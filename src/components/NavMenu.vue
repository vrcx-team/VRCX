<template>
    <div class="x-menu-container nav-menu-container">
        <div>
            <div v-if="updateInProgress" class="pending-update" @click="showVRCXUpdateDialog">
                <el-progress
                    type="circle"
                    :width="50"
                    :stroke-width="3"
                    :percentage="updateProgress"
                    :format="updateProgressText"></el-progress>
            </div>
            <div v-else-if="pendingVRCXUpdate || pendingVRCXInstall" class="pending-update">
                <el-button
                    type="success"
                    plain
                    style="font-size: 19px; height: 36px; width: 44px; margin: 10px"
                    @click="showVRCXUpdateDialog"
                    ><i class="ri-download-line"></i
                ></el-button>
            </div>

            <el-menu ref="navRef" collapse router default-active="feed" :collapse-transition="false">
                <el-menu-item
                    v-for="item in navItems"
                    :key="item.index"
                    :index="item.index"
                    :class="{ notify: notifiedMenus.includes(item.index) }">
                    <i :class="item.icon"></i>
                    <template #title>
                        <span>{{ t(item.tooltip) }}</span>
                    </template>
                </el-menu-item>
            </el-menu>
        </div>

        <div class="nav-menu-container-bottom">
            <el-tooltip v-if="branch === 'Nightly'" :content="'Feedback'" placement="right"
                ><div class="direct-access" id="feedback" @click="setSentryErrorReporting">
                    <i class="ri-feedback-line"></i></div
            ></el-tooltip>
            <el-tooltip :content="t('prompt.direct_access_omni.header')" placement="right"
                ><div class="direct-access" @click="directAccessPaste"><i class="ri-compass-3-line"></i></div
            ></el-tooltip>
        </div>
    </div>
</template>

<script setup>
    import { onMounted } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAdvancedSettingsStore, useSearchStore, useUiStore, useVRCXUpdaterStore } from '../stores';

    import * as Sentry from '@sentry/vue';

    const { t } = useI18n();

    const navItems = [
        { index: 'feed', icon: 'ri-rss-line', tooltip: 'nav_tooltip.feed' },
        { index: 'gameLog', icon: 'ri-history-line', tooltip: 'nav_tooltip.game_log' },
        { index: 'playerList', icon: 'ri-group-3-line', tooltip: 'nav_tooltip.player_list' },
        { index: 'search', icon: 'ri-search-line', tooltip: 'nav_tooltip.search' },
        { index: 'favorites', icon: 'ri-star-line', tooltip: 'nav_tooltip.favorites' },
        { index: 'friendLog', icon: 'ri-contacts-line', tooltip: 'nav_tooltip.friend_log' },
        { index: 'moderation', icon: 'ri-user-forbid-line', tooltip: 'nav_tooltip.moderation' },
        { index: 'notification', icon: 'ri-notification-2-line', tooltip: 'nav_tooltip.notification' },
        { index: 'friendList', icon: 'ri-contacts-book-3-line', tooltip: 'nav_tooltip.friend_list' },
        { index: 'charts', icon: 'ri-bar-chart-line', tooltip: 'nav_tooltip.charts' },
        { index: 'tools', icon: 'ri-tools-line', tooltip: 'nav_tooltip.tools' },
        { index: 'settings', icon: 'ri-settings-3-line', tooltip: 'nav_tooltip.settings' }
    ];

    const VRCXUpdaterStore = useVRCXUpdaterStore();
    const { pendingVRCXUpdate, pendingVRCXInstall, updateInProgress, updateProgress, branch } =
        storeToRefs(VRCXUpdaterStore);
    const { showVRCXUpdateDialog, updateProgressText } = VRCXUpdaterStore;
    const uiStore = useUiStore();
    const { notifiedMenus } = storeToRefs(uiStore);
    const { directAccessPaste } = useSearchStore();
    const { sentryErrorReporting } = storeToRefs(useAdvancedSettingsStore());
    const { setSentryErrorReporting } = useAdvancedSettingsStore();

    onMounted(() => {
        if (!sentryErrorReporting.value) return;
        const feedback = Sentry.getFeedback();
        feedback?.attachTo(document.getElementById('feedback'));
    });
</script>

<style scoped>
    .nav-menu-container {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        .el-menu {
            background: 0;
            border: 0;
        }
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
        .direct-access {
            font-size: 19px;
            width: 64px;
            height: 56px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            vertical-align: middle;
        }
        .direct-access:hover {
            background-color: var(--el-menu-hover-bg-color);
            cursor: pointer;
            transition:
                border-color var(--el-transition-duration),
                background-color var(--el-transition-duration),
                color var(--el-transition-duration);
        }
        .nav-menu-container-bottom {
            display: flex;
            flex-direction: column;
        }
    }
</style>
