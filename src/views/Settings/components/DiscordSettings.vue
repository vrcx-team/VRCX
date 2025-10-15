<template>
    <div class="options-container" style="margin-top: 0">
        <span class="header">{{ t('view.settings.discord_presence.discord_presence.header') }}</span>
        <div class="options-container-item">
            <span>{{ t('view.settings.discord_presence.discord_presence.description') }}</span>
        </div>
        <div class="options-container-item" @click="showVRChatConfig" style="cursor: pointer">
            <span>{{ t('view.settings.discord_presence.discord_presence.enable_tooltip') }}</span>
        </div>
        <br />
        <simple-switch
            :label="t('view.settings.discord_presence.discord_presence.enable')"
            :value="discordActive"
            @change="
                setDiscordActive();
                saveDiscordOption();
            " />
        <simple-switch
            :label="t('view.settings.discord_presence.discord_presence.world_integration')"
            :value="discordWorldIntegration"
            :disabled="!discordActive"
            @change="
                setDiscordWorldIntegration();
                saveDiscordOption();
            "
            :tooltip="t('view.settings.discord_presence.discord_presence.world_integration_tooltip')" />
        <simple-switch
            :label="t('view.settings.discord_presence.discord_presence.instance_type_player_count')"
            :value="discordInstance"
            :disabled="!discordActive"
            @change="
                setDiscordInstance();
                saveDiscordOption();
            " />
        <simple-switch
            :label="t('view.settings.discord_presence.discord_presence.show_current_platform')"
            :value="discordShowPlatform"
            :disabled="!discordActive || !discordInstance"
            @change="
                setDiscordShowPlatform();
                saveDiscordOption();
            " />
        <simple-switch
            :label="t('view.settings.discord_presence.discord_presence.show_details_in_private')"
            :value="!discordHideInvite"
            :disabled="!discordActive"
            @change="
                setDiscordHideInvite();
                saveDiscordOption();
            " />
        <simple-switch
            :label="t('view.settings.discord_presence.discord_presence.join_button')"
            :value="discordJoinButton"
            :disabled="!discordActive"
            @change="
                setDiscordJoinButton();
                saveDiscordOption();
            " />
        <simple-switch
            :label="t('view.settings.discord_presence.discord_presence.show_images')"
            :value="!discordHideImage"
            :disabled="!discordActive"
            @change="
                setDiscordHideImage();
                saveDiscordOption();
            " />
        <simple-switch
            :label="t('view.settings.discord_presence.discord_presence.display_world_name_as_discord_status')"
            :value="discordWorldNameAsDiscordStatus"
            :disabled="!discordActive"
            @change="
                setDiscordWorldNameAsDiscordStatus();
                saveDiscordOption();
            " />
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAdvancedSettingsStore, useDiscordPresenceSettingsStore } from '../../../stores';

    import SimpleSwitch from './SimpleSwitch.vue';

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
