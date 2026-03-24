import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    execute: vi.fn()
}));

vi.mock('../../sqlite.js', () => ({
    default: {
        execute: mocks.execute,
        executeNonQuery: vi.fn()
    }
}));
vi.mock('../index.js', () => ({
    dbVars: {
        maxTableSize: 500,
        userPrefix: ''
    }
}));

import { gameLog } from '../gameLog.js';

describe('gameLog.getSelfPresenceForLocations', () => {
    beforeEach(() => {
        mocks.execute.mockReset();
    });

    test('filters out zero-duration records with AND time > 0', async () => {
        mocks.execute.mockImplementation(async (callback, sql, params) => {
            callback(['wrld_1:123~region(us)', '2024-01-15T10:00:00Z', 3600000]);
            return undefined;
        });

        const result = await gameLog.getSelfPresenceForLocations('usr_abc', [
            'wrld_1:123~region(us)'
        ]);

        expect(result.get('wrld_1:123~region(us)')).toEqual([
            { selfLeave: '2024-01-15T10:00:00Z', selfTime: 3600000 }
        ]);
        expect(mocks.execute).toHaveBeenCalledTimes(1);
        expect(mocks.execute.mock.calls[0][1]).toContain('AND time > 0');
    });

    test('returns empty map when locations array is empty', async () => {
        const result = await gameLog.getSelfPresenceForLocations('usr_abc', []);
        expect(result.size).toBe(0);
        expect(mocks.execute).not.toHaveBeenCalled();
    });
});

describe('gameLog.getMyTopWorlds', () => {
    beforeEach(() => {
        mocks.execute.mockReset();
    });

    test('adds an exclude clause when a home world id is provided', async () => {
        mocks.execute.mockImplementation(async (callback, sql, params) => {
            callback(['wrld_1', 'World One', 3, 9000]);
            return undefined;
        });

        const result = await gameLog.getMyTopWorlds(30, 5, 'time', 'wrld_home');

        expect(result).toEqual([
            {
                worldId: 'wrld_1',
                worldName: 'World One',
                visitCount: 3,
                totalTime: 9000
            }
        ]);
        expect(mocks.execute).toHaveBeenCalledTimes(1);
        expect(mocks.execute.mock.calls[0][1]).toContain('AND world_id != @excludeWorldId');
        expect(mocks.execute.mock.calls[0][2]).toMatchObject({
            '@limit': 5,
            '@daysOffset': '-30 days',
            '@excludeWorldId': 'wrld_home'
        });
    });
});
