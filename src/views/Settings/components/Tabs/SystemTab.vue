<template>
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.general.general.header')">
            <div class="flex flex-col gap-0.5 px-1 py-1">
                <div class="flex-1">
                    <span class="block truncate font-medium text-sm leading-[18px]">{{
                        t('view.settings.general.general.version')
                    }}</span>
                    <span class="block truncate text-xs text-muted-foreground" v-text="appVersion"></span>
                </div>
            </div>

            <div class="flex flex-col gap-0.5 px-1 py-1 cursor-pointer" @click="checkForVRCXUpdate">
                <div class="flex-1">
                    <span class="block truncate font-medium text-sm leading-[18px]">{{
                        t('view.settings.general.general.latest_app_version')
                    }}</span>
                    <span
                        v-if="latestAppVersion"
                        class="block truncate text-xs text-muted-foreground"
                        v-text="latestAppVersion"></span>
                    <span v-else class="block truncate text-xs text-muted-foreground">{{
                        t('view.settings.general.general.latest_app_version_refresh')
                    }}</span>
                </div>
            </div>

            <div class="flex flex-col gap-0.5 px-1 py-1 cursor-pointer" @click="openExternalLink(links.github)">
                <div class="flex-1">
                    <span class="block truncate font-medium text-sm leading-[18px]">{{
                        t('view.settings.general.general.repository_url')
                    }}</span>
                    <span v-once class="block truncate text-xs text-muted-foreground">{{ links.github }}</span>
                </div>
            </div>

            <div class="flex flex-col gap-0.5 px-1 py-1 cursor-pointer" @click="openExternalLink(links.discord)">
                <div class="flex-1">
                    <span class="block truncate font-medium text-sm leading-[18px]">{{
                        t('view.settings.general.general.support')
                    }}</span>
                    <span v-once class="block truncate text-xs text-muted-foreground">{{ links.discord }}</span>
                </div>
            </div>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.general.vrcx_updater.header')">
            <div class="flex gap-2">
                <Button size="sm" variant="outline" @click="showChangeLogDialog">{{
                    t('view.settings.general.vrcx_updater.change_log')
                }}</Button>
                <Button v-if="!noUpdater" size="sm" variant="outline" @click="showVRCXUpdateDialog()">{{
                    t('view.settings.general.vrcx_updater.change_build')
                }}</Button>
            </div>

            <template v-if="!noUpdater">
                <SettingsItem :label="t('view.settings.general.vrcx_updater.update_action')">
                    <Select :model-value="autoUpdateVRCX" @update:model-value="setAutoUpdateVRCX">
                        <SelectTrigger size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Off">{{
                                t('view.settings.general.vrcx_updater.auto_update_off')
                            }}</SelectItem>
                            <SelectItem value="Notify">{{
                                t('view.settings.general.vrcx_updater.auto_update_notify')
                            }}</SelectItem>
                            <SelectItem value="Auto Download">{{
                                t('view.settings.general.vrcx_updater.auto_update_download')
                            }}</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingsItem>
            </template>
            <div v-else class="text-sm text-muted-foreground">
                {{ t('view.settings.general.vrcx_updater.updater_disabled') }}
            </div>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.general.application.header')">
            <SettingsItem v-if="!isLinux" :label="t('view.settings.general.application.startup')">
                <Switch :model-value="isStartAtWindowsStartup" @update:modelValue="setIsStartAtWindowsStartup" />
            </SettingsItem>

            <SettingsItem v-if="!isLinux" :label="t('view.settings.general.application.minimized')">
                <Switch :model-value="isStartAsMinimizedState" @update:modelValue="setIsStartAsMinimizedState" />
            </SettingsItem>
            <SettingsItem
                v-else
                :label="t('view.settings.general.application.minimized')"
                :description="t('view.settings.general.application.startup_linux')">
                <Switch :model-value="isStartAsMinimizedState" @update:modelValue="setIsStartAsMinimizedState" />
            </SettingsItem>

            <SettingsItem v-if="!isMacOS" :label="t('view.settings.general.application.tray')">
                <Switch :model-value="isCloseToTray" @update:modelValue="setIsCloseToTray" />
            </SettingsItem>

            <SettingsItem
                v-if="!isLinux"
                :label="t('view.settings.general.application.disable_gpu_acceleration')"
                :description="t('view.settings.general.application.disable_gpu_acceleration_tooltip')">
                <Switch :model-value="disableGpuAcceleration" @update:modelValue="setDisableGpuAcceleration" />
            </SettingsItem>

            <SettingsItem
                v-if="!isLinux"
                :label="t('view.settings.general.application.disable_vr_overlay_gpu_acceleration')"
                :description="t('view.settings.general.application.disable_gpu_acceleration_tooltip')">
                <Switch
                    :model-value="disableVrOverlayGpuAcceleration"
                    @update:modelValue="setDisableVrOverlayGpuAcceleration" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.general.application.proxy')">
                <Button size="sm" variant="outline" @click="promptProxySettings">{{
                    t('view.settings.general.application.proxy')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.general.contributors.header')">
            <div>
                <img
                    src="https://contrib.rocks/image?repo=vrcx-team/VRCX"
                    alt="Contributors"
                    class="cursor-pointer"
                    @click="openExternalLink('https://github.com/vrcx-team/VRCX/graphs/contributors')" />
            </div>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.general.legal_notice.header')">
            <div class="flex flex-col gap-2 text-sm text-muted-foreground mb-2">
                <p class="m-0">
                    &copy; 2019-2026
                    <a class="cursor-pointer" @click="openExternalLink('https://github.com/pypy-vrc')">pypy</a> &amp;
                    <a class="cursor-pointer" @click="openExternalLink('https://github.com/Natsumi-sama')">Natsumi</a>
                    &amp;
                    <a class="cursor-pointer" @click="openExternalLink('https://github.com/Map1en')">Map1en</a>
                </p>
                <p class="m-0">{{ t('view.settings.general.legal_notice.info') }}</p>
                <p class="m-0">{{ t('view.settings.general.legal_notice.disclaimer1') }}</p>
                <p class="m-0">{{ t('view.settings.general.legal_notice.disclaimer2') }}</p>
            </div>

            <SettingsItem :label="t('view.settings.general.legal_notice.open_source_software_notice')">
                <Button size="sm" variant="outline" @click="openOSSDialog">{{
                    t('view.settings.general.legal_notice.open_source_software_notice')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>

        <OpenSourceSoftwareNoticeDialog v-if="ossDialog" v-model:ossDialog="ossDialog" />
    </div>
</template>

<script setup>
    import { computed, defineAsyncComponent, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Switch } from '@/components/ui/switch';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useGeneralSettingsStore, useVRCXUpdaterStore } from '@/stores';
    import { links } from '@/shared/constants';
    import { openExternalLink } from '@/shared/utils';

    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const generalSettingsStore = useGeneralSettingsStore();
    const vrcxUpdaterStore = useVRCXUpdaterStore();

    const {
        isStartAtWindowsStartup,
        isStartAsMinimizedState,
        isCloseToTray,
        disableGpuAcceleration,
        disableVrOverlayGpuAcceleration
    } = storeToRefs(generalSettingsStore);

    const {
        setIsStartAtWindowsStartup,
        setIsStartAsMinimizedState,
        setIsCloseToTray,
        setDisableGpuAcceleration,
        setDisableVrOverlayGpuAcceleration,
        promptProxySettings
    } = generalSettingsStore;

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

    /**
     *
     */
    function openOSSDialog() {
        ossDialog.value = true;
    }
</script>
