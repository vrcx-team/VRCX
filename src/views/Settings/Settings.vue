<template>
    <div class="x-container">
        <div class="options-container" style="margin-top: 0; padding: 5px">
            <span class="header">{{ t('view.settings.header') }}</span>
        </div>
        <TabsUnderline
            default-value="general"
            :items="settingsTabs"
            :unmount-on-hide="false"
            style="height: calc(100% - 51px)">
            <template #general>
                <GeneralTab />
            </template>
            <template #appearance>
                <AppearanceTab />
            </template>
            <template #notifications>
                <NotificationsTab />
            </template>
            <template #wrist-overlay>
                <WristOverlayTab />
            </template>
            <template #discord>
                <DiscordPresenceTab />
            </template>
            <template #pictures>
                <PicturesTab />
            </template>
            <template #advanced>
                <AdvancedTab />
            </template>
        </TabsUnderline>
    </div>
</template>

<script setup>
    import { computed, onBeforeMount } from 'vue';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { useI18n } from 'vue-i18n';


    import AdvancedTab from './components/Tabs/AdvancedTab.vue';
    import AppearanceTab from './components/Tabs/AppearanceTab.vue';
    import DiscordPresenceTab from './components/Tabs/DiscordPresenceTab.vue';
    import GeneralTab from './components/Tabs/GeneralTab.vue';
    import NotificationsTab from './components/Tabs/NotificationsTab.vue';
    import PicturesTab from './components/Tabs/PicturesTab.vue';
    import WristOverlayTab from './components/Tabs/WristOverlayTab.vue';

    const { t } = useI18n();
    const settingsTabs = computed(() => [
        { value: 'general', label: t('view.settings.category.general') },
        { value: 'appearance', label: t('view.settings.category.appearance') },
        { value: 'notifications', label: t('view.settings.category.notifications') },
        { value: 'wrist-overlay', label: t('view.settings.category.wrist_overlay') },
        { value: 'discord', label: t('view.settings.category.discord_presence') },
        { value: 'pictures', label: t('view.settings.category.pictures') },
        { value: 'advanced', label: t('view.settings.category.advanced') }
    ]);

    onBeforeMount(() => {
        const menuItem = document.querySelector('li[role="menuitem"].is-active');

        if (menuItem) {
            menuItem.classList.remove('is-active');
        }
    });
</script>
