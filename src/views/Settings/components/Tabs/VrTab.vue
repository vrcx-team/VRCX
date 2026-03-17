<template>
    <div class="flex flex-col gap-10 py-2">
        <!-- VR Core -->
        <SettingsGroup :title="t('view.settings.vr.vr_core.header')">
            <SettingsItem
                :label="t('view.settings.notifications.notifications.steamvr_notifications.steamvr_overlay')">
                <Switch
                    :model-value="openVR"
                    @update:modelValue="
                        setOpenVR();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.start_overlay_with')">
                <RadioGroup
                    :model-value="openVRAlways ? 'true' : 'false'"
                    :disabled="!openVR"
                    class="gap-2 flex"
                    @update:modelValue="handleOpenVRAlwaysRadio">
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="openVRAlways-false" value="false" />
                        <label for="openVRAlways-false">{{ 'VRChat' }}</label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="openVRAlways-true" value="true" />
                        <label for="openVRAlways-true">{{ 'SteamVR' }}</label>
                    </div>
                </RadioGroup>
            </SettingsItem>

            <template v-if="!isLinux">
                <SettingsItem
                    :label="
                        t('view.settings.notifications.notifications.steamvr_notifications.xsoverlay_notifications')
                    ">
                    <Switch
                        :model-value="xsNotifications"
                        @update:modelValue="
                            setXsNotifications();
                            saveOpenVROption();
                        " />
                </SettingsItem>
            </template>
            <template v-else>
                <SettingsItem
                    :label="
                        t('view.settings.notifications.notifications.steamvr_notifications.wayvr_notifications')
                    ">
                    <Switch
                        :model-value="xsNotifications"
                        @update:modelValue="
                            setXsNotifications();
                            saveOpenVROption();
                        " />
                </SettingsItem>
            </template>

            <template v-if="!isLinux">
                <SettingsItem
                    :label="
                        t(
                            'view.settings.notifications.notifications.steamvr_notifications.ovrtoolkit_hud_notifications'
                        )
                    ">
                    <Switch
                        :model-value="ovrtHudNotifications"
                        @update:modelValue="
                            setOvrtHudNotifications();
                            saveOpenVROption();
                        " />
                </SettingsItem>

                <SettingsItem
                    :label="
                        t(
                            'view.settings.notifications.notifications.steamvr_notifications.ovrtoolkit_wrist_notifications'
                        )
                    ">
                    <Switch
                        :model-value="ovrtWristNotifications"
                        @update:modelValue="
                            setOvrtWristNotifications();
                            saveOpenVROption();
                        " />
                </SettingsItem>
            </template>
        </SettingsGroup>

        <!-- VR Notifications -->
        <SettingsGroup :title="t('view.settings.vr.vr_notifications.header')">
            <SettingsItem
                :label="t('view.settings.notifications.notifications.desktop_notifications.when_to_display')">
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
            </SettingsItem>

            <SettingsItem
                :label="
                    t('view.settings.notifications.notifications.steamvr_notifications.overlay_notifications')
                ">
                <Switch
                    :model-value="overlayNotifications"
                    :disabled="!openVR"
                    @update:modelValue="
                        setOverlayNotifications();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem
                :label="
                    t('view.settings.notifications.notifications.steamvr_notifications.notification_position')
                ">
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="!overlayNotifications || !openVR"
                    @click="showNotificationPositionDialog"
                    >{{
                        t('view.settings.notifications.notifications.steamvr_notifications.notification_position')
                    }}</Button
                >
            </SettingsItem>

            <SettingsItem
                :label="
                    t('view.settings.notifications.notifications.steamvr_notifications.notification_opacity')
                ">
                <div class="w-75 max-w-full pt-1">
                    <Slider v-model="notificationOpacityValue" :min="0" :max="100" />
                </div>
            </SettingsItem>

            <SettingsItem
                :label="
                    t('view.settings.notifications.notifications.steamvr_notifications.notification_timeout')
                ">
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="(!overlayNotifications || !openVR) && !xsNotifications"
                    @click="promptNotificationTimeout"
                    >{{
                        t('view.settings.notifications.notifications.steamvr_notifications.notification_timeout')
                    }}</Button
                >
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.notifications.notifications.steamvr_notifications.user_images')">
                <Switch
                    :model-value="imageNotifications"
                    @update:modelValue="
                        setImageNotifications();
                        saveOpenVROption();
                    " />
            </SettingsItem>
        </SettingsGroup>

        <!-- Wrist Overlay -->
        <WristOverlaySettings @open-feed-filters="showWristFeedFiltersDialog" />

        <!-- VR Extras -->
        <SettingsGroup :title="t('view.settings.vr.vr_extras.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.video_progress_pie.header')"
                :description="t('view.settings.advanced.advanced.video_progress_pie.enable_tooltip')">
                <Switch
                    :model-value="progressPie"
                    :disabled="!openVR"
                    @update:modelValue="changeYouTubeApi('VRCX_progressPie')" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.video_progress_pie.dance_world_only')">
                <Switch
                    :model-value="progressPieFilter"
                    :disabled="!openVR"
                    @update:modelValue="changeYouTubeApi('VRCX_progressPieFilter')" />
            </SettingsItem>
        </SettingsGroup>

        <NotificationPositionDialog v-model:isNotificationPositionDialogVisible="isNotificationPositionDialogVisible" />
        <FeedFiltersDialog v-model:feedFiltersDialogMode="feedFiltersDialogMode" />
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Switch } from '@/components/ui/switch';
    import { Slider } from '@/components/ui/slider';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useAdvancedSettingsStore,
        useNotificationsSettingsStore,
        useVrStore,
        useWristOverlaySettingsStore
    } from '@/stores';

    import FeedFiltersDialog from '../../dialogs/FeedFiltersDialog.vue';
    import NotificationPositionDialog from '../../dialogs/NotificationPositionDialog.vue';
    import WristOverlaySettings from '../WristOverlaySettings.vue';
    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const notificationsSettingsStore = useNotificationsSettingsStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const wristOverlaySettingsStore = useWristOverlaySettingsStore();
    const { saveOpenVROption } = useVrStore();
    const { updateVRLastLocation, updateOpenVR } = useVrStore();

    const {
        overlayToast,
        openVR,
        overlayNotifications,
        xsNotifications,
        ovrtHudNotifications,
        ovrtWristNotifications,
        imageNotifications
    } = storeToRefs(notificationsSettingsStore);

    const { notificationOpacity } = storeToRefs(advancedSettingsStore);

    const { openVRAlways } = storeToRefs(wristOverlaySettingsStore);
    const { setOpenVRAlways } = wristOverlaySettingsStore;

    const {
        progressPie,
        progressPieFilter
    } = storeToRefs(advancedSettingsStore);

    const {
        setOverlayToast,
        setOpenVR,
        setOverlayNotifications,
        setXsNotifications,
        setOvrtHudNotifications,
        setOvrtWristNotifications,
        setImageNotifications,
        promptNotificationTimeout
    } = notificationsSettingsStore;

    const { setNotificationOpacity } = advancedSettingsStore;

    const isNotificationPositionDialogVisible = ref(false);
    const feedFiltersDialogMode = ref('');
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

    /**
     *
     */
    function showNotificationPositionDialog() {
        isNotificationPositionDialogVisible.value = true;
    }

    /**
     *
     */
    function showWristFeedFiltersDialog() {
        feedFiltersDialogMode.value = 'wrist';
    }

    /**
     *
     * @param value
     */
    function handleOpenVRAlwaysRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== openVRAlways.value) {
            setOpenVRAlways();
            saveOpenVROption();
        }
    }

    /**
     *
     * @param configKey
     */
    async function changeYouTubeApi(configKey = '') {
        if (configKey === 'VRCX_progressPie') {
            advancedSettingsStore.setProgressPie();
        } else if (configKey === 'VRCX_progressPieFilter') {
            advancedSettingsStore.setProgressPieFilter();
        }
        updateVRLastLocation();
        updateOpenVR();
    }
</script>
