<template>
    <div class="options-container" style="margin-top: 0">
        <span class="header">{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.header') }}</span>
        <div class="options-container-item">
            <Button
                size="sm"
                variant="outline"
                :disabled="!openVR || !overlayWrist"
                @click="emit('open-feed-filters')"
                >{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.wrist_feed_filters') }}</Button
            >
        </div>
        <div class="options-container-item">
            <span>{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.description') }}</span>
            <br />
            <br />
            <span>{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.grip') }}</span>
            <br />
            <span>{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.menu') }}</span>
            <br />
        </div>
        <simple-switch
            :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.steamvr_overlay')"
            :value="openVR"
            @change="
                setOpenVR();
                saveOpenVROption();
            " />
        <simple-switch
            :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.wrist_feed_overlay')"
            :value="overlayWrist"
            :disabled="!openVR"
            @change="
                setOverlayWrist();
                saveOpenVROption();
            "></simple-switch>
        <simple-switch
            :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.hide_private_worlds')"
            :value="hidePrivateFromFeed"
            @change="
                setHidePrivateFromFeed();
                saveOpenVROption();
            " />
        <div class="options-container-item" style="min-width: 118px">
            <span class="name">{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.start_overlay_with') }}</span>
            <RadioGroup
                :model-value="openVRAlways ? 'true' : 'false'"
                :disabled="!openVR"
                class="gap-2 flex"
                style="margin-top: 8px"
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
        </div>
        <div class="options-container-item">
            <span class="name">{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.overlay_button') }}</span>
            <RadioGroup
                :model-value="overlaybutton ? 'true' : 'false'"
                :disabled="!openVR || !overlayWrist"
                class="gap-2 flex"
                style="margin-top: 8px"
                @update:modelValue="handleOverlayButtonRadio">
                <div class="flex items-center space-x-2">
                    <RadioGroupItem id="overlaybutton-false" value="false" />
                    <label for="overlaybutton-false">{{
                        t('view.settings.wrist_overlay.steamvr_wrist_overlay.overlay_button_grip')
                    }}</label>
                </div>
                <div class="flex items-center space-x-2">
                    <RadioGroupItem id="overlaybutton-true" value="true" />
                    <label for="overlaybutton-true">{{
                        t('view.settings.wrist_overlay.steamvr_wrist_overlay.overlay_button_menu')
                    }}</label>
                </div>
            </RadioGroup>
        </div>
        <div class="options-container-item">
            <span class="name">{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on') }}</span>
            <ToggleGroup
                type="single"
                required
                variant="outline"
                size="sm"
                :model-value="overlayHand"
                @update:model-value="
                    setOverlayHand($event);
                    saveOpenVROption();
                ">
                <ToggleGroupItem value="1">{{
                    t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on_left')
                }}</ToggleGroupItem>
                <ToggleGroupItem value="2">{{
                    t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on_right')
                }}</ToggleGroupItem>
                <ToggleGroupItem value="0">{{
                    t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on_both')
                }}</ToggleGroupItem>
            </ToggleGroup>
        </div>
        <simple-switch
            :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.grey_background')"
            :value="vrBackgroundEnabled"
            :disabled="!openVR || !overlayWrist"
            @change="
                setVrBackgroundEnabled();
                saveOpenVROption();
            " />
        <simple-switch
            :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.minimal_feed_icons')"
            :value="minimalFeed"
            :disabled="!openVR || !overlayWrist"
            @change="
                setMinimalFeed();
                saveOpenVROption();
            " />
        <simple-switch
            :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_vr_devices')"
            :value="!hideDevicesFromFeed"
            :disabled="!openVR || !overlayWrist"
            @change="
                setHideDevicesFromFeed();
                saveOpenVROption();
            " />
        <simple-switch
            :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_cpu_usage')"
            :value="vrOverlayCpuUsage"
            :disabled="!openVR || !overlayWrist"
            @change="
                setVrOverlayCpuUsage();
                saveOpenVROption();
            " />
        <simple-switch
            :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_game_uptime')"
            :value="!hideUptimeFromFeed"
            :disabled="!openVR || !overlayWrist"
            @change="
                setHideUptimeFromFeed();
                saveOpenVROption();
            " />
        <simple-switch
            :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_pc_uptime')"
            :value="pcUptimeOnFeed"
            :disabled="!openVR || !overlayWrist"
            @change="
                setPcUptimeOnFeed();
                saveOpenVROption();
            "></simple-switch>
    </div>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useNotificationsSettingsStore, useVrStore, useWristOverlaySettingsStore } from '../../../stores';
    import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
    import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';

    import SimpleSwitch from './SimpleSwitch.vue';

    const emit = defineEmits(['open-feed-filters']);
    const { t } = useI18n();

    const notificationsSettingsStore = useNotificationsSettingsStore();
    const wristOverlaySettingsStore = useWristOverlaySettingsStore();

    const { openVR } = storeToRefs(notificationsSettingsStore);

    const {
        overlayWrist,
        hidePrivateFromFeed,
        openVRAlways,
        overlaybutton,
        overlayHand,
        vrBackgroundEnabled,
        minimalFeed,
        hideDevicesFromFeed,
        vrOverlayCpuUsage,
        hideUptimeFromFeed,
        pcUptimeOnFeed
    } = storeToRefs(wristOverlaySettingsStore);

    const { setOpenVR } = notificationsSettingsStore;

    const {
        setOverlayWrist,
        setHidePrivateFromFeed,
        setOpenVRAlways,
        setOverlaybutton,
        setOverlayHand,
        setVrBackgroundEnabled,
        setMinimalFeed,
        setHideDevicesFromFeed,
        setVrOverlayCpuUsage,
        setHideUptimeFromFeed,
        setPcUptimeOnFeed
    } = wristOverlaySettingsStore;

    const { saveOpenVROption } = useVrStore();

    function handleOpenVRAlwaysRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== openVRAlways.value) {
            setOpenVRAlways();
            saveOpenVROption();
        }
    }

    function handleOverlayButtonRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== overlaybutton.value) {
            setOverlaybutton();
            saveOpenVROption();
        }
    }
</script>
