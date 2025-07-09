import Noty from 'noty';
import * as workerTimers from 'worker-timers';
import { groupRequest } from '../api';
import { escapeTag, parseLocation } from '../shared/utils';
import {
    useAdvancedSettingsStore,
    useAuthStore,
    useFriendStore,
    useGalleryStore,
    useGroupStore,
    useInstanceStore,
    useLocationStore,
    useNotificationStore,
    useSharedFeedStore,
    useUiStore,
    useUserStore
} from '../stores';
import { API } from './eventBus';
import { request } from './request';

let webSocket = null;
let lastWebSocketMessage = '';

export function initWebsocket() {
    const friendStore = useFriendStore();
    if (!(friendStore.friendLogInitStatus && webSocket === null)) {
        return;
    }
    return request('auth', {
        method: 'GET'
    }).then((json) => {
        const args = {
            json
        };
        if (args.json.ok) {
            connectWebSocket(args.json.token);
        }
    });
}

/**
 * @param {string} token
 * @returns {void}
 */
function connectWebSocket(token) {
    const userStore = useUserStore();
    const authStore = useAuthStore();
    const friendStore = useFriendStore();
    if (webSocket !== null) {
        return;
    }
    const socket = new WebSocket(`${API.websocketDomain}/?auth=${token}`);
    socket.onopen = () => {
        if (API.debugWebSocket) {
            console.log('WebSocket connected');
        }
    };
    socket.onclose = () => {
        if (webSocket === socket) {
            webSocket = null;
        }
        try {
            socket.close();
        } catch (err) {
            console.error('Error closing WebSocket:', err);
        }
        if (API.debugWebSocket) {
            console.log('WebSocket closed');
        }
        workerTimers.setTimeout(() => {
            if (
                authStore.isLoggedIn &&
                friendStore.friendLogInitStatus &&
                webSocket === null
            ) {
                initWebsocket();
            }
        }, 5000);
    };
    socket.onerror = () => {
        if (API.errorNoty) {
            API.errorNoty.close();
        }
        API.errorNoty = new Noty({
            type: 'error',
            text: 'WebSocket Error'
        }).show();
        socket.onclose();
    };
    socket.onmessage = ({ data }) => {
        try {
            if (lastWebSocketMessage === data) {
                // pls no spam
                return;
            }
            lastWebSocketMessage = data;
            const json = JSON.parse(data);
            try {
                json.content = JSON.parse(json.content);
            } catch (err) {}
            handlePipeline({
                json
            });
            if (API.debugWebSocket && json.content) {
                let displayName = '';
                const user = userStore.cachedUsers.get(json.content.userId);
                if (user) {
                    displayName = user.displayName;
                }
                console.log('WebSocket', json.type, displayName, json.content);
            }
        } catch (err) {
            console.error(err);
        }
    };
    webSocket = socket;
}

API.$on('LOGOUT', function () {
    closeWebSocket();
});

/**
 * @returns {void}
 */
function closeWebSocket() {
    const socket = webSocket;
    if (socket === null) {
        return;
    }
    webSocket = null;
    try {
        socket.close();
    } catch (err) {
        console.error('Error closing WebSocket:', err);
    }
}

/**
 * @returns {void}
 */
export function reconnectWebSocket() {
    const authStore = useAuthStore();
    const friendStore = useFriendStore();
    if (!authStore.isLoggedIn || !friendStore.friendLogInitStatus) {
        return;
    }
    closeWebSocket();
    initWebsocket();
}

/**
 * @param {object} args
 * @param {string} args.json.type
 */
function handlePipeline(args) {
    const userStore = useUserStore();
    const locationStore = useLocationStore();
    const galleryStore = useGalleryStore();
    const notificationStore = useNotificationStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const sharedFeedStore = useSharedFeedStore();
    const friendStore = useFriendStore();
    const groupStore = useGroupStore();
    const uiStore = useUiStore();
    const instanceStore = useInstanceStore();
    const { type, content, err } = args.json;
    if (typeof err !== 'undefined') {
        console.error('PIPELINE: error', args);
        if (API.errorNoty) {
            API.errorNoty.close();
        }
        API.errorNoty = new Noty({
            type: 'error',
            text: escapeTag(`WebSocket Error: ${err}`)
        }).show();
        return;
    }
    if (typeof content === 'undefined') {
        console.error('PIPELINE: missing content', args);
        return;
    }
    if (typeof content.user !== 'undefined') {
        // I forgot about this...
        delete content.user.state;
    }
    switch (type) {
        case 'notification':
            API.$emit('NOTIFICATION', {
                json: content,
                params: {
                    notificationId: content.id
                }
            });
            API.$emit('PIPELINE:NOTIFICATION', {
                json: content,
                params: {
                    notificationId: content.id
                }
            });
            break;

        case 'notification-v2':
            console.log('notification-v2', content);
            API.$emit('NOTIFICATION:V2', {
                json: content,
                params: {
                    notificationId: content.id
                }
            });
            break;

        case 'notification-v2-delete':
            console.log('notification-v2-delete', content);
            for (var id of content.ids) {
                API.$emit('NOTIFICATION:HIDE', {
                    params: {
                        notificationId: id
                    }
                });
                API.$emit('NOTIFICATION:SEE', {
                    params: {
                        notificationId: id
                    }
                });
            }
            break;

        case 'notification-v2-update':
            console.log('notification-v2-update', content);
            API.$emit('NOTIFICATION:V2:UPDATE', {
                json: content.updates,
                params: {
                    notificationId: content.id
                }
            });
            break;

        case 'see-notification':
            API.$emit('NOTIFICATION:SEE', {
                params: {
                    notificationId: content
                }
            });
            break;

        case 'hide-notification':
            API.$emit('NOTIFICATION:HIDE', {
                params: {
                    notificationId: content
                }
            });
            API.$emit('NOTIFICATION:SEE', {
                params: {
                    notificationId: content
                }
            });
            break;

        case 'response-notification':
            API.$emit('NOTIFICATION:HIDE', {
                params: {
                    notificationId: content.notificationId
                }
            });
            API.$emit('NOTIFICATION:SEE', {
                params: {
                    notificationId: content.notificationId
                }
            });
            break;

        case 'friend-add':
            API.$emit('USER', {
                json: content.user,
                params: {
                    userId: content.userId
                }
            });
            API.$emit('FRIEND:ADD', {
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'friend-delete':
            API.$emit('FRIEND:DELETE', {
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'friend-online':
            // Where is instanceId, travelingToWorld, travelingToInstance?
            // More JANK, what a mess
            var $location = parseLocation(content.location);
            var $travelingToLocation = parseLocation(
                content.travelingToLocation
            );
            if (content?.user?.id) {
                API.$emit('USER', {
                    json: {
                        id: content.userId,
                        platform: content.platform,
                        state: 'online',

                        location: content.location,
                        worldId: content.worldId,
                        instanceId: $location.instanceId,
                        travelingToLocation: content.travelingToLocation,
                        travelingToWorld: $travelingToLocation.worldId,
                        travelingToInstance: $travelingToLocation.instanceId,

                        ...content.user
                    },
                    params: {
                        userId: content.userId
                    }
                });
            } else {
                friendStore.updateFriend({
                    id: content.userId,
                    state: 'online'
                });
            }
            break;

        case 'friend-active':
            if (content?.user?.id) {
                API.$emit('USER', {
                    json: {
                        id: content.userId,
                        platform: content.platform,
                        state: 'active',

                        location: 'offline',
                        worldId: 'offline',
                        instanceId: 'offline',
                        travelingToLocation: 'offline',
                        travelingToWorld: 'offline',
                        travelingToInstance: 'offline',

                        ...content.user
                    },
                    params: {
                        userId: content.userId
                    }
                });
            } else {
                friendStore.updateFriend({
                    id: content.userId,
                    state: 'active'
                });
            }
            break;

        case 'friend-offline':
            // more JANK, hell yeah
            API.$emit('USER', {
                json: {
                    id: content.userId,
                    platform: content.platform,
                    state: 'offline',

                    location: 'offline',
                    worldId: 'offline',
                    instanceId: 'offline',
                    travelingToLocation: 'offline',
                    travelingToWorld: 'offline',
                    travelingToInstance: 'offline'
                },
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'friend-update':
            API.$emit('USER', {
                json: content.user,
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'friend-location':
            var $location = parseLocation(content.location);
            var $travelingToLocation = parseLocation(
                content.travelingToLocation
            );
            if (!content?.user?.id) {
                var ref = userStore.get(content.userId);
                if (typeof ref !== 'undefined') {
                    API.$emit('USER', {
                        json: {
                            ...ref,
                            location: content.location,
                            worldId: content.worldId,
                            instanceId: $location.instanceId,
                            travelingToLocation: content.travelingToLocation,
                            travelingToWorld: $travelingToLocation.worldId,
                            travelingToInstance: $travelingToLocation.instanceId
                        },
                        params: {
                            userId: content.userId
                        }
                    });
                }
                break;
            }
            API.$emit('USER', {
                json: {
                    location: content.location,
                    worldId: content.worldId,
                    instanceId: $location.instanceId,
                    travelingToLocation: content.travelingToLocation,
                    travelingToWorld: $travelingToLocation.worldId,
                    travelingToInstance: $travelingToLocation.instanceId,
                    ...content.user,
                    state: 'online' // JANK
                },
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'user-update':
            API.$emit('USER:CURRENT', {
                json: content.user,
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'user-location':
            // update current user location
            if (content.userId !== userStore.currentUser.id) {
                console.error('user-location wrong userId', content);
                break;
            }

            // content.user: {} // we don't trust this
            // content.world: {} // this is long gone
            // content.worldId // where did worldId go?
            // content.instance // without worldId, this is useless

            locationStore.setCurrentUserLocation(
                content.location,
                content.travelingToLocation
            );
            break;

        case 'group-joined':
            // var groupId = content.groupId;
            // $app.onGroupJoined(groupId);
            break;

        case 'group-left':
            // var groupId = content.groupId;
            // $app.onGroupLeft(groupId);
            break;

        case 'group-role-updated':
            var groupId = content.role.groupId;
            groupRequest.getGroup({ groupId, includeRoles: true });
            console.log('group-role-updated', content);

            // content {
            //   role: {
            //     createdAt: string,
            //     description: string,
            //     groupId: string,
            //     id: string,
            //     isManagementRole: boolean,
            //     isSelfAssignable: boolean,
            //     name: string,
            //     order: number,
            //     permissions: string[],
            //     requiresPurchase: boolean,
            //     requiresTwoFactor: boolean
            break;

        case 'group-member-updated':
            var member = content.member;
            if (!member) {
                console.error('group-member-updated missing member', content);
                break;
            }
            var groupId = member.groupId;
            if (
                groupStore.groupDialog.visible &&
                groupStore.groupDialog.id === groupId
            ) {
                groupStore.getGroupDialogGroup(groupId);
            }
            API.$emit('GROUP:MEMBER', {
                json: member,
                params: {
                    groupId
                }
            });
            console.log('group-member-updated', member);
            break;

        case 'instance-queue-joined':
        case 'instance-queue-position':
            var instanceId = content.instanceLocation;
            var position = content.position ?? 0;
            var queueSize = content.queueSize ?? 0;
            instanceStore.instanceQueueUpdate(instanceId, position, queueSize);
            break;

        case 'instance-queue-ready':
            var instanceId = content.instanceLocation;
            // var expiry = Date.parse(content.expiry);
            instanceStore.instanceQueueReady(instanceId);
            break;

        case 'instance-queue-left':
            var instanceId = content.instanceLocation;
            instanceStore.removeQueuedInstance(instanceId);
            // $app.instanceQueueClear();
            break;

        case 'content-refresh':
            var contentType = content.contentType;
            console.log('content-refresh', content);
            if (contentType === 'icon') {
                if (
                    galleryStore.galleryDialogVisible &&
                    !galleryStore.galleryDialogIconsLoading
                ) {
                    galleryStore.refreshVRCPlusIconsTable();
                }
            } else if (contentType === 'gallery') {
                if (
                    galleryStore.galleryDialogVisible &&
                    !galleryStore.galleryDialogGalleryLoading
                ) {
                    galleryStore.refreshGalleryTable();
                }
            } else if (contentType === 'emoji') {
                if (
                    galleryStore.galleryDialogVisible &&
                    !galleryStore.galleryDialogEmojisLoading
                ) {
                    galleryStore.refreshEmojiTable();
                }
            } else if (contentType === 'sticker') {
                // on sticker upload
            } else if (contentType === 'print') {
                if (content.actionType === 'created') {
                    galleryStore.tryDeleteOldPrints();
                } else if (
                    galleryStore.galleryDialogVisible &&
                    !galleryStore.galleryDialogPrintsLoading
                ) {
                    galleryStore.refreshPrintTable();
                }
            } else if (contentType === 'prints') {
                // lol
            } else if (contentType === 'avatar') {
                // hmm, utilizing this might be too spamy and cause UI to move around
            } else if (contentType === 'world') {
                // hmm
            } else if (contentType === 'created') {
                // on avatar upload, might be gone now
            } else if (contentType === 'avatargallery') {
                // on avatar gallery image upload
            } else if (contentType === 'invitePhoto') {
                // on uploading invite photo
            } else if (contentType === 'inventory') {
                if (
                    galleryStore.galleryDialogVisible &&
                    !galleryStore.galleryDialogInventoryLoading
                ) {
                    galleryStore.getInventory();
                }
                // on consuming a bundle
                // {contentType: 'inventory', itemId: 'inv_', itemType: 'prop', actionType: 'add'}
            } else if (!contentType) {
                console.log('content-refresh without contentType', content);
            } else {
                console.log(
                    'Unknown content-refresh type',
                    content.contentType
                );
            }
            break;

        case 'instance-closed':
            // TODO: get worldName, groupName, hardClose
            const noty = {
                type: 'instance.closed',
                location: content.instanceLocation,
                message: 'Instance Closed',
                created_at: new Date().toJSON()
            };
            if (
                notificationStore.notificationTable.filters[0].value.length ===
                    0 ||
                notificationStore.notificationTable.filters[0].value.includes(
                    noty.type
                )
            ) {
                uiStore.notifyMenu('notification');
            }
            notificationStore.queueNotificationNoty(noty);
            notificationStore.notificationTable.data.push(noty);
            sharedFeedStore.updateSharedFeed(true);
            break;

        default:
            console.log('Unknown pipeline type', args.json);
    }
}
