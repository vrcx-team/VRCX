import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import configRepository from '../services/config';
import {
    DASHBOARD_NAV_KEY_PREFIX,
    DASHBOARD_STORAGE_KEY,
    DEFAULT_DASHBOARD_ICON
} from '../shared/constants/dashboard';

function clonePanel(panel) {
    if (typeof panel === 'string' && panel) {
        return panel;
    }
    if (
        panel &&
        typeof panel === 'object' &&
        typeof panel.key === 'string' &&
        panel.key
    ) {
        return {
            key: panel.key,
            config:
                panel.config && typeof panel.config === 'object'
                    ? JSON.parse(JSON.stringify(panel.config))
                    : {}
        };
    }
    return null;
}

function cloneRows(rows) {
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows
        .map((row) => {
            const panels = Array.isArray(row?.panels)
                ? row.panels.slice(0, 2).map(clonePanel)
                : [];
            if (!panels.length) {
                return null;
            }
            const direction =
                row?.direction === 'vertical' ? 'vertical' : 'horizontal';
            return { panels, direction };
        })
        .filter(Boolean);
}

function sanitizeDashboard(dashboard) {
    if (!dashboard || typeof dashboard !== 'object') {
        return null;
    }

    const id =
        typeof dashboard.id === 'string' && dashboard.id ? dashboard.id : null;
    if (!id) {
        return null;
    }

    const name =
        typeof dashboard.name === 'string' && dashboard.name.trim()
            ? dashboard.name.trim()
            : 'Dashboard';

    const icon =
        typeof dashboard.icon === 'string' && dashboard.icon.trim()
            ? dashboard.icon.trim()
            : DEFAULT_DASHBOARD_ICON;

    return {
        id,
        name,
        icon,
        rows: cloneRows(dashboard.rows)
    };
}

export const useDashboardStore = defineStore('dashboard', () => {
    const dashboards = ref([]);
    const loaded = ref(false);
    const editingDashboardId = ref(null);

    const dashboardNavKeys = computed(
        () =>
            new Set(
                dashboards.value.map(
                    (dashboard) => `${DASHBOARD_NAV_KEY_PREFIX}${dashboard.id}`
                )
            )
    );

    async function loadDashboards() {
        try {
            const stored = await configRepository.getString(
                DASHBOARD_STORAGE_KEY,
                null
            );
            if (!stored) {
                dashboards.value = [];
                loaded.value = true;
                return;
            }

            const parsed = JSON.parse(stored);
            const source = Array.isArray(parsed?.dashboards)
                ? parsed.dashboards
                : [];
            dashboards.value = source.map(sanitizeDashboard).filter(Boolean);
        } catch {
            dashboards.value = [];
        } finally {
            loaded.value = true;
        }
    }

    async function saveDashboards() {
        await configRepository.setString(
            DASHBOARD_STORAGE_KEY,
            JSON.stringify({ dashboards: dashboards.value })
        );
    }

    function ensureLoaded() {
        if (!loaded.value) {
            loadDashboards();
        }
    }

    function getDashboard(id) {
        return (
            dashboards.value.find((dashboard) => dashboard.id === id) || null
        );
    }

    function generateDashboardId() {
        if (
            typeof crypto !== 'undefined' &&
            typeof crypto.randomUUID === 'function'
        ) {
            return crypto.randomUUID();
        }
        return `dashboard-${Date.now()}-${Math.random().toString().slice(2, 8)}`;
    }

    function generateNextDashboardName(baseName = 'Dashboard') {
        const existingNames = new Set(dashboards.value.map((d) => d.name));
        if (!existingNames.has(baseName)) {
            return baseName;
        }
        let n = 1;
        while (existingNames.has(`${baseName} ${n}`)) {
            n++;
        }
        return `${baseName} ${n}`;
    }

    async function createDashboard(baseName = 'Dashboard') {
        const id = generateDashboardId();
        const name = generateNextDashboardName(baseName);
        const dashboard = {
            id,
            name,
            icon: DEFAULT_DASHBOARD_ICON,
            rows: []
        };
        dashboards.value.push(dashboard);
        await saveDashboards();
        return dashboard;
    }

    async function updateDashboard(id, updates) {
        const index = dashboards.value.findIndex(
            (dashboard) => dashboard.id === id
        );
        if (index < 0) {
            return;
        }

        const next = sanitizeDashboard({
            ...dashboards.value[index],
            ...updates,
            id
        });

        if (!next) {
            return;
        }

        dashboards.value[index] = next;
        await saveDashboards();
    }

    async function deleteDashboard(id) {
        dashboards.value = dashboards.value.filter(
            (dashboard) => dashboard.id !== id
        );
        if (editingDashboardId.value === id) {
            editingDashboardId.value = null;
        }
        await saveDashboards();
    }

    function setEditingDashboardId(id) {
        editingDashboardId.value = id || null;
    }

    function clearEditingDashboardId() {
        editingDashboardId.value = null;
    }

    function getDashboardNavDefinitions() {
        return dashboards.value.map((dashboard) => ({
            key: `${DASHBOARD_NAV_KEY_PREFIX}${dashboard.id}`,
            icon: dashboard.icon || DEFAULT_DASHBOARD_ICON,
            tooltip: dashboard.name,
            labelKey: dashboard.name,
            routeName: 'dashboard',
            routeParams: { id: dashboard.id },
            isDashboard: true
        }));
    }

    return {
        dashboards,
        loaded,
        editingDashboardId,
        dashboardNavKeys,
        ensureLoaded,
        loadDashboards,
        saveDashboards,
        createDashboard,
        getDashboard,
        updateDashboard,
        deleteDashboard,
        getDashboardNavDefinitions,
        setEditingDashboardId,
        clearEditingDashboardId
    };
});
