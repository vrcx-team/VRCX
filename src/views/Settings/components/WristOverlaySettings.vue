<template>
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.wrist_overlay.steamvr_wrist_overlay.header')">
            <template #description>
                <p class="m-0">{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.description') }}</p>
                <p class="m-0">{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.grip') }}</p>
                <p class="m-0">{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.menu') }}</p>
            </template>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.wrist_feed_filters')">
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="!openVR || !overlayWrist"
                    @click="emit('open-feed-filters')"
                    >{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.wrist_feed_filters') }}</Button
                >
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.wrist_feed_overlay')">
                <Switch
                    :model-value="overlayWrist"
                    :disabled="!openVR"
                    @update:modelValue="
                        setOverlayWrist();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.hide_private_worlds')">
                <Switch
                    :model-value="hidePrivateFromFeed"
                    @update:modelValue="
                        setHidePrivateFromFeed();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.overlay_button')">
                <Select
                    :model-value="overlaybutton ? 'true' : 'false'"
                    :disabled="!openVR || !overlayWrist"
                    @update:modelValue="handleOverlayButtonRadio">
                    <SelectTrigger size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="false">{{
                            t('view.settings.wrist_overlay.steamvr_wrist_overlay.overlay_button_grip')
                        }}</SelectItem>
                        <SelectItem value="true">{{
                            t('view.settings.wrist_overlay.steamvr_wrist_overlay.overlay_button_menu')
                        }}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on')">
                <Select
                    :model-value="overlayHand"
                    @update:model-value="
                        setOverlayHand($event);
                        saveOpenVROption();
                    ">
                    <SelectTrigger size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">{{
                            t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on_left')
                        }}</SelectItem>
                        <SelectItem value="2">{{
                            t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on_right')
                        }}</SelectItem>
                        <SelectItem value="0">{{
                            t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on_both')
                        }}</SelectItem>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.grey_background')">
                <Switch
                    :model-value="vrBackgroundEnabled"
                    :disabled="!openVR || !overlayWrist"
                    @update:modelValue="
                        setVrBackgroundEnabled();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.minimal_feed_icons')">
                <Switch
                    :model-value="minimalFeed"
                    :disabled="!openVR || !overlayWrist"
                    @update:modelValue="
                        setMinimalFeed();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_vr_devices')">
                <Switch
                    :model-value="!hideDevicesFromFeed"
                    :disabled="!openVR || !overlayWrist"
                    @update:modelValue="
                        setHideDevicesFromFeed();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_cpu_usage')">
                <Switch
                    :model-value="vrOverlayCpuUsage"
                    :disabled="!openVR || !overlayWrist"
                    @update:modelValue="
                        setVrOverlayCpuUsage();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_game_uptime')">
                <Switch
                    :model-value="!hideUptimeFromFeed"
                    :disabled="!openVR || !overlayWrist"
                    @update:modelValue="
                        setHideUptimeFromFeed();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_pc_uptime')">
                <Switch
                    :model-value="pcUptimeOnFeed"
                    :disabled="!openVR || !overlayWrist"
                    @update:modelValue="
                        setPcUptimeOnFeed();
                        saveOpenVROption();
                    " />
            </SettingsItem>
        </SettingsGroup>
    </div>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { Switch } from '@/components/ui/switch';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useNotificationsSettingsStore, useVrStore, useWristOverlaySettingsStore } from '@/stores';

    import SettingsGroup from './SettingsGroup.vue';
    import SettingsItem from './SettingsItem.vue';

    const emit = defineEmits(['open-feed-filters']);
    const { t } = useI18n();

    const notificationsSettingsStore = useNotificationsSettingsStore();
    const wristOverlaySettingsStore = useWristOverlaySettingsStore();

    const { openVR } = storeToRefs(notificationsSettingsStore);

    const {
        overlayWrist,
        hidePrivateFromFeed,
        overlaybutton,
        overlayHand,
        vrBackgroundEnabled,
        minimalFeed,
        hideDevicesFromFeed,
        vrOverlayCpuUsage,
        hideUptimeFromFeed,
        pcUptimeOnFeed
    } = storeToRefs(wristOverlaySettingsStore);

    const {
        setOverlayWrist,
        setHidePrivateFromFeed,
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

    /**
     *
     * @param value
     */
    function handleOverlayButtonRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== overlaybutton.value) {
            setOverlaybutton();
            saveOpenVROption();
        }
    }
</script>
