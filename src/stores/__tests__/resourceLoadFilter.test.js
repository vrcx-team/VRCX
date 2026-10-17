import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({ saved: '{}', setString: vi.fn(), lookup: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ currentRoute: ref({ name: 'other' }) }) }));
vi.mock('../../services/config', () => ({
    default: {
        getString: vi.fn(async (key, fallback) => (key === 'VRCX_gameLogResourceLoadFilter' ? mocks.saved : fallback)),
        getBool: vi.fn(async (_key, fallback) => fallback),
        setString: mocks.setString,
        setBool: vi.fn()
    }
}));
vi.mock('../../shared/utils', () => ({
    compareGameLogRows: () => -1,
    findUserByDisplayName: vi.fn(),
    formatSeconds: vi.fn(),
    gameLogSearchFilter: () => true,
    getGroupName: vi.fn()
}));
vi.mock('../../services/database', () => ({ database: { lookupGameLogDatabase: mocks.lookup } }));
vi.mock('../../coordinators/gameLogCoordinator', () => ({ tryLoadPlayerList: vi.fn() }));
vi.mock('../gameLog/mediaParsers', () => ({ createMediaParsers: () => ({}) }));
vi.mock('../settings/advanced', () => ({ useAdvancedSettingsStore: () => ({}) }));
vi.mock('../friend', () => ({ useFriendStore: () => ({ friends: new Map(), localFavoriteFriends: new Map() }) }));
vi.mock('../notification', () => ({ useNotificationStore: () => ({}) }));
vi.mock('../dashboard', () => ({ useDashboardStore: () => ({ dashboards: [] }) }));
vi.mock('../user', () => ({ useUserStore: () => ({ currentUser: { id: 'me' } }) }));
vi.mock('../vr', () => ({ useVrStore: () => ({}) }));
vi.mock('../vrcx', () => ({ useVrcxStore: () => ({ maxTableSize: 500 }) }));
vi.mock('../../services/watchState', () => ({ watchState: {} }));

import { useGameLogStore } from '../gameLog';

describe('saved and live resource load filtering', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mocks.saved = '{}';
        mocks.setString.mockReset();
        mocks.lookup.mockResolvedValue([{ type: 'StringLoad', resourceUrl: 'https://telemetry.vrclinking.com' }]);
    });

    it('defaults off, filters historical and live rows, and restores them when disabled', async () => {
        const store = useGameLogStore();
        await flushPromises();
        expect(store.resourceLoadFilter.enabled).toBe(false);
        await store.gameLogTableLookup();
        await store.setResourceLoadFilter({ enabled: true, patterns: ['telemetry'] });
        expect(store.visibleGameLogTableData).toHaveLength(0);
        store.addGameLog({ type: 'ImageLoad', resourceUrl: 'https://telemetry.vrclinking.com/image' });
        store.addGameLog({ type: 'ImageLoad', resourceUrl: 'https://example.com/image' });
        expect(store.visibleGameLogTableData).toHaveLength(1);
        expect(store.gameLogTableData).toHaveLength(3);
        await store.setResourceLoadFilter({ enabled: false, patterns: ['telemetry'] });
        expect(store.visibleGameLogTableData).toHaveLength(3);
        expect(mocks.setString).toHaveBeenLastCalledWith(
            'VRCX_gameLogResourceLoadFilter',
            JSON.stringify({ enabled: false, patterns: ['telemetry'] })
        );
    });

    it('restores preferences on startup and tolerates invalid saved patterns', async () => {
        mocks.saved = JSON.stringify({ enabled: true, patterns: ['[', 'telemetry', 123] });
        const store = useGameLogStore();
        await flushPromises();
        await store.gameLogTableLookup();
        expect(store.resourceLoadFilter.patterns).toEqual(['[', 'telemetry']);
        expect(store.visibleGameLogTableData).toHaveLength(0);
    });
});
