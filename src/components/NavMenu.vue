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
        { index: 'feed', icon: 'el-icon-news', tooltip: 'nav_tooltip.feed' },
        { index: 'gameLog', icon: 'el-icon-s-data', tooltip: 'nav_tooltip.game_log' },
        { index: 'playerList', icon: 'el-icon-tickets', tooltip: 'nav_tooltip.player_list' },
        { index: 'search', icon: 'el-icon-search', tooltip: 'nav_tooltip.search' },
        { index: 'favorite', icon: 'el-icon-star-off', tooltip: 'nav_tooltip.favorites' },
        { index: 'friendLog', icon: 'el-icon-notebook-2', tooltip: 'nav_tooltip.friend_log' },
        { index: 'moderation', icon: 'el-icon-finished', tooltip: 'nav_tooltip.moderation' },
        { index: 'notification', icon: 'el-icon-bell', tooltip: 'nav_tooltip.notification' },
        { index: 'friendList', icon: 'el-icon-s-management', tooltip: 'nav_tooltip.friend_list' },
        { index: 'charts', icon: 'el-icon-data-analysis', tooltip: 'nav_tooltip.charts' },
        { index: 'profile', icon: 'el-icon-user', tooltip: 'nav_tooltip.profile' },
        { index: 'settings', icon: 'el-icon-s-tools', tooltip: 'nav_tooltip.settings' }
    ];

    const VRCXUpdaterStore = useVRCXUpdaterStore();
    const { pendingVRCXUpdate, pendingVRCXInstall, updateInProgress, updateProgress } = storeToRefs(VRCXUpdaterStore);
    const { showVRCXUpdateDialog, updateProgressText } = VRCXUpdaterStore;
    const uiStore = useUiStore();
    const { menuActiveIndex, notifiedMenus } = storeToRefs(uiStore);
    const { selectMenu } = uiStore;
</script>
