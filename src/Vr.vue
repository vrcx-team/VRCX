<script>
    import '@fontsource/noto-sans-kr';
    import '@fontsource/noto-sans-jp';
    import '@fontsource/noto-sans-sc';
    import '@fontsource/noto-sans-tc';
    // @ts-ignore
    import pugTemplate from './vr.pug';
    import Vue, { onMounted, reactive, toRefs, nextTick } from 'vue';
    import Noty from 'noty';
    import * as workerTimers from 'worker-timers';
    import MarqueeText from 'vue-marquee-text-component';
    import VrLocation from './components/VrLocation.vue';
    import { displayLocation } from './shared/utils/location';
    import { escapeTag, escapeTagRecursive } from './shared/utils/base/string';
    import { removeFromArray } from './shared/utils/base/array';
    import { timeToText } from './shared/utils/base/format';

    import { i18n, t as $t } from './plugin/i18n.js';

    export default {
        name: 'vr',
        template: pugTemplate,
        components: {
            'marquee-text': MarqueeText,
            location: VrLocation
        },
        setup() {
            const vrState = reactive({
                appType: location.href.substr(-1),
                appLanguage: 'en',
                currentCulture: 'en-nz',
                isRunningUnderWine: false,
                currentTime: new Date().toJSON(),
                cpuUsageEnabled: false,
                cpuUsage: '0',
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
                    remainingText: '',
                    playing: false
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
                notificationOpacity: 100,
                hudFeed: [],
                hudTimeout: [],
                cleanHudFeedLoopStatus: false
            });

            onMounted(async () => {
                if (LINUX) {
                    updateVrElectronLoop();
                }
                if (vrState.appType === '1') {
                    refreshCustomScript();
                    updateStatsLoop();
                }
                setDatetimeFormat();

                nextTick(() => {
                    window.$app.configUpdate = configUpdate;
                    window.$app.updateOnlineFriendCount = updateOnlineFriendCount;
                    window.$app.nowPlayingUpdate = nowPlayingUpdate;
                    window.$app.lastLocationUpdate = lastLocationUpdate;
                    window.$app.wristFeedUpdate = wristFeedUpdate;
                    window.$app.refreshCustomScript = refreshCustomScript;
                    window.$app.playNoty = playNoty;
                    window.$app.statusClass = statusClass;
                    window.$app.notyClear = notyClear;
                    window.$app.addEntryHudFeed = addEntryHudFeed;
                    window.$app.updateHudFeedTag = updateHudFeedTag;
                    window.$app.updateHudTimeout = updateHudTimeout;
                    window.$app.setDatetimeFormat = setDatetimeFormat;
                    window.$app.setAppLanguage = setAppLanguage;
                    window.$app.trackingResultToClass = trackingResultToClass;
                    window.$app.updateFeedLength = updateFeedLength;
                    window.$app.updateStatsLoop = updateStatsLoop;
                    window.$app.updateVrElectronLoop = updateVrElectronLoop;
                    window.$app.cleanHudFeedLoop = cleanHudFeedLoop;
                    window.$app.cleanHudFeed = cleanHudFeed;

                    window.$app.vrState = vrState;

                    AppApiVr.VrInit();
                });
            });

            function configUpdate(json) {
                vrState.config = JSON.parse(json);
                vrState.hudFeed = [];
                vrState.hudTimeout = [];
                setDatetimeFormat();
                setAppLanguage(vrState.config.appLanguage);
                updateFeedLength();
                if (
                    vrState.config.vrOverlayCpuUsage !== vrState.cpuUsageEnabled ||
                    vrState.config.pcUptimeOnFeed !== vrState.pcUptimeEnabled
                ) {
                    vrState.cpuUsageEnabled = vrState.config.vrOverlayCpuUsage;
                    vrState.pcUptimeEnabled = vrState.config.pcUptimeOnFeed;
                    AppApiVr.ToggleSystemMonitor(vrState.cpuUsageEnabled || vrState.pcUptimeEnabled);
                }
                if (vrState.config.notificationOpacity !== vrState.notificationOpacity) {
                    vrState.notificationOpacity = vrState.config.notificationOpacity;
                    setNotyOpacity(vrState.notificationOpacity);
                }
            }

            function updateOnlineFriendCount(count) {
                vrState.onlineFriendCount = parseInt(count, 10);
            }

            function nowPlayingUpdate(json) {
                vrState.nowPlaying = JSON.parse(json);
                if (vrState.appType === '2') {
                    const circle = /** @type {SVGCircleElement} */ (
                        document.querySelector('.np-progress-circle-stroke')
                    );

                    if (vrState.lastLocation.progressPie && vrState.nowPlaying.percentage !== 0) {
                        circle.style.opacity = (0.5).toString();
                        const circumference = circle.getTotalLength();
                        circle.style.strokeDashoffset = (
                            circumference -
                            (vrState.nowPlaying.percentage / 100) * circumference
                        ).toString();
                    } else {
                        circle.style.opacity = '0';
                    }
                }
                updateFeedLength();
            }

            function lastLocationUpdate(json) {
                vrState.lastLocation = JSON.parse(json);
            }

            function wristFeedUpdate(json) {
                vrState.wristFeed = JSON.parse(json);
                updateFeedLength();
            }

            function updateFeedLength() {
                if (vrState.appType === '2' || vrState.wristFeed.length === 0) {
                    return;
                }
                let length = 16;
                if (!vrState.config.hideDevicesFromFeed) {
                    length -= 2;
                    if (vrState.deviceCount > 8) {
                        length -= 1;
                    }
                }
                if (vrState.nowPlaying.playing) {
                    length -= 1;
                }
                if (length < vrState.wristFeed.length) {
                    vrState.wristFeed.length = length;
                }
            }

            async function refreshCustomScript() {
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
            }

            function setNotyOpacity(value) {
                const opacity = (value / 100).toFixed(2);
                let element = document.getElementById('noty-opacity');
                if (!element) {
                    document.body.insertAdjacentHTML(
                        'beforeend',
                        `<style id="noty-opacity">.noty_layout { opacity: ${opacity}; }</style>`
                    );
                    element = document.getElementById('noty-opacity');
                }
                element.innerHTML = `.noty_layout { opacity: ${opacity}; }`;
            }

            async function updateStatsLoop() {
                try {
                    vrState.currentTime = new Date()
                        .toLocaleDateString(vrState.currentCulture, {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            second: 'numeric',
                            hourCycle: vrState.config.dtHour12 ? 'h12' : 'h23'
                        })
                        .replace(' AM', ' am')
                        .replace(' PM', ' pm')
                        .replace(',', '');

                    if (vrState.cpuUsageEnabled) {
                        const cpuUsage = await AppApiVr.CpuUsage();
                        vrState.cpuUsage = cpuUsage.toFixed(0);
                    }
                    if (vrState.lastLocation.date !== 0) {
                        vrState.lastLocationTimer = timeToText(Date.now() - vrState.lastLocation.date);
                    } else {
                        vrState.lastLocationTimer = '';
                    }
                    if (vrState.lastLocation.onlineFor) {
                        vrState.onlineForTimer = timeToText(Date.now() - vrState.lastLocation.onlineFor);
                    } else {
                        vrState.onlineForTimer = '';
                    }

                    if (!vrState.config.hideDevicesFromFeed) {
                        AppApiVr.GetVRDevices().then((devices) => {
                            let deviceList = [];
                            let baseStations = 0;
                            devices.forEach((device) => {
                                device[3] = parseInt(device[3], 10).toString();
                                if (device[0] === 'base' && device[1] === 'connected') {
                                    baseStations++;
                                } else {
                                    deviceList.push(device);
                                }
                            });
                            vrState.deviceCount = deviceList.length;
                            const deviceValue = (dev) => {
                                if (dev[0] === 'headset') return 0;
                                if (dev[0] === 'leftController') return 1;
                                if (dev[0] === 'rightController') return 2;
                                if (dev[0].toLowerCase().includes('controller')) return 3;
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
                                deviceList.push(['base', 'connected', '', baseStations]);
                                vrState.deviceCount += 1;
                            }
                            vrState.devices = deviceList;
                        });
                    } else {
                        vrState.devices = [];
                    }
                    if (vrState.config.pcUptimeOnFeed) {
                        AppApiVr.GetUptime().then((uptime) => {
                            if (uptime) {
                                vrState.pcUptime = timeToText(uptime);
                            }
                        });
                    } else {
                        vrState.pcUptime = '';
                    }
                } catch (err) {
                    console.error(err);
                }
                workerTimers.setTimeout(() => updateStatsLoop(), 500);
            }

            async function updateVrElectronLoop() {
                try {
                    if (vrState.appType === '1') {
                        const wristOverlayQueue = await AppApiVr.GetExecuteVrFeedFunctionQueue();
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
                                    console.error(`$app.${fullFunctionName} is not defined or is not a function`);
                                }
                            });
                        }
                    } else {
                        const hmdOverlayQueue = await AppApiVr.GetExecuteVrOverlayFunctionQueue();
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
                                    console.error(`$app.${fullFunctionName} is not defined or is not a function`);
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
                workerTimers.setTimeout(() => updateVrElectronLoop(), 500);
            }

            function playNoty(json) {
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
                        text = `<strong>${noty.displayName}</strong> is in ${displayLocation(
                            noty.location,
                            noty.worldName,
                            noty.groupName
                        )}`;
                        break;
                    case 'Online':
                        let locationName = '';
                        if (noty.worldName) {
                            locationName = ` to ${displayLocation(noty.location, noty.worldName, noty.groupName)}`;
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
                        text = `<strong>${noty.senderUsername}</strong> has invited you to ${displayLocation(
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
                            text = `<strong>${noty.displayName}</strong> has spawned a portal to ${displayLocation(
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
                        theme: vrState.config.notificationTheme,
                        timeout: vrState.config.notificationTimeout,
                        layout: vrState.config.notificationPosition,
                        text: `${img}<div class="noty-text">${text}</div>`
                    }).show();
                }
            }

            function statusClass(status) {
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
            }

            function notyClear() {
                Noty.closeAll();
            }

            function cleanHudFeedLoop() {
                if (!vrState.cleanHudFeedLoopStatus) {
                    return;
                }
                cleanHudFeed();
                if (vrState.hudFeed.length === 0) {
                    vrState.cleanHudFeedLoopStatus = false;
                    return;
                }
                workerTimers.setTimeout(() => cleanHudFeedLoop(), 500);
            }

            function cleanHudFeed() {
                const dt = Date.now();
                vrState.hudFeed.forEach((item) => {
                    if (item.time + vrState.config.photonOverlayMessageTimeout < dt) {
                        removeFromArray(vrState.hudFeed, item);
                    }
                });
                if (vrState.hudFeed.length > 10) {
                    vrState.hudFeed.length = 10;
                }
                if (!vrState.cleanHudFeedLoopStatus) {
                    vrState.cleanHudFeedLoopStatus = true;
                    cleanHudFeedLoop();
                }
            }

            function addEntryHudFeed(json) {
                const data = JSON.parse(json);
                let combo = 1;
                vrState.hudFeed.forEach((item) => {
                    if (item.displayName === data.displayName && item.text === data.text) {
                        combo = item.combo + 1;
                        removeFromArray(vrState.hudFeed, item);
                    }
                });
                vrState.hudFeed.unshift({
                    time: Date.now(),
                    combo,
                    ...data
                });
                cleanHudFeed();
            }

            function updateHudFeedTag(json) {
                const ref = JSON.parse(json);
                vrState.hudFeed.forEach((item) => {
                    if (item.userId === ref.userId) {
                        item.colour = ref.colour;
                    }
                });
            }

            function updateHudTimeout(json) {
                vrState.hudTimeout = JSON.parse(json);
            }

            async function setDatetimeFormat() {
                vrState.currentCulture = await AppApiVr.CurrentCulture();
                const formatDate = (date) => {
                    if (!date) {
                        return '';
                    }
                    const dt = new Date(date);
                    return dt
                        .toLocaleTimeString(vrState.currentCulture, {
                            hour: '2-digit',
                            minute: 'numeric',
                            hourCycle: vrState.config.dtHour12 ? 'h12' : 'h23'
                        })
                        .replace(' am', '')
                        .replace(' pm', '');
                };
                Vue.filter('formatDate', formatDate);
            }

            function setAppLanguage(appLanguage) {
                if (!appLanguage) {
                    return;
                }
                if (appLanguage !== vrState.appLanguage) {
                    vrState.appLanguage = appLanguage;
                    // @ts-ignore
                    i18n.locale = vrState.appLanguage;
                }
            }

            function trackingResultToClass(deviceStatus) {
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
            }
            const {
                appType,
                config,
                wristFeed,
                devices,
                nowPlaying,
                lastLocation,
                lastLocationTimer,
                onlineForTimer,
                pcUptime,
                currentTime,
                cpuUsageEnabled,
                cpuUsage,
                onlineFriendCount,
                customInfo,
                hudFeed,
                hudTimeout
            } = toRefs(vrState);

            return {
                appType,
                config,
                wristFeed,
                devices,
                nowPlaying,
                lastLocation,
                lastLocationTimer,
                onlineForTimer,
                pcUptime,
                currentTime,
                cpuUsageEnabled,
                cpuUsage,
                onlineFriendCount,
                customInfo,
                hudFeed,
                hudTimeout,
                statusClass,
                trackingResultToClass,
                $t
            };
        }
    };
</script>
