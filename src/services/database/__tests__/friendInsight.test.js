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
        userPrefix: 'usr_test'
    }
}));

import {
    FRIEND_INSIGHT_DATA_TYPES,
    friendInsight,
    normalizeDataTypes
} from '../friendInsight.js';

function currentFriendRow(id = 'usr_alice') {
    return [id, 'Alice', 'Trusted User', 4];
}

describe('friendInsight', () => {
    beforeEach(() => {
        mocks.execute.mockReset();
    });

    test('uses every supported type when data types are omitted', () => {
        expect(normalizeDataTypes()).toEqual(FRIEND_INSIGHT_DATA_TYPES);
        expect(normalizeDataTypes(['status', 'untrusted', 'status'])).toEqual([
            'status'
        ]);
    });

    test('resolves names from the current friend table with escaped LIKE input', async () => {
        mocks.execute.mockImplementation(async (callback) => {
            callback(currentFriendRow());
        });

        const result = await friendInsight.resolveFriendInsightFriends('Ali_%');

        expect(result).toEqual([
            {
                userId: 'usr_alice',
                displayName: 'Alice',
                trustLevel: 'Trusted User',
                friendNumber: 4
            }
        ]);
        expect(mocks.execute.mock.calls[0][1]).toContain(
            'FROM usr_test_friend_log_current'
        );
        expect(mocks.execute.mock.calls[0][2]['@query']).toBe('%Ali\\_\\%%');
    });

    test('only requests events for verified current friends', async () => {
        mocks.execute.mockImplementation(async (callback, sql) => {
            if (sql.includes('friend_log_current')) {
                callback(currentFriendRow());
                return;
            }
            callback([
                9,
                '2026-07-01T12:00:00.000Z',
                'usr_alice',
                'Alice',
                'status',
                null,
                null,
                null,
                null,
                'active',
                'hello',
                'join me',
                '',
                null,
                null,
                null,
                null,
                null
            ]);
        });

        const result = await friendInsight.getFriendInsightTimeline({
            friendIds: ['usr_alice', 'usr_not_a_friend'],
            dataTypes: ['status'],
            from: '2026-07-01T00:00:00.000Z',
            limit: 1
        });

        expect(result.currentFriends).toHaveLength(1);
        expect(result.events).toEqual([
            expect.objectContaining({
                userId: 'usr_alice',
                type: 'status',
                status: 'active',
                statusDescription: 'hello'
            })
        ]);
        expect(result.hasMore).toBe(false);
        expect(result.nextCursor).toBeNull();
        const timelineCall = mocks.execute.mock.calls[1];
        expect(timelineCall[1]).toContain('FROM usr_test_feed_status');
        expect(timelineCall[1]).not.toContain('usr_not_a_friend');
        expect(timelineCall[2]).toMatchObject({
            '@friend_0': 'usr_alice',
            '@from': '2026-07-01T00:00:00.000Z',
            '@limit': 2
        });
    });

    test('does not query history when no requested IDs are current friends', async () => {
        mocks.execute.mockResolvedValue(undefined);

        const result = await friendInsight.getFriendInsightRelationships({
            friendIds: ['usr_former_friend']
        });

        expect(result).toEqual({
            currentFriends: [],
            history: [],
            mutuals: [],
            hasMore: false,
            nextCursor: null
        });
        expect(mocks.execute).toHaveBeenCalledTimes(1);
    });

    test('returns relationship history and cached mutual metadata for a current friend', async () => {
        let call = 0;
        mocks.execute.mockImplementation(async (callback) => {
            call++;
            if (call === 1) {
                callback(currentFriendRow());
            } else if (call === 2) {
                callback([
                    4,
                    '2026-06-01T00:00:00.000Z',
                    'Friend',
                    'usr_alice',
                    'Alice',
                    null,
                    null,
                    null,
                    4
                ]);
            } else {
                callback([
                    'usr_alice',
                    'usr_bob',
                    '2026-06-05T00:00:00.000Z',
                    1
                ]);
            }
        });

        const result = await friendInsight.getFriendInsightRelationships({
            friendIds: ['usr_alice']
        });

        expect(result.history[0]).toMatchObject({
            type: 'Friend',
            userId: 'usr_alice'
        });
        expect(result.mutuals).toEqual([
            {
                friendId: 'usr_alice',
                mutualIds: ['usr_bob'],
                lastFetchedAt: '2026-06-05T00:00:00.000Z',
                optedOut: true
            }
        ]);
    });
});
