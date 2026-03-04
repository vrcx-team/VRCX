import {
    compareGameLogRows,
    gameLogSearchFilter,
    getGameLogCreatedAtTs
} from '../gameLog';

describe('gameLogSearchFilter', () => {
    test('returns true for empty search query', () => {
        expect(gameLogSearchFilter({}, '')).toBe(true);
        expect(gameLogSearchFilter({}, '   ')).toBe(true);
    });

    test('matches Location by worldName', () => {
        const row = { type: 'Location', worldName: 'Test World' };
        expect(gameLogSearchFilter(row, 'test')).toBe(true);
        expect(gameLogSearchFilter(row, 'WORLD')).toBe(true);
        expect(gameLogSearchFilter(row, 'nope')).toBe(false);
    });

    test('matches OnPlayerJoined by displayName', () => {
        const row = { type: 'OnPlayerJoined', displayName: 'Alice' };
        expect(gameLogSearchFilter(row, 'alice')).toBe(true);
        expect(gameLogSearchFilter(row, 'bob')).toBe(false);
    });

    test('matches OnPlayerLeft by displayName', () => {
        const row = { type: 'OnPlayerLeft', displayName: 'Bob' };
        expect(gameLogSearchFilter(row, 'bob')).toBe(true);
        expect(gameLogSearchFilter(row, 'alice')).toBe(false);
    });

    test('matches PortalSpawn by displayName or worldName', () => {
        const row = {
            type: 'PortalSpawn',
            displayName: 'Alice',
            worldName: 'Portal Room'
        };
        expect(gameLogSearchFilter(row, 'alice')).toBe(true);
        expect(gameLogSearchFilter(row, 'portal')).toBe(true);
        expect(gameLogSearchFilter(row, 'bob')).toBe(false);
    });

    test('matches Event by data', () => {
        const row = { type: 'Event', data: 'something happened' };
        expect(gameLogSearchFilter(row, 'something')).toBe(true);
        expect(gameLogSearchFilter(row, 'nothing')).toBe(false);
    });

    test('matches External by message or displayName', () => {
        const row = {
            type: 'External',
            message: 'hello world',
            displayName: 'Plugin'
        };
        expect(gameLogSearchFilter(row, 'hello')).toBe(true);
        expect(gameLogSearchFilter(row, 'plugin')).toBe(true);
        expect(gameLogSearchFilter(row, 'foo')).toBe(false);
    });

    test('matches VideoPlay by displayName, videoName, or videoUrl', () => {
        const row = {
            type: 'VideoPlay',
            displayName: 'Alice',
            videoName: 'Cool Song',
            videoUrl: 'https://example.com/video'
        };
        expect(gameLogSearchFilter(row, 'alice')).toBe(true);
        expect(gameLogSearchFilter(row, 'cool')).toBe(true);
        expect(gameLogSearchFilter(row, 'example.com')).toBe(true);
        expect(gameLogSearchFilter(row, 'nope')).toBe(false);
    });

    test('matches StringLoad/ImageLoad by resourceUrl', () => {
        const rowStr = {
            type: 'StringLoad',
            resourceUrl: 'https://cdn.example.com/res'
        };
        expect(gameLogSearchFilter(rowStr, 'cdn')).toBe(true);
        expect(gameLogSearchFilter(rowStr, 'nope')).toBe(false);

        const rowImg = {
            type: 'ImageLoad',
            resourceUrl: 'https://cdn.example.com/img'
        };
        expect(gameLogSearchFilter(rowImg, 'img')).toBe(true);
    });

    test('matches location prefix wrld_ or grp_ against row.location', () => {
        const row = {
            type: 'Location',
            location: 'wrld_123456~hidden',
            worldName: 'Test'
        };
        expect(gameLogSearchFilter(row, 'wrld_123456')).toBe(true);
        expect(gameLogSearchFilter(row, 'wrld_999')).toBe(false);
    });

    test('returns true for unknown type', () => {
        const row = { type: 'SomeNewType' };
        expect(gameLogSearchFilter(row, 'anything')).toBe(true);
    });
});

describe('getGameLogCreatedAtTs', () => {
    test('returns millisecond timestamp from millis number', () => {
        expect(getGameLogCreatedAtTs({ created_at: 1700000000000 })).toBe(
            1700000000000
        );
    });

    test('converts seconds to millis for small numbers', () => {
        expect(getGameLogCreatedAtTs({ created_at: 1700000000 })).toBe(
            1700000000000
        );
    });

    test('parses ISO string via Date.parse', () => {
        const ts = getGameLogCreatedAtTs({
            created_at: '2024-01-15T12:00:00Z'
        });
        expect(ts).toBe(Date.parse('2024-01-15T12:00:00Z'));
    });

    test('supports createdAt alias', () => {
        expect(getGameLogCreatedAtTs({ createdAt: 1700000000000 })).toBe(
            1700000000000
        );
    });

    test('supports dt alias', () => {
        expect(getGameLogCreatedAtTs({ dt: 1700000000000 })).toBe(
            1700000000000
        );
    });

    test('returns 0 for null/undefined row', () => {
        expect(getGameLogCreatedAtTs(null)).toBe(0);
        expect(getGameLogCreatedAtTs(undefined)).toBe(0);
    });

    test('returns 0 for missing timestamp fields', () => {
        expect(getGameLogCreatedAtTs({})).toBe(0);
    });

    test('returns 0 for unparseable string', () => {
        expect(getGameLogCreatedAtTs({ created_at: 'not-a-date' })).toBe(0);
    });

    test('returns 0 for NaN number', () => {
        expect(getGameLogCreatedAtTs({ created_at: NaN })).toBe(0);
    });
});

describe('compareGameLogRows', () => {
    test('sorts by timestamp descending (newest first)', () => {
        const a = { created_at: 2000 };
        const b = { created_at: 1000 };
        expect(compareGameLogRows(a, b)).toBeLessThan(0);
        expect(compareGameLogRows(b, a)).toBeGreaterThan(0);
    });

    test('equal timestamps → sorts by rowId descending', () => {
        const a = { created_at: 1000, rowId: 10 };
        const b = { created_at: 1000, rowId: 5 };
        expect(compareGameLogRows(a, b)).toBeLessThan(0);
        expect(compareGameLogRows(b, a)).toBeGreaterThan(0);
    });

    test('equal timestamp and rowId → sorts by uid reverse-lex', () => {
        const a = { created_at: 1000, rowId: 1, uid: 'bbb' };
        const b = { created_at: 1000, rowId: 1, uid: 'aaa' };
        expect(compareGameLogRows(a, b)).toBeLessThan(0);
        expect(compareGameLogRows(b, a)).toBeGreaterThan(0);
    });

    test('returns 0 for identical rows', () => {
        const row = { created_at: 1000, rowId: 1, uid: 'aaa' };
        expect(compareGameLogRows(row, row)).toBe(0);
    });

    test('handles missing fields gracefully', () => {
        const a = {};
        const b = {};
        expect(compareGameLogRows(a, b)).toBe(0);
    });
});
