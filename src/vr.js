// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import '@fontsource/noto-sans-kr';
import '@fontsource/noto-sans-jp';
import '@fontsource/noto-sans-sc';
import '@fontsource/noto-sans-tc';
import '@infolektuell/noto-color-emoji';
import ElementUI from 'element-ui';
import Noty from 'noty';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import MarqueeText from 'vue-marquee-text-component';
import * as workerTimers from 'worker-timers';
import * as localizedStrings from './localization/localizedStrings.js';

import { displayLocation, parseLocation } from './shared/utils/location';
import { escapeTag, escapeTagRecursive } from './shared/utils/base/string';
import { removeFromArray } from './shared/utils/base/array';
import { timeToText } from './shared/utils/base/format';

import pugTemplate from './vr.pug';
import InteropApi from './ipc-electron/interopApi.js';

Vue.component('marquee-text', MarqueeText);

(async function () {
    let $app = {};

    if (WINDOWS) {
        await CefSharp.BindObjectAsync('AppApiVr');
    } else {
        // @ts-ignore
        window.AppApiVr = InteropApi.AppApiVrElectron;
    }

    Noty.overrideDefaults({
        animation: {
            open: 'animate__animated animate__fadeIn',
            close: 'animate__animated animate__zoomOut'
        },
        layout: 'topCenter',
        theme: 'relax',
        timeout: 3000
    });

    // localization
    Vue.use(VueI18n);
    const i18n = new VueI18n({
        locale: 'en',
        fallbackLocale: 'en',
        messages: localizedStrings
    });
    // eslint-disable-next-line no-unused-vars
    const $t = i18n.t.bind(i18n);
    Vue.use(ElementUI, {
        i18n: (key, value) => i18n.t(key, value)
    });

    Vue.component('location', {
        template:
            '<span><span>{{ text }}</span>' +
            '<span v-if="groupName">({{ groupName }})</span>' +
            '<span class="flags" :class="region" style="display:inline-block;margin-bottom:2px;margin-left:5px"></span>' +
            '<i v-if="strict" class="el-icon el-icon-lock" style="display:inline-block;margin-left:5px"></i></span>',
        props: {
            location: String,
            hint: {
                type: String,
                default: ''
            },
            grouphint: {
                type: String,
                default: ''
            }
        },
        data() {
            return {
                text: this.location,
                region: this.region,
                strict: this.strict,
                groupName: this.groupName
            };
        },
        methods: {
            parse() {
                this.text = this.location;
                const L = parseLocation(this.location);
                if (L.isOffline) {
                    this.text = 'Offline';
                } else if (L.isPrivate) {
                    this.text = 'Private';
                } else if (L.isTraveling) {
                    this.text = 'Traveling';
                } else if (typeof this.hint === 'string' && this.hint !== '') {
                    if (L.instanceId) {
                        this.text = `${this.hint} #${L.instanceName} ${L.accessTypeName}`;
                    } else {
                        this.text = this.hint;
                    }
                } else if (L.worldId) {
                    if (L.instanceId) {
                        this.text = ` #${L.instanceName} ${L.accessTypeName}`;
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
                this.groupName = this.grouphint;
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

    const app = {
        template: pugTemplate,
        i18n,
        data: {
            // 1 = 대시보드랑 손목에 보이는거
            // 2 = 항상 화면에 보이는 거
            appType: location.href.substr(-1),
            appLanguage: 'en',
            currentCulture: 'en-nz',
            isRunningUnderWine: false,
            currentTime: new Date().toJSON(),
            cpuUsageEnabled: false,
            cpuUsage: 0,
            pcUptimeEnabled: false,
            pcUptime: '',
            customInfo: '',
            config: {},
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
            devices: [],
            deviceCount: 0,
            notificationOpacity: 100
        },
        computed: {},
        methods: {},
        watch: {},
        el: '#root',
        async mounted() {
            if (WINDOWS) {
                this.isRunningUnderWine = await AppApiVr.IsRunningUnderWine();
                await this.applyWineEmojis();
            } else {
                this.updateVrElectronLoop();
            }
            if (this.appType === '1') {
                this.refreshCustomScript();
                this.updateStatsLoop();
            }
            this.setDatetimeFormat();
        }
    };
    Object.assign($app, app);

    $app.methods.configUpdate = function (json) {
        $app.config = JSON.parse(json);
        $app.hudFeed = [];
        $app.hudTimeout = [];
        $app.setDatetimeFormat();
        $app.setAppLanguage($app.config.appLanguage);
        $app.updateFeedLength();
        if (
            $app.config.vrOverlayCpuUsage !== $app.cpuUsageEnabled ||
            $app.config.pcUptimeOnFeed !== $app.pcUptimeEnabled
        ) {
            $app.cpuUsageEnabled = $app.config.vrOverlayCpuUsage;
            $app.pcUptimeEnabled = $app.config.pcUptimeOnFeed;
            AppApiVr.ToggleSystemMonitor(
                $app.cpuUsageEnabled || $app.pcUptimeEnabled
            );
        }
        if ($app.config.notificationOpacity !== $app.notificationOpacity) {
            $app.notificationOpacity = $app.config.notificationOpacity;
            $app.setNotyOpacity($app.notificationOpacity);
        }
    };

    $app.methods.updateOnlineFriendCount = function (count) {
        $app.onlineFriendCount = parseInt(count, 10);
    };

    $app.methods.nowPlayingUpdate = function (json) {
        $app.nowPlaying = JSON.parse(json);
        if ($app.appType === '2') {
            const circle = document.querySelector('.np-progress-circle-stroke');
            if (
                $app.lastLocation.progressPie &&
                $app.nowPlaying.percentage !== 0
            ) {
                circle.style.opacity = 0.5;
                const circumference = circle.getTotalLength();
                circle.style.strokeDashoffset =
                    circumference -
                    ($app.nowPlaying.percentage / 100) * circumference;
            } else {
                circle.style.opacity = 0;
            }
        }
        $app.updateFeedLength();
    };

    $app.methods.lastLocationUpdate = function (json) {
        $app.lastLocation = JSON.parse(json);
    };

    $app.methods.wristFeedUpdate = function (json) {
        $app.wristFeed = JSON.parse(json);
        $app.updateFeedLength();
    };

    $app.methods.updateFeedLength = function () {
        if ($app.appType === '2' || $app.wristFeed.length === 0) {
            return;
        }
        let length = 16;
        if (!$app.config.hideDevicesFromFeed) {
            length -= 2;
            if ($app.deviceCount > 8) {
                length -= 1;
            }
        }
        if ($app.nowPlaying.playing) {
            length -= 1;
        }
        if (length < $app.wristFeed.length) {
            $app.wristFeed.length = length;
        }
    };

    $app.methods.refreshCustomScript = async function () {
        if (document.contains(document.getElementById('vr-custom-script'))) {
            document.getElementById('vr-custom-script').remove();
        }
        const customScript = await AppApiVr.CustomVrScript();
        if (customScript) {
            const head = document.head;
            const $vrCustomScript = document.createElement('script');
            $vrCustomScript.setAttribute('id', 'vr-custom-script');
            $vrCustomScript.type = 'text/javascript';
            $vrCustomScript.textContent = customScript;
            head.appendChild($vrCustomScript);
        }
    };

    $app.methods.setNotyOpacity = function (value) {
        const opacity = parseFloat(value / 100).toFixed(2);
        let element = document.getElementById('noty-opacity');
        if (!element) {
            document.body.insertAdjacentHTML(
                'beforeend',
                `<style id="noty-opacity">.noty_layout { opacity: ${opacity}; }</style>`
            );
            element = document.getElementById('noty-opacity');
        }
        element.innerHTML = `.noty_layout { opacity: ${opacity}; }`;
    };

    $app.methods.updateStatsLoop = async function () {
        try {
            $app.currentTime = new Date()
                .toLocaleDateString($app.currentCulture, {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hourCycle: $app.config.dtHour12 ? 'h12' : 'h23'
                })
                .replace(' AM', ' am')
                .replace(' PM', ' pm')
                .replace(',', '');

            if ($app.cpuUsageEnabled) {
                const cpuUsage = await AppApiVr.CpuUsage();
                $app.cpuUsage = cpuUsage.toFixed(0);
            }
            if ($app.lastLocation.date !== 0) {
                $app.lastLocationTimer = timeToText(
                    Date.now() - $app.lastLocation.date
                );
            } else {
                $app.lastLocationTimer = '';
            }
            if ($app.lastLocation.onlineFor) {
                $app.onlineForTimer = timeToText(
                    Date.now() - $app.lastLocation.onlineFor
                );
            } else {
                $app.onlineForTimer = '';
            }

            if (!$app.config.hideDevicesFromFeed) {
                AppApiVr.GetVRDevices().then((devices) => {
                    let deviceList = [];
                    let baseStations = 0;
                    devices.forEach((device) => {
                        device[3] = parseInt(device[3], 10);
                        if (device[0] === 'base' && device[1] === 'connected') {
                            baseStations++;
                        } else {
                            deviceList.push(device);
                        }
                    });
                    $app.deviceCount = deviceList.length;
                    const deviceValue = (dev) => {
                        if (dev[0] === 'headset') return 0;
                        if (dev[0] === 'leftController') return 1;
                        if (dev[0] === 'rightController') return 2;
                        if (dev[0].toLowerCase().includes('controller'))
                            return 3;
                        if (dev[0] === 'tracker' || dev[0] === 'base') return 4;
                        return 5;
                    };
                    deviceList.sort((a, b) => deviceValue(a) - deviceValue(b));
                    deviceList.sort((a, b) => {
                        if (a[1] === b[1]) {
                            return 0;
                        }
                        if (a[1] === 'connected') {
                            return -1;
                        }
                        if (a[1] === 'disconnected') {
                            return 1;
                        }
                        return 0;
                    });
                    if (baseStations > 0) {
                        deviceList.push([
                            'base',
                            'connected',
                            '',
                            baseStations
                        ]);
                        $app.deviceCount += 1;
                    }
                    $app.devices = deviceList;
                });
            } else {
                $app.devices = [];
            }
            if ($app.config.pcUptimeOnFeed) {
                AppApiVr.GetUptime().then((uptime) => {
                    if (uptime) {
                        $app.pcUptime = timeToText(uptime);
                    }
                });
            } else {
                $app.pcUptime = '';
            }
        } catch (err) {
            console.error(err);
        }
        workerTimers.setTimeout(() => $app.updateStatsLoop(), 500);
    };

    $app.methods.updateVrElectronLoop = async function () {
        try {
            if ($app.appType === '1') {
                const wristOverlayQueue =
                    await AppApiVr.GetExecuteVrFeedFunctionQueue();
                if (wristOverlayQueue) {
                    wristOverlayQueue.forEach((item) => {
                        // item[0] is the function name, item[1] is already an object
                        const fullFunctionName = item[0];
                        const jsonArg = item[1];

                        if (
                            typeof window.$app === 'object' &&
                            typeof window.$app[fullFunctionName] === 'function'
                        ) {
                            window.$app[fullFunctionName](jsonArg);
                        } else {
                            console.error(
                                `$app.${fullFunctionName} is not defined or is not a function`
                            );
                        }
                    });
                }
            } else {
                const hmdOverlayQueue =
                    await AppApiVr.GetExecuteVrOverlayFunctionQueue();
                if (hmdOverlayQueue) {
                    hmdOverlayQueue.forEach((item) => {
                        // item[0] is the function name, item[1] is already an object
                        const fullFunctionName = item[0];
                        const jsonArg = item[1];

                        if (
                            typeof window.$app === 'object' &&
                            typeof window.$app[fullFunctionName] === 'function'
                        ) {
                            window.$app[fullFunctionName](jsonArg);
                        } else {
                            console.error(
                                `$app.${fullFunctionName} is not defined or is not a function`
                            );
                        }
                    });
                }
            }
        } catch (err) {
            console.error(err);
        }
        workerTimers.setTimeout(() => $app.updateVrElectronLoop(), 500);
    };

    $app.methods.playNoty = function (json) {
        let { noty, message, image } = JSON.parse(json);
        if (typeof noty === 'undefined') {
            console.error('noty is undefined');
            return;
        }
        noty = escapeTagRecursive(noty);
        message = escapeTag(message) || '';
        let text = '';
        let img = '';
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
                }</strong> is in ${displayLocation(
                    noty.location,
                    noty.worldName,
                    noty.groupName
                )}`;
                break;
            case 'Online':
                let locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
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
                }</strong> has invited you to ${displayLocation(
                    noty.details.worldId,
                    noty.details.worldName,
                    ''
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
            case 'boop':
                text = noty.message;
                break;
            case 'groupChange':
                text = `<strong>${noty.senderUsername}</strong> ${noty.message}`;
                break;
            case 'group.announcement':
                text = noty.message;
                break;
            case 'group.informative':
                text = noty.message;
                break;
            case 'group.invite':
                text = noty.message;
                break;
            case 'group.joinRequest':
                text = noty.message;
                break;
            case 'group.transfer':
                text = noty.message;
                break;
            case 'group.queueReady':
                text = noty.message;
                break;
            case 'instance.closed':
                text = noty.message;
                break;
            case 'PortalSpawn':
                if (noty.displayName) {
                    text = `<strong>${
                        noty.displayName
                    }</strong> has spawned a portal to ${displayLocation(
                        noty.instanceId,
                        noty.worldName,
                        noty.groupName
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
            case 'External':
                text = noty.message;
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
                theme: $app.config.notificationTheme,
                timeout: $app.config.notificationTimeout,
                layout: $app.config.notificationPosition,
                text: `${img}<div class="noty-text">${text}</div>`
            }).show();
        }
    };

    $app.methods.statusClass = function (status) {
        let style = {};
        if (typeof status === 'undefined') {
            return style;
        }
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
        return style;
    };

    $app.methods.notyClear = function () {
        Noty.closeAll();
    };

    $app.data.hudFeed = [];
    $app.data.cleanHudFeedLoopStatus = false;

    $app.methods.cleanHudFeedLoop = function () {
        if (!$app.cleanHudFeedLoopStatus) {
            return;
        }
        $app.cleanHudFeed();
        if ($app.hudFeed.length === 0) {
            $app.cleanHudFeedLoopStatus = false;
            return;
        }
        workerTimers.setTimeout(() => $app.cleanHudFeedLoop(), 500);
    };

    $app.methods.cleanHudFeed = function () {
        const dt = Date.now();
        $app.hudFeed.forEach((item) => {
            if (item.time + $app.config.photonOverlayMessageTimeout < dt) {
                removeFromArray($app.hudFeed, item);
            }
        });
        if ($app.hudFeed.length > 10) {
            $app.hudFeed.length = 10;
        }
        if (!$app.cleanHudFeedLoopStatus) {
            $app.cleanHudFeedLoopStatus = true;
            $app.cleanHudFeedLoop();
        }
    };

    $app.methods.addEntryHudFeed = function (json) {
        const data = JSON.parse(json);
        let combo = 1;
        $app.hudFeed.forEach((item) => {
            if (
                item.displayName === data.displayName &&
                item.text === data.text
            ) {
                combo = item.combo + 1;
                removeFromArray($app.hudFeed, item);
            }
        });
        $app.hudFeed.unshift({
            time: Date.now(),
            combo,
            ...data
        });
        $app.cleanHudFeed();
    };

    $app.methods.updateHudFeedTag = function (json) {
        const ref = JSON.parse(json);
        $app.hudFeed.forEach((item) => {
            if (item.userId === ref.userId) {
                item.colour = ref.colour;
            }
        });
    };

    $app.data.hudTimeout = [];

    $app.methods.updateHudTimeout = function (json) {
        $app.hudTimeout = JSON.parse(json);
    };

    $app.methods.setDatetimeFormat = async function () {
        $app.currentCulture = await AppApiVr.CurrentCulture();
        const formatDate = function (date) {
            if (!date) {
                return '';
            }
            const dt = new Date(date);
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

    $app.methods.setAppLanguage = function (appLanguage) {
        if (!appLanguage) {
            return;
        }
        if (appLanguage !== $app.appLanguage) {
            $app.appLanguage = appLanguage;
            i18n.locale = $app.appLanguage;
        }
    };

    $app.methods.applyWineEmojis = async function () {
        if (document.contains(document.getElementById('app-emoji-font'))) {
            document.getElementById('app-emoji-font').remove();
        }
        if ($app.isRunningUnderWine) {
            const $appEmojiFont = document.createElement('link');
            $appEmojiFont.setAttribute('id', 'app-emoji-font');
            $appEmojiFont.rel = 'stylesheet';
            $appEmojiFont.href = 'emoji.font.css';
            document.head.appendChild($appEmojiFont);
        }
    };

    $app.methods.trackingResultToClass = function (deviceStatus) {
        switch (deviceStatus) {
            case 'Uninitialized':
            case 'Calibrating_OutOfRange':
            case 'Fallback_RotationOnly':
                return 'tracker-error';

            case 'Calibrating_InProgress':
            case 'Running_OutOfRange':
                return 'tracker-warning';

            case 'Running_OK':
            default:
                return '';
        }
    };

    $app = new Vue($app);
    window.$app = $app;
})();
