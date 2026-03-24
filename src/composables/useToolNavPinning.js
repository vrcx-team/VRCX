import { useEventListener } from '@vueuse/core';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';

import configRepository from '../services/config';
import {
    navDefinitions
} from '../shared/constants';
import { useDashboardStore } from '../stores';
import {
    createBaseDefaultNavLayout,
    insertDashboardEntries
} from '../components/nav-menu/navLayoutDefaults';
import { collectLayoutKeys } from '../components/nav-menu/navLayoutHelpers';
import {
    buildNavDefinitionsForLayout,
    createNavDefinitionMap,
    generateNavFolderId,
    loadStoredNavConfig,
    NAV_CONFIG_KEY
} from '../components/nav-menu/navConfigUtils';
import {
    normalizeHiddenKeys,
    sanitizeLayout
} from '../components/nav-menu/navMenuUtils';
import {
    dispatchNavLayoutUpdated,
    NAV_LAYOUT_UPDATED_EVENT
} from '../components/nav-menu/navLayoutEvents';

function insertToolNavItem(layout, navKey, t, placement = 'top-level') {
    const nextLayout = Array.isArray(layout) ? [...layout] : [];
    const alreadyExists = nextLayout.some((entry) => {
        if (entry.type === 'item') {
            return entry.key === navKey;
        }
        return entry.type === 'folder' && entry.items?.includes(navKey);
    });

    if (alreadyExists) {
        return nextLayout;
    }

    const insertIdx = nextLayout.findIndex(
        (entry) =>
            entry.type === 'item' &&
            (entry.key === 'tools' || entry.key === 'direct-access')
    );

    if (placement === 'top-level') {
        if (insertIdx === -1) {
            nextLayout.push({ type: 'item', key: navKey });
        } else {
            nextLayout.splice(insertIdx, 0, { type: 'item', key: navKey });
        }

        return nextLayout;
    }

    const folderWithTools = nextLayout.find(
        (entry) =>
            entry.type === 'folder' &&
            (entry.items || []).some((key) => String(key).startsWith('tool-'))
    );

    if (folderWithTools) {
        return nextLayout.map((entry) => {
            if (entry !== folderWithTools) {
                return entry;
            }

            return {
                ...entry,
                items: [...(entry.items || []), navKey]
            };
        });
    }

    const toolsFolder = {
        type: 'folder',
        id: 'default-folder-tools-shortcuts',
        nameKey: 'nav_tooltip.tools',
        name: t('nav_tooltip.tools'),
        icon: 'ri-tools-line',
        items: [navKey]
    };

    if (insertIdx === -1) {
        nextLayout.push(toolsFolder);
    } else {
        nextLayout.splice(insertIdx, 0, toolsFolder);
    }

    return nextLayout;
}

function removeToolNavItem(layout, navKey) {
    if (!Array.isArray(layout)) {
        return [];
    }

    return layout
        .map((entry) => {
            if (entry.type === 'item') {
                return entry.key === navKey ? null : entry;
            }

            if (entry.type === 'folder') {
                const nextItems = (entry.items || []).filter(
                    (key) => key !== navKey
                );
                if (!nextItems.length) {
                    return null;
                }
                return {
                    ...entry,
                    items: nextItems
                };
            }

            return entry;
        })
        .filter(Boolean);
}

export function useToolNavPinning() {
    const { t } = useI18n();
    const dashboardStore = useDashboardStore();
    const pinnedToolKeysRef = ref(new Set());

    const buildDefinitions = () => [
        ...navDefinitions,
        ...dashboardStore.getDashboardNavDefinitions()
    ];

    // Tool nav items are add/remove only; they do not use hidden state anymore.
    const getDefaultHiddenKeys = () => [];

    const buildDefaultLayout = () =>
        insertDashboardEntries(
            createBaseDefaultNavLayout(t),
            dashboardStore.getDashboardNavDefinitions()
        );

    const buildSanitizeDefinitions = (layout = [], hiddenKeys = []) => {
        return buildNavDefinitionsForLayout(
            navDefinitions,
            dashboardStore.getDashboardNavDefinitions(),
            layout,
            hiddenKeys
        );
    };

    const loadConfig = async () => {
        return loadStoredNavConfig(configRepository, buildDefaultLayout(), {
            configKey: NAV_CONFIG_KEY,
            filterHiddenKey: (key) => !key?.startsWith('tool-')
        });
    };

    const refreshPinnedState = async () => {
        const { layout, hiddenKeys } = await loadConfig();
        const layoutKeys = collectLayoutKeys(layout);
        const nextPinned = new Set();

        layoutKeys.forEach((key) => {
            if (key.startsWith('tool-')) {
                nextPinned.add(key.replace(/^tool-/, ''));
            }
        });

        pinnedToolKeysRef.value = nextPinned;
    };

    const pinToolToNav = async (toolKey, options = {}) => {
        const navKey = `tool-${toolKey}`;
        const { layout, hiddenKeys } = await loadConfig();
        const nextLayout = insertToolNavItem(
            layout,
            navKey,
            t,
            options.placement
        );
        const nextHiddenKeys = hiddenKeys.filter((key) => key !== navKey);
        const definitions = buildSanitizeDefinitions(nextLayout, nextHiddenKeys);
        const definitionMap = createNavDefinitionMap(buildDefinitions());
        const normalizedHiddenKeys = normalizeHiddenKeys(
            nextHiddenKeys,
            definitionMap
        );
        const sanitizedLayout = sanitizeLayout(
            nextLayout,
            normalizedHiddenKeys,
            definitionMap,
            definitions,
            t,
            generateNavFolderId
        );

        await configRepository.setString(
            NAV_CONFIG_KEY,
            JSON.stringify({
                layout: sanitizedLayout,
                hiddenKeys: normalizedHiddenKeys
            })
        );

        await refreshPinnedState();
        toast.success(t('nav_menu.custom_nav.pinned'));
        dispatchNavLayoutUpdated();
    };

    const unpinToolFromNav = async (toolKey) => {
        const navKey = `tool-${toolKey}`;
        const { layout, hiddenKeys } = await loadConfig();
        const nextLayout = removeToolNavItem(layout, navKey);
        const nextHiddenKeys = hiddenKeys.filter((key) => key !== navKey);
        const definitions = buildSanitizeDefinitions(nextLayout, nextHiddenKeys);
        const definitionMap = createNavDefinitionMap(buildDefinitions());
        const normalizedHiddenKeys = normalizeHiddenKeys(
            nextHiddenKeys,
            definitionMap
        );
        const sanitizedLayout = sanitizeLayout(
            nextLayout,
            normalizedHiddenKeys,
            definitionMap,
            definitions,
            t,
            generateNavFolderId
        );

        await configRepository.setString(
            NAV_CONFIG_KEY,
            JSON.stringify({
                layout: sanitizedLayout,
                hiddenKeys: normalizedHiddenKeys
            })
        );

        await refreshPinnedState();
        toast.success(t('nav_menu.custom_nav.unpinned'));
        dispatchNavLayoutUpdated();
    };

    useEventListener(
        typeof window !== 'undefined' ? window : undefined,
        NAV_LAYOUT_UPDATED_EVENT,
        refreshPinnedState
    );

    return {
        pinnedToolKeys: computed(() => pinnedToolKeysRef.value),
        pinToolToNav,
        unpinToolFromNav,
        refreshPinnedState
    };
}
