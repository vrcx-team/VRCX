<template>
    <div class="options-container">
        <span class="header">{{ t('view.settings.advanced.photon.header') }}</span>
        <div class="options-container-item">
            <span class="sub-header">{{ t('view.settings.advanced.photon.event_hud.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.photon.event_hud.enable')"
                :value="photonEventOverlay"
                :disabled="!openVR"
                :tooltip="t('view.settings.advanced.photon.event_hud.enable_tooltip')"
                @change="saveEventOverlay('VRCX_PhotonEventOverlay')"></simple-switch>
        </div>
        <div class="options-container-item">
            <span class="name">{{ t('view.settings.advanced.photon.event_hud.filter') }}</span>
            <ToggleGroup
                type="single"
                required
                variant="outline"
                size="sm"
                :model-value="photonEventOverlayFilter"
                :disabled="!openVR || !photonEventOverlay"
                @update:model-value="
                    setPhotonEventOverlayFilter($event);
                    saveEventOverlay();
                ">
                <ToggleGroupItem value="VIP">{{
                    t('view.settings.advanced.photon.event_hud.filter_favorites')
                }}</ToggleGroupItem>
                <ToggleGroupItem value="Friends">{{
                    t('view.settings.advanced.photon.event_hud.filter_friends')
                }}</ToggleGroupItem>
                <ToggleGroupItem value="Everyone">{{
                    t('view.settings.advanced.photon.event_hud.filter_everyone')
                }}</ToggleGroupItem>
            </ToggleGroup>
        </div>
        <div class="options-container-item">
            <Button size="sm" variant="outline" :disabled="!openVR" @click="promptPhotonOverlayMessageTimeout">{{
                t('view.settings.advanced.photon.event_hud.message_timeout')
            }}</Button>
        </div>
        <div class="options-container-item">
            <Select
                :model-value="photonEventTableTypeOverlayFilter"
                multiple
                @update:modelValue="
                    (v) => {
                        setPhotonEventTableTypeOverlayFilter(v);
                        photonEventTableFilterChange();
                    }
                ">
                <SelectTrigger style="flex: 1">
                    <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="type in photonEventTableTypeFilterList" :key="type" :value="type">{{
                        type
                    }}</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <br />
        <span class="sub-header">{{ t('view.settings.advanced.photon.timeout_hud.header') }}</span>
        <simple-switch
            :label="t('view.settings.advanced.photon.timeout_hud.enable')"
            :value="timeoutHudOverlay"
            :disabled="!openVR"
            :tooltip="t('view.settings.advanced.photon.timeout_hud.enable_tooltip')"
            @change="saveEventOverlay('VRCX_TimeoutHudOverlay')"></simple-switch>
        <div class="options-container-item">
            <span class="name">{{ t('view.settings.advanced.photon.timeout_hud.filter') }}</span>
            <ToggleGroup
                type="single"
                required
                variant="outline"
                size="sm"
                :model-value="timeoutHudOverlayFilter"
                :disabled="!openVR || !timeoutHudOverlay"
                @update:model-value="
                    setTimeoutHudOverlayFilter($event);
                    saveEventOverlay();
                ">
                <ToggleGroupItem value="VIP">{{
                    t('view.settings.advanced.photon.timeout_hud.filter_favorites')
                }}</ToggleGroupItem>
                <ToggleGroupItem value="Friends">{{
                    t('view.settings.advanced.photon.timeout_hud.filter_friends')
                }}</ToggleGroupItem>
                <ToggleGroupItem value="Everyone">{{
                    t('view.settings.advanced.photon.timeout_hud.filter_everyone')
                }}</ToggleGroupItem>
            </ToggleGroup>
        </div>
        <div class="options-container-item">
            <Button size="sm" variant="outline" :disabled="!openVR" @click="promptPhotonLobbyTimeoutThreshold">{{
                t('view.settings.advanced.photon.timeout_hud.timeout_threshold')
            }}</Button>
        </div>
    </div>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
    import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
    import { useNotificationsSettingsStore, usePhotonStore } from '../../../stores';
    import { photonEventTableTypeFilterList } from '../../../shared/constants/photon';

    import SimpleSwitch from './SimpleSwitch.vue';

    const { t } = useI18n();

    const {
        setPhotonEventOverlayFilter,
        setPhotonEventTableTypeOverlayFilter,
        setTimeoutHudOverlayFilter,
        saveEventOverlay,
        photonEventTableFilterChange,
        promptPhotonOverlayMessageTimeout,
        promptPhotonLobbyTimeoutThreshold
    } = usePhotonStore();

    const {
        photonEventOverlay,
        photonEventOverlayFilter,
        photonEventTableTypeOverlayFilter,
        timeoutHudOverlay,
        timeoutHudOverlayFilter
    } = storeToRefs(usePhotonStore());

    const { openVR } = storeToRefs(useNotificationsSettingsStore());
</script>
