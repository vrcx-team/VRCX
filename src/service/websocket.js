import Noty from 'noty';
import * as workerTimers from 'worker-timers';
import { groupRequest } from '../api';
import { escapeTag, parseLocation } from '../shared/utils';
import {
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
import { AppGlobal } from './appConfig';
import { request } from './request';
import { watchState } from './watchState';

let webSocket = null;
let lastWebSocketMessage = '';

export function initWebsocket() {
    if (!watchState.isFriendsLoaded || webSocket !== null) {
        return;
    }
    return request('auth', {
        method: 'GET'
    })
        .then((json) => {
            const args = {
                json
            };
            if (args.json.ok) {
                connectWebSocket(args.json.token);
            }
        })
        .catch((err) => {
            console.error('WebSocket init error:', err);
        });
}

/**
 * @param {string} token
 * @returns {void}
 */
function connectWebSocket(token) {
    const userStore = useUserStore();
    if (webSocket !== null) {
        return;
    }
    const socket = new WebSocket(`${AppGlobal.websocketDomain}/?auth=${token}`);
    socket.onopen = () => {
        if (AppGlobal.debugWebSocket) {
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
        if (AppGlobal.debugWebSocket) {
            console.log('WebSocket closed');
        }
        workerTimers.setTimeout(() => {
            if (
                watchState.isLoggedIn &&
                watchState.isFriendsLoaded &&
                webSocket === null
            ) {
                initWebsocket();
            }
        }, 5000);
    };
    socket.onerror = () => {
        if (AppGlobal.errorNoty) {
            AppGlobal.errorNoty.close();
        }
        AppGlobal.errorNoty = new Noty({
            type: 'error',
            text: 'WebSocket Error'
        }).show();
        socket.onclose(
            new CloseEvent('close', {
                code: 1006, // Abnormal Closure
                reason: 'WebSocket Error'
            })
        );
    };
    socket.onmessage = ({ data }) => {
        try {
            if (lastWebSocketMessage === data) {
                // pls no spam
                return;
            }
            lastWebSocketMessage = data;
            let json;
            try {
                json = JSON.parse(data);
                json.content = JSON.parse(json.content);
            } catch {
                // ignore parse error
            }
            handlePipeline({
                json
            });
            if (AppGlobal.debugWebSocket && json.content) {
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

/**
 * @returns {void}
 */
export function closeWebSocket() {
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
    if (!watchState.isLoggedIn || !watchState.isFriendsLoaded) {
        return;
    }
    closeWebSocket();
    initWebsocket();
}

/**
 * @param {object} args
 */
function handlePipeline(args) {
    const userStore = useUserStore();
    const locationStore = useLocationStore();
    const galleryStore = useGalleryStore();
    const notificationStore = useNotificationStore();
    const sharedFeedStore = useSharedFeedStore();
    const friendStore = useFriendStore();
    const groupStore = useGroupStore();
    const uiStore = useUiStore();
    const instanceStore = useInstanceStore();
    const { type, content, err } = args.json;
    if (typeof err !== 'undefined') {
        console.error('PIPELINE: error', args);
        if (AppGlobal.errorNoty) {
            AppGlobal.errorNoty.close();
        }
        AppGlobal.errorNoty = new Noty({
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
            notificationStore.handleNotification({
                json: content,
                params: {
                    notificationId: content.id
                }
            });
            notificationStore.handlePipelineNotification({
                json: content,
                params: {
                    notificationId: content.id
                }
            });
            break;

        case 'notification-v2':
            console.log('notification-v2', content);
            notificationStore.handleNotificationV2({
                json: content,
                params: {
                    notificationId: content.id
                }
            });
            break;

        case 'notification-v2-delete':
            console.log('notification-v2-delete', content);
            for (var id of content.ids) {
                notificationStore.handleNotificationHide({
                    params: {
                        notificationId: id
                    }
                });
                notificationStore.handleNotificationSee({
                    params: {
                        notificationId: id
                    }
                });
            }
            break;

        case 'notification-v2-update':
            console.log('notification-v2-update', content);
            notificationStore.handleNotificationV2Update({
                json: content.updates,
                params: {
                    notificationId: content.id
                }
            });
            break;

        case 'see-notification':
            notificationStore.handleNotificationSee({
                params: {
                    notificationId: content
                }
            });
            break;

        case 'hide-notification':
            notificationStore.handleNotificationHide({
                params: {
                    notificationId: content
                }
            });
            notificationStore.handleNotificationSee({
                params: {
                    notificationId: content
                }
            });
            break;

        case 'response-notification':
            notificationStore.handleNotificationHide({
                params: {
                    notificationId: content.notificationId
                }
            });
            notificationStore.handleNotificationSee({
                params: {
                    notificationId: content.notificationId
                }
            });
            break;

        case 'friend-add':
            userStore.applyUser(content.user);
            friendStore.handleFriendAdd({
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'friend-delete':
            friendStore.handleFriendDelete({
                params: {
                    userId: content.userId
                }
            });
            break;

        case 'friend-online':
            // Where is instanceId, travelingToWorld, travelingToInstance?
            // More JANK, what a mess
            const $location = parseLocation(content.location);
            const $travelingToLocation = parseLocation(
                content.travelingToLocation
            );
            if (content?.user?.id) {
                const onlineJson = {
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
                };
                userStore.applyUser(onlineJson);
            } else {
                console.error('friend-online missing user id', content);
                friendStore.updateFriend(content.userId, 'online');
            }
            break;

        case 'friend-active':
            if (content?.user?.id) {
                const activeJson = {
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
                };
                userStore.applyUser(activeJson);
            } else {
                console.error('friend-active missing user id', content);
                friendStore.updateFriend(content.userId, 'active');
            }
            break;

        case 'friend-offline':
            // more JANK, hell yeah
            const offlineJson = {
                id: content.userId,
                platform: content.platform,
                state: 'offline',

                location: 'offline',
                worldId: 'offline',
                instanceId: 'offline',
                travelingToLocation: 'offline',
                travelingToWorld: 'offline',
                travelingToInstance: 'offline'
            };
            userStore.applyUser(offlineJson);
            break;

        case 'friend-update':
            userStore.applyUser(content.user);
            break;

        case 'friend-location':
            const $location1 = parseLocation(content.location);
            const $travelingToLocation1 = parseLocation(
                content.travelingToLocation
            );
            if (!content?.user?.id) {
                console.error('friend-location missing user id', content);
                const jankLocationJson = {
                    id: content.userId,
                    location: content.location,
                    worldId: content.worldId,
                    instanceId: $location1.instanceId,
                    travelingToLocation: content.travelingToLocation,
                    travelingToWorld: $travelingToLocation1.worldId,
                    travelingToInstance: $travelingToLocation1.instanceId
                };
                userStore.applyUser(jankLocationJson);
                break;
            }
            const locationJson = {
                location: content.location,
                worldId: content.worldId,
                instanceId: $location1.instanceId,
                travelingToLocation: content.travelingToLocation,
                travelingToWorld: $travelingToLocation1.worldId,
                travelingToInstance: $travelingToLocation1.instanceId,
                ...content.user,
                state: 'online' // JANK
            };
            userStore.applyUser(locationJson);

            break;

        case 'user-update':
            userStore.applyCurrentUser(content.user);
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
            const groupId = content.role.groupId;
            groupRequest
                .getGroup({ groupId, includeRoles: true })
                .then((args) => groupStore.applyGroup(args.json));
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
            const groupId1 = member.groupId;
            if (
                groupStore.groupDialog.visible &&
                groupStore.groupDialog.id === groupId1
            ) {
                groupStore.getGroupDialogGroup(groupId1);
            }
            groupStore.handleGroupMember({
                json: member,
                params: {
                    groupId: groupId1
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
            // var expiry = Date.parse(content.expiry);
            instanceStore.instanceQueueReady(content.instanceLocation);
            break;

        case 'instance-queue-left':
            instanceStore.removeQueuedInstance(content.instanceLocation);
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
