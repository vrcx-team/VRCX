<template>
    <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader v-if="showNewDashboardButton" class="px-2 py-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        :tooltip="t('dashboard.new_dashboard')"
                        class="border border-dashed border-primary/40 text-primary hover:bg-primary/10"
                        @click="handleQuickCreateDashboard">
                        <div class="flex items-center gap-3 pl-1 group-data-[collapsible=icon]:pl-0">
                            <Plus class="size-4" />
                            <span v-show="!isCollapsed">{{ t('dashboard.new_dashboard') }}</span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>

        <ContextMenu>
            <ContextMenuTrigger as-child>
                <SidebarContent class="pt-2" style="container-type: inline-size">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu v-if="navLayoutReady">
                                <template v-for="item in menuItems" :key="item.index">
                                    <SidebarMenuItem v-if="!item.children?.length">
                                        <ContextMenu>
                                            <ContextMenuTrigger as-child>
                                                <SidebarMenuButton
                                                    :is-active="activeMenuIndex === item.index"
                                                    :tooltip="getItemTooltip(item)"
                                                    @click="handleMenuItemClick(item)">
                                                    <i
                                                        :class="item.icon"
                                                        class="inline-flex size-6 items-center justify-center text-lg relative">
                                                        <span
                                                            v-if="isNavItemNotified(item)"
                                                            class="notify-dot-not-collapsed bg-red-500"
                                                            :class="{ '-right-1!': isCollapsed }"
                                                            aria-hidden="true"></span>
                                                    </i>
                                                    <span v-show="!isCollapsed">{{
                                                        item.titleIsCustom ? item.title : t(item.title || '')
                                                    }}</span>
                                                    <span
                                                        v-if="item.action === 'direct-access' && !isCollapsed"
                                                        class="nav-shortcut-hint ml-auto inline-flex items-center gap-0.5">
                                                        <Kbd>{{ isMac ? '⌘' : 'Ctrl' }}</Kbd>
                                                        <Kbd>D</Kbd>
                                                    </span>
                                                </SidebarMenuButton>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent>
                                                <ContextMenuItem v-if="hasNotifications" @click="clearAllNotifications">
                                                    {{ t('nav_menu.mark_all_read') }}
                                                </ContextMenuItem>
                                                <ContextMenuSeparator v-if="hasNotifications" />
                                                <template v-if="isDashboardItem(item)">
                                                    <ContextMenuItem @click="handleEditDashboard(item)">
                                                        {{ t('nav_menu.edit_dashboard') }}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        variant="destructive"
                                                        @click="handleDeleteDashboard(item)">
                                                        {{ t('nav_menu.delete_dashboard') }}
                                                    </ContextMenuItem>
                                                    <ContextMenuSeparator />
                                                </template>
                                                <ContextMenuItem
                                                    v-if="isToolItem(item)"
                                                    @click="handleUnpinToolItem(item)">
                                                    {{ t('nav_menu.custom_nav.unpin_from_nav') }}
                                                </ContextMenuItem>
                                                <ContextMenuSeparator v-if="isToolItem(item)" />
                                                <ContextMenuItem @click="handleOpenCustomNavDialog">
                                                    {{ t('nav_menu.custom_nav.header') }}
                                                </ContextMenuItem>
                                            </ContextMenuContent>
                                        </ContextMenu>
                                    </SidebarMenuItem>

                                    <NavMenuFolderItem
                                        v-else
                                        :item="item"
                                        :is-collapsed="isCollapsed"
                                        :active-menu-index="activeMenuIndex"
                                        :collapsed-dropdown-open-id="collapsedDropdownOpenId"
                                        :has-notifications="hasNotifications"
                                        :is-entry-notified="isEntryNotified"
                                        :is-nav-item-notified="isNavItemNotified"
                                        :is-dashboard-item="isDashboardItem"
                                        :is-tool-item="isToolItem"
                                        @collapsed-dropdown-open-change="handleCollapsedDropdownOpenChange"
                                        @collapsed-submenu-select="handleCollapsedSubmenuSelect"
                                        @submenu-click="handleSubmenuClick"
                                        @clear-notifications="clearAllNotifications"
                                        @edit-dashboard="handleEditDashboard"
                                        @delete-dashboard="handleDeleteDashboard"
                                        @unpin-tool="handleUnpinToolItem"
                                        @open-custom-nav="handleOpenCustomNavDialog" />
                                </template>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem v-if="hasNotifications" @click="clearAllNotifications">
                    {{ t('nav_menu.mark_all_read') }}
                </ContextMenuItem>
                <ContextMenuSeparator v-if="hasNotifications" />
                <ContextMenuItem @click="handleQuickCreateDashboard">
                    {{ t('dashboard.new_dashboard') }}
                </ContextMenuItem>
                <ContextMenuItem @click="handleOpenCustomNavDialog">
                    {{ t('nav_menu.custom_nav.header') }}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>

        <NavMenuFooter
            :is-collapsed="isCollapsed"
            :is-dark-mode="isDarkMode"
            :has-pending-update="pendingVRCXUpdate"
            :has-pending-install="!!pendingVRCXInstall"
            :version="version"
            :vrcx-logo="vrcxLogo"
            :themes="themes"
            :theme-mode="themeMode"
            :table-density="tableDensity"
            :theme-colors="themeColors"
            :current-theme-color="currentThemeColor"
            :is-applying-theme-color="isApplyingThemeColor"
            :theme-display-name="themeDisplayName"
            :theme-color-display-name="themeColorDisplayName"
            @show-whats-new="handleShowWhatsNew"
            @support-link="handleSupportLink"
            @toggle-theme="handleThemeToggle"
            @show-vrcx-update-dialog="showVRCXUpdateDialog"
            @settings-click="handleSettingsClick"
            @theme-select="handleThemeSelect"
            @theme-color-select="handleThemeColorSelect"
            @table-density-select="handleTableDensitySelect"
            @open-custom-nav="handleOpenCustomNavDialog"
            @logout-click="handleLogoutClick"
            @toggle-nav-collapse="toggleNavCollapse"
            @open-github="openGithub" />
    </Sidebar>

    <CustomNavDialog
        v-model:visible="customNavDialogVisible"
        :layout="navLayout"
        :hidden-keys="navHiddenKeys"
        :default-hidden-keys="defaultHiddenKeys"
        :default-layout="defaultNavLayout"
        :definitions="allNavDefinitions"
        @save="handleCustomNavSave"
        @dashboard-created="handleDashboardCreated" />
</template>

<script setup>
    import { computed, h, onMounted, ref, watch } from 'vue';

    import { storeToRefs } from 'pinia';
    import { Plus } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import { useNavLayout } from './composables/useNavLayout';
    import { useNavTheme } from './composables/useNavTheme';
    import { useToolActions } from '../../composables/useToolActions';
    import { useToolNavPinning } from '../../composables/useToolNavPinning';
    import { Kbd } from '@/components/ui/kbd';
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '@/components/ui/context-menu';
    import {
        Sidebar,
        SidebarContent,
        SidebarGroup,
        SidebarGroupContent,
        SidebarHeader,
        SidebarMenu,
        SidebarMenuButton,
        SidebarMenuItem
    } from '@/components/ui/sidebar';

    import {
        useAppearanceSettingsStore,
        useAuthStore,
        useDashboardStore,
        useModalStore,
        useSearchStore,
        useUiStore,
        useVRCXUpdaterStore
    } from '../../stores';
    import { isEntryNotified as checkEntryNotified } from './navMenuUtils';
    import { DASHBOARD_NAV_KEY_PREFIX, links } from '../../shared/constants';
    import { openExternalLink } from '../../shared/utils';

    import NavMenuFolderItem from './NavMenuFolderItem.vue';
    import NavMenuFooter from './NavMenuFooter.vue';

    import CustomNavDialog from '../dialogs/CustomNavDialog.vue';

    const { t, locale } = useI18n();
    const router = useRouter();
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const VRCXUpdaterStore = useVRCXUpdaterStore();
    const { pendingVRCXUpdate, pendingVRCXInstall, appVersion } = storeToRefs(VRCXUpdaterStore);
    const { showVRCXUpdateDialog, showChangeLogDialog, showLatestWhatsNewDialog } = VRCXUpdaterStore;

    const dashboardStore = useDashboardStore();
    const { dashboards } = storeToRefs(dashboardStore);

    const uiStore = useUiStore();
    const { notifiedMenus } = storeToRefs(uiStore);
    const { clearAllNotifications } = uiStore;

    const { directAccessPaste } = useSearchStore();
    const { triggerTool } = useToolActions();
    const { unpinToolFromNav } = useToolNavPinning();
    const { logout } = useAuthStore();
    const modalStore = useModalStore();

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const {
        themeMode,
        tableDensity,
        isDarkMode,
        isNavCollapsed: isCollapsed,
        showNewDashboardButton
    } = storeToRefs(appearanceSettingsStore);

    const {
        themes,
        themeColors,
        currentThemeColor,
        isApplyingThemeColor,
        initThemeColor,
        themeDisplayName,
        themeColorDisplayName,
        handleThemeSelect,
        handleThemeToggle,
        handleTableDensitySelect,
        handleThemeColorSelect
    } = useNavTheme({
        t,
        appearanceSettingsStore
    });

    const {
        navLayout,
        navLayoutReady,
        navHiddenKeys,
        defaultHiddenKeys,
        menuItems,
        activeMenuIndex,
        allNavDefinitions,
        defaultNavLayout,
        sanitizeLayoutLocal,
        saveNavLayout,
        applyCustomNavLayout,
        loadNavMenuConfig,
        triggerNavAction
    } = useNavLayout({
        t,
        locale,
        router,
        dashboardStore,
        dashboards,
        directAccessPaste,
        triggerTool
    });

    const collapsedDropdownOpenId = ref(null);
    const customNavDialogVisible = ref(false);

    const hasNotifications = computed(() => notifiedMenus.value.length > 0);
    const version = computed(() => appVersion.value?.split('VRCX ')?.[1] || '-');
    const vrcxLogo = new URL('../../../images/VRCX.png', import.meta.url).href;

    const isEntryNotified = (entry) => checkEntryNotified(entry, notifiedMenus.value);

    const getItemTooltip = (item) => {
        const label = item.titleIsCustom ? item.title : t(item.title || '');
        if (item.action !== 'direct-access') {
            return label;
        }
        return () =>
            h('span', { class: 'inline-flex items-center gap-1' }, [
                label,
                h(Kbd, () => (isMac ? '⌘' : 'Ctrl')),
                h(Kbd, () => 'D')
            ]);
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

    const handleShowWhatsNew = async () => {
        const shown = showLatestWhatsNewDialog();
        if (!shown) {
            showChangeLogDialog();
        }
    };

    const handleSettingsClick = () => {
        router.push({ name: 'settings' });
    };

    const handleLogoutClick = () => {
        logout();
    };

    const openGithub = () => {
        openExternalLink('https://github.com/vrcx-team/VRCX');
    };

    const handleSupportLink = (id) => {
        const target = links[id];
        if (target) {
            openExternalLink(target);
        }
    };

    const handleOpenCustomNavDialog = () => {
        customNavDialogVisible.value = true;
    };

    const isDashboardItem = (item) => item?.index?.startsWith(DASHBOARD_NAV_KEY_PREFIX);
    const isToolItem = (item) => item?.index?.startsWith('tool-');

    const handleUnpinToolItem = async (item) => {
        if (!isToolItem(item)) {
            return;
        }
        await unpinToolFromNav(item.index.replace(/^tool-/, ''));
    };

    const handleQuickCreateDashboard = async () => {
        const dashboard = await dashboardStore.createDashboard(t('dashboard.default_name'));
        const dashboardKey = `${DASHBOARD_NAV_KEY_PREFIX}${dashboard.id}`;
        const currentLayout = [...navLayout.value];
        const directAccessIdx = currentLayout.findIndex((entry) => entry.type === 'item' && entry.key === 'direct-access');
        const newEntry = { type: 'item', key: dashboardKey };
        if (directAccessIdx !== -1) {
            currentLayout.splice(directAccessIdx, 0, newEntry);
        } else {
            currentLayout.push(newEntry);
        }
        const nextLayout = currentLayout;
        const nextHiddenKeys = navHiddenKeys.value.filter((key) => key !== dashboardKey);
        const sanitized = sanitizeLayoutLocal(nextLayout, nextHiddenKeys);
        navLayout.value = sanitized;
        navHiddenKeys.value = nextHiddenKeys;
        await saveNavLayout(sanitized, nextHiddenKeys);
        dashboardStore.setEditingDashboardId(dashboard.id);
        router.push({ name: 'dashboard', params: { id: dashboard.id } });
    };

    const handleEditDashboard = (item) => {
        if (!isDashboardItem(item)) {
            return;
        }
        const dashboardId = item.index.replace(DASHBOARD_NAV_KEY_PREFIX, '');
        dashboardStore.setEditingDashboardId(dashboardId);
        const currentRoute = router.currentRoute.value;
        if (currentRoute?.name !== 'dashboard' || String(currentRoute?.params?.id || '') !== dashboardId) {
            router.push({ name: 'dashboard', params: { id: dashboardId } });
        }
    };

    const handleDeleteDashboard = async (item) => {
        if (!isDashboardItem(item)) {
            return;
        }
        const { ok } = await modalStore.confirm({
            title: t('dashboard.confirmations.delete_title'),
            description: t('dashboard.confirmations.delete_description'),
            destructive: true
        });
        if (!ok) {
            return;
        }
        const dashboardId = item.index.replace(DASHBOARD_NAV_KEY_PREFIX, '');
        await dashboardStore.deleteDashboard(dashboardId);
        const currentRoute = router.currentRoute.value;
        if (currentRoute?.name === 'dashboard' && String(currentRoute?.params?.id || '') === dashboardId) {
            router.replace({ name: 'feed' });
        }
    };

    const handleCustomNavSave = async (layout, hiddenKeys) => {
        await applyCustomNavLayout(layout, hiddenKeys);
        customNavDialogVisible.value = false;
    };

    const handleDashboardCreated = async (dashboardId, layout, hiddenKeys) => {
        await handleCustomNavSave(layout, hiddenKeys);
        router.push({ name: 'dashboard', params: { id: dashboardId } });
    };

    const handleSubmenuClick = (entry) => {
        triggerNavAction(entry);
    };

    const handleCollapsedDropdownOpenChange = (index, value) => {
        collapsedDropdownOpenId.value = value ? index : null;
    };

    const handleCollapsedSubmenuSelect = (event, entry) => {
        if (event?.preventDefault) {
            event.preventDefault();
        }
        handleSubmenuClick(entry);
    };

    const handleMenuItemClick = (item) => {
        triggerNavAction(item);
    };

    const toggleNavCollapse = () => {
        appearanceSettingsStore.toggleNavCollapsed();
    };

    watch(
        () => isCollapsed.value,
        (value) => {
            if (!value) {
                collapsedDropdownOpenId.value = null;
            }
        }
    );

    onMounted(async () => {
        await initThemeColor();
        await dashboardStore.loadDashboards();
        await loadNavMenuConfig();
    });
</script>

<style scoped>
    .notify-dot-not-collapsed {
        position: absolute;
        top: 4px;
        right: 0;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        transform: translateY(-50%);
    }

    @container (max-width: 220px) {
        .nav-shortcut-hint {
            display: none;
        }
    }
</style>
