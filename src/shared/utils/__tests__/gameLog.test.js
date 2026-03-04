import { gameLogSearchFilter } from '../gameLog';

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
