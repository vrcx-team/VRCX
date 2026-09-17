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

import { feed } from '../feed.js';

/**
 * @param row
 */
function respondWith(row) {
    mocks.execute.mockImplementationOnce(async (callback) => {
        callback(row);
        return undefined;
    });
}

function respondEmpty() {
    mocks.execute.mockImplementationOnce(async () => undefined);
}

describe('feed.getLastKnownGPSLocation', () => {
    beforeEach(() => {
        mocks.execute.mockReset();
    });

    test('prefers the transition into a hidden state and its previous location', async () => {
        respondWith(['2026-01-15T09:00:00.000Z', 'private', 'wrld_left:43160', '']);

        const result = await feed.getLastKnownGPSLocation({ id: 'usr_1', displayName: 'Alice' });

        expect(result).toEqual({
            createdAt: '2026-01-15T09:00:00.000Z',
            location: 'private',
            previousLocation: 'wrld_left:43160',
            worldName: ''
        });
        // The hidden-state query matched, so the fallback must not run.
        expect(mocks.execute).toHaveBeenCalledTimes(1);
        expect(mocks.execute.mock.calls[0][1]).toContain("previous_location LIKE 'wrld_%'");
    });

    test('falls back to the last real location when there is no hidden transition', async () => {
        respondEmpty();
        respondWith(['2026-01-15T09:30:00.000Z', 'wrld_now:999', 'private', 'Some World']);

        const result = await feed.getLastKnownGPSLocation({ id: 'usr_1', displayName: '' });

        expect(result).toEqual({
            createdAt: '2026-01-15T09:30:00.000Z',
            location: 'wrld_now:999',
            previousLocation: 'private',
            worldName: 'Some World'
        });
        expect(mocks.execute).toHaveBeenCalledTimes(2);
        expect(mocks.execute.mock.calls[1][1]).toContain("location LIKE 'wrld_%'");
    });

    test('returns null when neither query matches', async () => {
        respondEmpty();
        respondEmpty();

        expect(await feed.getLastKnownGPSLocation({ id: 'usr_1' })).toBeNull();
        expect(mocks.execute).toHaveBeenCalledTimes(2);
    });

    test('returns null without querying when there is no id or display name', async () => {
        expect(await feed.getLastKnownGPSLocation({})).toBeNull();
        expect(await feed.getLastKnownGPSLocation(null)).toBeNull();
        expect(mocks.execute).not.toHaveBeenCalled();
    });

    test('queries by user id or display name, scoped to the gps table', async () => {
        respondWith(['2026-01-15T09:00:00.000Z', 'private', 'wrld_left:1', '']);

        await feed.getLastKnownGPSLocation({ id: 'usr_1', displayName: 'Alice' });

        const [callback, sql, params] = mocks.execute.mock.calls[0];
        expect(typeof callback).toBe('function');
        expect(sql).toContain('usr_test_feed_gps');
        expect(sql).toContain('ORDER BY created_at DESC, id DESC');
        expect(params).toEqual({ '@userId': 'usr_1', '@displayName': 'Alice' });
    });

    test('falls back to empty strings for missing columns', async () => {
        respondWith([null, null, null, null]);

        const result = await feed.getLastKnownGPSLocation({ id: 'usr_1' });

        expect(result).toEqual({ createdAt: '', location: '', previousLocation: '', worldName: '' });
    });
});

describe('feed.getWorldNameByLocation', () => {
    beforeEach(() => {
        mocks.execute.mockReset();
    });

    test('reads the name from another GPS row of the same location', async () => {
        respondWith(['Resolved World']);

        const name = await feed.getWorldNameByLocation('wrld_abc:123');

        expect(name).toBe('Resolved World');
        expect(mocks.execute).toHaveBeenCalledTimes(1);
    });

    test('falls back to the cached world when the feed has no name', async () => {
        respondEmpty();
        respondWith(['Cached World']);

        const name = await feed.getWorldNameByLocation('wrld_abc:123');

        expect(name).toBe('Cached World');
        expect(mocks.execute).toHaveBeenCalledTimes(2);
        expect(mocks.execute.mock.calls[1][1]).toContain('cache_world');
        expect(mocks.execute.mock.calls[1][2]).toEqual({ '@worldId': 'wrld_abc' });
    });

    test('returns an empty name when nothing resolves', async () => {
        respondEmpty();
        respondEmpty();

        expect(await feed.getWorldNameByLocation('wrld_abc:123')).toBe('');
    });

    test('returns an empty name without querying for a non-world location', async () => {
        expect(await feed.getWorldNameByLocation('private')).toBe('');
        expect(await feed.getWorldNameByLocation('')).toBe('');
        expect(await feed.getWorldNameByLocation(undefined)).toBe('');
        expect(mocks.execute).not.toHaveBeenCalled();
    });
});
