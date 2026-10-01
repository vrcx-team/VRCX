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

    test('maps the newest row to the resolved location', async () => {
        respondWith(['2026-01-15T10:00:00.000Z', 'wrld_left:1~hidden(usr_x)', 'Some World']);

        const result = await feed.getLastKnownGPSLocation({ id: 'usr_1', displayName: 'Alice' });

        expect(result).toEqual({
            createdAt: '2026-01-15T10:00:00.000Z',
            location: 'wrld_left:1~hidden(usr_x)',
            worldName: 'Some World'
        });
    });

    test('falls back to empty strings for missing columns', async () => {
        respondWith([null, null, null]);

        expect(await feed.getLastKnownGPSLocation({ id: 'usr_1' })).toEqual({
            createdAt: '',
            location: '',
            worldName: ''
        });
    });

    test('returns null when no row matches', async () => {
        respondEmpty();

        expect(await feed.getLastKnownGPSLocation({ id: 'usr_1' })).toBeNull();
    });

    test('returns null without querying when there is no id or display name', async () => {
        expect(await feed.getLastKnownGPSLocation({})).toBeNull();
        expect(await feed.getLastKnownGPSLocation(null)).toBeNull();
        expect(mocks.execute).not.toHaveBeenCalled();
    });

    test('only considers transitions out of a real world', async () => {
        respondWith(['2026-01-15T10:00:00.000Z', 'wrld_left:1', '']);

        await feed.getLastKnownGPSLocation({ id: 'usr_1', displayName: 'Alice' });

        const [callback, sql, params] = mocks.execute.mock.calls[0];
        expect(typeof callback).toBe('function');
        expect(sql).toContain('usr_test_feed_gps');
        // The location to show is the one the player came from.
        expect(sql).toContain("COALESCE(previous_location, '') LIKE 'wrld_%'");
        expect(sql).toContain("COALESCE(location, '') NOT LIKE 'wrld_%'");
        // World name comes from another row of that location, then the world cache.
        expect(sql).toContain('cache_world');
        expect(sql).toContain('ORDER BY created_at DESC, id DESC');
        expect(params).toEqual({ '@userId': 'usr_1', '@displayName': 'Alice' });
    });

    test('reads the row positionally', async () => {
        const row = ['2026-01-15T10:00:00.000Z', 'wrld_left:1', 'Some World'];
        respondWith(row);

        const result = await feed.getLastKnownGPSLocation({ id: 'usr_1' });

        expect(result.createdAt).toBe(row[0]);
        expect(result.location).toBe(row[1]);
        expect(result.worldName).toBe(row[2]);
    });
});
