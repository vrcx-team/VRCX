import { LogWatcherService } from '../gameLog.js';

const svc = new LogWatcherService();

describe('parseRawGameLog', () => {
    test('parses location type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'location', [
            'wrld_123:456',
            'Test World'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'location',
            location: 'wrld_123:456',
            worldName: 'Test World'
        });
    });

    test('parses location-destination type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'location-destination', [
            'wrld_abc:789'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'location-destination',
            location: 'wrld_abc:789'
        });
    });

    test('parses player-joined type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'player-joined', [
            'TestUser',
            'usr_123'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'player-joined',
            displayName: 'TestUser',
            userId: 'usr_123'
        });
    });

    test('parses player-left type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'player-left', [
            'TestUser',
            'usr_123'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'player-left',
            displayName: 'TestUser',
            userId: 'usr_123'
        });
    });

    test('parses notification type', () => {
        const json = '{"type":"invite"}';
        const log = svc.parseRawGameLog('2024-01-01', 'notification', [json]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'notification',
            json
        });
    });

    test('parses event type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'event', ['some-event']);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'event',
            event: 'some-event'
        });
    });

    test('parses video-play type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'video-play', [
            'https://example.com/video.mp4',
            'Player1'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'video-play',
            videoUrl: 'https://example.com/video.mp4',
            displayName: 'Player1'
        });
    });

    test('parses resource-load-string type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'resource-load-string', [
            'https://example.com/res'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'resource-load-string',
            resourceUrl: 'https://example.com/res'
        });
    });

    test('parses resource-load-image type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'resource-load-image', [
            'https://example.com/img.png'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'resource-load-image',
            resourceUrl: 'https://example.com/img.png'
        });
    });

    test('parses avatar-change type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'avatar-change', [
            'User1',
            'CoolAvatar'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'avatar-change',
            displayName: 'User1',
            avatarName: 'CoolAvatar'
        });
    });

    test('parses photon-id type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'photon-id', [
            'User1',
            '42'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'photon-id',
            displayName: 'User1',
            photonId: '42'
        });
    });

    test('parses screenshot type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'screenshot', [
            '/path/to/screenshot.png'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'screenshot',
            screenshotPath: '/path/to/screenshot.png'
        });
    });

    test('parses sticker-spawn type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'sticker-spawn', [
            'usr_abc',
            'StickerUser',
            'inv_123'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'sticker-spawn',
            userId: 'usr_abc',
            displayName: 'StickerUser',
            inventoryId: 'inv_123'
        });
    });

    test('parses video-sync type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'video-sync', [
            '123.456'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'video-sync',
            timestamp: '123.456'
        });
    });

    test('parses vrcx type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'vrcx', ['some-data']);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'vrcx',
            data: 'some-data'
        });
    });

    test('parses api-request type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'api-request', [
            'https://api.vrchat.cloud/api/1/users'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'api-request',
            url: 'https://api.vrchat.cloud/api/1/users'
        });
    });

    test('parses udon-exception type', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'udon-exception', [
            'NullRef'
        ]);
        expect(log).toEqual({
            dt: '2024-01-01',
            type: 'udon-exception',
            data: 'NullRef'
        });
    });

    test('handles types with no extra fields', () => {
        for (const type of [
            'portal-spawn',
            'vrc-quit',
            'openvr-init',
            'desktop-mode'
        ]) {
            const log = svc.parseRawGameLog('2024-01-01', type, []);
            expect(log).toEqual({ dt: '2024-01-01', type });
        }
    });

    test('handles unknown type gracefully', () => {
        const log = svc.parseRawGameLog('2024-01-01', 'unknown-type', ['foo']);
        expect(log).toEqual({ dt: '2024-01-01', type: 'unknown-type' });
    });
});
