import dayjs from 'dayjs';

import { isToolNavKey } from '../../shared/constants';
import { collectLayoutKeys } from './navLayoutHelpers';

export const NAV_CONFIG_KEY = 'VRCX_customNavMenuLayoutList';

export function generateNavFolderId() {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return `nav-folder-${crypto.randomUUID()}`;
    }

    return `nav-folder-${dayjs().toISOString()}-${Math.random().toString().slice(2, 4)}`;
}

export function createNavDefinitionMap(definitions = []) {
    const map = new Map();
    definitions.forEach((definition) => {
        if (definition?.key) {
            map.set(definition.key, definition);
        }
    });
    return map;
}

export function buildNavDefinitionsForLayout(
    baseDefinitions = [],
    dashboardDefinitions = [],
    layout = [],
    hiddenKeys = []
) {
    const keysInLayout = collectLayoutKeys(layout);
    const hiddenSet = new Set(Array.isArray(hiddenKeys) ? hiddenKeys : []);
    const visibleBaseDefinitions = baseDefinitions.filter(
        (definition) =>
            !isToolNavKey(definition.key) || keysInLayout.has(definition.key)
    );
    const visibleDashboardDefinitions = dashboardDefinitions.filter(
        (definition) =>
            keysInLayout.has(definition.key) || hiddenSet.has(definition.key)
    );

    return [...visibleBaseDefinitions, ...visibleDashboardDefinitions];
}

export async function loadStoredNavConfig(
    repository,
    fallbackLayout,
    {
        configKey = NAV_CONFIG_KEY,
        filterHiddenKey = () => true
    } = {}
) {
    let layout = fallbackLayout;
    let hiddenKeys = [];

    const storedValue = await repository.getString(configKey);
    if (!storedValue) {
        return { layout, hiddenKeys };
    }

    try {
        const parsed = JSON.parse(storedValue);
        if (Array.isArray(parsed)) {
            layout = parsed;
        } else if (Array.isArray(parsed?.layout)) {
            layout = parsed.layout;
            hiddenKeys = Array.isArray(parsed.hiddenKeys)
                ? parsed.hiddenKeys.filter(filterHiddenKey)
                : [];
        }
    } catch {
        // keep defaults
    }

    return { layout, hiddenKeys };
}
