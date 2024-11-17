import * as workerTimers from 'worker-timers';
import Noty from 'noty';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        API.webSocket = null;
        API.lastWebSocketMessage = '';

        API.$on('USER:CURRENT', function () {
            if ($app.friendLogInitStatus && this.webSocket === null) {
                this.getAuth();
            }
        });

        API.getAuth = function () {
            return this.call('auth', {
                method: 'GET'
            }).then((json) => {
                var args = {
                    json
                };
                this.$emit('AUTH', args);
                return args;
            });
        };

        API.$on('AUTH', function (args) {
            if (args.json.ok) {
                this.connectWebSocket(args.json.token);
            }
        });

        API.connectWebSocket = function (token) {
            if (this.webSocket !== null) {
                return;
            }
            var socket = new WebSocket(`${API.websocketDomain}/?auth=${token}`);
            socket.onopen = () => {
                if ($app.debugWebSocket) {
                    console.log('WebSocket connected');
                }
            };
            socket.onclose = () => {
                if (this.webSocket === socket) {
                    this.webSocket = null;
                }
                try {
                    socket.close();
                } catch (err) {}
                if ($app.debugWebSocket) {
                    console.log('WebSocket closed');
                }
                workerTimers.setTimeout(() => {
                    if (
                        this.isLoggedIn &&
                        $app.friendLogInitStatus &&
                        this.webSocket === null
                    ) {
                        this.getAuth();
                    }
                }, 5000);
            };
            socket.onerror = () => {
                if (this.errorNoty) {
                    this.errorNoty.close();
                }
                this.errorNoty = new Noty({
                    type: 'error',
                    text: 'WebSocket Error'
                }).show();
                socket.onclose();
            };
            socket.onmessage = ({ data }) => {
                try {
                    if (this.lastWebSocketMessage === data) {
                        // pls no spam
                        return;
                    }
                    this.lastWebSocketMessage = data;
                    var json = JSON.parse(data);
                    try {
                        json.content = JSON.parse(json.content);
                    } catch (err) {}
                    this.$emit('PIPELINE', {
                        json
                    });
                    if ($app.debugWebSocket && json.content) {
                        var displayName = '';
                        var user = this.cachedUsers.get(json.content.userId);
                        if (user) {
                            displayName = user.displayName;
                        }
                        console.log(
                            'WebSocket',
                            json.type,
                            displayName,
                            json.content
                        );
                    }
                } catch (err) {
                    console.error(err);
                }
            };
            this.webSocket = socket;
        };

        API.$on('LOGOUT', function () {
            this.closeWebSocket();
        });

        API.closeWebSocket = function () {
            var socket = this.webSocket;
            if (socket === null) {
                return;
            }
            this.webSocket = null;
            try {
                socket.close();
            } catch (err) {}
        };

        API.reconnectWebSocket = function () {
            if (!this.isLoggedIn || !$app.friendLogInitStatus) {
                return;
            }
            this.closeWebSocket();
            this.getAuth();
        };

        API.$on('PIPELINE', function (args) {
            var { type, content, err } = args.json;
            if (typeof err !== 'undefined') {
                console.error('PIPELINE: error', args);
                if (this.errorNoty) {
                    this.errorNoty.close();
                }
                this.errorNoty = new Noty({
                    type: 'error',
                    text: $app.escapeTag(`WebSocket Error: ${err}`)
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
                    this.$emit('NOTIFICATION', {
                        json: content,
                        params: {
                            notificationId: content.id
                        }
                    });
                    this.$emit('PIPELINE:NOTIFICATION', {
                        json: content,
                        params: {
                            notificationId: content.id
                        }
                    });
                    break;

                case 'notification-v2':
                    console.log('notification-v2', content);
                    this.$emit('NOTIFICATION:V2', {
                        json: content,
                        params: {
                            notificationId: content.id
                        }
                    });
                    break;

                case 'notification-v2-delete':
                    console.log('notification-v2-delete', content);
                    for (var id of content.ids) {
                        this.$emit('NOTIFICATION:HIDE', {
                            params: {
                                notificationId: id
                            }
                        });
                        this.$emit('NOTIFICATION:SEE', {
                            params: {
                                notificationId: id
                            }
                        });
                    }
                    break;

                case 'notification-v2-update':
                    console.log('notification-v2-update', content);
                    this.$emit('NOTIFICATION:V2:UPDATE', {
                        json: content.updates,
                        params: {
                            notificationId: content.id
                        }
                    });
                    break;

                case 'see-notification':
                    this.$emit('NOTIFICATION:SEE', {
                        params: {
                            notificationId: content
                        }
                    });
                    break;

                case 'hide-notification':
                    this.$emit('NOTIFICATION:HIDE', {
                        params: {
                            notificationId: content
                        }
                    });
                    this.$emit('NOTIFICATION:SEE', {
                        params: {
                            notificationId: content
                        }
                    });
                    break;

                case 'response-notification':
                    this.$emit('NOTIFICATION:HIDE', {
                        params: {
                            notificationId: content.notificationId
                        }
                    });
                    this.$emit('NOTIFICATION:SEE', {
                        params: {
                            notificationId: content.notificationId
                        }
                    });
                    break;

                case 'friend-add':
                    this.$emit('USER', {
                        json: content.user,
                        params: {
                            userId: content.userId
                        }
                    });
                    this.$emit('FRIEND:ADD', {
                        params: {
                            userId: content.userId
                        }
                    });
                    break;

                case 'friend-delete':
                    this.$emit('FRIEND:DELETE', {
                        params: {
                            userId: content.userId
                        }
                    });
                    break;

                case 'friend-online':
                    // Where is instanceId, travelingToWorld, travelingToInstance?
                    // More JANK, what a mess
                    var $location = $utils.parseLocation(content.location);
                    var $travelingToLocation = $utils.parseLocation(
                        content.travelingToLocation
                    );
                    if (content?.user?.id) {
                        this.$emit('USER', {
                            json: {
                                id: content.userId,
                                platform: content.platform,
                                state: 'online',

                                location: content.location,
                                worldId: content.worldId,
                                instanceId: $location.instanceId,
                                travelingToLocation:
                                    content.travelingToLocation,
                                travelingToWorld: $travelingToLocation.worldId,
                                travelingToInstance:
                                    $travelingToLocation.instanceId,

                                ...content.user
                            },
                            params: {
                                userId: content.userId
                            }
                        });
                    } else {
                        this.$emit('FRIEND:STATE', {
                            json: {
                                state: 'online'
                            },
                            params: {
                                userId: content.userId
                            }
                        });
                    }
                    break;

                case 'friend-active':
                    if (content?.user?.id) {
                        this.$emit('USER', {
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
                        this.$emit('FRIEND:STATE', {
                            json: {
                                state: 'active'
                            },
                            params: {
                                userId: content.userId
                            }
                        });
                    }
                    break;

                case 'friend-offline':
                    // more JANK, hell yeah
                    this.$emit('USER', {
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
                    this.$emit('USER', {
                        json: content.user,
                        params: {
                            userId: content.userId
                        }
                    });
                    break;

                case 'friend-location':
                    var $location = $utils.parseLocation(content.location);
                    var $travelingToLocation = $utils.parseLocation(
                        content.travelingToLocation
                    );
                    if (!content?.user?.id) {
                        var ref = this.cachedUsers.get(content.userId);
                        if (typeof ref !== 'undefined') {
                            this.$emit('USER', {
                                json: {
                                    ...ref,
                                    location: content.location,
                                    worldId: content.worldId,
                                    instanceId: $location.instanceId,
                                    travelingToLocation:
                                        content.travelingToLocation,
                                    travelingToWorld:
                                        $travelingToLocation.worldId,
                                    travelingToInstance:
                                        $travelingToLocation.instanceId
                                },
                                params: {
                                    userId: content.userId
                                }
                            });
                        }
                        break;
                    }
                    this.$emit('USER', {
                        json: {
                            location: content.location,
                            worldId: content.worldId,
                            instanceId: $location.instanceId,
                            travelingToLocation: content.travelingToLocation,
                            travelingToWorld: $travelingToLocation.worldId,
                            travelingToInstance:
                                $travelingToLocation.instanceId,
                            ...content.user,
                            state: 'online' // JANK
                        },
                        params: {
                            userId: content.userId
                        }
                    });
                    break;

                case 'user-update':
                    this.$emit('USER:CURRENT', {
                        json: content.user,
                        params: {
                            userId: content.userId
                        }
                    });
                    break;

                case 'user-location':
                    // update current user location
                    if (content.userId !== this.currentUser.id) {
                        console.error('user-location wrong userId', content);
                        break;
                    }

                    // content.user: {}
                    // content.world: {}

                    this.currentUser.presence.instance = content.instance;
                    this.currentUser.presence.world = content.worldId;
                    $app.setCurrentUserLocation(content.location);
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
                    API.getGroup({ groupId, includeRoles: true });
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
                        console.error(
                            'group-member-updated missing member',
                            content
                        );
                        break;
                    }
                    var groupId = member.groupId;
                    if (
                        $app.groupDialog.visible &&
                        $app.groupDialog.id === groupId
                    ) {
                        $app.getGroupDialogGroup(groupId);
                    }
                    this.$emit('GROUP:MEMBER', {
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
                    $app.instanceQueueUpdate(instanceId, position, queueSize);
                    break;

                case 'instance-queue-ready':
                    var instanceId = content.instanceLocation;
                    // var expiry = Date.parse(content.expiry);
                    $app.instanceQueueReady(instanceId);
                    break;

                case 'instance-queue-left':
                    var instanceId = content.instanceLocation;
                    $app.removeQueuedInstance(instanceId);
                    // $app.instanceQueueClear();
                    break;

                case 'content-refresh':
                    var contentType = content.contentType;
                    console.log('content-refresh', content);
                    if (contentType === 'icon') {
                        if (
                            $app.galleryDialogVisible &&
                            !$app.galleryDialogIconsLoading
                        ) {
                            $app.refreshVRCPlusIconsTable();
                        }
                    } else if (contentType === 'gallery') {
                        if (
                            $app.galleryDialogVisible &&
                            !$app.galleryDialogGalleryLoading
                        ) {
                            $app.refreshGalleryTable();
                        }
                    } else if (contentType === 'emoji') {
                        if (
                            $app.galleryDialogVisible &&
                            !$app.galleryDialogEmojisLoading
                        ) {
                            $app.refreshEmojiTable();
                        }
                    } else if (
                        contentType === 'print' ||
                        contentType === 'prints'
                    ) {
                        if (
                            $app.galleryDialogVisible &&
                            !$app.galleryDialogPrintsLoading
                        ) {
                            $app.refreshPrintTable();
                        }
                    } else if (contentType === 'avatar') {
                        // hmm, utilizing this might be too spamy and cause UI to move around
                    } else if (contentType === 'world') {
                        // hmm
                    } else if (contentType === 'created') {
                        // on avatar upload
                    } else {
                        console.log('Unknown content-refresh', content);
                    }
                    break;

                case 'instance-closed':
                    // TODO: get worldName, groupName, hardClose
                    var noty = {
                        type: 'instance.closed',
                        location: content.instanceLocation,
                        message: 'Instance Closed',
                        created_at: new Date().toJSON()
                    };
                    if (
                        $app.notificationTable.filters[0].value.length === 0 ||
                        $app.notificationTable.filters[0].value.includes(
                            noty.type
                        )
                    ) {
                        $app.notifyMenu('notification');
                    }
                    $app.queueNotificationNoty(noty);
                    $app.notificationTable.data.push(noty);
                    $app.updateSharedFeed(true);
                    break;

                default:
                    console.log('Unknown pipeline type', args.json);
            }
        });
    }

    _data = {};

    _methods = {};
}
