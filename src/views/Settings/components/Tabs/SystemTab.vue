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
            <SettingsItem v-if="!isLinux" :label="t('view.settings.general.application.startup')" toggle>
                <Switch
                    :model-value="isStartAtWindowsStartup"
                    :ariaLabel="t('view.settings.general.application.startup')"
                    @update:modelValue="setIsStartAtWindowsStartup" />
            </SettingsItem>

            <SettingsItem v-if="!isLinux" :label="t('view.settings.general.application.minimized')" toggle>
                <Switch
                    :model-value="isStartAsMinimizedState"
                    :ariaLabel="t('view.settings.general.application.minimized')"
                    @update:modelValue="setIsStartAsMinimizedState" />
            </SettingsItem>
            <SettingsItem
                v-else
                :label="t('view.settings.general.application.minimized')"
                :description="t('view.settings.general.application.startup_linux')"
                toggle>
                <Switch
                    :model-value="isStartAsMinimizedState"
                    :ariaLabel="t('view.settings.general.application.minimized')"
                    @update:modelValue="setIsStartAsMinimizedState" />
            </SettingsItem>

            <SettingsItem v-if="!isMacOS" :label="t('view.settings.general.application.tray')" toggle>
                <Switch
                    :model-value="isCloseToTray"
                    :ariaLabel="t('view.settings.general.application.tray')"
                    @update:modelValue="setIsCloseToTray" />
            </SettingsItem>

            <SettingsItem
                v-if="!isLinux"
                :label="t('view.settings.general.application.disable_gpu_acceleration')"
                :description="t('view.settings.general.application.disable_gpu_acceleration_tooltip')"
                toggle>
                <Switch
                    :model-value="disableGpuAcceleration"
                    :ariaLabel="t('view.settings.general.application.disable_gpu_acceleration')"
                    @update:modelValue="setDisableGpuAcceleration" />
            </SettingsItem>

            <SettingsItem
                v-if="!isLinux"
                :label="t('view.settings.general.application.disable_vr_overlay_gpu_acceleration')"
                :description="t('view.settings.general.application.disable_gpu_acceleration_tooltip')"
                toggle>
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

        <SettingsGroup :title="t('view.settings.general.remote_host.header')">
            <div class="flex flex-col gap-2 text-sm text-muted-foreground mb-2">
                <p class="m-0">
                    {{ t('view.settings.general.remote_host.description') }}
                </p>
            </div>
            <SettingsItem :label="t('view.settings.general.remote_host.enable')" toggle>
                <Switch
                    :model-value="remoteHostEnabled"
                    :ariaLabel="t('view.settings.general.remote_host.enable')"
                    @update:modelValue="setRemoteHostEnabled" />
            </SettingsItem>
            <SettingsItem :label="t('view.settings.general.remote_host.address')">
                <Input
                    v-model="remoteHostAddress"
                    :placeholder="'192.168.1.100'"
                    class="w-56!"
                    @blur="applyRemoteHostConfig" />
            </SettingsItem>
            <SettingsItem :label="t('view.settings.general.remote_host.username')">
                <Input
                    v-model="remoteHostUsername"
                    class="w-56!"
                    @blur="applyRemoteHostConfig" />
            </SettingsItem>
            <SettingsItem :label="t('view.settings.general.remote_host.password')">
                <Input
                    v-model="remoteHostPassword"
                    type="password"
                    class="w-56!"
                    @blur="applyRemoteHostConfig" />
            </SettingsItem>
            <SettingsItem :label="t('view.settings.general.remote_host.log_path')">
                <Input
                    v-model="remoteHostLogPath"
                    :placeholder="t('view.settings.general.remote_host.log_path_placeholder')"
                    class="w-80!"
                    @blur="applyRemoteHostConfig" />
            </SettingsItem>
            <SettingsItem :label="t('view.settings.general.remote_host.status')">
                <span class="text-sm text-muted-foreground break-all max-w-md">{{ remoteHostStatusText }}</span>
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
    import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
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

    function openOSSDialog() {
        ossDialog.value = true;
    }

    const remoteHostEnabled = ref(false);
    const remoteHostAddress = ref('');
    const remoteHostUsername = ref('');
    const remoteHostPassword = ref('');
    const remoteHostLogPath = ref('');
    const remoteHostStatusText = ref('');
    let remoteHostStatusTimer = null;

    function formatRemoteHostStatus(statusJson) {
        const s = JSON.parse(statusJson);
        if (!s.enabled) {
            return t('view.settings.general.remote_host.status_off');
        }
        if (s.lastError) {
            return t('view.settings.general.remote_host.status_error', { message: s.lastError });
        }
        if (!s.connected) {
            return t('view.settings.general.remote_host.status_connecting');
        }
        return t('view.settings.general.remote_host.status_ok', {
            gameRunning: s.gameRunning
                ? t('view.settings.general.remote_host.game_running')
                : t('view.settings.general.remote_host.game_stopped'),
            logDirectory: s.logDirectory
        });
    }

    async function refreshRemoteHostStatus() {
        try {
            remoteHostStatusText.value = formatRemoteHostStatus(await AppApi.GetRemoteHostStatus());
        } catch (err) {
            console.error(err);
        }
    }

    function applyRemoteHostConfig() {
        VRCXStorage.Set('VRCX_RemoteHostAddress', remoteHostAddress.value.trim());
        VRCXStorage.Set('VRCX_RemoteHostUsername', remoteHostUsername.value.trim());
        VRCXStorage.Set('VRCX_RemoteHostPassword', remoteHostPassword.value);
        VRCXStorage.Set('VRCX_RemoteHostLogPath', remoteHostLogPath.value.trim());
        if (remoteHostEnabled.value) {
            AppApi.SetRemoteHostConfig(
                remoteHostAddress.value.trim(),
                remoteHostUsername.value.trim(),
                remoteHostPassword.value,
                remoteHostLogPath.value.trim()
            );
        }
        refreshRemoteHostStatus();
    }

    async function setRemoteHostEnabled(enabled) {
        remoteHostEnabled.value = enabled;
        VRCXStorage.Set('VRCX_RemoteHostEnabled', enabled ? 'true' : 'false');
        if (enabled) {
            applyRemoteHostConfig();
            AppApi.SetRemoteHostEnabled(true);
        } else {
            AppApi.SetRemoteHostEnabled(false);
        }
        refreshRemoteHostStatus();
    }

    onMounted(async () => {
        remoteHostEnabled.value = (await VRCXStorage.Get('VRCX_RemoteHostEnabled')) === 'true';
        remoteHostAddress.value = (await VRCXStorage.Get('VRCX_RemoteHostAddress')) || '';
        remoteHostUsername.value = (await VRCXStorage.Get('VRCX_RemoteHostUsername')) || '';
        remoteHostPassword.value = (await VRCXStorage.Get('VRCX_RemoteHostPassword')) || '';
        remoteHostLogPath.value = (await VRCXStorage.Get('VRCX_RemoteHostLogPath')) || '';
        await refreshRemoteHostStatus();
        remoteHostStatusTimer = setInterval(refreshRemoteHostStatus, 5000);
    });

    onUnmounted(() => {
        clearInterval(remoteHostStatusTimer);
    });
</script>
