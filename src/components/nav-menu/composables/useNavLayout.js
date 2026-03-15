import { useEventListener } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import configRepository from '../../../services/config';
import {
    DASHBOARD_NAV_KEY_PREFIX,
    isToolNavKey,
    navDefinitions
} from '../../../shared/constants';
import { triggerNavEntryAction } from '../navActionUtils';
import {
    buildMenuItems,
    findFirstNavEntry,
    findFirstNavKey
} from '../navLayoutHelpers';
import {
    createBaseDefaultNavLayout,
    insertDashboardEntries
} from '../navLayoutDefaults';
import {
    dispatchNavLayoutUpdated,
    NAV_LAYOUT_UPDATED_EVENT
} from '../navLayoutEvents';
import {
    buildNavDefinitionsForLayout,
    createNavDefinitionMap,
    generateNavFolderId,
    loadStoredNavConfig,
    NAV_CONFIG_KEY
} from '../navConfigUtils';
import { normalizeHiddenKeys, sanitizeLayout } from '../navMenuUtils';

export function useNavLayout({
    t,
    locale,
    router,
    dashboardStore,
    dashboards,
    directAccessPaste,
    triggerTool
}) {
    const navLayout = ref([]);
    const navLayoutReady = ref(false);
    const navHiddenKeys = ref([]);

    const allNavDefinitions = computed(() => [
        ...navDefinitions,
        ...dashboardStore.getDashboardNavDefinitions()
    ]);

    const navDefinitionMap = computed(() =>
        createNavDefinitionMap(allNavDefinitions.value)
    );

    // Tool nav items are add/remove only; they no longer participate in hidden state.
    const getDefaultHiddenKeys = (layout = []) => {
        void layout;
        return [];
    };

    const createDefaultNavLayout = () => createBaseDefaultNavLayout(t);

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
        const navKeys = Array.isArray(currentRoute?.meta?.navKeys)
            ? currentRoute.meta.navKeys
            : [currentRoute?.meta?.navKey || currentRouteName].filter(Boolean);
        if (!navKeys.length) {
            return getFirstNavKeyLocal(navLayout.value) || 'feed';
        }

        for (const entry of navLayout.value) {
            if (entry.type === 'item' && navKeys.includes(entry.key)) {
                return entry.key;
            }
            if (entry.type === 'folder') {
                const matchedKey = navKeys.find((key) =>
                    entry.items?.includes(key)
                );
                if (matchedKey) {
                    return matchedKey;
                }
            }
        }
        return getFirstNavKeyLocal(navLayout.value) || 'feed';
    });

    const getAppendDefinitions = (layout, hiddenKeys = []) => {
        return buildNavDefinitionsForLayout(
            navDefinitions,
            dashboardStore.getDashboardNavDefinitions(),
            layout,
            hiddenKeys
        );
    };

    const sanitizeLayoutLocal = (layout, hiddenKeys = []) => {
        return sanitizeLayout(
            layout,
            hiddenKeys,
            navDefinitionMap.value,
            getAppendDefinitions(layout, hiddenKeys),
            t,
            generateNavFolderId
        );
    };

    const defaultNavLayout = computed(() => {
        const base = insertDashboardEntries(
            createDefaultNavLayout(),
            dashboardStore.getDashboardNavDefinitions()
        );
        return sanitizeLayoutLocal(base, getDefaultHiddenKeys(base));
    });

    const triggerNavAction = (entry) => {
        const action = triggerNavEntryAction(entry, {
            router,
            directAccessPaste
        });
        if (action?.type === 'tool' && action.toolKey) {
            triggerTool?.(action.toolKey);
        }
    };

    const saveNavLayout = async (layout, hiddenKeys = []) => {
        const normalizedHiddenKeys = normalizeHiddenKeys(
            [...hiddenKeys, ...getDefaultHiddenKeys(layout)],
            navDefinitionMap.value
        );
        try {
            await configRepository.setString(
                NAV_CONFIG_KEY,
                JSON.stringify({
                    layout,
                    hiddenKeys: normalizedHiddenKeys
                })
            );
        } catch (error) {
            console.error('Failed to save custom nav', error);
            return;
        }

        dispatchNavLayoutUpdated();
    };

    const applyCustomNavLayout = async (layout, hiddenKeys = []) => {
        const normalizedHiddenKeys = normalizeHiddenKeys(
            [...hiddenKeys, ...getDefaultHiddenKeys(layout)],
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
            const loaded = await loadStoredNavConfig(
                configRepository,
                createDefaultNavLayout(),
                {
                    configKey: NAV_CONFIG_KEY,
                    filterHiddenKey: (key) => !isToolNavKey(key)
                }
            );
            layoutData = loaded.layout;
            hiddenKeysData = loaded.hiddenKeys;
        } catch (error) {
            console.error('Failed to load custom nav', error);
        } finally {
            const fallbackLayout = layoutData?.length
                ? layoutData
                : createDefaultNavLayout();
            const normalizedHiddenKeys = normalizeHiddenKeys(
                hiddenKeysData,
                navDefinitionMap.value
            );
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

    const handleExternalNavLayoutUpdate = async () => {
        await loadNavMenuConfig();
    };

    useEventListener(
        typeof window !== 'undefined' ? window : undefined,
        NAV_LAYOUT_UPDATED_EVENT,
        handleExternalNavLayoutUpdate
    );

    return {
        navLayout,
        navLayoutReady,
        navHiddenKeys,
        defaultHiddenKeys: computed(() => getDefaultHiddenKeys(defaultNavLayout.value)),
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
