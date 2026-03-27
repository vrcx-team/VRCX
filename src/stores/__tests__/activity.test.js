import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mocks = vi.hoisted(() => ({
    getMyTopWorlds: vi.fn()
}));

vi.mock('../../services/database', () => ({
    database: {
        getMyTopWorlds: mocks.getMyTopWorlds
    }
}));
vi.mock('../../workers/activityWorkerRunner', () => ({
    runActivityWorkerTask: vi.fn()
}));

import { useActivityStore } from '../activity';

describe('useActivityStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    test('forwards excludeWorldId to top worlds query', async () => {
        mocks.getMyTopWorlds.mockResolvedValue([{ worldId: 'wrld_1' }]);
        const store = useActivityStore();

        const result = await store.loadTopWorldsView({
            userId: 'usr_me',
            rangeDays: 30,
            limit: 5,
            sortBy: 'time',
            excludeWorldId: 'wrld_home'
        });

        expect(result).toEqual([{ worldId: 'wrld_1' }]);
        expect(mocks.getMyTopWorlds).toHaveBeenCalledWith(30, 5, 'time', 'wrld_home');
    });
});
