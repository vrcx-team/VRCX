<template>
    <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarContent class="pt-2">
            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu v-if="navLayoutReady">
                        <template v-for="item in menuItems" :key="item.index">
                            <SidebarMenuItem v-if="!item.children?.length">
                                <SidebarMenuButton
                                    :is-active="activeMenuIndex === item.index"
                                    :tooltip="item.titleIsCustom ? item.title : t(item.title || '')"
                                    @click="handleMenuItemClick(item)">
                                    <i
                                        :class="item.icon"
                                        class="inline-flex size-6 items-center justify-center text-lg" />
                                    <span v-show="!isCollapsed">{{
                                        item.titleIsCustom ? item.title : t(item.title || '')
                                    }}</span>
                                    <span v-if="isNavItemNotified(item)" class="notify-dot" aria-hidden="true"></span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem v-else>
                                <DropdownMenu
                                    v-if="isCollapsed"
                                    :open="collapsedDropdownOpenId === item.index"
                                    @update:open="(value) => handleCollapsedDropdownOpenChange(item.index, value)">
                                    <DropdownMenuTrigger as-child>
                                        <SidebarMenuButton
                                            :is-active="item.children?.some((e) => e.index === activeMenuIndex)"
                                            :tooltip="item.titleIsCustom ? item.title : t(item.title || '')">
                                            <i
                                                :class="item.icon"
                                                class="inline-flex size-6 items-center justify-center text-lg" />
                                            <span v-show="!isCollapsed">{{
                                                item.titleIsCustom ? item.title : t(item.title || '')
                                            }}</span>
                                            <span
                                                v-if="isNavItemNotified(item)"
                                                class="notify-dot"
                                                aria-hidden="true"></span>
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="right" align="start" class="w-56">
                                        <DropdownMenuItem
                                            v-for="entry in item.children"
                                            :key="entry.index"
                                            @select="(event) => handleCollapsedSubmenuSelect(event, entry, item.index)">
                                            <i
                                                v-if="entry.icon"
                                                :class="entry.icon"
                                                class="inline-flex size-4 items-center justify-center text-base" />
                                            <span>{{ t(entry.label) }}</span
                                            ><span
                                                v-if="isEntryNotified(entry)"
                                                class="notify-dot left-6!"
                                                aria-hidden="true"></span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Collapsible
                                    v-else
                                    class="group/collapsible"
                                    :default-open="
                                        activeMenuIndex && item.children?.some((e) => e.index === activeMenuIndex)
                                    ">
                                    <template #default="{ open }">
                                        <CollapsibleTrigger as-child>
                                            <SidebarMenuButton
                                                :is-active="item.children?.some((e) => e.index === activeMenuIndex)"
                                                :tooltip="item.titleIsCustom ? item.title : t(item.title || '')">
                                                <i
                                                    :class="item.icon"
                                                    class="inline-flex size-6 items-center justify-center text-lg" />
                                                <span v-show="!isCollapsed">{{
                                                    item.titleIsCustom ? item.title : t(item.title || '')
                                                }}</span>
                                                <span
                                                    v-if="isNavItemNotified(item)"
                                                    class="notify-dot left-1!"
                                                    aria-hidden="true"></span>
                                                <ChevronRight
                                                    v-show="!isCollapsed"
                                                    class="ml-auto transition-transform"
                                                    :class="open ? 'rotate-90' : ''" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                <SidebarMenuSubItem v-for="entry in item.children" :key="entry.index">
                                                    <SidebarMenuSubButton
                                                        :is-active="activeMenuIndex === entry.index"
                                                        @click="handleSubmenuClick(entry, item.index)">
                                                        <i
                                                            v-if="entry.icon"
                                                            :class="entry.icon"
                                                            class="inline-flex size-5 items-center justify-center text-base" />
                                                        <span>{{ t(entry.label) }}</span>
                                                        <span
                                                            v-if="isEntryNotified(entry)"
                                                            class="notify-dot left-0.75!"
                                                            aria-hidden="true"></span>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </template>
                                </Collapsible>
                            </SidebarMenuItem>
                        </template>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>

        <SidebarFooter class="px-2 py-3">
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <SidebarMenuButton :tooltip="t('nav_tooltip.help_support')">
                                <i class="ri-question-line inline-flex size-6 items-center justify-center text-lg" />
                                <span v-show="!isCollapsed">{{ t('nav_tooltip.help_support') }}</span>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" class="w-56">
                            <DropdownMenuItem @click="showChangeLogDialog">
                                <span>{{ t('nav_menu.whats_new') }}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{{ t('nav_menu.resources') }}</DropdownMenuLabel>
                            <DropdownMenuItem @click="handleSupportLink('wiki')">
                                <span>{{ t('nav_menu.wiki') }}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{{ t('nav_menu.get_help') }}</DropdownMenuLabel>
                            <DropdownMenuItem @click="handleSupportLink('github')">
                                <span>{{ t('nav_menu.github') }}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem @click="handleSupportLink('discord')">
                                <span>{{ t('nav_menu.discord') }}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>

                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <SidebarMenuButton :tooltip="t('nav_tooltip.manage')">
                                <span class="relative inline-flex size-6 items-center justify-center">
                                    <i class="ri-settings-3-line text-lg" />
                                    <span
                                        v-if="pendingVRCXUpdate || pendingVRCXInstall"
                                        class="absolute top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                                </span>
                                <span v-show="!isCollapsed">{{ t('nav_tooltip.manage') }}</span>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" class="w-54">
                            <div class="flex items-center gap-2 px-2 py-1.5">
                                <img class="h-6 w-6 cursor-pointer" :src="vrcxLogo" alt="VRCX" @click="openGithub" />
                                <div class="flex min-w-0 flex-col">
                                    <button
                                        type="button"
                                        class="text-left text-sm font-medium truncate flex items-center gap-1"
                                        @click="openGithub">
                                        VRCX
                                        <Heart class="text-primary fill-current stroke-none" />
                                    </button>
                                    <span class="text-xs text-muted-foreground">{{ version }}</span>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                v-if="pendingVRCXUpdate || pendingVRCXInstall"
                                @click="showVRCXUpdateDialog">
                                <span>{{ t('nav_menu.update_available') }}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator v-if="pendingVRCXUpdate || pendingVRCXInstall" />
                            <DropdownMenuItem @click="handleSettingsClick">
                                <span>{{ t('nav_tooltip.settings') }}</span>
                            </DropdownMenuItem>

                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <span>{{ t('view.settings.appearance.appearance.theme_mode') }}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent side="right" align="start" class="w-54">
                                    <DropdownMenuCheckboxItem
                                        v-for="theme in themes"
                                        :key="theme"
                                        :model-value="themeMode === theme"
                                        indicator-position="right"
                                        @select="handleThemeSelect(theme)">
                                        <span>{{ themeDisplayName(theme) }}</span>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel class="px-2 py-2 font-normal">
                                        <div class="flex items-center justify-around">
                                            <TooltipWrapper
                                                v-for="theme in themeColors"
                                                :key="theme.key"
                                                side="top"
                                                :content="themeColorDisplayName(theme)"
                                                :delay-duration="600">
                                                <button
                                                    type="button"
                                                    :disabled="isApplyingThemeColor"
                                                    :aria-pressed="currentThemeColor === theme.key"
                                                    :aria-label="themeColorDisplayName(theme)"
                                                    :title="themeColorDisplayName(theme)"
                                                    @click="handleThemeColorSelect(theme)"
                                                    class="h-3.5 w-3.5 shrink-0 rounded-sm"
                                                    :class="currentThemeColor === theme.key ? 'ring-1 --ring' : ''"
                                                    :style="{ backgroundColor: theme.swatch }"></button>
                                            </TooltipWrapper>
                                        </div>
                                    </DropdownMenuLabel>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <span>{{ t('view.settings.appearance.appearance.table_density') }}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent side="right" align="start" class="w-54">
                                    <DropdownMenuCheckboxItem
                                        :model-value="tableDensity === 'standard'"
                                        indicator-position="right"
                                        @select="handleTableDensitySelect('standard')">
                                        <span>{{
                                            t('view.settings.appearance.appearance.table_density_comfortable')
                                        }}</span>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        :model-value="tableDensity === 'comfortable'"
                                        indicator-position="right"
                                        @select="handleTableDensitySelect('comfortable')">
                                        <span>{{
                                            t('view.settings.appearance.appearance.table_density_standard')
                                        }}</span>
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        :model-value="tableDensity === 'compact'"
                                        indicator-position="right"
                                        @select="handleTableDensitySelect('compact')">
                                        <span>{{
                                            t('view.settings.appearance.appearance.table_density_compact')
                                        }}</span>
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem @click="handleOpenCustomNavDialog">
                                <span>{{ t('nav_menu.custom_nav.header') }}</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" @click="handleLogoutClick">
                                <span>{{ t('dialog.user.actions.logout') }}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>

                <SidebarMenuItem>
                    <SidebarMenuButton :tooltip="t('nav_tooltip.toggle_theme')" @click="handleThemeToggle">
                        <i
                            :class="isDarkMode ? 'ri-moon-line' : 'ri-sun-line'"
                            class="inline-flex size-6 items-center justify-center text-[19px]" />
                        <span v-show="!isCollapsed">{{ t('nav_tooltip.toggle_theme') }}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                    <SidebarMenuButton
                        :tooltip="isCollapsed ? t('nav_tooltip.expand_menu') : t('nav_tooltip.collapse_menu')"
                        @click="toggleNavCollapse">
                        <i class="ri-side-bar-line inline-flex size-6 items-center justify-center text-[19px]" />
                        <span v-show="!isCollapsed">{{ t('nav_tooltip.collapse_menu') }}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>

    <CustomNavDialog
        v-model:visible="customNavDialogVisible"
        :layout="navLayout"
        @save="handleCustomNavSave"
        @reset="handleCustomNavReset" />
</template>

<script setup>
    import {
        Sidebar,
        SidebarContent,
        SidebarFooter,
        SidebarGroup,
        SidebarGroupContent,
        SidebarMenu,
        SidebarMenuButton,
        SidebarMenuItem,
        SidebarMenuSub,
        SidebarMenuSubButton,
        SidebarMenuSubItem
    } from '@/components/ui/sidebar';
    import {
        DropdownMenu,
        DropdownMenuCheckboxItem,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
    import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
    import { ChevronRight, Heart } from 'lucide-vue-next';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';
    import { useThemeColor } from '@/shared/utils/base/ui';

    import dayjs from 'dayjs';

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
    const { pendingVRCXUpdate, pendingVRCXInstall, appVersion } = storeToRefs(VRCXUpdaterStore);
    const { showVRCXUpdateDialog, showChangeLogDialog } = VRCXUpdaterStore;
    const uiStore = useUiStore();
    const { notifiedMenus } = storeToRefs(uiStore);
    const { directAccessPaste } = useSearchStore();
    const { logout } = useAuthStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { themeMode, tableDensity, isDarkMode, isNavCollapsed: isCollapsed } = storeToRefs(appearanceSettingsStore);
    const navLayout = ref([]);
    const navLayoutReady = ref(false);
    const collapsedDropdownOpenId = ref(null);

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
    const { themeColors, currentThemeColor, isApplyingThemeColor, applyThemeColor, initThemeColor } = useThemeColor();

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

    watch(
        () => isCollapsed.value,
        (value) => {
            if (!value) {
                collapsedDropdownOpenId.value = null;
            }
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

    const themeColorDisplayName = (theme) => {
        if (!theme) {
            return '';
        }
        const i18nKey = `view.settings.appearance.theme_color.${theme.key}`;
        const translated = t(i18nKey);
        if (translated !== i18nKey) {
            return translated;
        }
        return theme.label || theme.key;
    };

    const handleSettingsClick = () => {
        router.push({ name: 'settings' });
    };

    const handleLogoutClick = () => {
        logout();
    };

    const handleThemeSelect = (theme) => {
        appearanceSettingsStore.setThemeMode(theme);
    };

    const handleThemeToggle = () => {
        appearanceSettingsStore.toggleThemeMode();
    };

    const handleTableDensitySelect = (density) => {
        appearanceSettingsStore.setTableDensity(density);
    };

    const handleThemeColorSelect = async (theme) => {
        if (!theme) {
            return;
        }
        await applyThemeColor(theme.key);
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
        if (entry.index) {
            targets.push(entry.index);
        }
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

    const triggerNavAction = (entry, navIndex = entry?.index) => {
        if (!entry) {
            return;
        }

        if (entry.action === 'direct-access') {
            directAccessPaste();
            return;
        }

        if (entry.routeName) {
            handleRouteChange(entry.routeName, navIndex);
            return;
        }

        if (entry.path) {
            router.push(entry.path);
        }
    };

    const handleRouteChange = (routeName, navIndex = routeName) => {
        if (!routeName) {
            return;
        }
        router.push({ name: routeName });
    };

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

    const handleCollapsedDropdownOpenChange = (index, value) => {
        collapsedDropdownOpenId.value = value ? index : null;
    };

    const handleCollapsedSubmenuSelect = (event, entry, index) => {
        if (event?.preventDefault) {
            event.preventDefault();
        }
        handleSubmenuClick(entry, index);
    };

    const handleMenuItemClick = (item) => {
        triggerNavAction(item, item?.index);
    };

    const toggleNavCollapse = () => {
        appearanceSettingsStore.toggleNavCollapsed();
    };

    onMounted(async () => {
        await initThemeColor();
        await loadNavMenuConfig();
    });
</script>

<style scoped>
    .notify {
        position: relative;
    }

    .notify-dot {
        position: absolute;
        top: 6px;
        right: 3px;
        width: 5px;
        height: 5px;
        background-color: #ef4444;
        border-radius: 50%;
        transform: translateY(-50%);
    }
</style>
