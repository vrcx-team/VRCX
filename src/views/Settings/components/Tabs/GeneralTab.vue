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
            <span class="header">{{ t('view.settings.general.favorites.header') }}</span>
            <br />
            <Select
                :model-value="localFavoriteFriendsGroups"
                multiple
                @update:modelValue="setLocalFavoriteFriendsGroups">
                <SelectTrigger style="margin-top: 8px">
                    <SelectValue :placeholder="t('view.settings.general.favorites.group_placeholder')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="group in favoriteFriendGroups" :key="group.key" :value="group.key">
                        {{ group.displayName }}
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.general.logging.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.cache_debug.udon_exception_logging')"
                :value="udonExceptionLogging"
                @change="setUdonExceptionLogging" />
            <simple-switch
                :label="t('view.settings.general.logging.resource_load')"
                :value="logResourceLoad"
                @change="setLogResourceLoad" />
            <simple-switch
                :label="t('view.settings.general.logging.empty_avatar')"
                :value="logEmptyAvatars"
                @change="setLogEmptyAvatars" />
            <simple-switch
                :label="t('view.settings.general.logging.auto_login_delay')"
                :value="autoLoginDelayEnabled"
                @change="setAutoLoginDelayEnabled" />
            <div v-if="autoLoginDelayEnabled" class="options-container-item">
                <Button size="sm" variant="outline" @click="promptAutoLoginDelaySeconds">
                    {{ t('view.settings.general.logging.auto_login_delay_button') }}
                </Button>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.general.automation.header') }}</span>
            <simple-switch
                :label="t('view.settings.general.automation.auto_change_status')"
                :value="autoStateChangeEnabled"
                :tooltip="t('view.settings.general.automation.auto_state_change_tooltip')"
                @change="setAutoStateChangeEnabled" />
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.general.automation.alone_status') }}</span>
                <Select
                    :model-value="autoStateChangeAloneStatus"
                    :disabled="!autoStateChangeEnabled"
                    @update:modelValue="setAutoStateChangeAloneStatus">
                    <SelectTrigger style="margin-top: 8px" size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="join me">
                            <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                        </SelectItem>
                        <SelectItem value="active">
                            <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                        </SelectItem>
                        <SelectItem value="ask me">
                            <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                        </SelectItem>
                        <SelectItem value="busy">
                            <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.general.automation.company_status') }}</span>
                <Select
                    :model-value="autoStateChangeCompanyStatus"
                    :disabled="!autoStateChangeEnabled"
                    @update:modelValue="setAutoStateChangeCompanyStatus">
                    <SelectTrigger style="margin-top: 8px" size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="join me">
                            <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                        </SelectItem>
                        <SelectItem value="active">
                            <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                        </SelectItem>
                        <SelectItem value="ask me">
                            <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                        </SelectItem>
                        <SelectItem value="busy">
                            <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.general.automation.allowed_instance_types') }}</span>
                <Select
                    :model-value="autoStateChangeInstanceTypes"
                    :disabled="!autoStateChangeEnabled"
                    multiple
                    @update:modelValue="setAutoStateChangeInstanceTypes">
                    <SelectTrigger style="margin-top: 8px" size="sm">
                        <SelectValue :placeholder="t('view.settings.general.automation.instance_type_placeholder')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="instanceType in instanceTypes" :key="instanceType" :value="instanceType">
                            {{ instanceType }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.general.automation.alone_condition') }}</span>
                <RadioGroup
                    :model-value="autoStateChangeNoFriends ? 'true' : 'false'"
                    :disabled="!autoStateChangeEnabled"
                    class="gap-2 flex"
                    style="margin-top: 8px"
                    @update:modelValue="handleAutoStateChangeNoFriendsRadio">
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="autoStateChangeNoFriends-false" value="false" />
                        <label for="autoStateChangeNoFriends-false">
                            {{ t('view.settings.general.automation.alone') }}
                        </label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="autoStateChangeNoFriends-true" value="true" />
                        <label for="autoStateChangeNoFriends-true">
                            {{ t('view.settings.general.automation.no_friends') }}
                        </label>
                    </div>
                </RadioGroup>
            </div>
            <div class="options-container-item">
                <span class="name"
                    >{{ t('view.settings.general.automation.auto_invite_request_accept') }}
                    <TooltipWrapper
                        side="top"
                        style="margin-left: 5px"
                        :content="t('view.settings.general.automation.auto_invite_request_accept_tooltip')">
                        <Info class="inline-block" />
                    </TooltipWrapper>
                </span>
                <br />
                <ToggleGroup
                    type="single"
                    required
                    variant="outline"
                    size="sm"
                    :model-value="autoAcceptInviteRequests"
                    style="margin-top: 5px"
                    @update:model-value="setAutoAcceptInviteRequests">
                    <ToggleGroupItem value="Off">{{
                        t('view.settings.general.automation.auto_invite_request_accept_off')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="All Favorites">{{
                        t('view.settings.general.automation.auto_invite_request_accept_favs')
                    }}</ToggleGroupItem>
                    <ToggleGroupItem value="Selected Favorites">{{
                        t('view.settings.general.automation.auto_invite_request_accept_selected_favs')
                    }}</ToggleGroupItem>
                </ToggleGroup>
            </div>
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

    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
    import { useFavoriteStore, useGeneralSettingsStore, useVRCXUpdaterStore } from '../../../../stores';
    import { RadioGroup, RadioGroupItem } from '../../../../components/ui/radio-group';
    import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
    import { links } from '../../../../shared/constants';
    import { openExternalLink } from '../../../../shared/utils';

    import SimpleSwitch from '../SimpleSwitch.vue';

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
        localFavoriteFriendsGroups,
        udonExceptionLogging,
        logResourceLoad,
        logEmptyAvatars,
        autoLoginDelayEnabled,
        autoStateChangeEnabled,
        autoStateChangeAloneStatus,
        autoStateChangeCompanyStatus,
        autoStateChangeInstanceTypes,
        autoStateChangeNoFriends,
        autoAcceptInviteRequests
    } = storeToRefs(generalSettingsStore);

    const {
        setIsStartAtWindowsStartup,
        setIsStartAsMinimizedState,
        setIsCloseToTray,
        setDisableGpuAcceleration,
        setDisableVrOverlayGpuAcceleration,
        setUdonExceptionLogging,
        setLogResourceLoad,
        setLogEmptyAvatars,
        setAutoLoginDelayEnabled,
        promptAutoLoginDelaySeconds,
        setAutoStateChangeEnabled,
        setAutoStateChangeAloneStatus,
        setAutoStateChangeCompanyStatus,
        setAutoStateChangeInstanceTypes,
        setAutoStateChangeNoFriends,
        setAutoAcceptInviteRequests,
        setLocalFavoriteFriendsGroups,
        promptProxySettings
    } = generalSettingsStore;

    const { favoriteFriendGroups } = storeToRefs(favoriteStore);

    const { appVersion, autoUpdateVRCX, latestAppVersion, noUpdater } = storeToRefs(vrcxUpdaterStore);
    const { setAutoUpdateVRCX, checkForVRCXUpdate, showVRCXUpdateDialog, showChangeLogDialog } = vrcxUpdaterStore;

    const instanceTypes = ref([
        'invite',
        'invite+',
        'friends',
        'friends+',
        'public',
        'groupPublic',
        'groupPlus',
        'groupOnly'
    ]);

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

    function handleAutoStateChangeNoFriendsRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== autoStateChangeNoFriends.value) {
            setAutoStateChangeNoFriends();
        }
    }
</script>
