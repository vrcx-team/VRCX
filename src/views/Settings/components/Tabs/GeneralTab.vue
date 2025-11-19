<template>
    <div>
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.settings.general.general.header') }}</span>
            <div class="x-friend-list" style="margin-top: 10px">
                <div class="x-friend-item" style="cursor: default">
                    <div class="detail">
                        <span class="name">{{ t('view.settings.general.general.version') }}</span>
                        <span class="extra" v-text="appVersion"></span>
                    </div>
                </div>
                <div class="x-friend-item" @click="checkForVRCXUpdate">
                    <div class="detail">
                        <span class="name">{{ t('view.settings.general.general.latest_app_version') }}</span>
                        <span v-if="latestAppVersion" class="extra" v-text="latestAppVersion"></span>
                        <span v-else class="extra">{{
                            t('view.settings.general.general.latest_app_version_refresh')
                        }}</span>
                    </div>
                </div>
                <div class="x-friend-item" @click="openExternalLink(links.github)">
                    <div class="detail">
                        <span class="name">{{ t('view.settings.general.general.repository_url') }}</span>
                        <span v-once class="extra">{{ links.github }}</span>
                    </div>
                </div>
                <div class="x-friend-item" @click="openExternalLink(links.discord)">
                    <div class="detail">
                        <span class="name">{{ t('view.settings.general.general.support') }}</span>
                        <span v-once class="extra">{{ links.discord }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.general.vrcx_updater.header') }}</span>
            <div class="options-container-item">
                <el-button size="small" :icon="Document" @click="showChangeLogDialog">{{
                    t('view.settings.general.vrcx_updater.change_log')
                }}</el-button>
                <el-button v-if="!noUpdater" size="small" :icon="Upload" @click="showVRCXUpdateDialog()">{{
                    t('view.settings.general.vrcx_updater.change_build')
                }}</el-button>
            </div>
            <div v-if="!noUpdater" class="options-container-item">
                <span class="name">{{ t('view.settings.general.vrcx_updater.update_action') }}</span>
                <br />
                <el-radio-group
                    :model-value="autoUpdateVRCX"
                    size="small"
                    style="margin-top: 5px"
                    @change="setAutoUpdateVRCX">
                    <el-radio-button value="Off">{{
                        t('view.settings.general.vrcx_updater.auto_update_off')
                    }}</el-radio-button>
                    <el-radio-button value="Notify">{{
                        t('view.settings.general.vrcx_updater.auto_update_notify')
                    }}</el-radio-button>
                    <el-radio-button value="Auto Download">{{
                        t('view.settings.general.vrcx_updater.auto_update_download')
                    }}</el-radio-button>
                </el-radio-group>
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
                <el-button size="small" :icon="Connection" @click="promptProxySettings">{{
                    t('view.settings.general.application.proxy')
                }}</el-button>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.general.favorites.header') }}</span>
            <br />
            <el-select
                :model-value="localFavoriteFriendsGroups"
                multiple
                clearable
                :placeholder="t('view.settings.general.favorites.group_placeholder')"
                style="margin-top: 8px"
                @change="setLocalFavoriteFriendsGroups">
                <el-option-group :label="t('view.settings.general.favorites.group_placeholder')">
                    <el-option
                        v-for="group in favoriteFriendGroups"
                        :key="group.key"
                        :label="group.displayName"
                        :value="group.key"
                        class="x-friend-item">
                        <div class="detail">
                            <span class="name" v-text="group.displayName"></span>
                        </div>
                    </el-option>
                </el-option-group>
            </el-select>
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
                <el-select
                    :model-value="autoStateChangeAloneStatus"
                    :disabled="!autoStateChangeEnabled"
                    style="margin-top: 8px"
                    size="small"
                    @change="setAutoStateChangeAloneStatus">
                    <el-option :label="t('dialog.user.status.join_me')" value="join me">
                        <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                    </el-option>
                    <el-option :label="t('dialog.user.status.online')" value="active">
                        <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                    </el-option>
                    <el-option :label="t('dialog.user.status.ask_me')" value="ask me">
                        <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                    </el-option>
                    <el-option :label="t('dialog.user.status.busy')" value="busy">
                        <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                    </el-option>
                </el-select>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.general.automation.company_status') }}</span>
                <el-select
                    :model-value="autoStateChangeCompanyStatus"
                    :disabled="!autoStateChangeEnabled"
                    style="margin-top: 8px"
                    size="small"
                    @change="setAutoStateChangeCompanyStatus">
                    <el-option :label="t('dialog.user.status.join_me')" value="join me">
                        <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                    </el-option>
                    <el-option :label="t('dialog.user.status.online')" value="active">
                        <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                    </el-option>
                    <el-option :label="t('dialog.user.status.ask_me')" value="ask me">
                        <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                    </el-option>
                    <el-option :label="t('dialog.user.status.busy')" value="busy">
                        <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                    </el-option>
                </el-select>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.general.automation.allowed_instance_types') }}</span>
                <el-select
                    :model-value="autoStateChangeInstanceTypes"
                    :disabled="!autoStateChangeEnabled"
                    multiple
                    clearable
                    :placeholder="t('view.settings.general.automation.instance_type_placeholder')"
                    style="margin-top: 8px"
                    size="small"
                    @change="setAutoStateChangeInstanceTypes">
                    <el-option-group :label="t('view.settings.general.automation.allowed_instance_types')">
                        <el-option
                            v-for="instanceType in instanceTypes"
                            :key="instanceType"
                            :label="instanceType"
                            :value="instanceType"
                            class="x-friend-item">
                            <div class="detail">
                                <span class="name" v-text="instanceType"></span>
                            </div>
                        </el-option>
                    </el-option-group>
                </el-select>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.general.automation.alone_condition') }}</span>
                <el-radio-group
                    :model-value="autoStateChangeNoFriends"
                    :disabled="!autoStateChangeEnabled"
                    @change="setAutoStateChangeNoFriends">
                    <el-radio :value="false">{{ t('view.settings.general.automation.alone') }}</el-radio>
                    <el-radio :value="true">{{ t('view.settings.general.automation.no_friends') }}</el-radio>
                </el-radio-group>
            </div>
            <div class="options-container-item">
                <span class="name"
                    >{{ t('view.settings.general.automation.auto_invite_request_accept') }}
                    <el-tooltip
                        placement="top"
                        style="margin-left: 5px"
                        :content="t('view.settings.general.automation.auto_invite_request_accept_tooltip')">
                        <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                </span>
                <br />
                <el-radio-group
                    :model-value="autoAcceptInviteRequests"
                    size="small"
                    style="margin-top: 5px"
                    @change="setAutoAcceptInviteRequests">
                    <el-radio-button value="Off">{{
                        t('view.settings.general.automation.auto_invite_request_accept_off')
                    }}</el-radio-button>
                    <el-radio-button value="All Favorites">{{
                        t('view.settings.general.automation.auto_invite_request_accept_favs')
                    }}</el-radio-button>
                    <el-radio-button value="Selected Favorites">{{
                        t('view.settings.general.automation.auto_invite_request_accept_selected_favs')
                    }}</el-radio-button>
                </el-radio-group>
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
            <div class="options-container-item">
                <p>
                    &copy; 2019-2025
                    <a class="x-link" @click="openExternalLink('https://github.com/pypy-vrc')">pypy</a> &amp;
                    <a class="x-link" @click="openExternalLink('https://github.com/Natsumi-sama')">Natsumi</a>
                </p>
                <p>{{ t('view.settings.general.legal_notice.info') }}</p>
                <p>{{ t('view.settings.general.legal_notice.disclaimer1') }}</p>
                <p>{{ t('view.settings.general.legal_notice.disclaimer2') }}</p>
            </div>
            <div class="options-container-item">
                <el-button size="small" @click="openOSSDialog">{{
                    t('view.settings.general.legal_notice.open_source_software_notice')
                }}</el-button>
            </div>
        </div>
        <OpenSourceSoftwareNoticeDialog v-if="ossDialog" v-model:ossDialog="ossDialog" />
    </div>
</template>

<script setup>
    import { Connection, Document, InfoFilled, Upload } from '@element-plus/icons-vue';
    import { computed, defineAsyncComponent, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useGeneralSettingsStore, useVRCXUpdaterStore, useVrStore } from '../../../../stores';
    import { links } from '../../../../shared/constants';
    import { openExternalLink } from '../../../../shared/utils';

    import SimpleSwitch from '../SimpleSwitch.vue';

    const { t } = useI18n();

    const generalSettingsStore = useGeneralSettingsStore();
    const vrcxUpdaterStore = useVRCXUpdaterStore();
    const favoriteStore = useFavoriteStore();

    const { saveOpenVROption } = useVrStore();

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
</script>
