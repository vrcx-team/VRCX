<template>
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.advanced.advanced.vrchat_settings.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.relaunch_vrchat.header')"
                :description="t('view.settings.advanced.advanced.relaunch_vrchat.description')">
                <Switch :model-value="relaunchVRChatAfterCrash" @update:modelValue="setRelaunchVRChatAfterCrash" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.vrchat_quit_fix.header')"
                :description="t('view.settings.advanced.advanced.vrchat_quit_fix.description')">
                <Switch :model-value="vrcQuitFix" @update:modelValue="setVrcQuitFix" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.auto_cache_management.header')"
                :description="t('view.settings.advanced.advanced.auto_cache_management.description')">
                <Switch :model-value="autoSweepVRChatCache" @update:modelValue="setAutoSweepVRChatCache" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.self_invite.header')"
                :description="t('view.settings.advanced.advanced.self_invite.description')">
                <Switch :model-value="selfInviteOverride" @update:modelValue="setSelfInviteOverride" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.vrcx_settings.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.primary_password.header')"
                :description="t('view.settings.advanced.advanced.primary_password.description')">
                <Switch
                    :model-value="enablePrimaryPassword"
                    :disabled="!enablePrimaryPassword"
                    @update:modelValue="enablePrimaryPasswordChange" />
            </SettingsItem>

            <template v-if="branch === 'Nightly'">
                <SettingsItem :label="t('view.settings.advanced.advanced.anonymous_error_reporting.header')"
                    :description="t('view.settings.advanced.advanced.anonymous_error_reporting.description')">
                    <Switch :model-value="sentryErrorReporting" @update:modelValue="setSentryErrorReporting()" />
                </SettingsItem>
            </template>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.general.logging.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.cache_debug.udon_exception_logging')">
                <Switch :model-value="udonExceptionLogging" @update:modelValue="setUdonExceptionLogging" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.general.logging.resource_load')">
                <Switch :model-value="logResourceLoad" @update:modelValue="setLogResourceLoad" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.general.logging.empty_avatar')">
                <Switch :model-value="logEmptyAvatars" @update:modelValue="setLogEmptyAvatars" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.general.logging.auto_login_delay')">
                <Switch :model-value="autoLoginDelayEnabled" @update:modelValue="setAutoLoginDelayEnabled" />
            </SettingsItem>

            <SettingsItem v-if="autoLoginDelayEnabled"
                :label="t('view.settings.general.logging.auto_login_delay_button')">
                <Button size="sm" variant="outline" @click="promptAutoLoginDelaySeconds">
                    {{ t('view.settings.general.logging.auto_login_delay_button') }}
                </Button>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.profile.game_info.header')">
            <div class="px-1 py-1">
                <div class="flex-1 cursor-pointer" @click="getVisits">
                    <span class="block truncate font-medium text-sm leading-[18px]">{{
                        t('view.profile.game_info.online_users')
                    }}</span>
                    <span v-if="visits" class="block truncate text-xs text-muted-foreground">{{
                        t('view.profile.game_info.user_online', { count: visits })
                    }}</span>
                    <span v-else class="block truncate text-xs text-muted-foreground">{{
                        t('view.profile.game_info.refresh')
                    }}</span>
                </div>
            </div>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.remote_database.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.remote_database.enable')">
                <Switch
                    :model-value="avatarRemoteDatabase"
                    @update:modelValue="setAvatarRemoteDatabase(!avatarRemoteDatabase)" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.remote_database.avatar_database_provider')">
                <Button size="sm" variant="outline" @click="showAvatarProviderDialog">{{
                    t('view.settings.advanced.advanced.remote_database.avatar_database_provider')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>

        <template v-if="!isLinux">
            <SettingsGroup :title="t('view.settings.advanced.advanced.app_launcher.header')">
                <SettingsItem :label="t('view.settings.advanced.advanced.app_launcher.folder')">
                    <Button size="sm" variant="outline" @click="openShortcutFolder()">{{
                        t('view.settings.advanced.advanced.app_launcher.folder')
                    }}</Button>
                </SettingsItem>

                <SettingsItem :label="t('view.settings.advanced.advanced.remote_database.enable')"
                    :description="t('view.settings.advanced.advanced.app_launcher.folder_tooltip')">
                    <Switch :model-value="enableAppLauncher" @update:modelValue="setEnableAppLauncher" />
                </SettingsItem>

                <SettingsItem :label="t('view.settings.advanced.advanced.app_launcher.auto_close')">
                    <Switch
                        :model-value="enableAppLauncherAutoClose"
                        @update:modelValue="setEnableAppLauncherAutoClose" />
                </SettingsItem>

                <SettingsItem :label="t('view.settings.advanced.advanced.app_launcher.run_process_once')">
                    <Switch
                        :model-value="enableAppLauncherRunProcessOnce"
                        @update:modelValue="setEnableAppLauncherRunProcessOnce" />
                </SettingsItem>
            </SettingsGroup>
        </template>

        <SettingsGroup :title="t('view.settings.advanced.advanced.youtube_api.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.youtube_api.enable')"
                :description="t('view.settings.advanced.advanced.youtube_api.enable_tooltip')">
                <Switch :model-value="youTubeApi" @update:modelValue="changeYouTubeApi('VRCX_youtubeAPI')" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.youtube_api.youtube_api_key')">
                <Button size="sm" variant="outline" @click="showYouTubeApiDialog">{{
                    t('view.settings.advanced.advanced.youtube_api.youtube_api_key')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.translation_api.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.translation_api.enable')"
                :description="t('view.settings.advanced.advanced.translation_api.enable_tooltip')">
                <Switch :model-value="translationApi" @update:modelValue="changeTranslationAPI('VRCX_translationAPI')" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.translation_api.translation_api_key')">
                <Button size="sm" variant="outline" @click="showTranslationApiDialog">
                    <Languages class="h-4 w-4 mr-1.5" />
                    {{ t('view.settings.advanced.advanced.translation_api.translation_api_key') }}
                </Button>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.video_progress_pie.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.video_progress_pie.enable')"
                :description="t('view.settings.advanced.advanced.video_progress_pie.enable_tooltip')">
                <Switch
                    :model-value="progressPie"
                    :disabled="!openVR"
                    @update:modelValue="changeYouTubeApi('VRCX_progressPie')" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.video_progress_pie.dance_world_only')">
                <Switch
                    :model-value="progressPieFilter"
                    :disabled="!openVR"
                    @update:modelValue="changeYouTubeApi('VRCX_progressPieFilter')" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.launch_commands.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.launch_commands.show_confirmation_on_switch_avatar_enable')"
                :description="t('view.settings.advanced.advanced.launch_commands.show_confirmation_on_switch_avatar_tooltip')">
                <Switch
                    :model-value="showConfirmationOnSwitchAvatar"
                    @update:modelValue="setShowConfirmationOnSwitchAvatar" />
            </SettingsItem>

            <div class="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    @click="openExternalLink('https://github.com/vrcx-team/VRCX/wiki/Launch-parameters-&-VRCX.json')"
                    >{{ t('view.settings.advanced.advanced.launch_commands.docs') }}</Button
                >
                <Button
                    size="sm"
                    variant="outline"
                    @click="openExternalLink('https://github.com/Myrkie/open-in-vrcx')"
                    >{{ t('view.settings.advanced.advanced.launch_commands.website_userscript') }}</Button
                >
            </div>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.cache_debug.header')">
            <div class="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" @click="clearVRCXCache">{{
                    t('view.settings.advanced.advanced.cache_debug.clear_cache')
                }}</Button>
                <Button size="sm" variant="outline" @click="promptAutoClearVRCXCacheFrequency">{{
                    t('view.settings.advanced.advanced.cache_debug.auto_clear_cache')
                }}</Button>
                <Button size="sm" variant="outline" @click="refreshCacheSize">{{
                    t('view.settings.advanced.advanced.cache_debug.refresh_cache')
                }}</Button>
            </div>

            <SettingsItem
                :label="`${t('view.settings.advanced.advanced.cache_debug.disable_gamelog')} ${t('view.settings.advanced.advanced.cache_debug.disable_gamelog_notice')}`">
                <Switch :model-value="gameLogDisabled" @update:modelValue="disableGameLogDialog()" />
            </SettingsItem>

            <div class="flex flex-col gap-1 text-sm">
                <span>{{ t('view.settings.advanced.advanced.cache_debug.user_cache') }} <span v-text="cacheSize.cachedUsers"></span></span>
                <span>{{ t('view.settings.advanced.advanced.cache_debug.world_cache') }} <span v-text="cacheSize.cachedWorlds"></span></span>
                <span>{{ t('view.settings.advanced.advanced.cache_debug.avatar_cache') }} <span v-text="cacheSize.cachedAvatars"></span></span>
                <span>{{ t('view.settings.advanced.advanced.cache_debug.group_cache') }} <span v-text="cacheSize.cachedGroups"></span></span>
                <span>{{ t('view.settings.advanced.advanced.cache_debug.avatar_name_cache') }} <span v-text="cacheSize.cachedAvatarNames"></span></span>
                <span>{{ t('view.settings.advanced.advanced.cache_debug.instance_cache') }} <span v-text="cacheSize.cachedInstances"></span></span>
            </div>

            <SettingsItem :label="t('view.settings.advanced.advanced.cache_debug.show_console')">
                <Button size="sm" variant="outline" @click="showConsole">{{
                    t('view.settings.advanced.advanced.cache_debug.show_console')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.sqlite_table_size.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.sqlite_table_size.refresh')">
                <Button size="sm" variant="outline" @click="getSqliteTableSizes">{{
                    t('view.settings.advanced.advanced.sqlite_table_size.refresh')
                }}</Button>
            </SettingsItem>

            <div class="flex flex-col gap-1 text-sm">
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.gps') }} <span v-text="sqliteTableSizes.gps"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.status') }} <span v-text="sqliteTableSizes.status"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.bio') }} <span v-text="sqliteTableSizes.bio"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.avatar') }} <span v-text="sqliteTableSizes.avatar"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.online_offline') }} <span v-text="sqliteTableSizes.onlineOffline"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.friend_log_history') }} <span v-text="sqliteTableSizes.friendLogHistory"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.notification') }} <span v-text="sqliteTableSizes.notification"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.location') }} <span v-text="sqliteTableSizes.location"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.join_leave') }} <span v-text="sqliteTableSizes.joinLeave"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.portal_spawn') }} <span v-text="sqliteTableSizes.portalSpawn"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.video_play') }} <span v-text="sqliteTableSizes.videoPlay"></span></span>
                <span>{{ t('view.settings.advanced.advanced.sqlite_table_size.event') }} <span v-text="sqliteTableSizes.event"></span></span>
            </div>
        </SettingsGroup>

        <SettingsGroup :title="t('view.profile.config_json')">
            <div class="flex items-center gap-2">
                <TooltipWrapper side="top" :content="t('view.profile.refresh_tooltip')">
                    <Button class="rounded-full" size="icon-sm" variant="outline" @click="refreshConfigTreeData()">
                        <RefreshCcw />
                    </Button>
                </TooltipWrapper>
                <TooltipWrapper side="top" :content="t('view.profile.clear_results_tooltip')">
                    <Button class="rounded-full" size="icon-sm" variant="outline" @click="configTreeData = {}">
                        <Trash2 />
                    </Button>
                </TooltipWrapper>
            </div>
            <vue-json-pretty
                v-if="Object.keys(configTreeData).length > 0"
                :data="configTreeData"
                :deep="2"
                :theme="isDarkMode ? 'dark' : 'light'"
                :height="800"
                :dynamic-height="false"
                virtual
                show-icon />
        </SettingsGroup>

        <RegistryBackupDialog />
        <YouTubeApiDialog v-model:isYouTubeApiDialogVisible="isYouTubeApiDialogVisible" />
        <TranslationApiDialog v-model:isTranslationApiDialogVisible="isTranslationApiDialogVisible" />
        <AvatarProviderDialog v-model:isAvatarProviderDialogVisible="isAvatarProviderDialogVisible" />
        <PhotonSettings v-if="photonLoggingEnabled" />
    </div>
</template>

<script setup>
    import { Languages, RefreshCcw, Trash2 } from 'lucide-vue-next';
    import { computed, reactive, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Switch } from '@/components/ui/switch';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import VueJsonPretty from 'vue-json-pretty';

    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useAuthStore,
        useAvatarProviderStore,
        useAvatarStore,
        useGeneralSettingsStore,
        useGroupStore,
        useInstanceStore,
        useNotificationsSettingsStore,
        usePhotonStore,
        useUiStore,
        useUserStore,
        useVRCXUpdaterStore,
        useVrStore,
        useWorldStore
    } from '@/stores';
    import { authRequest, queryRequest } from '@/api';
    import { disableGameLogDialog } from '@/coordinators/gameLogCoordinator';
    import { clearVRCXCache } from '@/coordinators/vrcxCoordinator';
    import { openExternalLink } from '@/shared/utils';

    import AvatarProviderDialog from '../../dialogs/AvatarProviderDialog.vue';
    import PhotonSettings from '../PhotonSettings.vue';
    import RegistryBackupDialog from '../../../Tools/dialogs/RegistryBackupDialog.vue';
    import TranslationApiDialog from '../../dialogs/TranslationApiDialog.vue';
    import YouTubeApiDialog from '../../dialogs/YouTubeApiDialog.vue';
    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const advancedSettingsStore = useAdvancedSettingsStore();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const { updateVRLastLocation, updateOpenVR } = useVrStore();
    const { enablePrimaryPasswordChange } = useAuthStore();
    const { cachedConfig } = storeToRefs(useAuthStore());
    const { showConsole } = useUiStore();

    const generalSettingsStore = useGeneralSettingsStore();
    const { udonExceptionLogging, logResourceLoad, logEmptyAvatars, autoLoginDelayEnabled } =
        storeToRefs(generalSettingsStore);
    const {
        setUdonExceptionLogging,
        setLogResourceLoad,
        setLogEmptyAvatars,
        setAutoLoginDelayEnabled,
        promptAutoLoginDelaySeconds
    } = generalSettingsStore;

    const { cachedUsers } = useUserStore();
    const { cachedWorlds } = useWorldStore();
    const { cachedAvatars, cachedAvatarNames } = useAvatarStore();
    const { cachedGroups } = useGroupStore();
    const { cachedInstances } = useInstanceStore();

    const { photonLoggingEnabled } = storeToRefs(usePhotonStore());
    const { branch } = storeToRefs(useVRCXUpdaterStore());
    const { openVR } = storeToRefs(notificationsSettingsStore);

    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());

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
    const configTreeData = ref({});
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

    /**
     *
     */
    function openShortcutFolder() {
        AppApi.OpenShortcutFolder();
    }

    /**
     *
     */
    function showYouTubeApiDialog() {
        isYouTubeApiDialogVisible.value = true;
    }

    /**
     *
     */
    function showTranslationApiDialog() {
        isTranslationApiDialogVisible.value = true;
    }

    /**
     *
     */
    function refreshCacheSize() {
        cacheSize.cachedUsers = cachedUsers.size;
        cacheSize.cachedWorlds = cachedWorlds.size;
        cacheSize.cachedAvatars = cachedAvatars.size;
        cacheSize.cachedGroups = cachedGroups.size;
        cacheSize.cachedAvatarNames = cachedAvatarNames.size;
        cacheSize.cachedInstances = cachedInstances.size;
    }

    /**
     *
     * @param configKey
     */
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

    /**
     *
     * @param configKey
     */
    async function changeTranslationAPI(configKey = '') {
        if (configKey === 'VRCX_translationAPI') {
            advancedSettingsStore.setTranslationApi();
        }
    }

    /**
     *
     */
    async function refreshConfigTreeData() {
        await authRequest.getConfig();
        configTreeData.value = cachedConfig.value;
    }

    /**
     *
     */
    function getVisits() {
        queryRequest.fetch('visits').then((args) => {
            visits.value = args.json;
        });
    }
</script>
