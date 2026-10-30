import { create, fromBinary, toBinary } from '@bufbuild/protobuf';

import {
    ClientMessageSchema,
    DataObjectType,
    GetNotificationsRequestSchema,
    ServerMessageSchema
} from './realtimeSchema';
import { AppDebug } from '../appConfig';

const AUTH_TIMEOUT = 10000;
const REQUEST_TIMEOUT = 10000;

/**
 * Client for wss://nexvr.net/api/realtime. NexVR has no REST endpoint for the
 * friends list or notifications; both only arrive over this socket.
 *
 * Events, by name:
 *
 * - `friends`: { snapshot: boolean, changed: [prev | undefined, next][], removed: prev[] }
 * - `notifications`: Notification[] (the full current list)
 * - `close`: { code, reason, authFailed }
 * - `message`: byteLength of each frame, for the status bar
 * - `instanceModeration`: { instanceId, moderation } for a watched instance
 */
class RealtimeClient {
    /** @type {WebSocket | null} */
    ws = null;
    userId = '';
    connected = false;
    authFailed = false;
    /** @type {Map<string, any>} FriendPresence by user id, the caller included */
    friends = new Map();
    hasSnapshot = false;
    /** @type {any[]} */
    notifications = [];
    /** @type {Promise<boolean> | null} */
    connecting = null;
    nextRequestId = 1;
    /** @type {Map<number, (response: any) => void>} */
    pending = new Map();
    /** @type {(() => void)[]} */
    snapshotWaiters = [];
    /** @type {Record<string, Set<Function>>} */
    listeners = {
        friends: new Set(),
        notifications: new Set(),
        close: new Set(),
        message: new Set(),
        instanceModeration: new Set()
    };
    /** @type {string[]} instances whose occupant list is watched */
    watchedInstances = [];

    /**
     * @param {string} event
     * @param {Function} fn
     * @returns {() => void} Unsubscribe
     */
    on(event, fn) {
        this.listeners[event].add(fn);
        return () => this.listeners[event].delete(fn);
    }

    emit(event, payload) {
        for (const fn of this.listeners[event]) {
            try {
                fn(payload);
            } catch (err) {
                console.error(`NexVR realtime ${event} listener failed:`, err);
            }
        }
    }

    /**
     * Opens and authenticates the socket, reusing a live one for the same user.
     *
     * @param {string} accessToken
     * @param {string} userId
     * @returns {Promise<boolean>} Whether NexVR accepted the token
     */
    connect(accessToken, userId) {
        if (this.ws && this.userId === userId) {
            return this.connecting ?? Promise.resolve(this.connected);
        }
        this.disconnect();
        this.authFailed = false;
        if (this.userId !== userId) {
            // a reconnect for the same user keeps the last friends map, so the
            // snapshot that follows is diffed into online/offline events
            this.userId = userId;
            this.hasSnapshot = false;
            this.friends.clear();
            this.notifications = [];
        }

        const socket = new WebSocket(AppDebug.websocketDomain);
        socket.binaryType = 'arraybuffer';
        this.ws = socket;

        this.connecting = new Promise((resolve) => {
            let settled = false;
            const settle = (ok) => {
                if (!settled) {
                    settled = true;
                    resolve(ok);
                }
            };
            const timer = setTimeout(() => {
                settle(false);
                socket.close();
            }, AUTH_TIMEOUT);

            socket.onopen = () => {
                this.send({ case: 'auth', value: { accessToken } });
            };
            socket.onmessage = ({ data }) => {
                if (!(data instanceof ArrayBuffer)) {
                    return;
                }
                this.emit('message', data.byteLength);
                /** @type {any} schema is loaded at runtime, so messages are untyped */
                let msg;
                try {
                    msg = fromBinary(ServerMessageSchema, new Uint8Array(data));
                } catch (err) {
                    console.error('NexVR realtime: undecodable frame', err);
                    return;
                }
                if (msg.payload.case === 'authResult') {
                    clearTimeout(timer);
                    if (msg.payload.value.success) {
                        this.connected = true;
                        this.subscribe();
                        settle(true);
                    } else {
                        this.authFailed = true;
                        settle(false);
                        socket.close();
                    }
                    return;
                }
                this.handleServerMessage(msg);
            };
            socket.onclose = ({ code, reason }) => {
                clearTimeout(timer);
                settle(false);
                if (this.ws !== socket) {
                    return;
                }
                this.ws = null;
                this.connected = false;
                this.connecting = null;
                for (const resolvePending of this.pending.values()) {
                    resolvePending(null);
                }
                this.pending.clear();
                this.emit('close', { code, reason, authFailed: this.authFailed });
            };
        }).finally(() => {
            if (this.ws === socket) {
                this.connecting = null;
            }
        });
        return this.connecting;
    }

    disconnect() {
        const socket = this.ws;
        this.ws = null;
        this.connected = false;
        this.connecting = null;
        if (socket) {
            socket.onclose = null;
            try {
                socket.close(1000);
            } catch {
                // already closed
            }
        }
        this.releaseSnapshotWaiters();
    }

    /**
     * Disconnects and forgets everything learned for the signed-in user.
     */
    reset() {
        this.disconnect();
        this.watchedInstances = [];
        this.userId = '';
        this.hasSnapshot = false;
        this.friends.clear();
        this.notifications = [];
    }

    /**
     * @param {{ case: string; value: object }} payload
     */
    send(payload) {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            return;
        }
        const msg = create(ClientMessageSchema, { payload });
        this.ws.send(/** @type {Uint8Array<ArrayBuffer>} */ (toBinary(ClientMessageSchema, msg)));
    }

    subscribe() {
        const keys = [this.userId];
        // each subscribe replaces the last, so it always carries the full set
        /** @type {{ type: number; keys: string[] }[]} */
        const subscriptions = [
            { type: DataObjectType.NOTIFICATIONS, keys },
            { type: DataObjectType.FRIENDS_PRESENCE, keys }
        ];
        if (this.watchedInstances.length) {
            subscriptions.push({ type: DataObjectType.INSTANCE_MODERATION, keys: this.watchedInstances });
        }
        this.send({ case: 'subscribe', value: { subscriptions } });
    }

    /**
     * Follows the occupant list of the given instances (the one the user is
     * in), replacing any previously watched ones.
     *
     * @param {string[]} instanceIds
     */
    watchInstances(instanceIds) {
        const next = instanceIds.filter(Boolean);
        if (next.join() === this.watchedInstances.join()) {
            return;
        }
        this.watchedInstances = next;
        if (this.connected) {
            this.subscribe();
        }
    }

    /**
     * Resolves once the first friends snapshot has arrived, or after timeoutMs.
     *
     * @param {number} timeoutMs
     * @returns {Promise<boolean>} Whether a snapshot is in hand
     */
    waitForSnapshot(timeoutMs) {
        if (this.hasSnapshot || !this.ws) {
            return Promise.resolve(this.hasSnapshot);
        }
        return new Promise((resolve) => {
            const done = () => {
                clearTimeout(timer);
                resolve(this.hasSnapshot);
            };
            const timer = setTimeout(() => {
                this.snapshotWaiters = this.snapshotWaiters.filter((fn) => fn !== done);
                resolve(this.hasSnapshot);
            }, timeoutMs);
            this.snapshotWaiters.push(done);
        });
    }

    releaseSnapshotWaiters() {
        const waiters = this.snapshotWaiters;
        this.snapshotWaiters = [];
        for (const fn of waiters) {
            fn();
        }
    }

    /**
     * @returns {Promise<any[]>} The caller's notifications
     */
    getNotifications() {
        if (!this.connected) {
            return Promise.resolve(this.notifications);
        }
        const requestId = this.nextRequestId++;
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pending.delete(requestId);
                resolve(this.notifications);
            }, REQUEST_TIMEOUT);
            this.pending.set(requestId, (response) => {
                clearTimeout(timer);
                if (response?.case === 'notifications') {
                    this.notifications = response.value.notifications;
                }
                resolve(this.notifications);
            });
            this.send({
                case: 'request',
                value: {
                    requestId,
                    request: {
                        case: 'getNotifications',
                        value: create(GetNotificationsRequestSchema, {})
                    }
                }
            });
        });
    }

    /**
     * @param {any} msg ServerMessage
     */
    handleServerMessage(msg) {
        if (msg.payload.case === 'response') {
            const { requestId, response } = msg.payload.value;
            const resolvePending = this.pending.get(requestId);
            if (resolvePending) {
                this.pending.delete(requestId);
                resolvePending(response);
            }
            return;
        }
        if (msg.payload.case !== 'dataUpdate') {
            return;
        }
        const { key, data } = msg.payload.value;
        if (data.case === 'instanceModeration') {
            if (this.watchedInstances.includes(key)) {
                this.emit('instanceModeration', { instanceId: key, moderation: data.value });
            }
            return;
        }
        if (key !== this.userId) {
            return;
        }
        if (data.case === 'notifications') {
            this.notifications = data.value.notifications;
            this.emit('notifications', this.notifications);
        } else if (data.case === 'friendsPresence') {
            this.applyFriendsPresence(data.value.update);
        }
    }

    /**
     * @param {any} update FriendsPresence.update oneof
     */
    applyFriendsPresence(update) {
        const changed = [];
        const removed = [];
        if (update.case === 'snapshot') {
            const next = new Map(update.value.friends.map((f) => [f.userId, f]));
            for (const [id, prev] of this.friends) {
                if (!next.has(id)) {
                    removed.push(prev);
                }
            }
            for (const [id, presence] of next) {
                changed.push([this.friends.get(id), presence]);
            }
            this.friends = next;
        } else if (update.case === 'delta') {
            for (const presence of update.value.changed) {
                changed.push([this.friends.get(presence.userId), presence]);
                this.friends.set(presence.userId, presence);
            }
            for (const id of update.value.removed) {
                const prev = this.friends.get(id);
                if (prev) {
                    removed.push(prev);
                    this.friends.delete(id);
                }
            }
        } else {
            return;
        }
        const snapshot = update.case === 'snapshot' && !this.hasSnapshot;
        this.hasSnapshot = true;
        this.releaseSnapshotWaiters();
        this.emit('friends', { snapshot, changed, removed });
    }
}

export const realtime = new RealtimeClient();

// console access next to $debug, e.g. [...$nexvr.realtime.friends.values()]
/** @type {any} */ (window).$nexvr = { realtime };
