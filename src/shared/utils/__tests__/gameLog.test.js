import {
    compareGameLogRows,
    createJoinLeaveEntry,
    createLocationEntry,
    createPortalSpawnEntry,
    createResourceLoadEntry,
    gameLogSearchFilter,
    getGameLogCreatedAtTs,
    parseInventoryFromUrl,
    parsePrintFromUrl
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

describe('createLocationEntry', () => {
    test('creates entry with correct shape', () => {
        const entry = createLocationEntry(
            '2024-01-15T12:00:00Z',
            'wrld_abc123~12345',
            'wrld_abc123',
            'Test World'
        );
        expect(entry).toEqual({
            created_at: '2024-01-15T12:00:00Z',
            type: 'Location',
            location: 'wrld_abc123~12345',
            worldId: 'wrld_abc123',
            worldName: 'Test World',
            groupName: '',
            time: 0
        });
    });
});

describe('createJoinLeaveEntry', () => {
    test('creates OnPlayerJoined entry with default time', () => {
        const entry = createJoinLeaveEntry(
            'OnPlayerJoined',
            '2024-01-15T12:00:00Z',
            'Alice',
            'wrld_abc~123',
            'usr_abc'
        );
        expect(entry).toEqual({
            created_at: '2024-01-15T12:00:00Z',
            type: 'OnPlayerJoined',
            displayName: 'Alice',
            location: 'wrld_abc~123',
            userId: 'usr_abc',
            time: 0
        });
    });

    test('creates OnPlayerLeft entry with custom time', () => {
        const entry = createJoinLeaveEntry(
            'OnPlayerLeft',
            '2024-01-15T12:30:00Z',
            'Bob',
            'wrld_xyz~456',
            'usr_xyz',
            1800000
        );
        expect(entry.type).toBe('OnPlayerLeft');
        expect(entry.time).toBe(1800000);
    });
});

describe('createPortalSpawnEntry', () => {
    test('creates portal spawn entry with empty defaults', () => {
        const entry = createPortalSpawnEntry(
            '2024-01-15T12:00:00Z',
            'wrld_abc~123'
        );
        expect(entry).toEqual({
            created_at: '2024-01-15T12:00:00Z',
            type: 'PortalSpawn',
            location: 'wrld_abc~123',
            displayName: '',
            userId: '',
            instanceId: '',
            worldName: ''
        });
    });
});

describe('createResourceLoadEntry', () => {
    test('maps resource-load-string to StringLoad', () => {
        const entry = createResourceLoadEntry(
            'resource-load-string',
            '2024-01-15T12:00:00Z',
            'https://cdn.example.com/res.json',
            'wrld_abc~123'
        );
        expect(entry.type).toBe('StringLoad');
        expect(entry.resourceUrl).toBe('https://cdn.example.com/res.json');
    });

    test('maps resource-load-image to ImageLoad', () => {
        const entry = createResourceLoadEntry(
            'resource-load-image',
            '2024-01-15T12:00:00Z',
            'https://cdn.example.com/img.png',
            'wrld_abc~123'
        );
        expect(entry.type).toBe('ImageLoad');
    });
});

describe('parseInventoryFromUrl', () => {
    test('parses valid inventory URL', () => {
        const url =
            'https://api.vrchat.cloud/api/1/user/usr_032383a7-748c-4fb2-94e4-bcb928e5de6b/inventory/inv_75781d65-92fe-4a80-a1ff-27ee6e843b08';
        const result = parseInventoryFromUrl(url);
        expect(result).toEqual({
            userId: 'usr_032383a7-748c-4fb2-94e4-bcb928e5de6b',
            inventoryId: 'inv_75781d65-92fe-4a80-a1ff-27ee6e843b08'
        });
    });

    test('returns null for non-inventory URL', () => {
        expect(
            parseInventoryFromUrl(
                'https://api.vrchat.cloud/api/1/user/usr_abc/avatar'
            )
        ).toBeNull();
    });

    test('returns null for invalid URL', () => {
        expect(parseInventoryFromUrl('not a url')).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(parseInventoryFromUrl('')).toBeNull();
    });

    test('returns null if inventoryId length is wrong', () => {
        expect(
            parseInventoryFromUrl(
                'https://api.vrchat.cloud/api/1/user/usr_abc/inventory/inv_short'
            )
        ).toBeNull();
    });
});

describe('parsePrintFromUrl', () => {
    test('parses valid print URL', () => {
        // printId is 41 chars: prnt_ (5) + UUID (36)
        const printId = 'prnt_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        const url = `https://api.vrchat.cloud/api/1/prints/${printId}`;
        const result = parsePrintFromUrl(url);
        expect(result).toBe(printId);
    });

    test('returns null for non-print URL', () => {
        expect(
            parsePrintFromUrl('https://api.vrchat.cloud/api/1/user/usr_abc')
        ).toBeNull();
    });

    test('returns null for invalid URL', () => {
        expect(parsePrintFromUrl('not a url')).toBeNull();
    });

    test('returns null if printId has wrong length', () => {
        expect(
            parsePrintFromUrl('https://api.vrchat.cloud/api/1/prints/short')
        ).toBeNull();
    });
});
