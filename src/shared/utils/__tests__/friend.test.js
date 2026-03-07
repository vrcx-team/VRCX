import { getFriendsSortFunction, isFriendOnline, sortStatus } from '../friend';

describe('Friend Utils', () => {
    describe('sortStatus', () => {
        const statuses = ['join me', 'active', 'ask me', 'busy', 'offline'];

        test('returns 0 for same status', () => {
            for (const s of statuses) {
                expect(sortStatus(s, s)).toBe(0);
            }
        });

        test('sorts statuses in priority order: join me > active > ask me > busy > offline', () => {
            // Higher priority status vs lower priority → negative
            expect(sortStatus('join me', 'active')).toBe(-1);
            expect(sortStatus('join me', 'ask me')).toBe(-1);
            expect(sortStatus('join me', 'busy')).toBe(-1);
            expect(sortStatus('join me', 'offline')).toBe(-1);

            expect(sortStatus('active', 'ask me')).toBe(-1);
            expect(sortStatus('active', 'busy')).toBe(-1);
            expect(sortStatus('active', 'offline')).toBe(-1);

            expect(sortStatus('ask me', 'busy')).toBe(-1);
            expect(sortStatus('ask me', 'offline')).toBe(-1);

            expect(sortStatus('busy', 'offline')).toBe(-1);
        });

        test('lower priority vs higher priority → positive', () => {
            expect(sortStatus('active', 'join me')).toBe(1);
            expect(sortStatus('busy', 'active')).toBe(1);
            expect(sortStatus('offline', 'join me')).toBe(1);
            expect(sortStatus('offline', 'busy')).toBe(1);
        });

        test('returns 0 for unknown statuses', () => {
            expect(sortStatus('unknown', 'active')).toBe(0);
            expect(sortStatus('active', 'unknown')).toBe(0);
            expect(sortStatus(null, 'active')).toBe(0);
        });
    });

    describe('isFriendOnline', () => {
        test('returns true for online friends', () => {
            expect(
                isFriendOnline({ state: 'online', ref: { location: 'wrld_1' } })
            ).toBe(true);
        });

        test('returns true for non-online friends with non-private location', () => {
            // This is the "wat" case in the code
            expect(
                isFriendOnline({
                    state: 'active',
                    ref: { location: 'wrld_1' }
                })
            ).toBe(true);
        });

        test('returns false for friends in private with non-online state', () => {
            expect(
                isFriendOnline({
                    state: 'active',
                    ref: { location: 'private' }
                })
            ).toBe(false);
        });

        test('returns false for undefined or missing ref', () => {
            expect(isFriendOnline(undefined)).toBe(false);
            expect(isFriendOnline({})).toBe(false);
            expect(isFriendOnline({ state: 'online' })).toBe(false);
        });
    });

    describe('getFriendsSortFunction', () => {
        test('returns a comparator function', () => {
            const fn = getFriendsSortFunction(['Sort Alphabetically']);
            expect(typeof fn).toBe('function');
        });

        test('sorts alphabetically by name', () => {
            const fn = getFriendsSortFunction(['Sort Alphabetically']);
            const a = { name: 'Alice', ref: {} };
            const b = { name: 'Bob', ref: {} };
            expect(fn(a, b)).toBeLessThan(0);
            expect(fn(b, a)).toBeGreaterThan(0);
        });

        test('sorts private to bottom', () => {
            const fn = getFriendsSortFunction(['Sort Private to Bottom']);
            const pub = { ref: { location: 'wrld_1' } };
            const priv = { ref: { location: 'private' } };
            expect(fn(priv, pub)).toBe(1);
            expect(fn(pub, priv)).toBe(-1);
        });

        test('sorts by status', () => {
            const fn = getFriendsSortFunction(['Sort by Status']);
            const joinMe = { ref: { status: 'join me', state: 'online' } };
            const busy = { ref: { status: 'busy', state: 'online' } };
            expect(fn(joinMe, busy)).toBeLessThan(0);
        });

        test('sorts by last active', () => {
            const fn = getFriendsSortFunction(['Sort by Last Active']);
            const a = {
                state: 'offline',
                ref: { last_activity: '2023-01-01' }
            };
            const b = {
                state: 'offline',
                ref: { last_activity: '2023-06-01' }
            };
            expect(fn(a, b)).toBe(1);
        });

        test('sorts by last seen', () => {
            const fn = getFriendsSortFunction(['Sort by Last Seen']);
            const a = { ref: { $lastSeen: '2023-01-01' } };
            const b = { ref: { $lastSeen: '2023-06-01' } };
            expect(fn(a, b)).toBe(1);
        });

        test('sorts by time in instance', () => {
            const fn = getFriendsSortFunction(['Sort by Time in Instance']);
            const a = {
                state: 'online',
                pendingOffline: false,
                ref: { $location_at: 100, location: 'wrld_1' }
            };
            const b = {
                state: 'online',
                pendingOffline: false,
                ref: { $location_at: 200, location: 'wrld_2' }
            };
            // compareByLocationAt(b.ref, a.ref): b.$location_at(200) > a.$location_at(100) → 1
            expect(fn(a, b)).toBe(1);
        });

        test('sorts pending offline to bottom for time in instance', () => {
            const fn = getFriendsSortFunction(['Sort by Time in Instance']);
            const pending = {
                pendingOffline: true,
                ref: { $location_at: 100 }
            };
            const active = {
                pendingOffline: false,
                state: 'online',
                ref: { $location_at: 200 }
            };
            expect(fn(pending, active)).toBe(1);
            expect(fn(active, pending)).toBe(-1);
        });

        test('sorts by location', () => {
            const fn = getFriendsSortFunction(['Sort by Location']);
            const a = { state: 'online', ref: { location: 'aaa' } };
            const b = { state: 'online', ref: { location: 'zzz' } };
            expect(fn(a, b)).toBeLessThan(0);
        });

        test('None sort returns 0', () => {
            const fn = getFriendsSortFunction(['None']);
            const a = { name: 'Zack' };
            const b = { name: 'Alice' };
            expect(fn(a, b)).toBe(0);
        });

        test('applies multiple sort methods in order (tie-breaking)', () => {
            const fn = getFriendsSortFunction([
                'Sort by Status',
                'Sort Alphabetically'
            ]);
            // Same status → tie → falls to alphabetical
            const a = {
                name: 'Alice',
                ref: { status: 'active', state: 'online' }
            };
            const b = {
                name: 'Bob',
                ref: { status: 'active', state: 'online' }
            };
            expect(fn(a, b)).toBeLessThan(0);
        });

        test('first sort wins when not tied', () => {
            const fn = getFriendsSortFunction([
                'Sort by Status',
                'Sort Alphabetically'
            ]);
            const joinMe = {
                name: 'Zack',
                ref: { status: 'join me', state: 'online' }
            };
            const busy = {
                name: 'Alice',
                ref: { status: 'busy', state: 'online' }
            };
            // status differs → alphabetical not reached
            expect(fn(joinMe, busy)).toBeLessThan(0);
        });

        test('handles empty sort methods array', () => {
            const fn = getFriendsSortFunction([]);
            const a = { name: 'Alice' };
            const b = { name: 'Bob' };
            // No sort functions → result is undefined from loop
            expect(fn(a, b)).toBeUndefined();
        });
    });
});
