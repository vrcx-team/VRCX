<template>
    <div>
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.settings.notifications.notifications.header') }}</span>
            <div class="options-container-item">
                <el-button size="small" :icon="ChatSquare" @click="showNotyFeedFiltersDialog">{{
                    t('view.settings.notifications.notifications.notification_filter')
                }}</el-button>
            </div>
        </div>
        <div class="options-container">
            <span class="sub-header">{{
                t('view.settings.notifications.notifications.steamvr_notifications.header')
            }}</span>
            <div class="options-container-item">
                <span class="name">{{
                    t('view.settings.notifications.notifications.desktop_notifications.when_to_display')
                }}</span>
                <br />
                <el-radio-group
                    :model-value="overlayToast"
                    size="small"
                    :disabled="
                        (!overlayNotifications || !openVR) &&
                        !xsNotifications &&
                        !ovrtHudNotifications &&
                        !ovrtWristNotifications
                    "
                    style="margin-top: 5px"
                    @change="
                        setOverlayToast($event);
                        saveOpenVROption();
                    ">
                    <el-radio-button value="Never">{{
                        t('view.settings.notifications.notifications.conditions.never')
                    }}</el-radio-button>
                    <el-radio-button value="Game Running">{{
                        t('view.settings.notifications.notifications.conditions.inside_vrchat')
                    }}</el-radio-button>
                    <el-radio-button value="Game Closed">{{
                        t('view.settings.notifications.notifications.conditions.outside_vrchat')
                    }}</el-radio-button>
                    <el-radio-button value="Always">{{
                        t('view.settings.notifications.notifications.conditions.always')
                    }}</el-radio-button>
                </el-radio-group>
            </div>
            <simple-switch
                :label="t('view.settings.notifications.notifications.steamvr_notifications.steamvr_overlay')"
                :value="openVR"
                @change="
                    setOpenVR();
                    saveOpenVROption();
                " />
            <template v-if="openVR">
                <simple-switch
                    :label="t('view.settings.notifications.notifications.steamvr_notifications.overlay_notifications')"
                    :value="overlayNotifications"
                    :disabled="!openVR"
                    @change="
                        setOverlayNotifications();
                        saveOpenVROption();
                    " />
                <div class="options-container-item">
                    <el-button
                        size="small"
                        :icon="Rank"
                        :disabled="!overlayNotifications || !openVR"
                        @click="showNotificationPositionDialog"
                        >{{
                            t('view.settings.notifications.notifications.steamvr_notifications.notification_position')
                        }}</el-button
                    >
                </div>
            </template>
            <div class="options-container-item">
                <span class="name" style="vertical-align: top; padding-top: 10px">{{
                    t('view.settings.notifications.notifications.steamvr_notifications.notification_opacity')
                }}</span>
                <el-slider
                    :model-value="notificationOpacity"
                    @input="setNotificationOpacity"
                    :min="0"
                    :max="100"
                    style="display: inline-block; width: 300px; padding-top: 16px" />
            </div>
            <div class="options-container-item">
                <el-button
                    size="small"
                    :icon="Timer"
                    :disabled="(!overlayNotifications || !openVR) && !xsNotifications"
                    @click="promptNotificationTimeout"
                    >{{
                        t('view.settings.notifications.notifications.steamvr_notifications.notification_timeout')
                    }}</el-button
                >
            </div>
            <simple-switch
                :label="t('view.settings.notifications.notifications.steamvr_notifications.user_images')"
                :value="imageNotifications"
                @change="
                    setImageNotifications();
                    saveOpenVROption();
                " />
            <template v-if="!isLinux">
                <simple-switch
                    :label="
                        t('view.settings.notifications.notifications.steamvr_notifications.xsoverlay_notifications')
                    "
                    :value="xsNotifications"
                    @change="
                        setXsNotifications();
                        saveOpenVROption();
                    " />
            </template>
            <template v-else>
                <simple-switch
                    :label="
                        t('view.settings.notifications.notifications.steamvr_notifications.wlxoverlay_notifications')
                    "
                    :value="xsNotifications"
                    @change="
                        setXsNotifications();
                        saveOpenVROption();
                    " />
            </template>
            <template v-if="!isLinux">
                <simple-switch
                    :label="
                        t(
                            'view.settings.notifications.notifications.steamvr_notifications.ovrtoolkit_hud_notifications'
                        )
                    "
                    :value="ovrtHudNotifications"
                    @change="
                        setOvrtHudNotifications();
                        saveOpenVROption();
                    " />
                <simple-switch
                    :label="
                        t(
                            'view.settings.notifications.notifications.steamvr_notifications.ovrtoolkit_wrist_notifications'
                        )
                    "
                    :value="ovrtWristNotifications"
                    @change="
                        setOvrtWristNotifications();
                        saveOpenVROption();
                    " />
            </template>
        </div>
        <div class="options-container">
            <span class="sub-header">{{
                t('view.settings.notifications.notifications.desktop_notifications.header')
            }}</span>
            <div class="options-container-item">
                <span class="name">{{
                    t('view.settings.notifications.notifications.desktop_notifications.when_to_display')
                }}</span>
                <br />
                <el-radio-group
                    :model-value="desktopToast"
                    size="small"
                    style="margin-top: 5px"
                    @change="setDesktopToast($event)">
                    <el-radio-button value="Never">{{
                        t('view.settings.notifications.notifications.conditions.never')
                    }}</el-radio-button>
                    <el-radio-button value="Desktop Mode">{{
                        t('view.settings.notifications.notifications.conditions.desktop')
                    }}</el-radio-button>
                    <el-radio-button value="Inside VR">{{
                        t('view.settings.notifications.notifications.conditions.inside_vr')
                    }}</el-radio-button>
                    <el-radio-button value="Outside VR">{{
                        t('view.settings.notifications.notifications.conditions.outside_vr')
                    }}</el-radio-button>
                    <el-radio-button value="Game Running">{{
                        t('view.settings.notifications.notifications.conditions.inside_vrchat')
                    }}</el-radio-button>
                    <el-radio-button value="Game Closed">{{
                        t('view.settings.notifications.notifications.conditions.outside_vrchat')
                    }}</el-radio-button>
                    <el-radio-button value="Always">{{
                        t('view.settings.notifications.notifications.conditions.always')
                    }}</el-radio-button>
                </el-radio-group>
            </div>
            <simple-switch
                :label="
                    t('view.settings.notifications.notifications.desktop_notifications.desktop_notification_while_afk')
                "
                :value="afkDesktopToast"
                @change="setAfkDesktopToast" />
        </div>
        <div class="options-container">
            <span class="sub-header">{{ t('view.settings.notifications.notifications.text_to_speech.header') }}</span>
            <div class="options-container-item">
                <span class="name">{{
                    t('view.settings.notifications.notifications.text_to_speech.when_to_play')
                }}</span>
                <br />
                <el-radio-group
                    :model-value="notificationTTS"
                    size="small"
                    style="margin-top: 5px"
                    @change="saveNotificationTTS">
                    <el-radio-button value="Never">{{
                        t('view.settings.notifications.notifications.conditions.never')
                    }}</el-radio-button>
                    <el-radio-button value="Inside VR">{{
                        t('view.settings.notifications.notifications.conditions.inside_vr')
                    }}</el-radio-button>
                    <el-radio-button value="Game Running">{{
                        t('view.settings.notifications.notifications.conditions.inside_vrchat')
                    }}</el-radio-button>
                    <el-radio-button value="Game Closed">{{
                        t('view.settings.notifications.notifications.conditions.outside_vrchat')
                    }}</el-radio-button>
                    <el-radio-button value="Always">{{
                        t('view.settings.notifications.notifications.conditions.always')
                    }}</el-radio-button>
                </el-radio-group>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.notifications.notifications.text_to_speech.tts_voice') }}</span>
                <el-dropdown trigger="click" size="small" @command="(voice) => changeTTSVoice(voice)">
                    <el-button size="small" :disabled="notificationTTS === 'Never'">
                        <span
                            >{{ getTTSVoiceName() }} <el-icon style="margin-left: 5px"><ArrowDown /></el-icon
                        ></span>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item
                                v-for="(voice, index) in TTSvoices"
                                :key="index"
                                :command="index"
                                v-text="voice.name" />
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
            <simple-switch
                :label="t('view.settings.notifications.notifications.text_to_speech.use_memo_nicknames')"
                :value="notificationTTSNickName"
                :disabled="notificationTTS === 'Never'"
                @change="setNotificationTTSNickName" />
            <simple-switch
                :label="t('view.settings.notifications.notifications.text_to_speech.tts_test_placeholder')"
                :value="isTestTTSVisible"
                @change="isTestTTSVisible = !isTestTTSVisible" />
            <div v-if="isTestTTSVisible" style="margin-top: 5px">
                <el-input
                    v-model="notificationTTSTest"
                    type="textarea"
                    :placeholder="t('view.settings.notifications.notifications.text_to_speech.tts_test_placeholder')"
                    :rows="1"
                    style="width: 175px; display: inline-block"></el-input>
                <el-button size="small" :icon="VideoPlay" style="margin-left: 10px" @click="testNotificationTTS">{{
                    t('view.settings.notifications.notifications.text_to_speech.play')
                }}</el-button>
            </div>
        </div>
        <NotificationPositionDialog v-model:isNotificationPositionDialogVisible="isNotificationPositionDialogVisible" />
        <FeedFiltersDialog v-model:feedFiltersDialogMode="feedFiltersDialogMode" />
    </div>
</template>

<script setup>
    import { ArrowDown, ChatSquare, Rank, Timer, VideoPlay } from '@element-plus/icons-vue';
    import { computed, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAdvancedSettingsStore, useNotificationsSettingsStore, useVrStore } from '../../../../stores';

    import FeedFiltersDialog from '../../dialogs/FeedFiltersDialog.vue';
    import NotificationPositionDialog from '../../dialogs/NotificationPositionDialog.vue';
    import SimpleSwitch from '../SimpleSwitch.vue';

    const { t } = useI18n();

    const notificationsSettingsStore = useNotificationsSettingsStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const { saveOpenVROption } = useVrStore();

    const {
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
        isTestTTSVisible,
        notificationTTSTest,
        TTSvoices
    } = storeToRefs(notificationsSettingsStore);

    const { notificationOpacity } = storeToRefs(advancedSettingsStore);

    const {
        setOverlayToast,
        setOpenVR,
        setOverlayNotifications,
        setXsNotifications,
        setOvrtHudNotifications,
        setOvrtWristNotifications,
        setImageNotifications,
        setDesktopToast,
        setAfkDesktopToast,
        setNotificationTTSNickName,
        getTTSVoiceName,
        changeTTSVoice,
        saveNotificationTTS,
        testNotificationTTS,
        promptNotificationTimeout
    } = notificationsSettingsStore;

    const { setNotificationOpacity } = advancedSettingsStore;

    const feedFiltersDialogMode = ref('');
    const isNotificationPositionDialogVisible = ref(false);
    const isLinux = computed(() => LINUX);

    function showNotyFeedFiltersDialog() {
        feedFiltersDialogMode.value = 'noty';
    }

    function showNotificationPositionDialog() {
        isNotificationPositionDialogVisible.value = true;
    }
</script>
