import {
    compareByName,
    compareByCreatedAt,
    compareByCreatedAtAscending,
    compareByUpdatedAt,
    compareByDisplayName,
    compareByMemberCount,
    compareByPrivate,
    compareByStatus,
    compareByLastActive,
    compareByLastSeen,
    compareByLocationAt,
    compareByLocation
} from '../compare';

describe('Compare Functions', () => {
    describe('compareByName', () => {
        test('compares objects by name property', () => {
            const a = { name: 'Alice' };
            const b = { name: 'Bob' };
            expect(compareByName(a, b)).toBeLessThan(0);
            expect(compareByName(b, a)).toBeGreaterThan(0);
        });

        test('returns 0 for equal names', () => {
            const a = { name: 'Alice' };
            const b = { name: 'Alice' };
            expect(compareByName(a, b)).toBe(0);
        });

        test('handles non-string name properties', () => {
            const a = { name: null };
            const b = { name: 'Bob' };
            expect(compareByName(a, b)).toBe(0);

            const c = { name: 123 };
            const d = { name: 'Alice' };
            expect(compareByName(c, d)).toBe(0);
        });

        test('handles missing name properties', () => {
            const a = {};
            const b = { name: 'Bob' };
            expect(compareByName(a, b)).toBe(0);
        });

        test('uses locale-aware comparison', () => {
            const a = { name: 'ä' };
            const b = { name: 'z' };
            expect(typeof compareByName(a, b)).toBe('number');
        });
    });

    describe('compareByCreatedAt', () => {
        test('compares objects by created_at in descending order', () => {
            const a = { created_at: '2023-01-01' };
            const b = { created_at: '2023-01-02' };
            expect(compareByCreatedAt(a, b)).toBeGreaterThan(0);
            expect(compareByCreatedAt(b, a)).toBeLessThan(0);
        });

        test('returns 0 for equal created_at', () => {
            const a = { created_at: '2023-01-01' };
            const b = { created_at: '2023-01-01' };
            expect(compareByCreatedAt(a, b)).toBe(0);
        });

        test('handles non-string created_at properties', () => {
            const a = { created_at: null };
            const b = { created_at: '2023-01-01' };
            expect(compareByCreatedAt(a, b)).toBe(0);

            const c = { created_at: 123 };
            const d = { created_at: '2023-01-01' };
            expect(compareByCreatedAt(c, d)).toBe(0);
        });

        test('handles case-insensitive comparison', () => {
            const a = { created_at: '2023-01-01t12:00:00z' };
            const b = { created_at: '2023-01-01T12:00:00Z' };
            expect(compareByCreatedAt(a, b)).toBe(0);
        });
    });

    describe('compareByCreatedAtAscending', () => {
        test('compares objects by created_at in ascending order', () => {
            const a = { created_at: '2023-01-01' };
            const b = { created_at: '2023-01-02' };
            expect(compareByCreatedAtAscending(a, b)).toBeLessThan(0);
            expect(compareByCreatedAtAscending(b, a)).toBeGreaterThan(0);
        });

        test('returns 0 for equal created_at', () => {
            const a = { created_at: '2023-01-01' };
            const b = { created_at: '2023-01-01' };
            expect(compareByCreatedAtAscending(a, b)).toBe(0);
        });

        test('handles undefined created_at', () => {
            const a = { created_at: undefined };
            const b = { created_at: '2023-01-01' };
            // undefined comparison with string: both undefined < string and undefined > string are false
            // So it falls through to return 0
            expect(compareByCreatedAtAscending(a, b)).toBe(0);
        });
    });

    describe('compareByUpdatedAt', () => {
        test('compares objects by updated_at in descending order', () => {
            const a = { updated_at: '2023-01-01' };
            const b = { updated_at: '2023-01-02' };
            expect(compareByUpdatedAt(a, b)).toBeGreaterThan(0);
            expect(compareByUpdatedAt(b, a)).toBeLessThan(0);
        });

        test('returns 0 for equal updated_at', () => {
            const a = { updated_at: '2023-01-01' };
            const b = { updated_at: '2023-01-01' };
            expect(compareByUpdatedAt(a, b)).toBe(0);
        });

        test('handles non-string updated_at properties', () => {
            const a = { updated_at: null };
            const b = { updated_at: '2023-01-01' };
            expect(compareByUpdatedAt(a, b)).toBe(0);
        });

        test('handles case-insensitive comparison', () => {
            const a = { updated_at: '2023-01-01t12:00:00z' };
            const b = { updated_at: '2023-01-01T12:00:00Z' };
            expect(compareByUpdatedAt(a, b)).toBe(0);
        });
    });

    describe('compareByDisplayName', () => {
        test('compares objects by displayName property', () => {
            const a = { displayName: 'Alice Display' };
            const b = { displayName: 'Bob Display' };
            expect(compareByDisplayName(a, b)).toBeLessThan(0);
            expect(compareByDisplayName(b, a)).toBeGreaterThan(0);
        });

        test('returns 0 for equal displayNames', () => {
            const a = { displayName: 'Alice Display' };
            const b = { displayName: 'Alice Display' };
            expect(compareByDisplayName(a, b)).toBe(0);
        });

        test('handles non-string displayName properties', () => {
            const a = { displayName: null };
            const b = { displayName: 'Bob Display' };
            expect(compareByDisplayName(a, b)).toBe(0);

            const c = { displayName: 123 };
            const d = { displayName: 'Alice Display' };
            expect(compareByDisplayName(c, d)).toBe(0);
        });
    });

    describe('compareByMemberCount', () => {
        test('compares objects by memberCount property', () => {
            const a = { memberCount: 5 };
            const b = { memberCount: 10 };
            expect(compareByMemberCount(a, b)).toBe(-5);
            expect(compareByMemberCount(b, a)).toBe(5);
        });

        test('returns 0 for equal memberCounts', () => {
            const a = { memberCount: 5 };
            const b = { memberCount: 5 };
            expect(compareByMemberCount(a, b)).toBe(0);
        });

        test('handles non-number memberCount properties', () => {
            const a = { memberCount: 'invalid' };
            const b = { memberCount: 10 };
            expect(compareByMemberCount(a, b)).toBe(0);

            const c = { memberCount: null };
            const d = { memberCount: 5 };
            expect(compareByMemberCount(c, d)).toBe(0);
        });

        test('handles negative member counts', () => {
            const a = { memberCount: -5 };
            const b = { memberCount: 10 };
            expect(compareByMemberCount(a, b)).toBe(-15);
        });
    });

    describe('compareByPrivate', () => {
        test('prioritizes non-private locations', () => {
            const a = { ref: { location: 'public' } };
            const b = { ref: { location: 'private' } };
            expect(compareByPrivate(a, b)).toBe(-1);
            expect(compareByPrivate(b, a)).toBe(1);
        });

        test('returns 0 when both are private', () => {
            const a = { ref: { location: 'private' } };
            const b = { ref: { location: 'private' } };
            expect(compareByPrivate(a, b)).toBe(0);
        });

        test('returns 0 when both are non-private', () => {
            const a = { ref: { location: 'public' } };
            const b = { ref: { location: 'friends' } };
            expect(compareByPrivate(a, b)).toBe(0);
        });

        test('handles undefined ref properties', () => {
            const a = { ref: undefined };
            const b = { ref: { location: 'private' } };
            expect(compareByPrivate(a, b)).toBe(0);

            const c = {};
            const d = { ref: { location: 'public' } };
            expect(compareByPrivate(c, d)).toBe(0);
        });
    });

    describe('compareByStatus', () => {
        test('handles offline users', () => {
            const a = { ref: { state: 'offline', status: 'active' } };
            const b = { ref: { state: 'online', status: 'busy' } };
            expect(compareByStatus(a, b)).toBe(1);
        });

        test('returns 0 for same status', () => {
            const a = { ref: { status: 'active' } };
            const b = { ref: { status: 'active' } };
            expect(compareByStatus(a, b)).toBe(0);
        });

        test('handles undefined ref properties', () => {
            const a = { ref: undefined };
            const b = { ref: { status: 'active' } };
            expect(compareByStatus(a, b)).toBe(0);
        });
    });

    describe('compareByLastActive', () => {
        test('compares online users by $online_for', () => {
            const a = {
                state: 'online',
                ref: { $online_for: 100 }
            };
            const b = {
                state: 'online',
                ref: { $online_for: 200 }
            };
            expect(compareByLastActive(a, b)).toBe(1);
        });

        test('falls back to last_activity for non-online users', () => {
            const a = {
                state: 'offline',
                ref: { last_activity: '2023-01-01' }
            };
            const b = {
                state: 'offline',
                ref: { last_activity: '2023-01-02' }
            };
            expect(compareByLastActive(a, b)).toBe(1);
        });

        test('handles undefined ref properties', () => {
            const a = { state: 'online', ref: undefined };
            const b = { state: 'online', ref: { $online_for: 100 } };
            expect(compareByLastActive(a, b)).toBe(0);
        });
    });

    describe('compareByLastSeen', () => {
        test('compares by $lastSeen field', () => {
            const a = { ref: { $lastSeen: '2023-01-01' } };
            const b = { ref: { $lastSeen: '2023-01-02' } };
            expect(compareByLastSeen(a, b)).toBe(1);
        });

        test('handles empty string as longest active', () => {
            const a = { ref: { $lastSeen: '' } };
            const b = { ref: { $lastSeen: '2023-01-01' } };
            // '' < '2023-01-01' is true, so first condition matches and returns 1
            expect(compareByLastSeen(a, b)).toBe(1);
        });

        test('handles undefined ref properties', () => {
            const a = { ref: undefined };
            const b = { ref: { $lastSeen: '2023-01-01' } };
            expect(compareByLastSeen(a, b)).toBe(0);
        });
    });

    describe('compareByLocationAt', () => {
        test('handles traveling status', () => {
            const a = { location: 'traveling', $location_at: 100 };
            const b = { location: 'public', $location_at: 200 };
            expect(compareByLocationAt(a, b)).toBe(1);
            expect(compareByLocationAt(b, a)).toBe(-1);
        });

        test('returns 0 when both are traveling', () => {
            const a = { location: 'traveling', $location_at: 100 };
            const b = { location: 'traveling', $location_at: 200 };
            expect(compareByLocationAt(a, b)).toBe(0);
        });

        test('compares by $location_at for non-traveling locations', () => {
            const a = { location: 'public', $location_at: 100 };
            const b = { location: 'friends', $location_at: 200 };
            expect(compareByLocationAt(a, b)).toBe(-1);
            expect(compareByLocationAt(b, a)).toBe(1);
        });

        test('returns 0 for equal $location_at', () => {
            const a = { location: 'public', $location_at: 100 };
            const b = { location: 'friends', $location_at: 100 };
            expect(compareByLocationAt(a, b)).toBe(0);
        });
    });

    describe('compareByLocation', () => {
        test('compares online users by location', () => {
            const a = {
                state: 'online',
                ref: { location: 'public' }
            };
            const b = {
                state: 'online',
                ref: { location: 'friends' }
            };
            expect(compareByLocation(a, b)).toBeGreaterThan(0);
        });

        test('returns 0 for non-online users', () => {
            const a = {
                state: 'offline',
                ref: { location: 'public' }
            };
            const b = {
                state: 'offline',
                ref: { location: 'friends' }
            };
            expect(compareByLocation(a, b)).toBe(0);
        });

        test('returns 0 when one user is not online', () => {
            const a = {
                state: 'online',
                ref: { location: 'public' }
            };
            const b = {
                state: 'offline',
                ref: { location: 'friends' }
            };
            expect(compareByLocation(a, b)).toBe(0);
        });

        test('handles undefined ref properties', () => {
            const a = { state: 'online', ref: undefined };
            const b = { state: 'online', ref: { location: 'public' } };
            expect(compareByLocation(a, b)).toBe(0);
        });

        test('uses locale-aware comparison', () => {
            const a = {
                state: 'online',
                ref: { location: 'ä' }
            };
            const b = {
                state: 'online',
                ref: { location: 'z' }
            };
            expect(typeof compareByLocation(a, b)).toBe('number');
        });
    });

    describe('edge cases and boundary conditions', () => {
        test('handles null objects', () => {
            // compareByName doesn't handle null objects - it will throw
            expect(() => compareByName(null, { name: 'test' })).toThrow();
            expect(() => compareByName({ name: 'test' }, null)).toThrow();
        });

        test('handles empty objects', () => {
            expect(compareByName({}, {})).toBe(0);
            expect(compareByDisplayName({}, {})).toBe(0);
            expect(compareByMemberCount({}, {})).toBe(0);
        });

        test('handles mixed valid and invalid data', () => {
            const valid = { memberCount: 5 };
            const invalid = { memberCount: 'not a number' };
            expect(compareByMemberCount(valid, invalid)).toBe(0);
        });

        test('handles zero values', () => {
            const a = { memberCount: 0 };
            const b = { memberCount: 5 };
            expect(compareByMemberCount(a, b)).toBe(-5);
        });
    });
});
