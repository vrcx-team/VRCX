<template>
    <div class="x-container">
        <div class="options-container" style="margin-top: 0; padding: 5px">
            <span class="header">{{ t('view.settings.header') }}</span>
        </div>
        <el-tabs type="card" style="height: calc(100% - 51px)">
            <el-tab-pane :label="t('view.settings.category.general')">
                <GeneralTab />
            </el-tab-pane>
            <el-tab-pane lazy :label="t('view.settings.category.appearance')">
                <AppearanceTab />
            </el-tab-pane>
            <el-tab-pane lazy :label="t('view.settings.category.notifications')">
                <NotificationsTab />
            </el-tab-pane>
            <el-tab-pane lazy :label="t('view.settings.category.wrist_overlay')">
                <WristOverlayTab />
            </el-tab-pane>
            <el-tab-pane lazy :label="t('view.settings.category.discord_presence')">
                <DiscordPresenceTab />
            </el-tab-pane>
            <el-tab-pane lazy :label="t('view.settings.category.pictures')">
                <PicturesTab />
            </el-tab-pane>
            <el-tab-pane lazy :label="t('view.settings.category.advanced')">
                <AdvancedTab />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup>
    import { onBeforeMount } from 'vue';
    import { useI18n } from 'vue-i18n';

    import AdvancedTab from './components/Tabs/AdvancedTab.vue';
    import AppearanceTab from './components/Tabs/AppearanceTab.vue';
    import DiscordPresenceTab from './components/Tabs/DiscordPresenceTab.vue';
    import GeneralTab from './components/Tabs/GeneralTab.vue';
    import NotificationsTab from './components/Tabs/NotificationsTab.vue';
    import PicturesTab from './components/Tabs/PicturesTab.vue';
    import WristOverlayTab from './components/Tabs/WristOverlayTab.vue';

    const { t } = useI18n();

    onBeforeMount(() => {
        const menuItem = document.querySelector('li[role="menuitem"].is-active');

        if (menuItem) {
            menuItem.classList.remove('is-active');
        }
    });
</script>
