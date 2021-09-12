// Copyright(c) 2019-2021 pypy and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import Noty from 'noty';
import Vue from 'vue';
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';
import MarqueeText from 'vue-marquee-text-component';
Vue.component('marquee-text', MarqueeText);

import configRepository from './repository/config.js';

speechSynthesis.getVoices();

(async function () {
    var $app = null;

    await CefSharp.BindObjectAsync(
        'AppApi',
        'WebApi',
        'SharedVariable',
        'SQLite'
    );

    await configRepository.init();

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

    var formatDate = (s, format) => {
        var dt = new Date(s);
        if (isNaN(dt)) {
            return escapeTag(s);
        }
        var hours = dt.getHours();
        var map = {
            YYYY: String(10000 + dt.getFullYear()).substr(-4),
            MM: String(101 + dt.getMonth()).substr(-2),
            DD: String(100 + dt.getDate()).substr(-2),
            HH24: String(100 + hours).substr(-2),
            HH: String(100 + (hours > 12 ? hours - 12 : hours)).substr(-2),
            MI: String(100 + dt.getMinutes()).substr(-2),
            SS: String(100 + dt.getSeconds()).substr(-2),
            AMPM: hours >= 12 ? 'PM' : 'AM'
        };
        return format.replace(
            /YYYY|MM|DD|HH24|HH|MI|SS|AMPM/gu,
            (c) => map[c] || c
        );
    };
    Vue.filter('formatDate', formatDate);

    var textToHex = (s) =>
        String(s)
            .split('')
            .map((c) => c.charCodeAt(0).toString(16))
            .join(' ');
    Vue.filter('textToHex', textToHex);

    var timeToText = (t) => {
        var sec = Number(t);
        if (isNaN(sec)) {
            return escapeTag(t);
        }
        sec = Math.floor(sec / 1000);
        var arr = [];
        if (sec < 0) {
            sec = -sec;
        }
        if (sec >= 86400) {
            arr.push(`${Math.floor(sec / 86400)}d`);
            sec %= 86400;
        }
        if (sec >= 3600) {
            arr.push(`${Math.floor(sec / 3600)}h`);
            sec %= 3600;
        }
        if (sec >= 60) {
            arr.push(`${Math.floor(sec / 60)}m`);
            sec %= 60;
        }
        if (sec || !arr.length) {
            arr.push(`${sec}s`);
        }
        return arr.join(' ');
    };
    Vue.filter('timeToText', timeToText);

    Vue.component('location', {
        template:
            '<span>{{ text }}<slot></slot><span class="famfamfam-flags" :class="region" style="display:inline-block;margin-left:5px"></span></span>',
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
                region: this.region
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
                    if (L.region === 'eu') {
                        this.region = 'europeanunion';
                    } else if (L.region === 'jp') {
                        this.region = 'jp';
                    } else {
                        this.region = 'us';
                    }
                }
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

    var $app = {
        data: {
            // 1 = 대시보드랑 손목에 보이는거
            // 2 = 항상 화면에 보이는 거
            appType: location.href.substr(-1),
            currentTime: new Date().toJSON(),
            cpuUsage: 0,
            config: {},
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
                friendList: []
            },
            lastLocationTimer: '',
            wristFeed: [],
            devices: []
        },
        computed: {},
        methods: {},
        watch: {},
        el: '#x-app',
        mounted() {
            setTimeout(function () {
                AppApi.ExecuteAppFunction('vrInit', '');
            }, 1000);
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
            canRequestInvite: false
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
    };

    $app.methods.nowPlayingUpdate = function (json) {
        this.nowPlaying = JSON.parse(json);
    };

    $app.methods.lastLocationUpdate = function (json) {
        this.lastLocation = JSON.parse(json);
    };

    $app.methods.wristFeedUpdate = function (json) {
        this.wristFeed = JSON.parse(json);
    };

    $app.methods.updateStatsLoop = async function () {
        try {
            this.currentTime = new Date().toJSON();
            var cpuUsage = await AppApi.CpuUsage();
            this.cpuUsage = cpuUsage.toFixed(0);

            this.lastLocationTimer = '';
            if (this.lastLocation.date !== 0) {
                this.lastLocationTimer = timeToText(
                    Date.now() - this.lastLocation.date
                );
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
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => this.updateStatsLoop(), 500);
    };

    $app.methods.playNoty = function (json) {
        var {noty, message, image} = JSON.parse(json);
        var text = '';
        var img = '';
        if (image) {
            img = `<img class="noty-img" src="data:image/png;base64, ${image}"></img>`;
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
                text = `<strong>${noty.displayName}</strong> has logged in`;
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
                var locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${this.displayLocation(
                        noty.instanceId,
                        noty.worldName
                    )}`;
                }
                text = `<strong>${noty.displayName}</strong> has spawned a portal${locationName}`;
                break;
            case 'AvatarChange':
                text = `<strong>${noty.displayName}</strong> changed into avatar ${noty.name}`;
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

    $app.methods.speak = function (text) {
        var tts = new SpeechSynthesisUtterance();
        var voices = speechSynthesis.getVoices();
        var voiceIndex = this.config.notificationTTSVoice;
        tts.voice = voices[voiceIndex];
        tts.text = text;
        speechSynthesis.speak(tts);
    };

    $app = new Vue($app);
    window.$app = $app;
})();
