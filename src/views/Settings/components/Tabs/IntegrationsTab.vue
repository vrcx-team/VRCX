<template>
    <div class="flex flex-col gap-10 py-2">
        <!-- Discord Rich Presence -->
        <SettingsGroup :title="t('view.settings.discord_presence.discord_presence.header')">
            <template #description>
                <p class="m-0">{{ t('view.settings.discord_presence.discord_presence.description') }}</p>
                <p class="m-0 cursor-pointer hover:text-foreground transition-colors" @click="showVRChatConfig">
                    {{ t('view.settings.discord_presence.discord_presence.enable_tooltip') }}
                </p>
            </template>

            <SettingsItem :label="t('view.settings.discord_presence.discord_presence.enable')">
                <Switch
                    :model-value="discordActive"
                    :ariaLabel="t('view.settings.discord_presence.discord_presence.enable')"
                    @update:modelValue="
                        setDiscordActive();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.discord_presence.discord_presence.world_integration')"
                :description="t('view.settings.discord_presence.discord_presence.world_integration_tooltip')">
                <Switch
                    :model-value="discordWorldIntegration"
                    :disabled="!discordActive"
                    :ariaLabel="t('view.settings.discord_presence.discord_presence.world_integration')"
                    @update:modelValue="
                        setDiscordWorldIntegration();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.discord_presence.discord_presence.instance_type_player_count')">
                <Switch
                    :model-value="discordInstance"
                    :disabled="!discordActive"
                    :ariaLabel="t('view.settings.discord_presence.discord_presence.instance_type_player_count')"
                    @update:modelValue="
                        setDiscordInstance();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.discord_presence.discord_presence.show_current_platform')">
                <Switch
                    :model-value="discordShowPlatform"
                    :disabled="!discordActive || !discordInstance"
                    :ariaLabel="t('view.settings.discord_presence.discord_presence.show_current_platform')"
                    @update:modelValue="
                        setDiscordShowPlatform();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.discord_presence.discord_presence.show_details_in_private')">
                <Switch
                    :model-value="!discordHideInvite"
                    :disabled="!discordActive"
                    :ariaLabel="t('view.settings.discord_presence.discord_presence.show_details_in_private')"
                    @update:modelValue="
                        setDiscordHideInvite();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.discord_presence.discord_presence.join_button')">
                <Switch
                    :model-value="discordJoinButton"
                    :disabled="!discordActive"
                    :ariaLabel="t('view.settings.discord_presence.discord_presence.join_button')"
                    @update:modelValue="
                        setDiscordJoinButton();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.discord_presence.discord_presence.show_images')">
                <Switch
                    :model-value="!discordHideImage"
                    :disabled="!discordActive"
                    :ariaLabel="t('view.settings.discord_presence.discord_presence.show_images')"
                    @update:modelValue="
                        setDiscordHideImage();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.discord_presence.discord_presence.display_world_name_as_discord_status')">
                <Switch
                    :model-value="discordWorldNameAsDiscordStatus"
                    :disabled="!discordActive"
                    :ariaLabel="
                        t('view.settings.discord_presence.discord_presence.display_world_name_as_discord_status')
                    "
                    @update:modelValue="
                        setDiscordWorldNameAsDiscordStatus();
                        saveDiscordOption();
                    " />
            </SettingsItem>
        </SettingsGroup>

        <!-- Translation API -->
        <SettingsGroup :title="t('view.settings.advanced.advanced.translation_api.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.translation_api.enable')"
                :description="t('view.settings.advanced.advanced.translation_api.enable_tooltip')">
                <Switch
                    :model-value="translationApi"
                    :ariaLabel="t('view.settings.advanced.advanced.translation_api.enable')"
                    @update:modelValue="changeTranslationAPI('VRCX_translationAPI')" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.translation_api.translation_api_key')">
                <Button size="sm" variant="outline" @click="showTranslationApiDialog">
                    <Languages class="h-4 w-4 mr-1.5" />
                    {{ t('view.settings.advanced.advanced.translation_api.translation_api_key') }}
                </Button>
            </SettingsItem>
        </SettingsGroup>

        <!-- YouTube API -->
        <SettingsGroup :title="t('view.settings.advanced.advanced.youtube_api.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.youtube_api.enable')"
                :description="t('view.settings.advanced.advanced.youtube_api.enable_tooltip')">
                <Switch
                    :model-value="youTubeApi"
                    :ariaLabel="t('view.settings.advanced.advanced.youtube_api.enable')"
                    @update:modelValue="changeYouTubeApi('VRCX_youtubeAPI')" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.youtube_api.youtube_api_key')">
                <Button size="sm" variant="outline" @click="showYouTubeApiDialog">{{
                    t('view.settings.advanced.advanced.youtube_api.youtube_api_key')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>

        <!-- Remote Database -->
        <SettingsGroup :title="t('view.settings.advanced.advanced.remote_database.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.remote_database.enable')"
                :description="t('view.settings.advanced.advanced.remote_database.enable_description')">
                <Switch
                    :model-value="avatarRemoteDatabase"
                    :ariaLabel="t('view.settings.advanced.advanced.remote_database.enable')"
                    @update:modelValue="setAvatarRemoteDatabase(!avatarRemoteDatabase)" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.remote_database.avatar_database_provider')">
                <Button size="sm" variant="outline" @click="showAvatarProviderDialog">{{
                    t('view.settings.advanced.advanced.remote_database.avatar_database_provider')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>

        <!-- Friend Insight -->
        <SettingsGroup :title="t('view.settings.advanced.advanced.friend_insight.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.friend_insight.enable')"
                :description="t('view.settings.advanced.advanced.friend_insight.enable_tooltip')">
                <Switch
                    :model-value="friendInsightEnabled"
                    @update:modelValue="advancedSettingsStore.setFriendInsightEnabled()" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.friend_insight.api_config')">
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="!friendInsightEnabled"
                    @click="showFriendInsightApiDialog">
                    <Brain class="h-4 w-4 mr-1.5" />
                    {{ t('view.settings.advanced.advanced.friend_insight.api_config') }}
                </Button>
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.friend_insight.data_location')"
                :description="t('view.settings.advanced.advanced.friend_insight.data_location_tooltip')">
                <Switch
                    :model-value="friendInsightDataLocation"
                    :disabled="!friendInsightEnabled"
                    @update:modelValue="advancedSettingsStore.setFriendInsightDataLocation()" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.friend_insight.data_status')"
                :description="t('view.settings.advanced.advanced.friend_insight.data_status_tooltip')">
                <Switch
                    :model-value="friendInsightDataStatus"
                    :disabled="!friendInsightEnabled"
                    @update:modelValue="advancedSettingsStore.setFriendInsightDataStatus()" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.friend_insight.data_bio')"
                :description="t('view.settings.advanced.advanced.friend_insight.data_bio_tooltip')">
                <Switch
                    :model-value="friendInsightDataBio"
                    :disabled="!friendInsightEnabled"
                    @update:modelValue="advancedSettingsStore.setFriendInsightDataBio()" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.friend_insight.data_avatar')"
                :description="t('view.settings.advanced.advanced.friend_insight.data_avatar_tooltip')">
                <Switch
                    :model-value="friendInsightDataAvatar"
                    :disabled="!friendInsightEnabled"
                    @update:modelValue="advancedSettingsStore.setFriendInsightDataAvatar()" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.friend_insight.data_presence')"
                :description="t('view.settings.advanced.advanced.friend_insight.data_presence_tooltip')">
                <Switch
                    :model-value="friendInsightDataPresence"
                    :disabled="!friendInsightEnabled"
                    @update:modelValue="advancedSettingsStore.setFriendInsightDataPresence()" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.friend_insight.data_relationship')"
                :description="t('view.settings.advanced.advanced.friend_insight.data_relationship_tooltip')">
                <Switch
                    :model-value="friendInsightDataRelationship"
                    :disabled="!friendInsightEnabled"
                    @update:modelValue="advancedSettingsStore.setFriendInsightDataRelationship()" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.friend_insight.data_mutuals')"
                :description="t('view.settings.advanced.advanced.friend_insight.data_mutuals_tooltip')">
                <Switch
                    :model-value="friendInsightDataMutuals"
                    :disabled="!friendInsightEnabled"
                    @update:modelValue="advancedSettingsStore.setFriendInsightDataMutuals()" />
            </SettingsItem>
        </SettingsGroup>

        <FriendInsightApiDialog v-model:isVisible="isFriendInsightApiDialogVisible" />

        <TranslationApiDialog v-model:isTranslationApiDialogVisible="isTranslationApiDialogVisible" />
        <YouTubeApiDialog v-model:isYouTubeApiDialogVisible="isYouTubeApiDialogVisible" />
        <AvatarProviderDialog v-model:isAvatarProviderDialogVisible="isAvatarProviderDialogVisible" />
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import { Brain, Languages } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Switch } from '@/components/ui/switch';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useAdvancedSettingsStore,
        useAvatarProviderStore,
        useDiscordPresenceSettingsStore,
        useVrStore
    } from '@/stores';

    import AvatarProviderDialog from '../../dialogs/AvatarProviderDialog.vue';
    import FriendInsightApiDialog from '../../dialogs/FriendInsightApiDialog.vue';
    import TranslationApiDialog from '../../dialogs/TranslationApiDialog.vue';
    import YouTubeApiDialog from '../../dialogs/YouTubeApiDialog.vue';
    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const advancedSettingsStore = useAdvancedSettingsStore();
    const { updateVRLastLocation, updateOpenVR } = useVrStore();

    const {
        setDiscordActive,
        setDiscordInstance,
        setDiscordHideInvite,
        setDiscordJoinButton,
        setDiscordHideImage,
        setDiscordShowPlatform,
        setDiscordWorldIntegration,
        setDiscordWorldNameAsDiscordStatus,
        saveDiscordOption
    } = useDiscordPresenceSettingsStore();

    const {
        discordActive,
        discordInstance,
        discordHideInvite,
        discordJoinButton,
        discordHideImage,
        discordShowPlatform,
        discordWorldIntegration,
        discordWorldNameAsDiscordStatus
    } = storeToRefs(useDiscordPresenceSettingsStore());

    const { showVRChatConfig } = advancedSettingsStore;

    const {
        avatarRemoteDatabase,
        youTubeApi,
        translationApi,
        friendInsightEnabled,
        friendInsightDataLocation,
        friendInsightDataStatus,
        friendInsightDataBio,
        friendInsightDataAvatar,
        friendInsightDataPresence,
        friendInsightDataRelationship,
        friendInsightDataMutuals
    } = storeToRefs(advancedSettingsStore);

    const { setAvatarRemoteDatabase } = advancedSettingsStore;

    const { isAvatarProviderDialogVisible } = storeToRefs(useAvatarProviderStore());
    const { showAvatarProviderDialog } = useAvatarProviderStore();

    const isYouTubeApiDialogVisible = ref(false);
    const isTranslationApiDialogVisible = ref(false);
    const isFriendInsightApiDialogVisible = ref(false);

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
     * @param configKey
     */
    async function changeYouTubeApi(configKey = '') {
        if (configKey === 'VRCX_youtubeAPI') {
            advancedSettingsStore.setYouTubeApi();
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

    function showFriendInsightApiDialog() {
        isFriendInsightApiDialogVisible.value = true;
    }
</script>
