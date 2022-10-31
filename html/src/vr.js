// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import '@fontsource/noto-sans-kr';
import '@fontsource/noto-sans-jp';
import Noty from 'noty';
import Vue from 'vue';
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';
import * as workerTimers from 'worker-timers';
import MarqueeText from 'vue-marquee-text-component';
Vue.component('marquee-text', MarqueeText);

(async function () {
    var $app = null;

    await CefSharp.BindObjectAsync('AppApi');

    Noty.overrideDefaults({
        animation: {
            open: 'animate__animated animate__fadeIn',
            close: 'animate__animated animate__zoomOut'
        },
        layout: 'topCenter',
        theme: 'relax',
        timeout: 3000
    });

    Vue.use(ElementUI, {
        locale
    });

    var escapeTag = (s) =>
        String(s).replace(/["&'<>]/gu, (c) => `&#${c.charCodeAt(0)};`);
    Vue.filter('escapeTag', escapeTag);

    var commaNumber = (n) =>
        String(Number(n) || 0).replace(/(\d)(?=(\d{3})+(?!\d))/gu, '$1,');
    Vue.filter('commaNumber', commaNumber);

    var textToHex = (s) =>
        String(s)
            .split('')
            .map((c) => c.charCodeAt(0).toString(16))
            .join(' ');
    Vue.filter('textToHex', textToHex);

    var timeToText = function (sec) {
        var n = Number(sec);
        if (isNaN(n)) {
            return escapeTag(sec);
        }
        n = Math.floor(n / 1000);
        var arr = [];
        if (n < 0) {
            n = -n;
        }
        if (n >= 86400) {
            arr.push(`${Math.floor(n / 86400)}d`);
            n %= 86400;
        }
        if (n >= 3600) {
            arr.push(`${Math.floor(n / 3600)}h`);
            n %= 3600;
        }
        if (n >= 60) {
            arr.push(`${Math.floor(n / 60)}m`);
            n %= 60;
        }
        if (arr.length === 0 && n < 60) {
            arr.push(`${n}s`);
        }
        return arr.join(' ');
    };
    Vue.filter('timeToText', timeToText);

    Vue.component('location', {
        template:
            '<span><span style="margin-right:5px">{{ text }}</span><span class="flags" :class="region" style="display:inline-block;margin-bottom:2px"></span><i v-if="strict" class="el-icon el-icon-lock" style="display:inline-block;margin-left:5px"></i></span>',
        props: {
            location: String,
            hint: {
                type: String,
                default: ''
            }
        },
        data() {
            return {
                text: this.location,
                region: this.region,
                strict: this.strict
            };
        },
        methods: {
            parse() {
                this.text = this.location;
                var L = $app.parseLocation(this.location);
                if (L.isOffline) {
                    this.text = 'Offline';
                } else if (L.isPrivate) {
                    this.text = 'Private';
                } else if (typeof this.hint === 'string' && this.hint !== '') {
                    if (L.instanceId) {
                        this.text = `${this.hint} #${L.instanceName} ${L.accessType}`;
                    } else {
                        this.text = this.hint;
                    }
                } else if (L.worldId) {
                    if (L.instanceId) {
                        this.text = ` #${L.instanceName} ${L.accessType}`;
                    } else {
                        this.text = this.location;
                    }
                }
                this.region = '';
                if (
                    this.location !== '' &&
                    L.instanceId &&
                    !L.isOffline &&
                    !L.isPrivate
                ) {
                    this.region = L.region;
                    if (!L.region) {
                        this.region = 'us';
                    }
                }
                this.strict = L.strict;
            }
        },
        watch: {
            location() {
                this.parse();
            }
        },
        created() {
            this.parse();
        }
    });

    var removeFromArray = function (array, item) {
        var {length} = array;
        for (var i = 0; i < length; ++i) {
            if (array[i] === item) {
                array.splice(i, 1);
                return true;
            }
        }
        return false;
    };

    var $app = {
        data: {
            // 1 = 대시보드랑 손목에 보이는거
            // 2 = 항상 화면에 보이는 거
            appType: location.href.substr(-1),
            currentTime: new Date().toJSON(),
            cpuUsage: 0,
            pcUptime: '',
            config: {},
            photonLobbyBotSize: 0,
            onlineFriendCount: 0,
            nowPlaying: {
                url: '',
                name: '',
                length: 0,
                startTime: 0,
                elapsed: 0,
                percentage: 0,
                remainingText: ''
            },
            lastLocation: {
                date: 0,
                location: '',
                name: '',
                playerList: [],
                friendList: [],
                progressPie: false,
                onlineFor: 0
            },
            lastLocationTimer: '',
            onlineForTimer: '',
            wristFeed: [],
            devices: []
        },
        computed: {},
        methods: {},
        watch: {},
        el: '#x-app',
        mounted() {
            workerTimers.setTimeout(
                () => AppApi.ExecuteAppFunction('vrInit', ''),
                1000
            );
            if (this.appType === '1') {
                this.updateStatsLoop();
            }
        }
    };

    $app.methods.parseLocation = function (tag) {
        var _tag = String(tag || '');
        var ctx = {
            tag: _tag,
            isOffline: false,
            isPrivate: false,
            worldId: '',
            instanceId: '',
            instanceName: '',
            accessType: '',
            region: '',
            userId: null,
            hiddenId: null,
            privateId: null,
            friendsId: null,
            canRequestInvite: false,
            strict: false
        };
        if (_tag === 'offline') {
            ctx.isOffline = true;
        } else if (_tag === 'private') {
            ctx.isPrivate = true;
        } else if (_tag.startsWith('local') === false) {
            var sep = _tag.indexOf(':');
            if (sep >= 0) {
                ctx.worldId = _tag.substr(0, sep);
                ctx.instanceId = _tag.substr(sep + 1);
                ctx.instanceId.split('~').forEach((s, i) => {
                    if (i) {
                        var A = s.indexOf('(');
                        var Z = A >= 0 ? s.lastIndexOf(')') : -1;
                        var key = Z >= 0 ? s.substr(0, A) : s;
                        var value = A < Z ? s.substr(A + 1, Z - A - 1) : '';
                        if (key === 'hidden') {
                            ctx.hiddenId = value;
                        } else if (key === 'private') {
                            ctx.privateId = value;
                        } else if (key === 'friends') {
                            ctx.friendsId = value;
                        } else if (key === 'canRequestInvite') {
                            ctx.canRequestInvite = true;
                        } else if (key === 'region') {
                            ctx.region = value;
                        } else if (key === 'strict') {
                            ctx.strict = true;
                        }
                    } else {
                        ctx.instanceName = s;
                    }
                });
                ctx.accessType = 'public';
                if (ctx.privateId !== null) {
                    if (ctx.canRequestInvite) {
                        // InvitePlus
                        ctx.accessType = 'invite+';
                    } else {
                        // InviteOnly
                        ctx.accessType = 'invite';
                    }
                    ctx.userId = ctx.privateId;
                } else if (ctx.friendsId !== null) {
                    // FriendsOnly
                    ctx.accessType = 'friends';
                    ctx.userId = ctx.friendsId;
                } else if (ctx.hiddenId !== null) {
                    // FriendsOfGuests
                    ctx.accessType = 'friends+';
                    ctx.userId = ctx.hiddenId;
                }
            } else {
                ctx.worldId = _tag;
            }
        }
        return ctx;
    };

    $app.methods.configUpdate = function (json) {
        this.config = JSON.parse(json);
        this.hudFeed = [];
        this.hudTimeout = [];
        this.setDatetimeFormat();
    };

    $app.methods.updatePhotonLobbyBotSize = function (size) {
        this.photonLobbyBotSize = parseInt(size, 10);
    };

    $app.methods.updateOnlineFriendCount = function (count) {
        this.onlineFriendCount = parseInt(count, 10);
    };

    $app.methods.nowPlayingUpdate = function (json) {
        this.nowPlaying = JSON.parse(json);
        if (this.appType === '2') {
            var circle = document.querySelector('.np-progress-circle-stroke');
            if (
                this.lastLocation.progressPie &&
                this.nowPlaying.percentage !== 0
            ) {
                circle.style.opacity = 0.5;
                var circumference = circle.getTotalLength();
                circle.style.strokeDashoffset =
                    circumference -
                    (this.nowPlaying.percentage / 100) * circumference;
            } else {
                circle.style.opacity = 0;
            }
        }
    };

    $app.methods.lastLocationUpdate = function (json) {
        this.lastLocation = JSON.parse(json);
    };

    $app.methods.wristFeedUpdate = function (json) {
        this.wristFeed = JSON.parse(json);
    };

    $app.methods.updateStatsLoop = async function () {
        try {
            this.currentTime = new Date()
                .toLocaleDateString(this.currentCulture, {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hourCycle: this.config.dtHour12 ? 'h12' : 'h23'
                })
                .replace(' AM', ' am')
                .replace(' PM', ' pm')
                .replace(',', '');

            if (!this.config.hideCpuUsageFromFeed) {
                var cpuUsage = await AppApi.CpuUsage();
                this.cpuUsage = cpuUsage.toFixed(0);
            }
            if (this.lastLocation.date !== 0) {
                this.lastLocationTimer = timeToText(
                    Date.now() - this.lastLocation.date
                );
            } else {
                this.lastLocationTimer = '';
            }
            if (this.lastLocation.onlineFor) {
                this.onlineForTimer = timeToText(
                    Date.now() - this.lastLocation.onlineFor
                );
            } else {
                this.onlineForTimer = '';
            }

            if (!this.config.hideDevicesFromFeed) {
                AppApi.GetVRDevices().then((devices) => {
                    devices.forEach((device) => {
                        device[2] = parseInt(device[2], 10);
                    });
                    this.devices = devices;
                });
            } else {
                this.devices = '';
            }
            if (this.config.pcUptimeOnFeed) {
                AppApi.GetUptime().then((uptime) => {
                    this.pcUptime = timeToText(uptime);
                });
            } else {
                this.pcUptime = '';
            }
        } catch (err) {
            console.error(err);
        }
        workerTimers.setTimeout(() => this.updateStatsLoop(), 500);
    };

    $app.methods.playNoty = function (json) {
        var {noty, message, image} = JSON.parse(json);
        var text = '';
        var img = '';
        if (image) {
            img = `<img class="noty-img" src="${image}"></img>`;
        }
        switch (noty.type) {
            case 'OnPlayerJoined':
                text = `<strong>${noty.displayName}</strong> has joined`;
                break;
            case 'OnPlayerLeft':
                text = `<strong>${noty.displayName}</strong> has left`;
                break;
            case 'OnPlayerJoining':
                text = `<strong>${noty.displayName}</strong> is joining`;
                break;
            case 'GPS':
                text = `<strong>${
                    noty.displayName
                }</strong> is in ${this.displayLocation(
                    noty.location,
                    noty.worldName
                )}`;
                break;
            case 'Online':
                var locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${this.displayLocation(
                        noty.location,
                        noty.worldName
                    )}`;
                }
                text = `<strong>${noty.displayName}</strong> has logged in${locationName}`;
                break;
            case 'Offline':
                text = `<strong>${noty.displayName}</strong> has logged out`;
                break;
            case 'Status':
                text = `<strong>${noty.displayName}</strong> status is now <i>${noty.status}</i> ${noty.statusDescription}`;
                break;
            case 'invite':
                text = `<strong>${
                    noty.senderUsername
                }</strong> has invited you to ${this.displayLocation(
                    noty.details.worldId,
                    noty.details.worldName
                )}${message}`;
                break;
            case 'requestInvite':
                text = `<strong>${noty.senderUsername}</strong> has requested an invite ${message}`;
                break;
            case 'inviteResponse':
                text = `<strong>${noty.senderUsername}</strong> has responded to your invite ${message}`;
                break;
            case 'requestInviteResponse':
                text = `<strong>${noty.senderUsername}</strong> has responded to your invite request ${message}`;
                break;
            case 'friendRequest':
                text = `<strong>${noty.senderUsername}</strong> has sent you a friend request`;
                break;
            case 'Friend':
                text = `<strong>${noty.displayName}</strong> is now your friend`;
                break;
            case 'Unfriend':
                text = `<strong>${noty.displayName}</strong> is no longer your friend`;
                break;
            case 'TrustLevel':
                text = `<strong>${noty.displayName}</strong> trust level is now ${noty.trustLevel}`;
                break;
            case 'DisplayName':
                text = `<strong>${noty.previousDisplayName}</strong> changed their name to ${noty.displayName}`;
                break;
            case 'PortalSpawn':
                if (noty.displayName) {
                    text = `<strong>${
                        noty.displayName
                    }</strong> has spawned a portal to ${this.displayLocation(
                        noty.instanceId,
                        noty.worldName
                    )}`;
                } else {
                    text = 'User has spawned a portal';
                }
                break;
            case 'AvatarChange':
                text = `<strong>${noty.displayName}</strong> changed into avatar ${noty.name}`;
                break;
            case 'ChatBoxMessage':
                text = `<strong>${noty.displayName}</strong> said ${noty.text}`;
                break;
            case 'Event':
                text = noty.data;
                break;
            case 'VideoPlay':
                text = `<strong>Now playing:</strong> ${noty.notyName}`;
                break;
            case 'BlockedOnPlayerJoined':
                text = `Blocked user <strong>${noty.displayName}</strong> has joined`;
                break;
            case 'BlockedOnPlayerLeft':
                text = `Blocked user <strong>${noty.displayName}</strong> has left`;
                break;
            case 'MutedOnPlayerJoined':
                text = `Muted user <strong>${noty.displayName}</strong> has joined`;
                break;
            case 'MutedOnPlayerLeft':
                text = `Muted user <strong>${noty.displayName}</strong> has left`;
                break;
            case 'Blocked':
                text = `<strong>${noty.displayName}</strong> has blocked you`;
                break;
            case 'Unblocked':
                text = `<strong>${noty.displayName}</strong> has unblocked you`;
                break;
            case 'Muted':
                text = `<strong>${noty.displayName}</strong> has muted you`;
                break;
            case 'Unmuted':
                text = `<strong>${noty.displayName}</strong> has unmuted you`;
                break;
            default:
                break;
        }
        if (text) {
            new Noty({
                type: 'alert',
                theme: this.config.notificationTheme,
                timeout: this.config.notificationTimeout,
                layout: this.config.notificationPosition,
                text: `${img}<div class="noty-text">${text}</div>`
            }).show();
        }
    };

    $app.methods.statusClass = function (status) {
        var style = {};
        if (typeof status !== 'undefined') {
            if (status === 'active') {
                // Online
                style.online = true;
            } else if (status === 'join me') {
                // Join Me
                style.joinme = true;
            } else if (status === 'ask me') {
                // Ask Me
                style.askme = true;
            } else if (status === 'busy') {
                // Do Not Disturb
                style.busy = true;
            }
        }
        return style;
    };

    $app.methods.displayLocation = function (location, worldName) {
        var text = '';
        var L = this.parseLocation(location);
        if (L.isOffline) {
            text = 'Offline';
        } else if (L.isPrivate) {
            text = 'Private';
        } else if (L.worldId) {
            if (L.instanceId) {
                text = `${worldName} ${L.accessType}`;
            } else {
                text = worldName;
            }
        }
        return text;
    };

    $app.methods.notyClear = function () {
        Noty.closeAll();
    };

    $app.data.hudFeed = [];
    $app.data.cleanHudFeedLoopStatus = false;

    $app.methods.cleanHudFeedLoop = function () {
        if (!this.cleanHudFeedLoopStatus) {
            return;
        }
        this.cleanHudFeed();
        if (this.hudFeed.length === 0) {
            this.cleanHudFeedLoopStatus = false;
            return;
        }
        workerTimers.setTimeout(() => this.cleanHudFeedLoop(), 500);
    };

    $app.methods.cleanHudFeed = function () {
        var dt = Date.now();
        this.hudFeed.forEach((item) => {
            if (item.time + this.config.photonOverlayMessageTimeout < dt) {
                removeFromArray(this.hudFeed, item);
            }
        });
        if (this.hudFeed.length > 10) {
            this.hudFeed.length = 10;
        }
        if (!this.cleanHudFeedLoopStatus) {
            this.cleanHudFeedLoopStatus = true;
            this.cleanHudFeedLoop();
        }
    };

    $app.methods.addEntryHudFeed = function (json) {
        var data = JSON.parse(json);
        var combo = 1;
        this.hudFeed.forEach((item) => {
            if (
                item.displayName === data.displayName &&
                item.text === data.text
            ) {
                combo = item.combo + 1;
                removeFromArray(this.hudFeed, item);
            }
        });
        this.hudFeed.unshift({
            time: Date.now(),
            combo,
            ...data
        });
        this.cleanHudFeed();
    };

    $app.data.hudTimeout = [];

    $app.methods.updateHudTimeout = function (json) {
        this.hudTimeout = JSON.parse(json);
    };

    $app.data.currentCulture = await AppApi.CurrentCulture();

    $app.methods.setDatetimeFormat = async function () {
        this.currentCulture = await AppApi.CurrentCulture();
        var formatDate = function (date) {
            if (!date) {
                return '';
            }
            var dt = new Date(date);
            return dt
                .toLocaleTimeString($app.currentCulture, {
                    hour: '2-digit',
                    minute: 'numeric',
                    hourCycle: $app.config.dtHour12 ? 'h12' : 'h23'
                })
                .replace(' am', '')
                .replace(' pm', '');
        };
        Vue.filter('formatDate', formatDate);
    };

    $app = new Vue($app);
    window.$app = $app;
})();
