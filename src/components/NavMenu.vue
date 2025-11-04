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
            <el-tooltip :content="t('prompt.direct_access_omni.header')" placement="right"
                ><div class="bottom-button" @click="directAccessPaste"><i class="ri-compass-3-line"></i></div
            ></el-tooltip>
        </div>

        <div class="nav-menu-container-bottom">
            <el-tooltip v-if="branch === 'Nightly'" :content="'Feedback'" placement="right"
                ><div class="bottom-button" id="feedback" @click="!sentryErrorReporting && setSentryErrorReporting()">
                    <i class="ri-feedback-line"></i></div
            ></el-tooltip>

            <el-popover
                v-model:visible="supportMenuVisible"
                placement="right"
                trigger="click"
                popper-style="padding:4px;border-radius:8px;"
                :offset="4"
                :show-arrow="false"
                :width="200"
                :hide-after="0">
                <div class="nav-menu-support nav-menu-settings">
                    <div class="nav-menu-support__section">
                        <button type="button" class="nav-menu-settings__item" @click="showChangeLogDialog">
                            <span>{{ t('nav_menu.whats_new') }}</span>
                        </button>
                    </div>
                    <el-divider></el-divider>
                    <div class="nav-menu-support__section">
                        <span class="nav-menu-support__title">{{ t('nav_menu.resources') }}</span>
                        <button type="button" class="nav-menu-settings__item" @click="handleSupportLink('wiki')">
                            <span>{{ t('nav_menu.wiki') }}</span>
                        </button>
                    </div>
                    <el-divider></el-divider>
                    <div class="nav-menu-support__section">
                        <span class="nav-menu-support__title">{{ t('nav_menu.get_help') }}</span>
                        <button type="button" class="nav-menu-settings__item" @click="handleSupportLink('github')">
                            <span>{{ t('nav_menu.github') }}</span>
                        </button>
                        <button type="button" class="nav-menu-settings__item" @click="handleSupportLink('discord')">
                            <span>{{ t('nav_menu.discord') }}</span>
                        </button>
                    </div>
                </div>
                <template #reference>
                    <div>
                        <el-tooltip :content="t('nav_tooltip.help_support')" placement="right">
                            <div class="bottom-button">
                                <i class="ri-question-line"></i>
                            </div>
                        </el-tooltip>
                    </div>
                </template>
            </el-popover>

            <el-popover
                v-model:visible="settingsMenuVisible"
                placement="right"
                trigger="click"
                popper-style="padding:4px;border-radius:8px;"
                :offset="4"
                :show-arrow="false"
                :width="200"
                :hide-after="0">
                <div class="nav-menu-settings">
                    <div class="nav-menu-settings__header">
                        <img class="nav-menu-settings__logo" :src="vrcxLogo" alt="VRCX" @click="openGithub" />
                        <div class="nav-menu-settings__meta">
                            <span class="nav-menu-settings__title" @click="openGithub"
                                >VRCX
                                <i class="ri-heart-3-fill" style="color: #64cd8a; font-size: 14px"></i>
                            </span>
                            <span class="nav-menu-settings__version">{{ version }}</span>
                        </div>
                    </div>
                    <el-divider></el-divider>
                    <button type="button" class="nav-menu-settings__item" @click="handleSettingsClick">
                        <span>{{ t('nav_tooltip.settings') }}</span>
                    </button>
                    <el-popover
                        v-model:visible="themeMenuVisible"
                        placement="right-start"
                        trigger="hover"
                        popper-style="padding:4px;border-radius:8px;"
                        :offset="4"
                        :show-arrow="false"
                        :width="200">
                        <div class="nav-menu-theme">
                            <button
                                v-for="theme in themes"
                                :key="theme"
                                type="button"
                                class="nav-menu-theme__item"
                                :class="{ 'is-active': themeMode === theme }"
                                @click="handleThemeSelect(theme)">
                                <span class="nav-menu-theme__label">{{ themeDisplayName(theme) }}</span>
                                <span v-if="themeMode === theme" class="nav-menu-theme__check">✔</span>
                            </button>
                        </div>
                        <template #reference>
                            <button type="button" class="nav-menu-settings__item" @click.prevent>
                                <span>{{ t('view.settings.appearance.appearance.theme_mode') }}</span>
                                <span class="nav-menu-settings__arrow">›</span>
                            </button>
                        </template>
                    </el-popover>
                    <button
                        type="button"
                        class="nav-menu-settings__item nav-menu-settings__item--danger"
                        @click="handleLogoutClick">
                        <span>{{ t('dialog.user.actions.logout') }}</span>
                    </button>
                </div>
                <template #reference>
                    <div class="bottom-button">
                        <i class="ri-settings-3-line"></i>
                    </div>
                </template>
            </el-popover>
        </div>
    </div>
</template>

<script setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useAuthStore,
        useSearchStore,
        useUiStore,
        useVRCXUpdaterStore
    } from '../stores';
    import { THEME_CONFIG } from '../shared/constants';
    import { openExternalLink } from '../shared/utils';

    import * as Sentry from '@sentry/vue';

    const { t } = useI18n();
    const router = useRouter();

    const navItems = [
        { index: 'feed', icon: 'ri-rss-line', tooltip: 'nav_tooltip.feed' },
        { index: 'friend-location', icon: 'ri-user-location-line', tooltip: 'nav_tooltip.friend_location' },
        { index: 'game-log', icon: 'ri-history-line', tooltip: 'nav_tooltip.game_log' },
        { index: 'player-list', icon: 'ri-group-3-line', tooltip: 'nav_tooltip.player_list' },
        { index: 'search', icon: 'ri-search-line', tooltip: 'nav_tooltip.search' },
        { index: 'favorites', icon: 'ri-star-line', tooltip: 'nav_tooltip.favorites' },
        { index: 'friend-log', icon: 'ri-contacts-line', tooltip: 'nav_tooltip.friend_log' },
        { index: 'moderation', icon: 'ri-user-forbid-line', tooltip: 'nav_tooltip.moderation' },
        { index: 'notification', icon: 'ri-notification-2-line', tooltip: 'nav_tooltip.notification' },
        { index: 'friend-list', icon: 'ri-contacts-book-3-line', tooltip: 'nav_tooltip.friend_list' },
        { index: 'charts', icon: 'ri-bar-chart-line', tooltip: 'nav_tooltip.charts' },
        { index: 'tools', icon: 'ri-tools-line', tooltip: 'nav_tooltip.tools' }
    ];

    const VRCXUpdaterStore = useVRCXUpdaterStore();
    const { pendingVRCXUpdate, pendingVRCXInstall, updateInProgress, updateProgress, branch, appVersion } =
        storeToRefs(VRCXUpdaterStore);
    const { showVRCXUpdateDialog, updateProgressText, showChangeLogDialog } = VRCXUpdaterStore;
    const uiStore = useUiStore();
    const { notifiedMenus } = storeToRefs(uiStore);
    const { directAccessPaste } = useSearchStore();
    const { sentryErrorReporting } = storeToRefs(useAdvancedSettingsStore());
    const { setSentryErrorReporting } = useAdvancedSettingsStore();
    const { logout } = useAuthStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { themeMode } = storeToRefs(appearanceSettingsStore);

    const settingsMenuVisible = ref(false);
    const themeMenuVisible = ref(false);
    const supportMenuVisible = ref(false);

    const version = computed(() => appVersion.value?.split('VRCX ')?.[1] || '-');
    const vrcxLogo = new URL('../../images/VRCX.png', import.meta.url).href;

    const themes = computed(() => Object.keys(THEME_CONFIG));

    const themeDisplayName = (key) => THEME_CONFIG[key]?.name ?? key;

    const handleSettingsClick = () => {
        themeMenuVisible.value = false;
        supportMenuVisible.value = false;
        settingsMenuVisible.value = false;
        router.push({ name: 'settings' });
    };

    const handleLogoutClick = () => {
        settingsMenuVisible.value = false;
        logout();
    };

    const handleThemeSelect = (theme) => {
        themeMenuVisible.value = false;
        settingsMenuVisible.value = false;
        appearanceSettingsStore.saveThemeMode(theme);
    };

    const openGithub = () => {
        openExternalLink('https://github.com/vrcx-team/VRCX');
    };

    watch(settingsMenuVisible, (visible) => {
        if (visible) {
            supportMenuVisible.value = false;
        } else {
            themeMenuVisible.value = false;
        }
    });

    watch(supportMenuVisible, (visible) => {
        if (visible) {
            settingsMenuVisible.value = false;
        }
    });

    const supportLinks = {
        wiki: 'https://github.com/vrcx-team/VRCX/wiki',
        github: 'https://github.com/vrcx-team/VRCX',
        discord: 'https://vrcx.app/discord'
    };

    const handleSupportLink = (id) => {
        supportMenuVisible.value = false;
        const target = supportLinks[id];
        if (target) {
            openExternalLink(target);
        }
    };

    onMounted(() => {
        if (!sentryErrorReporting.value) return;
        const feedback = Sentry.getFeedback();
        feedback?.attachTo(document.getElementById('feedback'));
    });
</script>

<style scoped>
    :deep(.el-divider) {
        margin: 0;
    }
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
        .bottom-button {
            font-size: 19px;
            width: 64px;
            height: 56px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            vertical-align: middle;
            cursor: pointer;
        }
        .bottom-button:hover {
            background-color: var(--el-menu-hover-bg-color);
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

    .nav-menu-settings {
        display: flex;
        flex-direction: column;
        gap: 2px;
        .nav-menu-settings__header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 8px 10px;
            .nav-menu-settings__logo {
                width: 24px;
                height: 24px;
                object-fit: contain;
                cursor: pointer;
            }

            .nav-menu-settings__meta {
                display: flex;
                flex-direction: column;
                gap: 2px;
                color: var(--el-text-color-secondary);
                font-size: 12px;
                line-height: 1.2;
            }
            .nav-menu-settings__title {
                display: flex;
                align-items: center;
                font-weight: 600;
                font-size: 14px;
                color: var(--el-text-color-regular);
                cursor: pointer;
            }

            .nav-menu-settings__version {
                font-size: 11px;
            }
        }
        .nav-menu-settings__item {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 8px 12px;
            width: 100%;
            border: none;
            background: transparent;
            color: var(--el-text-color-primary);
            font-size: 14px;
            border-radius: 4px;
            transition: background-color var(--el-transition-duration);
            cursor: pointer;
            .nav-menu-settings__arrow {
                margin-left: auto;
                color: var(--el-text-color-secondary);
                font-size: 12px;
            }
        }
        .nav-menu-settings__item:hover {
            background-color: var(--el-menu-hover-bg-color);
        }

        .nav-menu-settings__item--danger {
            color: var(--el-color-danger);
        }

        .nav-menu-settings__item--danger:hover {
            background-color: rgba(245, 108, 108, 0.18);
        }
    }

    .nav-menu-support {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .nav-menu-support__search {
            padding: 10px 12px;
            border-radius: 8px;
            background: var(--el-fill-color-light);
            color: var(--el-text-color-secondary);
            font-size: 12px;
            font-weight: 500;
            line-height: 1.2;
        }

        .nav-menu-support__heading {
            padding: 4px 12px 0;
            font-size: 13px;
            font-weight: 700;
            color: var(--el-text-color-primary);
        }

        .nav-menu-support__section {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .nav-menu-support__title {
            padding: 0 12px;
            font-size: 11px;
            font-weight: 600;
            color: var(--el-text-color-secondary);
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
    }

    .nav-menu-theme {
        display: flex;
        flex-direction: column;
        gap: 2px;
        .nav-menu-theme__item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            border: none;
            background: transparent;
            color: var(--el-text-color-primary);
            font-size: 13px;
            border-radius: 6px;
            transition: background-color var(--el-transition-duration);
            cursor: pointer;
            .nav-menu-theme__check {
                font-size: 12px;
                color: var(--el-color-primary);
                margin-left: 10px;
            }
        }
        .nav-menu-theme__item:hover,
        .nav-menu-theme__item.is-active {
            background-color: var(--el-menu-hover-bg-color);
        }
    }
</style>
