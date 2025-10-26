<template>
    <div>
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.settings.advanced.advanced.header') }}</span>
            <div class="options-container-item" style="margin-top: 15px">
                <el-button-group>
                    <el-button size="small" :icon="Operation" @click="showVRChatConfig()">VRChat config.json</el-button>
                    <el-button size="small" :icon="Operation" @click="showLaunchOptions()">{{
                        t('view.settings.advanced.advanced.launch_options')
                    }}</el-button>
                    <el-button size="small" :icon="Goods" @click="showRegistryBackupDialog()">{{
                        t('view.settings.advanced.advanced.vrc_registry_backup')
                    }}</el-button>
                </el-button-group>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.advanced.advanced.common_folders') }}</span>
            <div class="options-container-item" style="margin-top: 15px">
                <el-button-group>
                    <el-button size="small" :icon="Folder" @click="openVrcxAppDataFolder()">VRCX Data</el-button>
                    <el-button size="small" :icon="Folder" @click="openVrcAppDataFolder()">VRChat Data</el-button>
                    <el-button size="small" :icon="Folder" @click="openCrashVrcCrashDumps()">Crash Dumps</el-button>
                </el-button-group>
            </div>
        </div>
        <div class="options-container">
            <span class="sub-header">{{ t('view.settings.advanced.advanced.primary_password.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.primary_password.description')"
                :value="enablePrimaryPassword"
                :disabled="!enablePrimaryPassword"
                :long-label="true"
                @change="enablePrimaryPasswordChange" />

            <span class="sub-header">{{ t('view.settings.advanced.advanced.relaunch_vrchat.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.relaunch_vrchat.description')"
                :value="relaunchVRChatAfterCrash"
                :long-label="true"
                @change="
                    setRelaunchVRChatAfterCrash();
                    saveOpenVROption();
                " />

            <span class="sub-header">{{ t('view.settings.advanced.advanced.vrchat_quit_fix.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.vrchat_quit_fix.description')"
                :value="vrcQuitFix"
                :long-label="true"
                @change="
                    setVrcQuitFix();
                    saveOpenVROption();
                " />

            <span class="sub-header">{{ t('view.settings.advanced.advanced.auto_cache_management.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.auto_cache_management.description')"
                :value="autoSweepVRChatCache"
                :long-label="true"
                @change="
                    setAutoSweepVRChatCache();
                    saveOpenVROption();
                " />

            <span class="sub-header">{{ t('view.settings.advanced.advanced.self_invite.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.self_invite.description')"
                :value="selfInviteOverride"
                :long-label="true"
                @change="
                    setSelfInviteOverride();
                    saveOpenVROption();
                " />

            <div v-if="branch === 'Nightly'">
                <span class="sub-header">Anonymous Error Reporting (Nightly Only)</span>
                <simple-switch
                    label="Help improve VRCX by sending anonymous error reports. Only collects crash and error information, no personal data or VRChat information is collected."
                    :value="sentryErrorReporting"
                    :long-label="true"
                    @change="setSentryErrorReporting()" />
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.profile.game_info.header') }}</span>
            <div class="x-friend-list" style="margin-top: 10px">
                <div class="x-friend-item">
                    <div class="detail" @click="getVisits">
                        <span class="name">{{ t('view.profile.game_info.online_users') }}</span>
                        <span v-if="visits" class="extra">{{
                            t('view.profile.game_info.user_online', { count: visits })
                        }}</span>
                        <span v-else class="extra">{{ t('view.profile.game_info.refresh') }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.advanced.advanced.remote_database.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.remote_database.enable')"
                :value="avatarRemoteDatabase"
                :long-label="true"
                @change="
                    setAvatarRemoteDatabase(!avatarRemoteDatabase);
                    saveOpenVROption();
                " />
            <div class="options-container-item">
                <el-button size="small" :icon="User" @click="showAvatarProviderDialog">{{
                    t('view.settings.advanced.advanced.remote_database.avatar_database_provider')
                }}</el-button>
            </div>
        </div>
        <template v-if="!isLinux">
            <div class="options-container">
                <span class="header">{{ t('view.settings.advanced.advanced.app_launcher.header') }}</span>
                <br />
                <el-button size="small" :icon="Folder" style="margin-top: 5px" @click="openShortcutFolder()">{{
                    t('view.settings.advanced.advanced.app_launcher.folder')
                }}</el-button>
                <simple-switch
                    :label="t('view.settings.advanced.advanced.remote_database.enable')"
                    :value="enableAppLauncher"
                    :tooltip="t('view.settings.advanced.advanced.app_launcher.folder_tooltip')"
                    :long-label="true"
                    @change="setEnableAppLauncher" />
                <simple-switch
                    :label="t('view.settings.advanced.advanced.app_launcher.auto_close')"
                    :value="enableAppLauncherAutoClose"
                    :long-label="true"
                    @change="setEnableAppLauncherAutoClose" />
                <simple-switch
                    :label="t('view.settings.advanced.advanced.app_launcher.run_process_once')"
                    :value="enableAppLauncherRunProcessOnce"
                    :long-label="true"
                    @change="setEnableAppLauncherRunProcessOnce" />
            </div>
        </template>
        <div class="options-container">
            <span class="header">{{ t('view.settings.advanced.advanced.youtube_api.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.youtube_api.enable')"
                :value="youTubeApi"
                :tooltip="t('view.settings.advanced.advanced.youtube_api.enable_tooltip')"
                :long-label="true"
                @change="changeYouTubeApi('VRCX_youtubeAPI')" />
            <div class="options-container-item">
                <el-button size="small" :icon="CaretRight" @click="showYouTubeApiDialog">{{
                    t('view.settings.advanced.advanced.youtube_api.youtube_api_key')
                }}</el-button>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.advanced.advanced.translation_api.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.translation_api.enable')"
                :value="translationApi"
                :tooltip="t('view.settings.advanced.advanced.translation_api.enable_tooltip')"
                :long-label="true"
                @change="changeTranslationAPI('VRCX_translationAPI')" />
            <div class="options-container-item">
                <el-button size="small" @click="showTranslationApiDialog"
                    ><i class="ri-translate-2" style="margin-right: 5px"></i
                    >{{ t('view.settings.advanced.advanced.translation_api.translation_api_key') }}</el-button
                >
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.advanced.advanced.video_progress_pie.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.video_progress_pie.enable')"
                :value="progressPie"
                :disabled="!openVR"
                :tooltip="t('view.settings.advanced.advanced.video_progress_pie.enable_tooltip')"
                :long-label="true"
                @change="changeYouTubeApi('VRCX_progressPie')" />
            <simple-switch
                :label="t('view.settings.advanced.advanced.video_progress_pie.dance_world_only')"
                :value="progressPieFilter"
                :disabled="!openVR"
                :long-label="true"
                @change="changeYouTubeApi('VRCX_progressPieFilter')" />
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.advanced.advanced.launch_commands.header') }}</span>
            <simple-switch
                :label="t('view.settings.advanced.advanced.launch_commands.show_confirmation_on_switch_avatar_enable')"
                :value="showConfirmationOnSwitchAvatar"
                :tooltip="
                    t('view.settings.advanced.advanced.launch_commands.show_confirmation_on_switch_avatar_tooltip')
                "
                :long-label="true"
                @change="setShowConfirmationOnSwitchAvatar" />
            <div class="options-container-item">
                <el-button
                    size="small"
                    :icon="Paperclip"
                    @click="openExternalLink('https://github.com/vrcx-team/VRCX/wiki/Launch-parameters-&-VRCX.json')"
                    >{{ t('view.settings.advanced.advanced.launch_commands.docs') }}</el-button
                >
                <el-button
                    size="small"
                    :icon="Paperclip"
                    @click="openExternalLink('https://github.com/Myrkie/open-in-vrcx')"
                    >{{ t('view.settings.advanced.advanced.launch_commands.website_userscript') }}</el-button
                >
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.advanced.advanced.cache_debug.header') }}</span>
            <br />
            <div class="options-container-item">
                <el-button size="small" :icon="DeleteFilled" @click="clearVRCXCache">{{
                    t('view.settings.advanced.advanced.cache_debug.clear_cache')
                }}</el-button>
                <el-button size="small" :icon="Timer" @click="promptAutoClearVRCXCacheFrequency">{{
                    t('view.settings.advanced.advanced.cache_debug.auto_clear_cache')
                }}</el-button>
                <el-button size="small" :icon="Refresh" @click="refreshCacheSize">{{
                    t('view.settings.advanced.advanced.cache_debug.refresh_cache')
                }}</el-button>
            </div>

            <simple-switch
                :label="`${t('view.settings.advanced.advanced.cache_debug.disable_gamelog')} ${t('view.settings.advanced.advanced.cache_debug.disable_gamelog_notice')}`"
                :value="gameLogDisabled"
                :long-label="true"
                @change="disableGameLogDialog()" />
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.cache_debug.user_cache') }}
                    <span v-text="cacheSize.cachedUsers"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.cache_debug.world_cache') }}
                    <span v-text="cacheSize.cachedWorlds"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.cache_debug.avatar_cache') }}
                    <span v-text="cacheSize.cachedAvatars"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.cache_debug.group_cache') }}
                    <span v-text="cacheSize.cachedGroups"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.cache_debug.avatar_name_cache') }}
                    <span v-text="cacheSize.cachedAvatarNames"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.cache_debug.instance_cache') }}
                    <span v-text="cacheSize.cachedInstances"></span>
                </span>
            </div>
            <div class="options-container-item">
                <el-button size="small" :icon="Tickets" @click="showConsole">{{
                    t('view.settings.advanced.advanced.cache_debug.show_console')
                }}</el-button>
            </div>
        </div>
        <div class="options-container">
            <span class="sub-header">{{ t('view.settings.advanced.advanced.sqlite_table_size.header') }}</span>
            <div class="options-container-item">
                <el-button size="small" :icon="Refresh" @click="getSqliteTableSizes">{{
                    t('view.settings.advanced.advanced.sqlite_table_size.refresh')
                }}</el-button>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.gps') }}
                    <span v-text="sqliteTableSizes.gps"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.status') }}
                    <span v-text="sqliteTableSizes.status"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.bio') }}
                    <span v-text="sqliteTableSizes.bio"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.avatar') }}
                    <span v-text="sqliteTableSizes.avatar"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.online_offline') }}
                    <span v-text="sqliteTableSizes.onlineOffline"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.friend_log_history') }}
                    <span v-text="sqliteTableSizes.friendLogHistory"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.notification') }}
                    <span v-text="sqliteTableSizes.notification"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.location') }}
                    <span v-text="sqliteTableSizes.location"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.join_leave') }}
                    <span v-text="sqliteTableSizes.joinLeave"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.portal_spawn') }}
                    <span v-text="sqliteTableSizes.portalSpawn"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.video_play') }}
                    <span v-text="sqliteTableSizes.videoPlay"></span>
                </span>
            </div>
            <div class="options-container-item">
                <span class="name">
                    {{ t('view.settings.advanced.advanced.sqlite_table_size.event') }}
                    <span v-text="sqliteTableSizes.event"></span>
                </span>
            </div>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.config_json') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        circle
                        style="margin-left: 5px"
                        @click="refreshConfigTreeData()"></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Delete"
                        circle
                        style="margin-left: 5px"
                        @click="configTreeData = []"></el-button>
                </el-tooltip>
            </div>
            <el-tree v-if="configTreeData.length > 0" :data="configTreeData" style="margin-top: 10px; font-size: 12px">
                <template #default="scope">
                    <span>
                        <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                        <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                    </span>
                </template>
            </el-tree>
        </div>

        <RegistryBackupDialog />
        <YouTubeApiDialog v-model:isYouTubeApiDialogVisible="isYouTubeApiDialogVisible" />
        <TranslationApiDialog v-model:isTranslationApiDialogVisible="isTranslationApiDialogVisible" />
        <AvatarProviderDialog v-model:isAvatarProviderDialogVisible="isAvatarProviderDialogVisible" />
        <PhotonSettings v-if="photonLoggingEnabled" />
    </div>
</template>

<script setup>
    import {
        CaretRight,
        Delete,
        DeleteFilled,
        Folder,
        Goods,
        Operation,
        Paperclip,
        Refresh,
        Tickets,
        Timer,
        User
    } from '@element-plus/icons-vue';
    import { computed, reactive, ref } from 'vue';
    import { ElMessage } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useAdvancedSettingsStore,
        useAuthStore,
        useAvatarProviderStore,
        useAvatarStore,
        useGameLogStore,
        useGroupStore,
        useInstanceStore,
        useLaunchStore,
        useNotificationsSettingsStore,
        usePhotonStore,
        useUserStore,
        useVRCXUpdaterStore,
        useVrStore,
        useVrcxStore,
        useWorldStore
    } from '../../../../stores';
    import { authRequest, miscRequest } from '../../../../api';
    import { buildTreeData } from '../../../../shared/utils/common';
    import { openExternalLink } from '../../../../shared/utils';

    import AvatarProviderDialog from '../../dialogs/AvatarProviderDialog.vue';
    import PhotonSettings from '../PhotonSettings.vue';
    import RegistryBackupDialog from '../../dialogs/RegistryBackupDialog.vue';
    import SimpleSwitch from '../SimpleSwitch.vue';
    import TranslationApiDialog from '../../dialogs/TranslationApiDialog.vue';
    import YouTubeApiDialog from '../../dialogs/YouTubeApiDialog.vue';

    const { t } = useI18n();

    const advancedSettingsStore = useAdvancedSettingsStore();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const { saveOpenVROption, updateVRLastLocation, updateOpenVR } = useVrStore();
    const { showLaunchOptions } = useLaunchStore();
    const { enablePrimaryPasswordChange } = useAuthStore();
    const { cachedConfig } = storeToRefs(useAuthStore());
    const { showConsole, clearVRCXCache, showRegistryBackupDialog } = useVrcxStore();
    const { disableGameLogDialog } = useGameLogStore();

    const { cachedUsers } = useUserStore();
    const { cachedWorlds } = useWorldStore();
    const { cachedAvatars, cachedAvatarNames } = useAvatarStore();
    const { cachedGroups } = useGroupStore();
    const { cachedInstances } = useInstanceStore();

    const { photonLoggingEnabled } = storeToRefs(usePhotonStore());
    const { branch } = storeToRefs(useVRCXUpdaterStore());
    const { openVR } = storeToRefs(notificationsSettingsStore);

    const {
        enablePrimaryPassword,
        relaunchVRChatAfterCrash,
        vrcQuitFix,
        autoSweepVRChatCache,
        selfInviteOverride,
        avatarRemoteDatabase,
        enableAppLauncher,
        enableAppLauncherAutoClose,
        enableAppLauncherRunProcessOnce,
        youTubeApi,
        translationApi,
        progressPie,
        progressPieFilter,
        showConfirmationOnSwitchAvatar,
        gameLogDisabled,
        sqliteTableSizes,
        sentryErrorReporting
    } = storeToRefs(advancedSettingsStore);

    const {
        setRelaunchVRChatAfterCrash,
        setVrcQuitFix,
        setAutoSweepVRChatCache,
        setSelfInviteOverride,
        setAvatarRemoteDatabase,
        setEnableAppLauncher,
        setEnableAppLauncherAutoClose,
        setEnableAppLauncherRunProcessOnce,
        setShowConfirmationOnSwitchAvatar,
        getSqliteTableSizes,
        showVRChatConfig,
        promptAutoClearVRCXCacheFrequency,
        setSentryErrorReporting
    } = advancedSettingsStore;

    const { isAvatarProviderDialogVisible } = storeToRefs(useAvatarProviderStore());
    const { showAvatarProviderDialog } = useAvatarProviderStore();

    const isYouTubeApiDialogVisible = ref(false);
    const isTranslationApiDialogVisible = ref(false);
    const configTreeData = ref([]);
    const visits = ref(0);

    const cacheSize = reactive({
        cachedUsers: 0,
        cachedWorlds: 0,
        cachedAvatars: 0,
        cachedGroups: 0,
        cachedAvatarNames: 0,
        cachedInstances: 0
    });

    const isLinux = computed(() => LINUX);

    function openVrcxAppDataFolder() {
        AppApi.OpenVrcxAppDataFolder().then((result) => {
            if (result) {
                ElMessage({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                ElMessage({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    }

    function openVrcAppDataFolder() {
        AppApi.OpenVrcAppDataFolder().then((result) => {
            if (result) {
                ElMessage({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                ElMessage({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    }

    function openCrashVrcCrashDumps() {
        AppApi.OpenCrashVrcCrashDumps().then((result) => {
            if (result) {
                ElMessage({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                ElMessage({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    }

    function openShortcutFolder() {
        AppApi.OpenShortcutFolder();
    }

    function showYouTubeApiDialog() {
        isYouTubeApiDialogVisible.value = true;
    }

    function showTranslationApiDialog() {
        isTranslationApiDialogVisible.value = true;
    }

    function refreshCacheSize() {
        cacheSize.cachedUsers = cachedUsers.size;
        cacheSize.cachedWorlds = cachedWorlds.size;
        cacheSize.cachedAvatars = cachedAvatars.size;
        cacheSize.cachedGroups = cachedGroups.size;
        cacheSize.cachedAvatarNames = cachedAvatarNames.size;
        cacheSize.cachedInstances = cachedInstances.size;
    }

    async function changeYouTubeApi(configKey = '') {
        if (configKey === 'VRCX_youtubeAPI') {
            advancedSettingsStore.setYouTubeApi();
        } else if (configKey === 'VRCX_progressPie') {
            advancedSettingsStore.setProgressPie();
        } else if (configKey === 'VRCX_progressPieFilter') {
            advancedSettingsStore.setProgressPieFilter();
        }
        updateVRLastLocation();
        updateOpenVR();
    }

    async function changeTranslationAPI(configKey = '') {
        if (configKey === 'VRCX_translationAPI') {
            advancedSettingsStore.setTranslationApi();
        }
    }

    async function refreshConfigTreeData() {
        await authRequest.getConfig();
        configTreeData.value = buildTreeData(cachedConfig.value);
    }

    function getVisits() {
        miscRequest.getVisits().then((args) => {
            visits.value = args.json;
        });
    }
</script>
