<template>
    <div>
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.settings.general.general.header') }}</span>
            <div class="x-friend-list" style="margin-top: 10px">
                <div class="x-friend-item" style="cursor: default">
                    <div class="detail">
                        <span class="name">{{ t('view.settings.general.general.version') }}</span>
                        <span class="block truncate text-xs" v-text="appVersion"></span>
                    </div>
                </div>
                <div class="x-friend-item" @click="checkForVRCXUpdate">
                    <div class="detail">
                        <span class="name">{{ t('view.settings.general.general.latest_app_version') }}</span>
                        <span v-if="latestAppVersion" class="block truncate text-xs" v-text="latestAppVersion"></span>
                        <span v-else class="block truncate text-xs">{{
                            t('view.settings.general.general.latest_app_version_refresh')
                        }}</span>
                    </div>
                </div>
                <div class="x-friend-item" @click="openExternalLink(links.github)">
                    <div class="detail">
                        <span class="name">{{ t('view.settings.general.general.repository_url') }}</span>
                        <span v-once class="block truncate text-xs">{{ links.github }}</span>
                    </div>
                </div>
                <div class="x-friend-item" @click="openExternalLink(links.discord)">
                    <div class="detail">
                        <span class="name">{{ t('view.settings.general.general.support') }}</span>
                        <span v-once class="block truncate text-xs">{{ links.discord }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.general.vrcx_updater.header') }}</span>
            <div class="options-container-item">
                <Button size="sm" variant="outline" class="mr-2" @click="showChangeLogDialog">{{
                    t('view.settings.general.vrcx_updater.change_log')
                }}</Button>
                <Button size="sm" variant="outline" v-if="!noUpdater" @click="showVRCXUpdateDialog()">{{
                    t('view.settings.general.vrcx_updater.change_build')
                }}</Button>
            </div>
            <div v-if="!noUpdater" class="text-sm mt-2 flex flex-col align-baseline">
                <span class="name">{{ t('view.settings.general.vrcx_updater.update_action') }}</span>
                <ToggleGroup
                    type="single"
                    required
                    variant="outline"
                    size="sm"
                    :model-value="autoUpdateVRCX"
                    style="margin-top: 5px"
                    @update:model-value="setAutoUpdateVRCX">
                    <ToggleGroupItem value="Off">{{
                        t('view.settings.general.vrcx_updater.auto_update_off')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Notify">{{
                        t('view.settings.general.vrcx_updater.auto_update_notify')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Auto Download">{{
                        t('view.settings.general.vrcx_updater.auto_update_download')
                    }}</ToggleGroupItem>
                </ToggleGroup>
            </div>
            <div v-else class="options-container-item">
                <span>{{ t('view.settings.general.vrcx_updater.updater_disabled') }}</span>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.general.application.header') }}</span>
            <simple-switch
                v-if="!isLinux"
                :label="t('view.settings.general.application.startup')"
                :value="isStartAtWindowsStartup"
                @change="setIsStartAtWindowsStartup" />
            <simple-switch
                v-if="!isLinux"
                :label="t('view.settings.general.application.minimized')"
                :value="isStartAsMinimizedState"
                @change="setIsStartAsMinimizedState" />
            <simple-switch
                v-else
                :label="t('view.settings.general.application.minimized')"
                :value="isStartAsMinimizedState"
                :tooltip="t('view.settings.general.application.startup_linux')"
                @change="setIsStartAsMinimizedState" />
            <simple-switch
                v-if="!isMacOS"
                :label="t('view.settings.general.application.tray')"
                :value="isCloseToTray"
                @change="setIsCloseToTray" />
            <simple-switch
                v-if="!isLinux"
                :label="t('view.settings.general.application.disable_gpu_acceleration')"
                :value="disableGpuAcceleration"
                :tooltip="t('view.settings.general.application.disable_gpu_acceleration_tooltip')"
                @change="setDisableGpuAcceleration" />
            <simple-switch
                v-if="!isLinux"
                :label="t('view.settings.general.application.disable_vr_overlay_gpu_acceleration')"
                :value="disableVrOverlayGpuAcceleration"
                :tooltip="t('view.settings.general.application.disable_gpu_acceleration_tooltip')"
                @change="setDisableVrOverlayGpuAcceleration" />
            <div class="options-container-item">
                <Button size="sm" variant="outline" @click="promptProxySettings">{{
                    t('view.settings.general.application.proxy')
                }}</Button>
            </div>
        </div>
        <div class="options-container">
            <span class="header inline-flex items-center"
                >{{ t('view.settings.general.favorites.header') }}
                <TooltipWrapper side="top" :content="t('view.settings.general.favorites.header_tooltip')">
                    <Info style="width: 12px; height: 12px; margin-left: 4px; vertical-align: middle; cursor: help" />
                </TooltipWrapper>
            </span>
            <br />
            <Select
                :model-value="localFavoriteFriendsGroups"
                multiple
                @update:modelValue="setLocalFavoriteFriendsGroups">
                <SelectTrigger style="margin-top: 8px">
                    <SelectValue :placeholder="t('view.settings.general.favorites.group_placeholder')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem v-for="group in favoriteFriendGroups" :key="group.key" :value="group.key">
                            {{ group.displayName }}
                        </SelectItem>
                    </SelectGroup>
                    <template v-if="localFriendFavoriteGroups.length">
                        <SelectSeparator />
                        <SelectGroup>
                            <SelectItem
                                v-for="group in localFriendFavoriteGroups"
                                :key="'local:' + group"
                                :value="'local:' + group">
                                {{ group }}
                            </SelectItem>
                        </SelectGroup>
                    </template>
                </SelectContent>
            </Select>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.general.contributors.header') }}</span>
            <div class="options-container-item">
                <img
                    src="https://contrib.rocks/image?repo=vrcx-team/VRCX"
                    alt="Contributors"
                    style="cursor: pointer"
                    @click="openExternalLink('https://github.com/vrcx-team/VRCX/graphs/contributors')" />
            </div>
        </div>
        <div class="options-container" style="margin-top: 45px; border-top: 1px solid #eee; padding-top: 30px">
            <span class="header">{{ t('view.settings.general.legal_notice.header') }}</span>
            <div class="options-container-item" style="display: block">
                <p>
                    &copy; 2019-2026
                    <a class="cursor-pointer" @click="openExternalLink('https://github.com/pypy-vrc')">pypy</a> &amp;
                    <a class="cursor-pointer" @click="openExternalLink('https://github.com/Natsumi-sama')">Natsumi</a>
                    &amp;
                    <a class="cursor-pointer" @click="openExternalLink('https://github.com/Map1en')">Map1en</a>
                </p>
                <p>{{ t('view.settings.general.legal_notice.info') }}</p>
                <p>{{ t('view.settings.general.legal_notice.disclaimer1') }}</p>
                <p>{{ t('view.settings.general.legal_notice.disclaimer2') }}</p>
            </div>
            <div class="options-container-item">
                <Button size="sm" variant="outline" @click="openOSSDialog">{{
                    t('view.settings.general.legal_notice.open_source_software_notice')
                }}</Button>
            </div>
        </div>
        <OpenSourceSoftwareNoticeDialog v-if="ossDialog" v-model:ossDialog="ossDialog" />
    </div>
</template>

<script setup>
    import { computed, defineAsyncComponent, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Info } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        Select,
        SelectContent,
        SelectGroup,
        SelectItem,
        SelectSeparator,
        SelectTrigger,
        SelectValue
    } from '../../../../components/ui/select';
    import { useFavoriteStore, useGeneralSettingsStore, useVRCXUpdaterStore } from '../../../../stores';
    import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
    import { links } from '../../../../shared/constants';
    import { openExternalLink } from '../../../../shared/utils';

    import SimpleSwitch from '../SimpleSwitch.vue';
    import TooltipWrapper from '../../../../components/ui/tooltip/TooltipWrapper.vue';

    const { t } = useI18n();

    const generalSettingsStore = useGeneralSettingsStore();
    const vrcxUpdaterStore = useVRCXUpdaterStore();
    const favoriteStore = useFavoriteStore();

    const {
        isStartAtWindowsStartup,
        isStartAsMinimizedState,
        isCloseToTray,
        disableGpuAcceleration,
        disableVrOverlayGpuAcceleration,
        localFavoriteFriendsGroups
    } = storeToRefs(generalSettingsStore);

    const {
        setIsStartAtWindowsStartup,
        setIsStartAsMinimizedState,
        setIsCloseToTray,
        setDisableGpuAcceleration,
        setDisableVrOverlayGpuAcceleration,
        setLocalFavoriteFriendsGroups,
        promptProxySettings
    } = generalSettingsStore;

    const { favoriteFriendGroups, localFriendFavoriteGroups } = storeToRefs(favoriteStore);

    const { appVersion, autoUpdateVRCX, latestAppVersion, noUpdater } = storeToRefs(vrcxUpdaterStore);
    const { setAutoUpdateVRCX, checkForVRCXUpdate, showVRCXUpdateDialog, showChangeLogDialog } = vrcxUpdaterStore;

    const ossDialog = ref(false);
    const isLinux = computed(() => LINUX);
    const isMacOS = computed(() => {
        return navigator.platform.indexOf('Mac') > -1;
    });

    const OpenSourceSoftwareNoticeDialog = defineAsyncComponent(
        () => import('../../dialogs/OpenSourceSoftwareNoticeDialog.vue')
    );

    function openOSSDialog() {
        ossDialog.value = true;
    }
</script>
