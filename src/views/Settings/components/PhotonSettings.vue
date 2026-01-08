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
            <el-button size="small" :icon="Timer" :disabled="!openVR" @click="promptPhotonOverlayMessageTimeout">{{
                t('view.settings.advanced.photon.event_hud.message_timeout')
            }}</el-button>
        </div>
        <div class="options-container-item">
            <el-select
                :model-value="photonEventTableTypeOverlayFilter"
                multiple
                clearable
                collapse-tags
                style="flex: 1"
                placeholder="Filter"
                @change="
                    setPhotonEventTableTypeOverlayFilter($event);
                    photonEventTableFilterChange();
                ">
                <el-option
                    v-for="type in photonEventTableTypeFilterList"
                    :key="type"
                    :label="type"
                    :value="type"></el-option>
            </el-select>
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
            <el-button size="small" :icon="Timer" :disabled="!openVR" @click="promptPhotonLobbyTimeoutThreshold">{{
                t('view.settings.advanced.photon.timeout_hud.timeout_threshold')
            }}</el-button>
        </div>
    </div>
</template>

<script setup>
    import { Timer } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useNotificationsSettingsStore, usePhotonStore } from '../../../stores';
    import { photonEventTableTypeFilterList } from '../../../shared/constants/photon';
    import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';

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
