import { sortStatus, isFriendOnline } from '../friend';

describe('Friend Utils', () => {
    describe('sortStatus', () => {
        test('handles same status', () => {
            expect(sortStatus('active', 'active')).toBe(0);
            expect(sortStatus('join me', 'join me')).toBe(0);
        });

        test('handles unknown status', () => {
            expect(sortStatus('unknown', 'active')).toBe(0);
            // @ts-ignore
            expect(sortStatus(null, 'active')).toBe(0);
        });
    });

    describe('isFriendOnline', () => {
        test('detects online friends', () => {
            const friend = { state: 'online', ref: { location: 'world' } };
            expect(isFriendOnline(friend)).toBe(true);
        });

        test('handles missing data', () => {
            expect(isFriendOnline({})).toBe(false);
            expect(isFriendOnline({ state: 'online' })).toBe(false);
        });
    });
});
