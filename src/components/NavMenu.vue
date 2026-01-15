<template>
    <div class="x-menu-container nav-menu-container" :class="{ 'is-collapsed': isCollapsed }">
        <template v-if="navLayoutReady">
            <div class="nav-menu-body mt-5">
                <div v-if="pendingVRCXUpdate || pendingVRCXInstall" class="pending-update">
                    <Button
                        variant="ghost"
                        size="icon"
                        class="hover:bg-transparent"
                        style="font-size: 19px; height: 36px; margin: 10px"
                        @click="showVRCXUpdateDialog">
                        <span class="relative inline-flex items-center justify-center">
                            <i class="ri-arrow-down-circle-line text-muted-foreground text-[20px]"></i>
                            <span class="absolute top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        </span>
                        <span v-if="!isCollapsed" class="text-[13px] text-muted-foreground">{{
                            t('nav_menu.update_available')
                        }}</span>
                    </Button>
                </div>

                <el-menu ref="navMenuRef" class="nav-menu" :collapse="isCollapsed" :collapse-transition="false">
                    <template v-for="item in menuItems" :key="item.index">
                        <el-menu-item
                            v-if="!item.children?.length"
                            :index="item.index"
                            :class="{ notify: isNavItemNotified(item) }"
                            @click="handleMenuItemClick(item)">
                            <i :class="item.icon"></i>
                            <template #title>
                                <span>{{ item.titleIsCustom ? item.title : t(item.title || '') }}</span>
                            </template>
                        </el-menu-item>
                        <el-sub-menu v-else :index="item.index">
                            <template #title>
                                <div :class="{ notify: isNavItemNotified(item) }">
                                    <i :class="item.icon"></i>
                                    <span v-show="!isCollapsed">{{
                                        item.titleIsCustom ? item.title : t(item.title || '')
                                    }}</span>
                                </div>
                            </template>
                            <el-menu-item
                                v-for="entry in item.children"
                                :key="entry.index"
                                :index="entry.index"
                                class="pl-9!"
                                :class="{ notify: isEntryNotified(entry) }"
                                @click="handleSubmenuClick(entry, item.index)">
                                <i v-show="entry.icon" :class="entry.icon"></i>
                                <template #title>
                                    <span>{{ t(entry.label) }}</span>
                                </template>
                            </el-menu-item>
                        </el-sub-menu>
                    </template>
                </el-menu>
            </div>

            <div class="nav-menu-container-bottom mb-4">
                <el-popover
                    v-model:visible="supportMenuVisible"
                    placement="right"
                    trigger="click"
                    popper-style="padding:4px;border-radius:8px;"
                    :offset="-10"
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
                            <TooltipWrapper
                                :delay-duration="150"
                                :content="t('nav_tooltip.help_support')"
                                side="right"
                                :disabled="!isCollapsed">
                                <div class="bottom-button">
                                    <i class="ri-question-line"></i>
                                    <span v-show="!isCollapsed" class="bottom-button__label">{{
                                        t('nav_tooltip.help_support')
                                    }}</span>
                                </div>
                            </TooltipWrapper>
                        </div>
                    </template>
                </el-popover>

                <el-popover
                    v-model:visible="settingsMenuVisible"
                    placement="right"
                    trigger="click"
                    popper-style="padding:4px;border-radius:8px;"
                    :offset="6"
                    :show-arrow="false"
                    :width="200"
                    :hide-after="0">
                    <div class="nav-menu-settings">
                        <div class="nav-menu-settings__header">
                            <img class="nav-menu-settings__logo" :src="vrcxLogo" alt="VRCX" @click="openGithub" />
                            <div class="nav-menu-settings__meta">
                                <span class="nav-menu-settings__title" @click="openGithub"
                                    >VRCX
                                    <i class="ri-heart-3-fill nav-menu-settings__heart"></i>
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
                            :offset="8"
                            :width="200"
                            :hide-after="0">
                            <div class="nav-menu-theme">
                                <button
                                    v-for="theme in themes"
                                    :key="theme"
                                    type="button"
                                    class="nav-menu-theme__item"
                                    :class="{ 'is-active': themeMode === theme }"
                                    @click="handleThemeSelect(theme)">
                                    <span class="nav-menu-theme__label">{{ themeDisplayName(theme) }}</span>
                                    <span v-if="themeMode === theme" class="nav-menu-theme__check">✓</span>
                                </button>

                                <el-divider></el-divider>

                                <el-popover
                                    v-model:visible="themeColorMenuVisible"
                                    placement="right-start"
                                    trigger="hover"
                                    popper-style="padding:4px;border-radius:8px;"
                                    :offset="8"
                                    :width="200"
                                    :show-arrow="false"
                                    :hide-after="0"
                                    :teleported="false">
                                    <div class="nav-menu-theme nav-menu-theme--colors">
                                        <button
                                            v-for="color in colorFamilies"
                                            :key="color.name"
                                            type="button"
                                            class="nav-menu-theme__item"
                                            :class="{ 'is-active': currentPrimary === color.base }"
                                            :disabled="isApplyingPrimaryColor"
                                            @click="handleThemeColorSelect(color)">
                                            <span class="nav-menu-theme__label nav-menu-theme__label--swatch">
                                                <span
                                                    class="nav-menu-theme__swatch"
                                                    :style="{ backgroundColor: color.base }"></span>
                                                <span class="nav-menu-theme__label-text">{{ color.name }}</span>
                                            </span>
                                            <span v-if="currentPrimary === color.base" class="nav-menu-theme__check">
                                                ✓
                                            </span>
                                        </button>
                                    </div>
                                    <template #reference>
                                        <button type="button" class="nav-menu-theme__item" @click.prevent>
                                            <span class="nav-menu-theme__label">{{
                                                t('view.settings.appearance.theme_color.header')
                                            }}</span>
                                            <span class="nav-menu-settings__arrow">›</span>
                                        </button>
                                    </template>
                                </el-popover>
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
                            <span v-show="!isCollapsed" class="bottom-button__label">{{
                                t('nav_tooltip.manage')
                            }}</span>
                        </div>
                    </template>
                </el-popover>
                <TooltipWrapper
                    :delay-duration="150"
                    :content="t('nav_tooltip.expand_menu')"
                    :disabled="!isCollapsed"
                    side="right">
                    <div class="bottom-button" @click="toggleNavCollapse">
                        <i class="ri-side-bar-line"></i>
                        <span v-show="!isCollapsed" class="bottom-button__label">{{
                            t('nav_tooltip.collapse_menu')
                        }}</span>
                    </div>
                </TooltipWrapper>
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
    import { Button } from '@/components/ui/button';
    import { dayjs } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import {
        useAppearanceSettingsStore,
        useAuthStore,
        useModalStore,
        useSearchStore,
        useUiStore,
        useVRCXUpdaterStore
    } from '../stores';
    import { THEME_CONFIG, links, navDefinitions } from '../shared/constants';
    import { openExternalLink } from '../shared/utils';
    import { useThemePrimaryColor } from '../composables/useElementTheme';

    import configRepository from '../service/config';

    const CustomNavDialog = defineAsyncComponent(() => import('./dialogs/CustomNavDialog.vue'));

    const { t, locale } = useI18n();
    const router = useRouter();
    const modalStore = useModalStore();

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
        { type: 'item', key: 'tools' },
        { type: 'item', key: 'direct-access' }
    ];

    const navDefinitionMap = new Map(navDefinitions.map((item) => [item.key, item]));
    const DEFAULT_FOLDER_ICON = 'ri-menu-fold-line';

    const VRCXUpdaterStore = useVRCXUpdaterStore();
    const { pendingVRCXUpdate, pendingVRCXInstall, updateInProgress, updateProgress, branch, appVersion } =
        storeToRefs(VRCXUpdaterStore);
    const { showVRCXUpdateDialog, updateProgressText, showChangeLogDialog } = VRCXUpdaterStore;
    const uiStore = useUiStore();
    const { notifiedMenus } = storeToRefs(uiStore);
    const { directAccessPaste } = useSearchStore();
    const { logout } = useAuthStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { themeMode, isNavCollapsed: isCollapsed } = storeToRefs(appearanceSettingsStore);
    const settingsMenuVisible = ref(false);
    const themeMenuVisible = ref(false);
    const themeColorMenuVisible = ref(false);
    const supportMenuVisible = ref(false);
    const navMenuRef = ref(null);
    const navLayout = ref([]);
    const navLayoutReady = ref(false);

    const menuItems = computed(() => {
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
                    title: definition.tooltip || definition.labelKey,
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
                            titleIsCustom: false
                        });
                    });
                    return;
                }

                const folderEntries = folderDefinitions.map((definition) => ({
                    label: definition.labelKey,
                    routeName: definition.routeName,
                    index: definition.key,
                    icon: definition.icon,
                    action: definition.action
                }));

                items.push({
                    index: entry.id,
                    icon: entry.icon || DEFAULT_FOLDER_ICON,
                    title: entry.name?.trim() || t('nav_menu.custom_nav.folder_name_placeholder'),
                    titleIsCustom: true,
                    children: folderEntries
                });
            }
        });
        return items;
    });

    const activeMenuIndex = computed(() => {
        const currentRoute = router.currentRoute.value;
        const currentRouteName = currentRoute?.name;
        const navKey = currentRoute?.meta?.navKey || currentRouteName;
        if (!navKey) {
            return getFirstNavRoute(navLayout.value) || 'feed';
        }

        for (const entry of navLayout.value) {
            if (entry.type === 'item' && entry.key === navKey) {
                return entry.key;
            }
            if (entry.type === 'folder' && entry.items?.includes(navKey)) {
                return navKey;
            }
        }

        return getFirstNavRoute(navLayout.value) || 'feed';
    });

    const version = computed(() => appVersion.value?.split('VRCX ')?.[1] || '-');
    const vrcxLogo = new URL('../../images/VRCX.png', import.meta.url).href;

    const themes = computed(() => Object.keys(THEME_CONFIG));

    const {
        currentPrimary,
        isApplying: isApplyingPrimaryColor,
        applyCustomPrimaryColor,
        initPrimaryColor,
        colorFamilies,
        selectPaletteColor
    } = useThemePrimaryColor();

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

    const themeDisplayName = (themeKey) => {
        const i18nKey = `view.settings.appearance.appearance.theme_mode_${themeKey}`;
        const translated = t(i18nKey);
        if (translated !== i18nKey) {
            return translated;
        }
        return THEME_CONFIG[themeKey]?.name ?? themeKey;
    };

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
        appearanceSettingsStore.setThemeMode(theme);
    };

    const handleThemeColorSelect = async (colorFamily) => {
        await selectPaletteColor(colorFamily);
        themeColorMenuVisible.value = false;
        themeMenuVisible.value = false;
        settingsMenuVisible.value = false;
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
        modalStore
            .confirm({
                description: t('nav_menu.custom_nav.restore_default_confirm'),
                title: t('confirm.title'),
                confirmText: t('nav_menu.custom_nav.restore_default'),
                cancelText: t('nav_menu.custom_nav.cancel')
            })
            .then(async ({ ok }) => {
                if (!ok) return;
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
        if (item.children?.length) {
            return item.children.some((entry) => isEntryNotified(entry));
        }
        return false;
    };

    const closeNavFlyouts = () => {
        settingsMenuVisible.value = false;
        supportMenuVisible.value = false;
        themeMenuVisible.value = false;
        themeColorMenuVisible.value = false;
    };

    const triggerNavAction = (entry, navIndex = entry?.index) => {
        if (!entry) {
            return;
        }

        if (entry.action === 'direct-access') {
            closeNavFlyouts();
            directAccessPaste();
            if (navIndex) {
                navMenuRef.value?.updateActiveIndex(navIndex);
            }
            return;
        }

        if (entry.routeName) {
            handleRouteChange(entry.routeName, navIndex);
            closeNavFlyouts();
            return;
        }

        if (entry.path) {
            router.push(entry.path);
            if (navIndex) {
                navMenuRef.value?.updateActiveIndex(navIndex);
            }
            closeNavFlyouts();
        }
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
            themeColorMenuVisible.value = false;
        }
    });

    watch(supportMenuVisible, (visible) => {
        if (visible) {
            settingsMenuVisible.value = false;
        }
    });

    function getFirstNavRoute(layout) {
        for (const entry of layout) {
            if (entry.type === 'item') {
                const definition = navDefinitionMap.get(entry.key);
                if (definition?.routeName) {
                    return definition.routeName;
                }
            }
            if (entry.type === 'folder' && entry.items?.length) {
                const definition = entry.items.map((key) => navDefinitionMap.get(key)).find((def) => def?.routeName);
                if (definition?.routeName) {
                    return definition.routeName;
                }
            }
        }
        return null;
    }

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

    const handleSubmenuClick = (entry, index) => {
        const navIndex = index || entry?.index;
        triggerNavAction(entry, navIndex);
    };

    const handleMenuItemClick = (item) => {
        triggerNavAction(item, item?.index);
    };

    const toggleNavCollapse = () => {
        appearanceSettingsStore.toggleNavCollapsed();
    };

    onMounted(async () => {
        await initPrimaryColor();
        await loadNavMenuConfig();
    });
</script>

<style scoped>
    :deep(.el-divider) {
        margin: 0;
    }

    .nav-menu-container {
        position: relative;
        width: 100%;
        min-width: 64px;
        height: 100%;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        background-color: var(--el-bg-color-page);
        box-shadow: none;
        backdrop-filter: blur(14px) saturate(130%);
    }

    .nav-menu-body {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden auto;
        align-items: center;
    }

    .nav-menu {
        background: transparent;
        border: 0;
        width: 100%;
    }

    .nav-menu :deep(.el-menu-item),
    .nav-menu :deep(.el-sub-menu__title) {
        height: 46px;
        line-height: 46px;
        display: flex;
        align-items: center;
        column-gap: 10px;
        font-size: 13px;
        padding: 0 20px !important;
    }

    .nav-menu :deep(.el-menu-item i[class*='ri-']),
    .nav-menu :deep(.el-sub-menu__title i[class*='ri-']) {
        font-size: 19px;
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        vertical-align: middle;
        line-height: 1;
        flex-shrink: 0;
    }

    .nav-menu :deep(.el-sub-menu__title > div) {
        display: inline-flex;
        align-items: center;
        gap: 10px;
    }

    .nav-menu :deep(.el-sub-menu__icon-arrow) {
        right: 8px;
    }

    .bottom-button {
        font-size: 19px;
        width: 100%;
        height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        padding: 0 20px;
        text-align: left;
        vertical-align: middle;
        cursor: pointer;
        box-sizing: border-box;
        & > span {
            font-size: 13px;
        }
    }

    .bottom-button i {
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }

    .bottom-button__label {
        font-size: 13px;
        color: var(--el-text-color-regular);
        white-space: nowrap;
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

    .nav-menu-container.is-collapsed .nav-menu :deep(.el-menu-item),
    .nav-menu-container.is-collapsed .nav-menu :deep(.el-sub-menu__title) {
        column-gap: 0;
        justify-content: center;
        padding: 0;
    }

    .nav-menu-container.is-collapsed {
        width: 100%;
    }

    .nav-menu-container.is-collapsed .nav-menu :deep(.el-sub-menu__title > div) {
        gap: 0;
    }

    .nav-menu-container.is-collapsed .bottom-button {
        width: 100%;
        justify-content: center;
        gap: 0;
        padding: 0;
        text-align: center;
    }

    :deep(.el-menu-item .el-menu-tooltip__trigger) {
        justify-content: center;
    }

    :deep(.el-button.is-text:not(.is-disabled):hover) {
        background-color: var(--el-menu-hover-bg-color);
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

            .nav-menu-settings__heart {
                font-size: 14px;
                color: var(--el-color-success);
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
            color: var(--el-text-color-regular);
            font-size: 13px;
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
            background-color: color-mix(in oklch, var(--el-color-danger) 18%, transparent);
        }
    }

    .nav-menu-support {
        display: flex;
        flex-direction: column;
        gap: 8px;

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

        .nav-menu-theme__label--swatch {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }

        .nav-menu-theme__label-text {
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-transform: capitalize;
        }

        .nav-menu-theme__swatch {
            inline-size: 14px;
            block-size: 14px;
            border-radius: 4px;
            border: 1px solid var(--el-border-color-lighter);
            flex: none;
        }

        .nav-menu-theme__custom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            border-radius: 6px;
        }

        .nav-menu-theme__custom-label {
            font-size: 13px;
            color: var(--el-text-color-regular);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding-right: 10px;
        }
    }

    .nav-menu-theme--colors {
        max-height: 360px;
        overflow: hidden auto;
    }
</style>
