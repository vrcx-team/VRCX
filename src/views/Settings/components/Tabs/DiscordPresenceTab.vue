<template>
    <div class="flex flex-col gap-10 py-2">
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
                    @update:modelValue="
                        setDiscordWorldIntegration();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.discord_presence.discord_presence.instance_type_player_count')">
                <Switch
                    :model-value="discordInstance"
                    :disabled="!discordActive"
                    @update:modelValue="
                        setDiscordInstance();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.discord_presence.discord_presence.show_current_platform')">
                <Switch
                    :model-value="discordShowPlatform"
                    :disabled="!discordActive || !discordInstance"
                    @update:modelValue="
                        setDiscordShowPlatform();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.discord_presence.discord_presence.show_details_in_private')">
                <Switch
                    :model-value="!discordHideInvite"
                    :disabled="!discordActive"
                    @update:modelValue="
                        setDiscordHideInvite();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.discord_presence.discord_presence.join_button')">
                <Switch
                    :model-value="discordJoinButton"
                    :disabled="!discordActive"
                    @update:modelValue="
                        setDiscordJoinButton();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.discord_presence.discord_presence.show_images')">
                <Switch
                    :model-value="!discordHideImage"
                    :disabled="!discordActive"
                    @update:modelValue="
                        setDiscordHideImage();
                        saveDiscordOption();
                    " />
            </SettingsItem>

            <SettingsItem
                :label="
                    t('view.settings.discord_presence.discord_presence.display_world_name_as_discord_status')
                ">
                <Switch
                    :model-value="discordWorldNameAsDiscordStatus"
                    :disabled="!discordActive"
                    @update:modelValue="
                        setDiscordWorldNameAsDiscordStatus();
                        saveDiscordOption();
                    " />
            </SettingsItem>
        </SettingsGroup>
    </div>
</template>

<script setup>
    import { Switch } from '@/components/ui/switch';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAdvancedSettingsStore, useDiscordPresenceSettingsStore } from '@/stores';

    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

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

    const { showVRChatConfig } = useAdvancedSettingsStore();
</script>
