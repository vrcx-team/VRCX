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
        userPrefix: 'testuser'
    }
}));

import { friendGroups } from '../friendGroups.js';

describe('friendGroups.saveFriendGroupsSnapshot', () => {
    beforeEach(() => {
        mocks.execute.mockReset();
        mocks.executeNonQuery.mockReset();
        mocks.executeNonQuery.mockResolvedValue(undefined);
    });

    test('never inlines group text fields into the SQL string, always binds them as parameters', async () => {
        const trickyName = "Bob's ❤️🧡💛💚💙💜🖤 Group; DROP TABLE testuser_friend_groups_info;--";
        const links = new Map([['usr_friend1', ['grp_1']]]);
        const groupInfos = new Map([
            [
                'grp_1',
                {
                    name: trickyName,
                    shortCode: 'ABC',
                    discriminator: '0000',
                    iconUrl: 'https://example.com/icon.png',
                    bannerUrl: '',
                    memberCount: 42,
                    ownerId: 'usr_owner'
                }
            ]
        ]);

        await friendGroups.saveFriendGroupsSnapshot(links, groupInfos);

        const infoCall = mocks.executeNonQuery.mock.calls.find(([sql]) =>
            sql.includes('testuser_friend_groups_info')
        );
        expect(infoCall).toBeDefined();
        const [sql, args] = infoCall;

        // The raw name text must never appear inlined in the SQL string itself.
        expect(sql.includes(trickyName)).toBe(false);
        // Only @-prefixed placeholders should appear in the VALUES clause.
        expect(sql).toMatch(/VALUES \(@p0_0, @p0_1, @p0_2, @p0_3, @p0_4, @p0_5, @p0_6, @p0_7, @p0_8\)/);
        // The value is bound as a parameter instead.
        expect(Object.values(args)).toContain(trickyName);
    });

    test('binds friend_id/group_id link rows as parameters', async () => {
        const links = new Map([['usr_friend1', ['grp_1', 'grp_2']]]);

        await friendGroups.saveFriendGroupsSnapshot(links, new Map());

        const linkInsertCall = mocks.executeNonQuery.mock.calls.find(
            ([sql]) =>
                sql.includes('INSERT OR REPLACE INTO testuser_friend_groups_links')
        );
        expect(linkInsertCall).toBeDefined();
        const [sql, args] = linkInsertCall;
        expect(sql).toContain('VALUES (@p0_0, @p0_1), (@p1_0, @p1_1)');
        expect(args).toMatchObject({
            '@p0_0': 'usr_friend1',
            '@p0_1': 'grp_1',
            '@p1_0': 'usr_friend1',
            '@p1_1': 'grp_2'
        });
    });

    test('batches inserts in chunks so parameter counts stay bounded', async () => {
        const groupIds = Array.from({ length: 150 }, (_, i) => `grp_${i}`);
        const links = new Map([['usr_friend1', groupIds]]);

        await friendGroups.saveFriendGroupsSnapshot(links, new Map());

        const linkInsertCalls = mocks.executeNonQuery.mock.calls.filter(
            ([sql]) =>
                sql.includes('INSERT OR REPLACE INTO testuser_friend_groups_links')
        );
        // 150 rows at 100/batch => 2 batches
        expect(linkInsertCalls).toHaveLength(2);
    });

    test('does nothing when userPrefix is not set', async () => {
        const { dbVars } = await import('../index.js');
        dbVars.userPrefix = '';

        await friendGroups.saveFriendGroupsSnapshot(new Map(), new Map());

        expect(mocks.executeNonQuery).not.toHaveBeenCalled();

        dbVars.userPrefix = 'testuser';
    });
});

describe('friendGroups.upsertFriendGroupsMeta / bulkUpsertFriendGroupsMeta', () => {
    beforeEach(() => {
        mocks.executeNonQuery.mockReset();
        mocks.executeNonQuery.mockResolvedValue(undefined);
    });

    test('upsertFriendGroupsMeta binds values as parameters', async () => {
        await friendGroups.upsertFriendGroupsMeta('usr_friend1', {
            unavailable: true
        });

        expect(mocks.executeNonQuery).toHaveBeenCalledTimes(1);
        const [sql, args] = mocks.executeNonQuery.mock.calls[0];
        expect(sql).toContain(
            'VALUES (@friend_id, @last_fetched_at, @unavailable)'
        );
        expect(args['@friend_id']).toBe('usr_friend1');
        expect(args['@unavailable']).toBe(1);
    });

    test('bulkUpsertFriendGroupsMeta binds friend ids as parameters', async () => {
        const entries = new Map([
            ['usr_friend1', { unavailable: false }],
            ['usr_friend2', { unavailable: true }]
        ]);

        await friendGroups.bulkUpsertFriendGroupsMeta(entries);

        expect(mocks.executeNonQuery).toHaveBeenCalledTimes(1);
        const [sql, args] = mocks.executeNonQuery.mock.calls[0];
        expect(sql).toContain('VALUES (@p0_0, @p0_1, @p0_2), (@p1_0, @p1_1, @p1_2)');
        expect(args).toMatchObject({
            '@p0_0': 'usr_friend1',
            '@p0_2': 0,
            '@p1_0': 'usr_friend2',
            '@p1_2': 1
        });
    });
});
