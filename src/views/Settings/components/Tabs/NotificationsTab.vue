<template>
    <div>
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.settings.notifications.notifications.header') }}</span>
            <div class="options-container-item">
                <Button size="sm" variant="outline" @click="showNotyFeedFiltersDialog">{{
                    t('view.settings.notifications.notifications.notification_filter')
                }}</Button>
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
                <ToggleGroup
                    type="single"
                    required
                    variant="outline"
                    size="sm"
                    :model-value="overlayToast"
                    :disabled="
                        (!overlayNotifications || !openVR) &&
                        !xsNotifications &&
                        !ovrtHudNotifications &&
                        !ovrtWristNotifications
                    "
                    style="margin-top: 5px"
                    @update:model-value="
                        setOverlayToast($event);
                        saveOpenVROption();
                    ">
                    <ToggleGroupItem value="Never">{{
                        t('view.settings.notifications.notifications.conditions.never')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Game Running">{{
                        t('view.settings.notifications.notifications.conditions.inside_vrchat')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Game Closed">{{
                        t('view.settings.notifications.notifications.conditions.outside_vrchat')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Always">{{
                        t('view.settings.notifications.notifications.conditions.always')
                    }}</ToggleGroupItem>
                </ToggleGroup>
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
                    <Button
                        size="sm"
                        variant="outline"
                        :disabled="!overlayNotifications || !openVR"
                        @click="showNotificationPositionDialog"
                        >{{
                            t('view.settings.notifications.notifications.steamvr_notifications.notification_position')
                        }}</Button
                    >
                </div>
            </template>
            <div class="options-container-item">
                <span class="name" style="vertical-align: top; padding-top: 10px">{{
                    t('view.settings.notifications.notifications.steamvr_notifications.notification_opacity')
                }}</span>
                <div style="flex: 0 0 300px; width: 300px; max-width: 100%; padding-top: 16px">
                    <Slider v-model="notificationOpacityValue" :min="0" :max="100" />
                </div>
            </div>
            <div class="options-container-item">
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="(!overlayNotifications || !openVR) && !xsNotifications"
                    @click="promptNotificationTimeout"
                    >{{
                        t('view.settings.notifications.notifications.steamvr_notifications.notification_timeout')
                    }}</Button
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
                <ToggleGroup
                    type="single"
                    required
                    variant="outline"
                    size="sm"
                    :model-value="desktopToast"
                    style="margin-top: 5px"
                    @update:model-value="setDesktopToast(String($event))">
                    <ToggleGroupItem value="Never">{{
                        t('view.settings.notifications.notifications.conditions.never')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Desktop Mode">{{
                        t('view.settings.notifications.notifications.conditions.desktop')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Inside VR">{{
                        t('view.settings.notifications.notifications.conditions.inside_vr')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Outside VR">{{
                        t('view.settings.notifications.notifications.conditions.outside_vr')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Game Running">{{
                        t('view.settings.notifications.notifications.conditions.inside_vrchat')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Game Closed">{{
                        t('view.settings.notifications.notifications.conditions.outside_vrchat')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Always">{{
                        t('view.settings.notifications.notifications.conditions.always')
                    }}</ToggleGroupItem>
                </ToggleGroup>
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
                <ToggleGroup
                    type="single"
                    required
                    variant="outline"
                    size="sm"
                    :model-value="notificationTTS"
                    style="margin-top: 5px"
                    @update:model-value="saveNotificationTTS">
                    <ToggleGroupItem value="Never">{{
                        t('view.settings.notifications.notifications.conditions.never')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Inside VR">{{
                        t('view.settings.notifications.notifications.conditions.inside_vr')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Game Running">{{
                        t('view.settings.notifications.notifications.conditions.inside_vrchat')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Game Closed">{{
                        t('view.settings.notifications.notifications.conditions.outside_vrchat')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Always">{{
                        t('view.settings.notifications.notifications.conditions.always')
                    }}</ToggleGroupItem>
                </ToggleGroup>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.notifications.notifications.text_to_speech.tts_voice') }}</span>
                <Select
                    :model-value="ttsVoiceIndex"
                    :disabled="notificationTTS === 'Never'"
                    @update:modelValue="(v) => (ttsVoiceIndex = v)">
                    <SelectTrigger size="sm">
                        <SelectValue :placeholder="getTTSVoiceName()" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="(voice, index) in TTSvoices" :key="index" :value="index">
                                {{ voice.name }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
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
                <Button size="sm" variant="outline" style="margin-left: 10px" @click="testNotificationTTS">{{
                    t('view.settings.notifications.notifications.text_to_speech.play')
                }}</Button>
            </div>
        </div>
        <NotificationPositionDialog v-model:isNotificationPositionDialogVisible="isNotificationPositionDialogVisible" />
        <FeedFiltersDialog v-model:feedFiltersDialogMode="feedFiltersDialogMode" />
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAdvancedSettingsStore, useNotificationsSettingsStore, useVrStore } from '../../../../stores';
    import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
    import { Slider } from '../../../../components/ui/slider';

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
    const notificationOpacityValue = computed({
        get: () => [notificationOpacity.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                setNotificationOpacity(next);
            }
        }
    });

    const ttsVoiceIndex = computed({
        get: () => {
            const currentName = getTTSVoiceName();
            const idx = TTSvoices.value.findIndex((v) => v?.name === currentName);
            return idx >= 0 ? idx : null;
        },
        set: (value) => {
            if (typeof value === 'number') {
                changeTTSVoice(value);
            }
        }
    });

    function showNotyFeedFiltersDialog() {
        feedFiltersDialogMode.value = 'noty';
    }

    function showNotificationPositionDialog() {
        isNotificationPositionDialogVisible.value = true;
    }
</script>
