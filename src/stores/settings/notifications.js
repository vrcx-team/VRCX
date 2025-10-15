import { ElMessageBox } from 'element-plus';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { sharedFeedFiltersDefaults } from '../../shared/constants';
import { useVrStore } from '../vr';

import configRepository from '../../service/config';

export const useNotificationsSettingsStore = defineStore(
    'NotificationsSettings',
    () => {
        const vrStore = useVrStore();

        const { t } = useI18n();

        const overlayToast = ref('Game Running');
        const openVR = ref(false);
        const overlayNotifications = ref(true);
        const xsNotifications = ref(true);
        const ovrtHudNotifications = ref(true);
        const ovrtWristNotifications = ref(false);
        const imageNotifications = ref(true);
        const desktopToast = ref('Never');
        const afkDesktopToast = ref(false);
        const notificationTTS = ref('Never');
        const notificationTTSNickName = ref(false);
        const sharedFeedFilters = ref({
            noty: {
                Location: 'Off',
                OnPlayerJoined: 'VIP',
                OnPlayerLeft: 'VIP',
                OnPlayerJoining: 'VIP',
                Online: 'VIP',
                Offline: 'VIP',
                GPS: 'Off',
                Status: 'Off',
                invite: 'Friends',
                requestInvite: 'Friends',
                inviteResponse: 'Friends',
                requestInviteResponse: 'Friends',
                friendRequest: 'On',
                Friend: 'On',
                Unfriend: 'On',
                DisplayName: 'VIP',
                TrustLevel: 'VIP',
                boop: 'Off',
                groupChange: 'On',
                'group.announcement': 'On',
                'group.informative': 'On',
                'group.invite': 'On',
                'group.joinRequest': 'Off',
                'group.transfer': 'On',
                'group.queueReady': 'On',
                'instance.closed': 'On',
                PortalSpawn: 'Everyone',
                Event: 'On',
                External: 'On',
                VideoPlay: 'Off',
                BlockedOnPlayerJoined: 'Off',
                BlockedOnPlayerLeft: 'Off',
                MutedOnPlayerJoined: 'Off',
                MutedOnPlayerLeft: 'Off',
                AvatarChange: 'Off',
                ChatBoxMessage: 'Off',
                Blocked: 'Off',
                Unblocked: 'Off',
                Muted: 'Off',
                Unmuted: 'Off'
            },
            wrist: {
                Location: 'On',
                OnPlayerJoined: 'Everyone',
                OnPlayerLeft: 'Everyone',
                OnPlayerJoining: 'Friends',
                Online: 'Friends',
                Offline: 'Friends',
                GPS: 'Friends',
                Status: 'Friends',
                invite: 'Friends',
                requestInvite: 'Friends',
                inviteResponse: 'Friends',
                requestInviteResponse: 'Friends',
                friendRequest: 'On',
                Friend: 'On',
                Unfriend: 'On',
                DisplayName: 'Friends',
                TrustLevel: 'Friends',
                boop: 'On',
                groupChange: 'On',
                'group.announcement': 'On',
                'group.informative': 'On',
                'group.invite': 'On',
                'group.joinRequest': 'On',
                'group.transfer': 'On',
                'group.queueReady': 'On',
                'instance.closed': 'On',
                PortalSpawn: 'Everyone',
                Event: 'On',
                External: 'On',
                VideoPlay: 'On',
                BlockedOnPlayerJoined: 'Off',
                BlockedOnPlayerLeft: 'Off',
                MutedOnPlayerJoined: 'Off',
                MutedOnPlayerLeft: 'Off',
                AvatarChange: 'Everyone',
                ChatBoxMessage: 'Off',
                Blocked: 'On',
                Unblocked: 'On',
                Muted: 'On',
                Unmuted: 'On'
            }
        });
        const isTestTTSVisible = ref(false);
        const notificationTTSVoice = ref(0);
        const TTSvoices = ref([]);
        const notificationTTSTest = ref('');
        const notificationPosition = ref('topCenter');
        const notificationTimeout = ref(3000);

        async function initNotificationsSettings() {
            const [
                overlayToastConfig,
                overlayNotificationsConfig,
                openVRConfig,
                xsNotificationsConfig,
                ovrtHudNotificationsConfig,
                ovrtWristNotificationsConfig,
                imageNotificationsConfig,
                desktopToastConfig,
                afkDesktopToastConfig,
                notificationTTSConfig,
                notificationTTSNickNameConfig,
                sharedFeedFiltersConfig,
                notificationTTSVoiceConfig,
                notificationPositionConfig,
                notificationTimeoutConfig
            ] = await Promise.all([
                configRepository.getString('VRCX_overlayToast', 'Game Running'),
                configRepository.getBool('VRCX_overlayNotifications', true),
                configRepository.getBool('openVR'),
                configRepository.getBool('VRCX_xsNotifications', true),
                configRepository.getBool('VRCX_ovrtHudNotifications', true),
                configRepository.getBool('VRCX_ovrtWristNotifications', false),
                configRepository.getBool('VRCX_imageNotifications', true),
                configRepository.getString('VRCX_desktopToast', 'Never'),
                configRepository.getBool('VRCX_afkDesktopToast', false),
                configRepository.getString('VRCX_notificationTTS', 'Never'),
                configRepository.getBool('VRCX_notificationTTSNickName', false),
                configRepository.getString(
                    'sharedFeedFilters',
                    JSON.stringify(sharedFeedFiltersDefaults)
                ),
                configRepository.getString('VRCX_notificationTTSVoice', '0'),
                configRepository.getString(
                    'VRCX_notificationPosition',
                    'topCenter'
                ),
                configRepository.getString('VRCX_notificationTimeout', '3000')
            ]);

            overlayToast.value = overlayToastConfig;
            openVR.value = openVRConfig;
            overlayNotifications.value = overlayNotificationsConfig;
            xsNotifications.value = xsNotificationsConfig;
            ovrtHudNotifications.value = ovrtHudNotificationsConfig;
            ovrtWristNotifications.value = ovrtWristNotificationsConfig;
            imageNotifications.value = imageNotificationsConfig;
            desktopToast.value = desktopToastConfig;
            afkDesktopToast.value = afkDesktopToastConfig;
            notificationTTS.value = notificationTTSConfig;
            notificationTTSNickName.value = notificationTTSNickNameConfig;
            sharedFeedFilters.value = JSON.parse(sharedFeedFiltersConfig);
            notificationTTSVoice.value = Number(notificationTTSVoiceConfig);
            TTSvoices.value = speechSynthesis.getVoices();
            notificationPosition.value = notificationPositionConfig;
            notificationTimeout.value = Number(notificationTimeoutConfig);

            initSharedFeedFilters();

            setTimeout(() => {
                // some workaround for failing to get voice list first run
                updateTTSVoices();
            }, 5000);
        }

        initNotificationsSettings();

        function setOverlayToast(value) {
            overlayToast.value = value;
            configRepository.setString('VRCX_overlayToast', value);
        }
        function setOverlayNotifications() {
            overlayNotifications.value = !overlayNotifications.value;
            configRepository.setBool(
                'VRCX_overlayNotifications',
                overlayNotifications.value
            );
        }
        function setOpenVR() {
            openVR.value = !openVR.value;
            configRepository.setBool('openVR', openVR.value);
        }
        function setXsNotifications() {
            xsNotifications.value = !xsNotifications.value;
            configRepository.setBool(
                'VRCX_xsNotifications',
                xsNotifications.value
            );
        }
        function setOvrtHudNotifications() {
            ovrtHudNotifications.value = !ovrtHudNotifications.value;
            configRepository.setBool(
                'VRCX_ovrtHudNotifications',
                ovrtHudNotifications.value
            );
        }
        function setOvrtWristNotifications() {
            ovrtWristNotifications.value = !ovrtWristNotifications.value;
            configRepository.setBool(
                'VRCX_ovrtWristNotifications',
                ovrtWristNotifications.value
            );
        }
        function setImageNotifications() {
            imageNotifications.value = !imageNotifications.value;
            configRepository.setBool(
                'VRCX_imageNotifications',
                imageNotifications.value
            );
        }

        function changeNotificationPosition(value) {
            notificationPosition.value = value;
            configRepository.setString(
                'VRCX_notificationPosition',
                notificationPosition.value
            );
            vrStore.updateVRConfigVars();
        }
        /**
         * @param {string} value
         */
        function setDesktopToast(value) {
            desktopToast.value = value;
            configRepository.setString('VRCX_desktopToast', value);
        }
        function setAfkDesktopToast() {
            afkDesktopToast.value = !afkDesktopToast.value;
            configRepository.setBool(
                'VRCX_afkDesktopToast',
                afkDesktopToast.value
            );
        }
        /**
         * @param {string} value
         */
        function setNotificationTTS(value) {
            notificationTTS.value = value;
            configRepository.setString('VRCX_notificationTTS', value);
        }
        function setNotificationTTSNickName() {
            notificationTTSNickName.value = !notificationTTSNickName.value;
            configRepository.setBool(
                'VRCX_notificationTTSNickName',
                notificationTTSNickName.value
            );
        }
        function initSharedFeedFilters() {
            if (!sharedFeedFilters.value.noty.Blocked) {
                sharedFeedFilters.value.noty.Blocked = 'Off';
                sharedFeedFilters.value.noty.Unblocked = 'Off';
                sharedFeedFilters.value.noty.Muted = 'Off';
                sharedFeedFilters.value.noty.Unmuted = 'Off';
                sharedFeedFilters.value.wrist.Blocked = 'On';
                sharedFeedFilters.value.wrist.Unblocked = 'On';
                sharedFeedFilters.value.wrist.Muted = 'On';
                sharedFeedFilters.value.wrist.Unmuted = 'On';
            }
            if (!sharedFeedFilters.value.noty['group.announcement']) {
                sharedFeedFilters.value.noty['group.announcement'] = 'On';
                sharedFeedFilters.value.noty['group.informative'] = 'On';
                sharedFeedFilters.value.noty['group.invite'] = 'On';
                sharedFeedFilters.value.noty['group.joinRequest'] = 'Off';
                sharedFeedFilters.value.wrist['group.announcement'] = 'On';
                sharedFeedFilters.value.wrist['group.informative'] = 'On';
                sharedFeedFilters.value.wrist['group.invite'] = 'On';
                sharedFeedFilters.value.wrist['group.joinRequest'] = 'On';
            }
            if (!sharedFeedFilters.value.noty['group.queueReady']) {
                sharedFeedFilters.value.noty['group.queueReady'] = 'On';
                sharedFeedFilters.value.wrist['group.queueReady'] = 'On';
            }
            if (!sharedFeedFilters.value.noty['instance.closed']) {
                sharedFeedFilters.value.noty['instance.closed'] = 'On';
                sharedFeedFilters.value.wrist['instance.closed'] = 'On';
            }
            if (!sharedFeedFilters.value.noty.External) {
                sharedFeedFilters.value.noty.External = 'On';
                sharedFeedFilters.value.wrist.External = 'On';
            }
            if (!sharedFeedFilters.value.noty.groupChange) {
                sharedFeedFilters.value.noty.groupChange = 'On';
                sharedFeedFilters.value.wrist.groupChange = 'On';
            }
            if (!sharedFeedFilters.value.noty['group.transfer']) {
                sharedFeedFilters.value.noty['group.transfer'] = 'On';
                sharedFeedFilters.value.wrist['group.transfer'] = 'On';
            }
            if (!sharedFeedFilters.value.noty.boop) {
                sharedFeedFilters.value.noty.boop = 'Off';
                sharedFeedFilters.value.wrist.boop = 'On';
            }
        }
        function setNotificationTTSVoice(index) {
            notificationTTSVoice.value = index;
            configRepository.setString(
                'VRCX_notificationTTSVoice',
                notificationTTSVoice.value.toString()
            );
        }

        function getTTSVoiceName() {
            let voices;
            if (WINDOWS) {
                voices = speechSynthesis.getVoices();
            } else {
                voices = TTSvoices.value;
            }
            if (voices.length === 0) {
                return '';
            }
            if (notificationTTSVoice.value >= voices.length) {
                setNotificationTTSVoice(0);
            }
            return voices[notificationTTSVoice.value].name;
        }

        async function changeTTSVoice(index) {
            setNotificationTTSVoice(index);
            let voices;
            if (WINDOWS) {
                voices = speechSynthesis.getVoices();
            } else {
                voices = TTSvoices.value;
            }
            if (voices.length === 0) {
                return;
            }
            const voiceName = voices[index].name;
            speechSynthesis.cancel();
            speak(voiceName);
        }

        function updateTTSVoices() {
            TTSvoices.value = speechSynthesis.getVoices();
            if (LINUX) {
                const voices = speechSynthesis.getVoices();
                let uniqueVoices = [];
                voices.forEach((voice) => {
                    if (!uniqueVoices.some((v) => v.lang === voice.lang)) {
                        uniqueVoices.push(voice);
                    }
                });
                uniqueVoices = uniqueVoices.filter((v) =>
                    v.lang.startsWith('en')
                );
                TTSvoices.value = uniqueVoices;
            }
        }
        async function saveNotificationTTS(value) {
            speechSynthesis.cancel();
            if (
                (await configRepository.getString('VRCX_notificationTTS')) ===
                    'Never' &&
                value !== 'Never'
            ) {
                speak('Notification text-to-speech enabled');
            }
            setNotificationTTS(value);
        }

        function testNotificationTTS() {
            speechSynthesis.cancel();
            speak(notificationTTSTest.value);
        }

        function speak(text) {
            const tts = new SpeechSynthesisUtterance();
            const voices = speechSynthesis.getVoices();
            if (voices.length === 0) {
                return;
            }
            let index = 0;
            if (notificationTTSVoice.value < voices.length) {
                index = notificationTTSVoice.value;
            }
            tts.voice = voices[index];
            tts.text = text;
            speechSynthesis.speak(tts);
        }

        function promptNotificationTimeout() {
            ElMessageBox.prompt(
                t('prompt.notification_timeout.description'),
                t('prompt.notification_timeout.header'),
                {
                    distinguishCancelAndClose: true,
                    confirmButtonText: t('prompt.notification_timeout.ok'),
                    cancelButtonText: t('prompt.notification_timeout.cancel'),
                    inputValue: notificationTimeout.value / 1000,
                    inputPattern: /\d+$/,
                    inputErrorMessage: t(
                        'prompt.notification_timeout.input_error'
                    )
                }
            )
                .then(async ({ value }) => {
                    if (value && !isNaN(value)) {
                        notificationTimeout.value = Math.trunc(
                            Number(value) * 1000
                        );
                        await configRepository.setString(
                            'VRCX_notificationTimeout',
                            notificationTimeout.value.toString()
                        );
                        vrStore.updateVRConfigVars();
                    }
                })
                .catch(() => {});
        }

        return {
            overlayToast,
            openVR,
            overlayNotifications,
            xsNotifications,
            ovrtHudNotifications,
            ovrtWristNotifications,
            imageNotifications,
            desktopToast,
            afkDesktopToast,
            notificationTTS,
            notificationTTSNickName,
            sharedFeedFilters,
            isTestTTSVisible,
            notificationTTSVoice,
            TTSvoices,
            notificationTTSTest,
            notificationPosition,
            notificationTimeout,

            setOverlayToast,
            setOpenVR,
            setOverlayNotifications,
            setXsNotifications,
            setOvrtHudNotifications,
            setOvrtWristNotifications,
            setImageNotifications,
            setDesktopToast,
            setAfkDesktopToast,
            setNotificationTTS,
            setNotificationTTSNickName,
            getTTSVoiceName,
            changeTTSVoice,
            saveNotificationTTS,
            testNotificationTTS,
            speak,
            changeNotificationPosition,
            promptNotificationTimeout
        };
    }
);
