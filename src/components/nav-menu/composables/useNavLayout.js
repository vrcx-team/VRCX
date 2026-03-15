import { computed, ref, watch } from 'vue';

import dayjs from 'dayjs';

import configRepository from '../../../services/config';
import {
    DASHBOARD_NAV_KEY_PREFIX,
    navDefinitions
} from '../../../shared/constants';
import { triggerNavEntryAction } from '../navActionUtils';
import {
    buildMenuItems,
    collectLayoutKeys,
    findFirstNavEntry,
    findFirstNavKey
} from '../navLayoutHelpers';
import { normalizeHiddenKeys, sanitizeLayout } from '../navMenuUtils';

export function useNavLayout({
    t,
    locale,
    router,
    dashboardStore,
    dashboards,
    directAccessPaste
}) {
    const navLayout = ref([]);
    const navLayoutReady = ref(false);
    const navHiddenKeys = ref([]);

    const allNavDefinitions = computed(() => [
        ...navDefinitions,
        ...dashboardStore.getDashboardNavDefinitions()
    ]);

    const navDefinitionMap = computed(() => {
        const map = new Map();
        allNavDefinitions.value.forEach((item) => {
            map.set(item.key, item);
        });
        return map;
    });

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
        { type: 'item', key: 'my-avatars' },
        {
            type: 'folder',
            id: 'default-folder-charts',
            nameKey: 'nav_tooltip.charts',
            name: t('nav_tooltip.charts'),
            icon: 'ri-pie-chart-line',
            items: ['charts-instance', 'charts-mutual']
        },
        { type: 'item', key: 'tools' },
        { type: 'item', key: 'direct-access' }
    ];

    const menuItems = computed(() =>
        buildMenuItems(navLayout.value, navDefinitionMap.value, t)
    );

    const getFirstNavEntryLocal = (layout) => {
        return findFirstNavEntry(layout, navDefinitionMap.value);
    };

    const getFirstNavKeyLocal = (layout) => {
        return findFirstNavKey(layout, navDefinitionMap.value);
    };

    const activeMenuIndex = computed(() => {
        const currentRoute = router.currentRoute.value;
        if (currentRoute?.name === 'dashboard' && currentRoute.params?.id) {
            return `${DASHBOARD_NAV_KEY_PREFIX}${currentRoute.params.id}`;
        }
        const currentRouteName = currentRoute?.name;
        const navKey = currentRoute?.meta?.navKey || currentRouteName;
        if (!navKey) {
            return getFirstNavKeyLocal(navLayout.value) || 'feed';
        }

        for (const entry of navLayout.value) {
            if (entry.type === 'item' && entry.key === navKey) {
                return entry.key;
            }
            if (entry.type === 'folder' && entry.items?.includes(navKey)) {
                return navKey;
            }
        }
        return getFirstNavKeyLocal(navLayout.value) || 'feed';
    });

    const generateFolderId = () => {
        if (
            typeof crypto !== 'undefined' &&
            typeof crypto.randomUUID === 'function'
        ) {
            return `nav-folder-${crypto.randomUUID()}`;
        }
        return `nav-folder-${dayjs().toISOString()}-${Math.random().toString().slice(2, 4)}`;
    };

    const getAppendDefinitions = (layout, hiddenKeys = []) => {
        const keysInLayout = collectLayoutKeys(layout);
        const hiddenSet = new Set(Array.isArray(hiddenKeys) ? hiddenKeys : []);
        const dashboardDefinitions = dashboardStore
            .getDashboardNavDefinitions()
            .filter(
                (definition) =>
                    keysInLayout.has(definition.key) ||
                    hiddenSet.has(definition.key)
            );
        return [...navDefinitions, ...dashboardDefinitions];
    };

    const sanitizeLayoutLocal = (layout, hiddenKeys = []) => {
        return sanitizeLayout(
            layout,
            hiddenKeys,
            navDefinitionMap.value,
            getAppendDefinitions(layout, hiddenKeys),
            t,
            generateFolderId
        );
    };

    const defaultNavLayout = computed(() => {
        const base = createDefaultNavLayout();
        const dashboardEntries = dashboardStore
            .getDashboardNavDefinitions()
            .map((def) => ({ type: 'item', key: def.key }));
        if (dashboardEntries.length) {
            const directAccessIdx = base.findIndex(
                (entry) =>
                    entry.type === 'item' && entry.key === 'direct-access'
            );
            if (directAccessIdx !== -1) {
                base.splice(directAccessIdx, 0, ...dashboardEntries);
            } else {
                base.push(...dashboardEntries);
            }
        }
        return sanitizeLayoutLocal(base, []);
    });

    const triggerNavAction = (entry) => {
        triggerNavEntryAction(entry, { router, directAccessPaste });
    };

    const saveNavLayout = async (layout, hiddenKeys = []) => {
        const normalizedHiddenKeys = normalizeHiddenKeys(
            hiddenKeys,
            navDefinitionMap.value
        );
        try {
            await configRepository.setString(
                'VRCX_customNavMenuLayoutList',
                JSON.stringify({
                    layout,
                    hiddenKeys: normalizedHiddenKeys
                })
            );
        } catch (error) {
            console.error('Failed to save custom nav', error);
        }
    };

    const applyCustomNavLayout = async (layout, hiddenKeys = []) => {
        const normalizedHiddenKeys = normalizeHiddenKeys(
            hiddenKeys,
            navDefinitionMap.value
        );
        const sanitized = sanitizeLayoutLocal(layout, normalizedHiddenKeys);
        navLayout.value = sanitized;
        navHiddenKeys.value = normalizedHiddenKeys;
        await saveNavLayout(sanitized, normalizedHiddenKeys);
    };

    let hasNavigatedToInitialRoute = false;
    const navigateToFirstNavEntry = () => {
        if (hasNavigatedToInitialRoute) {
            return;
        }
        const firstEntry = getFirstNavEntryLocal(navLayout.value);
        if (!firstEntry) {
            return;
        }
        hasNavigatedToInitialRoute = true;
        if (
            router.currentRoute.value?.name !== firstEntry.routeName ||
            (firstEntry.routeParams?.id &&
                router.currentRoute.value?.params?.id !==
                    firstEntry.routeParams.id)
        ) {
            triggerNavAction(firstEntry);
        }
    };

    const loadNavMenuConfig = async () => {
        let layoutData = null;
        let hiddenKeysData = [];
        try {
            const storedValue = await configRepository.getString(
                'VRCX_customNavMenuLayoutList'
            );
            if (storedValue) {
                const parsed = JSON.parse(storedValue);
                if (Array.isArray(parsed)) {
                    layoutData = parsed;
                } else if (Array.isArray(parsed?.layout)) {
                    layoutData = parsed.layout;
                    hiddenKeysData = Array.isArray(parsed.hiddenKeys)
                        ? parsed.hiddenKeys
                        : [];
                }
            }
        } catch (error) {
            console.error('Failed to load custom nav', error);
        } finally {
            const normalizedHiddenKeys = normalizeHiddenKeys(
                hiddenKeysData,
                navDefinitionMap.value
            );
            const fallbackLayout = layoutData?.length
                ? layoutData
                : createDefaultNavLayout();
            const sanitized = sanitizeLayoutLocal(
                fallbackLayout,
                normalizedHiddenKeys
            );
            navLayout.value = sanitized;
            navHiddenKeys.value = normalizedHiddenKeys;
            if (
                layoutData?.length &&
                (JSON.stringify(sanitized) !== JSON.stringify(fallbackLayout) ||
                    JSON.stringify(normalizedHiddenKeys) !==
                        JSON.stringify(hiddenKeysData))
            ) {
                await saveNavLayout(sanitized, normalizedHiddenKeys);
            }
            navLayoutReady.value = true;
            navigateToFirstNavEntry();
        }
    };

    const cleanDashboardEntries = (layout, dashboardKeys) => {
        const normalized = [];
        layout.forEach((entry) => {
            if (entry.type === 'item') {
                if (
                    entry.key?.startsWith(DASHBOARD_NAV_KEY_PREFIX) &&
                    !dashboardKeys.has(entry.key)
                ) {
                    return;
                }
                normalized.push(entry);
                return;
            }

            if (entry.type === 'folder') {
                const nextItems = (entry.items || []).filter((key) => {
                    if (!key?.startsWith(DASHBOARD_NAV_KEY_PREFIX)) {
                        return true;
                    }
                    return dashboardKeys.has(key);
                });
                if (nextItems.length === 0) {
                    return;
                }
                normalized.push({ ...entry, items: nextItems });
            }
        });
        return normalized;
    };

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
        () => dashboards.value,
        async () => {
            if (!navLayoutReady.value) {
                return;
            }
            const cleanedLayout = cleanDashboardEntries(
                navLayout.value,
                dashboardStore.dashboardNavKeys
            );
            const cleanedHidden = navHiddenKeys.value.filter(
                (key) =>
                    !key?.startsWith(DASHBOARD_NAV_KEY_PREFIX) ||
                    dashboardStore.dashboardNavKeys.has(key)
            );
            if (
                JSON.stringify(cleanedLayout) !==
                    JSON.stringify(navLayout.value) ||
                JSON.stringify(cleanedHidden) !==
                    JSON.stringify(navHiddenKeys.value)
            ) {
                await applyCustomNavLayout(cleanedLayout, cleanedHidden);
            }
        },
        { deep: true }
    );

    return {
        navLayout,
        navLayoutReady,
        navHiddenKeys,
        menuItems,
        activeMenuIndex,
        allNavDefinitions,
        navDefinitionMap,
        defaultNavLayout,
        sanitizeLayoutLocal,
        saveNavLayout,
        applyCustomNavLayout,
        loadNavMenuConfig,
        triggerNavAction
    };
}
