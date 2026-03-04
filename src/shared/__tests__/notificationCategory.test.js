import {
    FRIEND_TYPES,
    GROUP_EXACT_TYPES,
    getNotificationCategory,
    getNotificationTs
} from '../utils/notificationCategory';

describe('getNotificationCategory', () => {
    test('returns "other" for falsy type', () => {
        expect(getNotificationCategory('')).toBe('other');
        expect(getNotificationCategory(null)).toBe('other');
        expect(getNotificationCategory(undefined)).toBe('other');
    });

    test('returns "friend" for friend types', () => {
        for (const type of FRIEND_TYPES) {
            expect(getNotificationCategory(type)).toBe('friend');
        }
    });

    test('returns "group" for group exact types', () => {
        for (const type of GROUP_EXACT_TYPES) {
            expect(getNotificationCategory(type)).toBe('group');
        }
    });

    test('returns "group" for group prefix types', () => {
        expect(getNotificationCategory('group.announcement')).toBe('group');
        expect(getNotificationCategory('group.invite')).toBe('group');
        expect(getNotificationCategory('group.transfer')).toBe('group');
        expect(getNotificationCategory('moderation.warning')).toBe('group');
    });

    test('returns "other" for unknown types', () => {
        expect(getNotificationCategory('OnPlayerJoined')).toBe('other');
        expect(getNotificationCategory('GPS')).toBe('other');
        expect(getNotificationCategory('VideoPlay')).toBe('other');
    });
});

describe('getNotificationTs', () => {
    test('returns millisecond timestamp from created_at string', () => {
        const ts = getNotificationTs({
            created_at: '2024-01-01T00:00:00.000Z'
        });
        expect(ts).toBe(new Date('2024-01-01T00:00:00.000Z').getTime());
    });

    test('returns millisecond timestamp from createdAt string', () => {
        const ts = getNotificationTs({
            createdAt: '2024-06-15T12:00:00.000Z'
        });
        expect(ts).toBe(new Date('2024-06-15T12:00:00.000Z').getTime());
    });

    test('prefers created_at over createdAt', () => {
        const ts = getNotificationTs({
            created_at: '2024-01-01T00:00:00.000Z',
            createdAt: '2025-01-01T00:00:00.000Z'
        });
        expect(ts).toBe(new Date('2024-01-01T00:00:00.000Z').getTime());
    });

    test('handles numeric millisecond timestamp', () => {
        const ms = 1700000000000;
        expect(getNotificationTs({ created_at: ms })).toBe(ms);
    });

    test('converts seconds to milliseconds', () => {
        const sec = 1700000000;
        expect(getNotificationTs({ created_at: sec })).toBe(sec * 1000);
    });
});
