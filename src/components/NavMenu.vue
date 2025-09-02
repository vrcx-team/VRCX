<template>
    <div class="x-menu-container">
        <div v-if="updateInProgress" class="pending-update" @click="showVRCXUpdateDialog">
            <el-progress
                type="circle"
                width="50"
                :stroke-width="3"
                :percentage="updateProgress"
                :format="updateProgressText"></el-progress>
        </div>
        <div v-else-if="pendingVRCXUpdate || pendingVRCXInstall" class="pending-update">
            <el-button
                type="default"
                size="mini"
                icon="el-icon-download"
                circle
                style="font-size: 14px; height: 50px; width: 50px"
                @click="showVRCXUpdateDialog" />
        </div>
        <el-menu
            ref="navRef"
            collapse
            :default-active="menuActiveIndex"
            :collapse-transition="false"
            @select="selectMenu">
            <el-menu-item
                v-for="item in navItems"
                :key="item.index"
                :index="item.index"
                :class="{ notify: notifiedMenus.includes(item.index) }">
                <i :class="item.icon"></i>
                <template #title>
                    <span>{{ $t(item.tooltip) }}</span>
                </template>
            </el-menu-item>
        </el-menu>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useUiStore, useVRCXUpdaterStore } from '../stores';

    const navItems = [
        { index: 'feed', icon: 'ri-rss-line', tooltip: 'nav_tooltip.feed' },
        { index: 'gameLog', icon: 'ri-history-line', tooltip: 'nav_tooltip.game_log' },
        { index: 'playerList', icon: 'ri-group-3-line', tooltip: 'nav_tooltip.player_list' },
        { index: 'search', icon: 'ri-search-line', tooltip: 'nav_tooltip.search' },
        { index: 'favorite', icon: 'ri-star-line', tooltip: 'nav_tooltip.favorites' },
        { index: 'friendLog', icon: 'ri-contacts-book-3-line', tooltip: 'nav_tooltip.friend_log' },
        { index: 'moderation', icon: 'ri-user-forbid-line', tooltip: 'nav_tooltip.moderation' },
        { index: 'notification', icon: 'ri-notification-2-line', tooltip: 'nav_tooltip.notification' },
        { index: 'friendList', icon: 'ri-contacts-book-2-line', tooltip: 'nav_tooltip.friend_list' },
        { index: 'charts', icon: 'ri-bar-chart-line', tooltip: 'nav_tooltip.charts' },
        { index: 'tools', icon: 'ri-tools-line', tooltip: 'nav_tooltip.tools' },
        { index: 'profile', icon: 'ri-user-line', tooltip: 'nav_tooltip.profile' },
        { index: 'settings', icon: 'ri-settings-3-line', tooltip: 'nav_tooltip.settings' }
    ];

    const VRCXUpdaterStore = useVRCXUpdaterStore();
    const { pendingVRCXUpdate, pendingVRCXInstall, updateInProgress, updateProgress } = storeToRefs(VRCXUpdaterStore);
    const { showVRCXUpdateDialog, updateProgressText } = VRCXUpdaterStore;
    const uiStore = useUiStore();
    const { menuActiveIndex, notifiedMenus } = storeToRefs(uiStore);
    const { selectMenu } = uiStore;
</script>

<style scoped>
    .el-menu-item i[class*='ri-'] {
        font-size: 19px;
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        vertical-align: middle;
    }
</style>
