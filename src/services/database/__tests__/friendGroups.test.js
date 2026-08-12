import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    execute: vi.fn(),
    executeNonQuery: vi.fn()
}));

vi.mock('../../sqlite.js', () => ({
    default: {
        execute: mocks.execute,
        executeNonQuery: mocks.executeNonQuery
    }
}));
vi.mock('../index.js', () => ({
    dbVars: {
        maxTableSize: 500,
        userPrefix: 'testuser'
    }
}));

import { friendGroups } from '../friendGroups.js';

beforeEach(() => {
    mocks.execute.mockReset();
    mocks.executeNonQuery.mockReset();
    mocks.executeNonQuery.mockResolvedValue(undefined);
});

describe('friendGroups.replaceFriendGroups', () => {
    test('replaces entries inside a transaction', async () => {
        await friendGroups.replaceFriendGroups('usr_1', [
            {
                groupId: 'grp_1',
                joinedAt: '2026-01-01T00:00:00.000Z',
                membershipStatus: 'member',
                visibility: 'visible'
            },
            { groupId: "grp_o'brien" }
        ]);

        expect(mocks.executeNonQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(mocks.executeNonQuery).toHaveBeenNthCalledWith(
            2,
            `DELETE FROM testuser_friend_groups WHERE friend_id = 'usr_1'`
        );
        const insertCall = mocks.executeNonQuery.mock.calls[2][0];
        expect(insertCall).toContain(
            'INSERT OR REPLACE INTO testuser_friend_groups (friend_id, group_id, joined_at, membership_status, visibility, fetched_at) VALUES'
        );
        expect(insertCall).toContain(
            "'usr_1', 'grp_1', '2026-01-01T00:00:00.000Z'"
        );
        // SQL 转义
        expect(insertCall).toContain("'grp_o''brien'");
        expect(mocks.executeNonQuery).toHaveBeenLastCalledWith('COMMIT');
    });

    test('skips entries without a groupId', async () => {
        await friendGroups.replaceFriendGroups('usr_1', [
            { groupId: 'grp_1' },
            { joinedAt: '2026-01-01T00:00:00.000Z' }
        ]);

        const insertCall = mocks.executeNonQuery.mock.calls[2][0];
        expect(insertCall).not.toContain('undefined');
        expect(insertCall.split('),').length).toBeGreaterThanOrEqual(1);
    });

    test('deletes only when entries are empty', async () => {
        await friendGroups.replaceFriendGroups('usr_1', []);

        expect(mocks.executeNonQuery).toHaveBeenCalledTimes(3); // BEGIN, DELETE, COMMIT
        const calls = mocks.executeNonQuery.mock.calls.map((c) => c[0]);
        expect(calls.some((sql) => sql.includes('INSERT OR REPLACE'))).toBe(
            false
        );
    });

    test('rolls back on error', async () => {
        mocks.executeNonQuery.mockImplementationOnce(() => Promise.resolve());
        mocks.executeNonQuery.mockImplementationOnce(() => {
            throw new Error('boom');
        });

        await expect(
            friendGroups.replaceFriendGroups('usr_1', [{ groupId: 'grp_1' }])
        ).rejects.toThrow('boom');
        expect(mocks.executeNonQuery).toHaveBeenLastCalledWith('ROLLBACK');
    });

    test('is a no-op without a user prefix', async () => {
        const { dbVars } = await import('../index.js');
        dbVars.userPrefix = '';
        await friendGroups.replaceFriendGroups('usr_1', [{ groupId: 'grp_1' }]);
        dbVars.userPrefix = 'testuser';
        expect(mocks.executeNonQuery).not.toHaveBeenCalled();
    });
});

describe('friendGroups.deleteFriendGroups', () => {
    test('deletes rows for a friend', async () => {
        await friendGroups.deleteFriendGroups('usr_1');

        expect(mocks.executeNonQuery).toHaveBeenCalledWith(
            `DELETE FROM testuser_friend_groups WHERE friend_id = @friend_id`,
            { '@friend_id': 'usr_1' }
        );
    });
});

describe('friendGroups.getFriendGroups', () => {
    test('maps rows to group entries', async () => {
        mocks.execute.mockImplementation(async (callback) => {
            callback([
                'grp_1',
                '2026-01-01T00:00:00.000Z',
                'member',
                'visible',
                '2026-01-02T00:00:00.000Z'
            ]);
            return undefined;
        });

        const result = await friendGroups.getFriendGroups('usr_1');

        expect(result).toEqual([
            {
                groupId: 'grp_1',
                joinedAt: '2026-01-01T00:00:00.000Z',
                membershipStatus: 'member',
                visibility: 'visible',
                fetchedAt: '2026-01-02T00:00:00.000Z'
            }
        ]);
        expect(mocks.execute.mock.calls[0][1]).toContain(
            'WHERE friend_id = @friend_id'
        );
        expect(mocks.execute.mock.calls[0][2]).toEqual({
            '@friend_id': 'usr_1'
        });
    });
});

describe('friendGroups.getFriendGroupFetchTimes', () => {
    test('maps friend id to latest fetch time', async () => {
        mocks.execute.mockImplementation(async (callback) => {
            callback(['usr_1', '2026-01-02T00:00:00.000Z']);
            callback(['usr_2', null]);
            return undefined;
        });

        const result = await friendGroups.getFriendGroupFetchTimes();

        expect(result).toEqual(
            new Map([
                ['usr_1', '2026-01-02T00:00:00.000Z'],
                ['usr_2', null]
            ])
        );
        expect(mocks.execute.mock.calls[0][1]).toContain(
            'SELECT friend_id, MAX(fetched_at) FROM testuser_friend_groups GROUP BY friend_id'
        );
    });
});

describe('friendGroups.upsertCacheGroups', () => {
    test('bulk upserts group cache rows', async () => {
        await friendGroups.upsertCacheGroups([
            {
                id: 'grp_1',
                name: "Dance O'Club",
                shortCode: 'DNC',
                discriminator: '1234',
                description: 'desc',
                iconUrl: 'https://x/i.png',
                bannerUrl: 'https://x/b.png',
                privacy: 'public',
                memberCount: 500
            }
        ]);

        const sql = mocks.executeNonQuery.mock.calls[0][0];
        expect(sql).toContain(
            'INSERT OR REPLACE INTO testuser_cache_group (id, added_at, updated_at, name, short_code, discriminator, description, icon_url, banner_url, privacy, member_count) VALUES'
        );
        expect(sql).toContain("'Dance O''Club'");
        expect(sql).toContain('500');
        expect(sql).toContain("'public'");
    });

    test('coerces missing memberCount to 0', async () => {
        await friendGroups.upsertCacheGroups([{ id: 'grp_2' }]);

        const sql = mocks.executeNonQuery.mock.calls[0][0];
        expect(sql).toContain("'grp_2'");
        expect(sql).toMatch(/, 0\)$/);
    });

    test('is a no-op for empty input', async () => {
        await friendGroups.upsertCacheGroups([]);
        expect(mocks.executeNonQuery).not.toHaveBeenCalled();
    });
});

describe('friendGroups.getCachedGroups', () => {
    test('maps all cached groups into a map', async () => {
        mocks.execute.mockImplementation(async (callback) => {
            callback([
                'grp_1',
                'Dance',
                'DNC',
                '1234',
                'desc',
                'https://i.png',
                'https://b.png',
                'public',
                500
            ]);
            return undefined;
        });

        const result = await friendGroups.getCachedGroups();

        expect(result.get('grp_1')).toEqual({
            id: 'grp_1',
            name: 'Dance',
            shortCode: 'DNC',
            discriminator: '1234',
            description: 'desc',
            iconUrl: 'https://i.png',
            bannerUrl: 'https://b.png',
            privacy: 'public',
            memberCount: 500
        });
    });
});

describe('friendGroups.getPopularGroups', () => {
    test('builds the aggregation query and maps rows', async () => {
        mocks.execute.mockImplementation(async (callback) => {
            callback([
                'grp_1',
                'Dance',
                'DNC',
                '1234',
                'desc',
                'https://i.png',
                'https://b.png',
                'public',
                500,
                12
            ]);
            return undefined;
        });

        const result = await friendGroups.getPopularGroups(2, 50);

        expect(result).toEqual([
            {
                groupId: 'grp_1',
                name: 'Dance',
                shortCode: 'DNC',
                discriminator: '1234',
                description: 'desc',
                iconUrl: 'https://i.png',
                bannerUrl: 'https://b.png',
                privacy: 'public',
                memberCount: 500,
                friendCount: 12
            }
        ]);
        const [sql, params] = mocks.execute.mock.calls[0].slice(1);
        expect(sql).toContain(
            'INNER JOIN testuser_friend_groups f ON f.group_id = g.id'
        );
        expect(sql).toContain('GROUP BY g.id');
        expect(sql).toContain('HAVING COUNT(f.friend_id) >= @minFriends');
        expect(sql).toContain(
            'ORDER BY friend_count DESC, g.member_count DESC'
        );
        expect(sql).toContain('LIMIT @limit');
        expect(params).toEqual({ '@minFriends': 2, '@limit': 50 });
    });
});

describe('friendGroups.getPopularGroupFriendIds', () => {
    test('splits GROUP_CONCAT into friend id arrays', async () => {
        mocks.execute.mockImplementation(async (callback) => {
            callback(['grp_1', 'usr_1,usr_2,usr_3']);
            callback(['grp_2', null]);
            return undefined;
        });

        const result = await friendGroups.getPopularGroupFriendIds(2);

        expect(result.get('grp_1')).toEqual(['usr_1', 'usr_2', 'usr_3']);
        expect(result.get('grp_2')).toEqual([]);
        expect(mocks.execute.mock.calls[0][1]).toContain(
            'GROUP_CONCAT(friend_id)'
        );
    });
});
