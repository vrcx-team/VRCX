import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

const mocks = vi.hoisted(() => ({
    setString: vi.fn(() => Promise.resolve()),
    getString: vi.fn(() => Promise.resolve(null))
}));

vi.mock('../../../../services/config', () => ({
    default: {
        setString: mocks.setString,
        getString: mocks.getString
    }
}));

vi.mock('../../navMenuUtils', () => ({
    normalizeHiddenKeys: (keys) => keys || [],
    sanitizeLayout: (layout) => layout
}));

import { useNavLayout } from '../useNavLayout';

describe('useNavLayout', () => {
    const createDeps = () => {
        const push = vi.fn();
        const router = {
            push,
            currentRoute: ref({ name: 'unknown', meta: {} })
        };
        const dashboardStore = {
            getDashboardNavDefinitions: () => [],
            dashboardNavKeys: new Set()
        };

        return {
            router,
            push,
            dashboardStore,
            dashboards: ref([]),
            locale: ref('en'),
            directAccessPaste: vi.fn()
        };
    };

    it('triggers direct access action', () => {
        const deps = createDeps();
        const { triggerNavAction } = useNavLayout({
            t: (key) => key,
            locale: deps.locale,
            router: deps.router,
            dashboardStore: deps.dashboardStore,
            dashboards: deps.dashboards,
            directAccessPaste: deps.directAccessPaste
        });

        triggerNavAction({ action: 'direct-access' });

        expect(deps.directAccessPaste).toHaveBeenCalledTimes(1);
    });

    it('navigates with route name and params', () => {
        const deps = createDeps();
        const { triggerNavAction } = useNavLayout({
            t: (key) => key,
            locale: deps.locale,
            router: deps.router,
            dashboardStore: deps.dashboardStore,
            dashboards: deps.dashboards,
            directAccessPaste: deps.directAccessPaste
        });

        triggerNavAction({ routeName: 'dashboard', routeParams: { id: '1' } });

        expect(deps.push).toHaveBeenCalledWith({ name: 'dashboard', params: { id: '1' } });
    });

    it('applies custom layout and persists', async () => {
        const deps = createDeps();
        const { applyCustomNavLayout, navLayout } = useNavLayout({
            t: (key) => key,
            locale: deps.locale,
            router: deps.router,
            dashboardStore: deps.dashboardStore,
            dashboards: deps.dashboards,
            directAccessPaste: deps.directAccessPaste
        });

        const layout = [{ type: 'item', key: 'feed' }];
        await applyCustomNavLayout(layout, []);
        await nextTick();

        expect(navLayout.value).toEqual(layout);
        expect(mocks.setString).toHaveBeenCalled();
    });
});
