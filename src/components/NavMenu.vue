<template>
    <div class="x-menu-container nav-menu-container">
        <template v-if="navLayoutReady">
            <div>
                <div v-if="updateInProgress" class="pending-update" @click="showVRCXUpdateDialog">
                    <el-progress
                        type="circle"
                        :width="50"
                        :stroke-width="3"
                        :percentage="updateProgress"
                        :format="updateProgressText"
                        style="padding: 7px"></el-progress>
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

                <el-menu collapse :default-active="activeMenuIndex" :collapse-transition="false" ref="navMenuRef">
                    <el-popover
                        v-for="item in navMenuItems"
                        :disabled="!item.entries?.length"
                        :key="item.index"
                        :ref="(el) => setNavPopoverRef(el, item.index)"
                        placement="right-start"
                        trigger="hover"
                        :hide-after="isSteamVRRunning ? 400 : 150"
                        :show-arrow="false"
                        :offset="0"
                        :width="navPopoverWidth"
                        transition="nav-menu-slide"
                        @before-enter="handleSubMenuBeforeEnter()"
                        :popper-style="navPopoverStyle"
                        popper-class="nav-menu-popover-popper">
                        <div class="nav-menu-popover">
                            <div class="nav-menu-popover__header">
                                <i :class="item.icon"></i>
                                <span>{{ item.titleIsCustom ? item.title : t(item.title || '') }}</span>
                            </div>

                            <div class="nav-menu-popover__menu">
                                <button
                                    v-for="entry in item.entries"
                                    :key="entry.label"
                                    type="button"
                                    :class="['nav-menu-popover__menu-item', { notify: isEntryNotified(entry) }]"
                                    @click="handleSubmenuClick(entry, item.index)">
                                    <i v-if="entry.icon" :class="entry.icon" class="nav-menu-popover__menu-icon"></i>
                                    <span class="nav-menu-popover__menu-label">{{ t(entry.label) }}</span>
                                </button>
                            </div>
                        </div>
                        <template #reference>
                            <el-menu-item
                                :index="item.index"
                                :class="{ notify: isNavItemNotified(item) }"
                                @click="handleMenuItemClick(item)">
                                <i :class="item.icon"></i>
                                <template #title v-if="item.tooltip">
                                    <span>{{ item.tooltipIsCustom ? item.tooltip : t(item.tooltip) }}</span>
                                </template>
                            </el-menu-item>
                        </template>
                    </el-popover>
                </el-menu>
                <el-divider style="width: calc(100% - 18px); margin-left: 9px"></el-divider>
                <NativeTooltip :content="t('prompt.direct_access_omni.header')" placement="right">
                    <div class="bottom-button" @click="directAccessPaste"><i class="ri-compass-3-line"></i></div>
                </NativeTooltip>
            </div>

            <div class="nav-menu-container-bottom">
                <NativeTooltip v-if="branch === 'Nightly'" :show-after="150" :content="'Feedback'" placement="right">
                    <div
                        class="bottom-button"
                        id="feedback"
                        @click="!sentryErrorReporting && setSentryErrorReporting()">
                        <i class="ri-feedback-line"></i>
                    </div>
                </NativeTooltip>

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
                            <NativeTooltip :show-after="150" :content="t('nav_tooltip.help_support')" placement="right">
                                <div class="bottom-button">
                                    <i class="ri-question-line"></i>
                                </div>
                            </NativeTooltip>
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
                        <button type="button" class="nav-menu-settings__item" @click="handleOpenCustomNavDialog">
                            <span>{{ t('nav_menu.custom_nav.header') }}</span>
                        </button>
                        <el-popover
                            v-model:visible="themeMenuVisible"
                            placement="right-start"
                            trigger="hover"
                            popper-style="padding:4px;border-radius:8px;"
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
        </template>
    </div>
    <CustomNavDialog
        v-model:visible="customNavDialogVisible"
        :layout="navLayout"
        :default-folder-icon="DEFAULT_FOLDER_ICON"
        @save="handleCustomNavSave"
        @reset="handleCustomNavReset" />
</template>

<script setup>
    import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
    import { ElMessageBox, dayjs } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useAuthStore,
        useGameStore,
        useSearchStore,
        useUiStore,
        useVRCXUpdaterStore
    } from '../stores';
    import { THEME_CONFIG, links, navDefinitions } from '../shared/constants';
    import { getSentry } from '../plugin';
    import { openExternalLink } from '../shared/utils';

    import configRepository from '../service/config';

    import 'remixicon/fonts/remixicon.css';

    const CustomNavDialog = defineAsyncComponent(() => import('./dialogs/CustomNavDialog.vue'));

    const { t, locale } = useI18n();
    const router = useRouter();

    const createDefaultNavLayout = () => [
        { type: 'item', key: 'feed' },
        { type: 'item', key: 'friends-locations' },
        { type: 'item', key: 'game-log' },
        { type: 'item', key: 'player-list' },
        { type: 'item', key: 'search' },
        {
            type: 'folder',
            id: 'default-folder-favorites',
            nameKey: 'nav_tooltip.favorites',
            name: t('nav_tooltip.favorites'),
            icon: 'ri-star-line',
            items: ['favorite-friends', 'favorite-worlds', 'favorite-avatars']
        },
        {
            type: 'folder',
            id: 'default-folder-social',
            nameKey: 'nav_tooltip.social',
            name: t('nav_tooltip.social'),
            icon: 'ri-group-line',
            items: ['friend-log', 'friend-list', 'moderation']
        },
        { type: 'item', key: 'notification' },
        { type: 'item', key: 'charts' },
        { type: 'item', key: 'tools' }
    ];

    const navDefinitionMap = new Map(navDefinitions.map((item) => [item.key, item]));
    const DEFAULT_FOLDER_ICON = 'ri-menu-fold-line';

    const navPopoverWidth = 250;
    const navPopoverStyle = {
        zIndex: 500,
        borderRadius: '0',
        border: '1px solid var(--el-border-color)',
        borderLeft: 'none',
        borderBottom: 'none',
        borderTop: 'none',
        boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
        padding: '0',
        background: 'var(--el-bg-color)',
        height: '100vh'
    };

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
    const { isSteamVRRunning } = storeToRefs(useGameStore());

    const settingsMenuVisible = ref(false);
    const themeMenuVisible = ref(false);
    const supportMenuVisible = ref(false);
    const navMenuRef = ref(null);
    const navPopoverRefs = new Map();
    const navLayout = ref([]);
    const navLayoutReady = ref(false);

    const navMenuItems = computed(() => {
        const items = [];
        navLayout.value.forEach((entry) => {
            if (entry.type === 'item') {
                const definition = navDefinitionMap.get(entry.key);
                if (!definition) {
                    return;
                }
                items.push({
                    ...definition,
                    index: definition.key,
                    tooltipIsCustom: false,
                    titleIsCustom: false
                });
                return;
            }

            if (entry.type === 'folder') {
                const folderDefinitions = (entry.items || []).map((key) => navDefinitionMap.get(key)).filter(Boolean);

                if (folderDefinitions.length < 2) {
                    folderDefinitions.forEach((definition) => {
                        items.push({
                            ...definition,
                            index: definition.key,
                            tooltipIsCustom: false,
                            titleIsCustom: false
                        });
                    });
                    return;
                }

                const folderEntries = folderDefinitions.map((definition) => ({
                    label: definition.labelKey,
                    routeName: definition.routeName,
                    key: definition.key,
                    icon: definition.icon
                }));

                items.push({
                    index: entry.id,
                    icon: entry.icon || DEFAULT_FOLDER_ICON,
                    tooltip: entry.name?.trim() || t('nav_menu.custom_nav.folder_name_placeholder'),
                    tooltipIsCustom: true,
                    title: entry.name?.trim() || t('nav_menu.custom_nav.folder_name_placeholder'),
                    titleIsCustom: true,
                    entries: folderEntries
                });
            }
        });
        return items;
    });

    const folderCyclePointers = new Map();

    const navigateToFolderEntry = (folderIndex, entry) => {
        if (!entry) {
            return;
        }
        if (entry.routeName) {
            handleRouteChange(entry.routeName, folderIndex);
            return;
        }
        if (entry.path) {
            router.push(entry.path);
            if (folderIndex) {
                navMenuRef.value?.updateActiveIndex(folderIndex);
            }
        }
    };

    const handleFolderCycleNavigation = (item) => {
        if (!item?.entries?.length) {
            return;
        }
        const entries = item.entries.filter((entry) => Boolean(entry?.routeName || entry?.path));
        if (!entries.length) {
            return;
        }
        let pointer = folderCyclePointers.get(item.index) ?? 0;
        if (pointer >= entries.length || pointer < 0) {
            pointer = 0;
        }
        const entry = entries[pointer];
        folderCyclePointers.set(item.index, (pointer + 1) % entries.length);
        navigateToFolderEntry(item.index, entry);
    };

    const activeMenuIndex = computed(() => {
        const currentRouteName = router.currentRoute.value?.name;
        if (!currentRouteName) {
            const firstEntry = navLayout.value[0];
            if (!firstEntry) {
                return 'feed';
            }
            return firstEntry.type === 'folder' ? firstEntry.id : firstEntry.key;
        }

        for (const entry of navLayout.value) {
            if (entry.type === 'item' && entry.key === currentRouteName) {
                return entry.key;
            }
            if (entry.type === 'folder' && entry.items?.includes(currentRouteName)) {
                return entry.id;
            }
        }

        const fallback = navLayout.value[0];
        if (!fallback) {
            return 'feed';
        }
        return fallback.type === 'folder' ? fallback.id : fallback.key;
    });

    const version = computed(() => appVersion.value?.split('VRCX ')?.[1] || '-');
    const vrcxLogo = new URL('../../images/VRCX.png', import.meta.url).href;

    const themes = computed(() => Object.keys(THEME_CONFIG));

    watch(
        () => activeMenuIndex.value,
        (value) => {
            if (value) {
                navMenuRef.value?.updateActiveIndex(value);
            }
        },
        { immediate: true }
    );

    watch(
        () => locale.value,
        () => {
            if (!navLayoutReady.value) {
                return;
            }
            navLayout.value = navLayout.value.map((entry) => {
                if (entry.type === 'folder' && entry.nameKey) {
                    return {
                        ...entry,
                        name: t(entry.nameKey)
                    };
                }
                return entry;
            });
        }
    );

    const generateFolderId = () => `nav-folder-${dayjs().toISOString()}-${Math.random().toString().slice(2, 4)}`;

    const sanitizeLayout = (layout) => {
        const usedKeys = new Set();
        const normalized = [];

        const appendItemEntry = (key, target = normalized) => {
            if (!key || usedKeys.has(key) || !navDefinitionMap.has(key)) {
                return;
            }
            target.push({ type: 'item', key });
            usedKeys.add(key);
        };

        if (Array.isArray(layout)) {
            layout.forEach((entry) => {
                if (entry?.type === 'item') {
                    appendItemEntry(entry.key);
                    return;
                }

                if (entry?.type === 'folder') {
                    const folderItems = [];
                    (entry.items || []).forEach((key) => {
                        if (!key || usedKeys.has(key) || !navDefinitionMap.has(key)) {
                            return;
                        }
                        folderItems.push(key);
                        usedKeys.add(key);
                    });

                    if (folderItems.length >= 2) {
                        const folderNameKey = entry.nameKey || null;
                        const folderName = folderNameKey ? t(folderNameKey) : entry.name || '';
                        normalized.push({
                            type: 'folder',
                            id: entry.id || generateFolderId(),
                            name: folderName,
                            nameKey: folderNameKey,
                            icon: entry.icon || DEFAULT_FOLDER_ICON,
                            items: folderItems
                        });
                    } else {
                        folderItems.forEach((key) => appendItemEntry(key));
                    }
                }
            });
        }

        navDefinitions.forEach((item) => {
            if (!usedKeys.has(item.key)) {
                normalized.push({ type: 'item', key: item.key });
                usedKeys.add(item.key);
            }
        });

        return normalized;
    };

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

    const customNavDialogVisible = ref(false);

    const saveNavLayout = async (layout) => {
        try {
            await configRepository.setString(
                'VRCX_customNavMenuLayoutList',
                JSON.stringify({
                    layout
                })
            );
        } catch (error) {
            console.error('Failed to save custom nav', error);
        }
    };

    const handleOpenCustomNavDialog = () => {
        themeMenuVisible.value = false;
        supportMenuVisible.value = false;
        settingsMenuVisible.value = false;
        customNavDialogVisible.value = true;
    };

    const handleCustomNavSave = async (layout) => {
        const sanitized = sanitizeLayout(layout);
        navLayout.value = sanitized;
        await saveNavLayout(sanitized);
        customNavDialogVisible.value = false;
    };

    const handleCustomNavReset = () => {
        ElMessageBox.confirm(t('nav_menu.custom_nav.restore_default_confirm'), {
            type: 'warning',
            confirmButtonText: t('nav_menu.custom_nav.restore_default'),
            cancelButtonText: t('nav_menu.custom_nav.cancel')
        })
            .then(async () => {
                const defaults = sanitizeLayout(createDefaultNavLayout());
                navLayout.value = defaults;
                await saveNavLayout(defaults);
                customNavDialogVisible.value = false;
            })
            .catch(() => {});
    };

    const loadNavMenuConfig = async () => {
        let layoutData = null;
        try {
            const storedValue = await configRepository.getString('VRCX_customNavMenuLayoutList');
            if (storedValue) {
                const parsed = JSON.parse(storedValue);
                if (Array.isArray(parsed)) {
                    layoutData = parsed;
                } else if (Array.isArray(parsed?.layout)) {
                    layoutData = parsed.layout;
                }
            }
        } catch (error) {
            console.error('Failed to load custom nav', error);
        } finally {
            const fallbackLayout = layoutData?.length ? layoutData : createDefaultNavLayout();
            navLayout.value = sanitizeLayout(fallbackLayout);
            navLayoutReady.value = true;
            navigateToFirstNavEntry();
        }
    };

    const handleSupportLink = (id) => {
        supportMenuVisible.value = false;
        const target = links[id];
        if (target) {
            openExternalLink(target);
        }
    };

    const isEntryNotified = (entry) => {
        if (!entry) {
            return false;
        }
        const targets = [];
        if (entry.routeName) {
            targets.push(entry.routeName);
        }
        if (entry.path) {
            const lastSegment = entry.path.split('/').pop();
            if (lastSegment) {
                targets.push(lastSegment);
            }
        }
        return targets.some((key) => notifiedMenus.value.includes(key));
    };

    const isNavItemNotified = (item) => {
        if (!item) {
            return false;
        }
        if (notifiedMenus.value.includes(item.index)) {
            return true;
        }
        if (item.entries?.length) {
            return item.entries.some((entry) => isEntryNotified(entry));
        }
        return false;
    };

    const setNavPopoverRef = (el, index) => {
        if (!index) {
            return;
        }
        if (el) {
            navPopoverRefs.set(index, el);
        } else {
            navPopoverRefs.delete(index);
        }
    };

    const closeNavPopover = (index) => {
        navPopoverRefs.get(index)?.hide?.();
    };

    const handleSubmenuClick = (entry, index) => {
        if (!entry) {
            return;
        }
        const entries = navMenuItems.value.find((item) => item.index === index)?.entries || [];
        const indexOfEntry = entries.findIndex((e) => e.label === entry.label);
        folderCyclePointers.set(index, (indexOfEntry + 1) % entries.length);

        if (entry.routeName) {
            handleRouteChange(entry.routeName, index || entry.routeName);
        } else if (entry.path) {
            router.push(entry.path);
            if (index) {
                navMenuRef.value?.updateActiveIndex(index);
            }
        }
        closeNavPopover(index);
    };

    const handleSubMenuBeforeEnter = () => {
        settingsMenuVisible.value = false;
        supportMenuVisible.value = false;
        themeMenuVisible.value = false;
    };

    const handleRouteChange = (routeName, navIndex = routeName) => {
        if (!routeName) {
            return;
        }
        router.push({ name: routeName });
        if (navIndex) {
            navMenuRef.value?.updateActiveIndex(navIndex);
        }
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

    const getFirstNavRoute = (layout) => {
        for (const entry of layout) {
            if (entry.type === 'item') {
                return entry.key;
            }
            if (entry.type === 'folder' && entry.items?.length) {
                return entry.items[0];
            }
        }
        return null;
    };

    let hasNavigatedToInitialRoute = false;
    const navigateToFirstNavEntry = () => {
        if (hasNavigatedToInitialRoute) {
            return;
        }
        const firstRoute = getFirstNavRoute(navLayout.value);
        if (!firstRoute) {
            return;
        }
        hasNavigatedToInitialRoute = true;
        if (router.currentRoute.value?.name !== firstRoute) {
            router.push({ name: firstRoute }).catch(() => {});
        }
    };

    const handleMenuItemClick = (item) => {
        if (!item) {
            return;
        }
        if (item.entries?.length) {
            handleFolderCycleNavigation(item);
            return;
        }
        handleRouteChange(item.routeName, item.index);
    };

    onMounted(async () => {
        await loadNavMenuConfig();

        if (!NIGHTLY || !sentryErrorReporting.value) return;

        try {
            const Sentry = await getSentry();

            const feedback = Sentry.getFeedback();
            feedback?.attachTo(document.getElementById('feedback'));
        } catch (error) {
            console.error('Error setting up Sentry feedback:', error);
        }
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
        z-index: 600;
        background-color: var(--el-bg-color);
        border-right: 1px solid var(--el-border-color);
        box-shadow: none;
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

    .nav-menu-popover {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-width: 240px;
        background-color: var(--el-bg-color);
        border-left: 1px solid var(--el-border-color);
        overflow: hidden;

        .nav-menu-popover__header {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            min-height: 52px;
            padding: 0 20px;
            border-bottom: 1px solid var(--el-border-color-light, var(--el-border-color));
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

        .nav-menu-popover__header i {
            font-size: 18px;
            color: var(--el-color-primary);
        }

        .nav-menu-popover__menu {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 6px;
            padding: 12px 12px 16px;
            overflow-y: auto;
            scrollbar-width: thin;
        }

        .nav-menu-popover__menu::-webkit-scrollbar {
            width: 6px;
        }

        .nav-menu-popover__menu::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.18);
            border-radius: 3px;
        }

        .nav-menu-popover__menu::-webkit-scrollbar-track {
            background: transparent;
        }

        .nav-menu-popover__menu-item {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 10px 12px;
            border: none;
            background: transparent;
            text-align: left;
            color: var(--el-text-color-primary);
            font-size: 13px;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color var(--el-transition-duration);
        }

        .nav-menu-popover__menu-item.notify::after {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--el-text-color-primary);
            margin-left: auto;
        }

        .nav-menu-popover__menu-item:hover {
            background-color: var(--el-menu-hover-bg-color);
        }

        .nav-menu-popover__menu-item:focus-visible {
            outline: 2px solid var(--el-color-primary);
            outline-offset: 2px;
        }

        .nav-menu-popover__menu-icon {
            font-size: 16px;
            color: var(--el-text-color-secondary);
        }

        .nav-menu-popover__menu-label {
            font-weight: 600;
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

    :global(.nav-menu-slide-enter-active),
    :global(.nav-menu-slide-leave-active) {
        transition:
            opacity 0.1s ease,
            transform 0.1s ease;
        transform-origin: left center;
    }

    :global(.nav-menu-slide-enter-from),
    :global(.nav-menu-slide-leave-to) {
        opacity: 0;
        transform: translateX(-12px);
    }
</style>
