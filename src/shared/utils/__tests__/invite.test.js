import { beforeEach, describe, expect, test, vi } from 'vitest';
import { checkCanInvite, checkCanInviteSelf } from '../invite';

const storeMocks = vi.hoisted(() => ({
    useUserStore: vi.fn(() => ({ currentUser: { id: 'usr_me' } })),
    useLocationStore: vi.fn(() => ({
        lastLocation: { location: '', friendList: new Set() }
    })),
    useInstanceStore: vi.fn(() => ({ cachedInstances: new Map() })),
    useFriendStore: vi.fn(() => ({ friends: new Map() }))
}));

vi.mock('../../../stores', () => storeMocks);

describe('Invite Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const defaultInviteDeps = {
        currentUserId: 'usr_me',
        lastLocationStr: 'wrld_last:12345',
        cachedInstances: new Map()
    };

    const defaultSelfDeps = {
        currentUserId: 'usr_me',
        cachedInstances: new Map(),
        friends: new Map()
    };

    describe('checkCanInvite', () => {
        test('does not access stores when deps are provided (pure path)', () => {
            checkCanInvite('wrld_123:instance', defaultInviteDeps);
            expect(storeMocks.useUserStore).not.toHaveBeenCalled();
            expect(storeMocks.useLocationStore).not.toHaveBeenCalled();
            expect(storeMocks.useInstanceStore).not.toHaveBeenCalled();
        });

        test('returns false for empty location', () => {
            expect(checkCanInvite('', defaultInviteDeps)).toBe(false);
            expect(checkCanInvite(null, defaultInviteDeps)).toBe(false);
        });

        test('returns true for public instance', () => {
            expect(checkCanInvite('wrld_123:instance', defaultInviteDeps)).toBe(
                true
            );
        });

        test('returns true for group instance', () => {
            expect(
                checkCanInvite(
                    'wrld_123:instance~group(grp_123)~groupAccessType(public)',
                    defaultInviteDeps
                )
            ).toBe(true);
        });

        test('returns true for own instance', () => {
            expect(
                checkCanInvite(
                    'wrld_123:instance~private(usr_me)',
                    defaultInviteDeps
                )
            ).toBe(true);
        });

        test('returns false for invite-only instance owned by another', () => {
            expect(
                checkCanInvite(
                    'wrld_123:instance~private(usr_other)',
                    defaultInviteDeps
                )
            ).toBe(false);
        });

        test('returns false for friends-only instance', () => {
            expect(
                checkCanInvite(
                    'wrld_123:instance~friends(usr_other)',
                    defaultInviteDeps
                )
            ).toBe(false);
        });

        test('returns true for friends+ instance if current location matches', () => {
            const location = 'wrld_123:instance~hidden(usr_other)';
            expect(
                checkCanInvite(location, {
                    ...defaultInviteDeps,
                    lastLocationStr: location
                })
            ).toBe(true);
        });

        test('returns false for friends+ instance if not in that location', () => {
            expect(
                checkCanInvite(
                    'wrld_123:instance~hidden(usr_other)',
                    defaultInviteDeps
                )
            ).toBe(false);
        });

        test('returns false for closed instance', () => {
            const location = 'wrld_123:instance';
            expect(
                checkCanInvite(location, {
                    ...defaultInviteDeps,
                    cachedInstances: new Map([
                        [location, { closedAt: '2024-01-01' }]
                    ])
                })
            ).toBe(false);
        });
    });

    describe('checkCanInviteSelf', () => {
        test('does not access stores when deps are provided (pure path)', () => {
            checkCanInviteSelf('wrld_123:instance', defaultSelfDeps);
            expect(storeMocks.useUserStore).not.toHaveBeenCalled();
            expect(storeMocks.useInstanceStore).not.toHaveBeenCalled();
            expect(storeMocks.useFriendStore).not.toHaveBeenCalled();
        });

        test('returns false for empty location', () => {
            expect(checkCanInviteSelf('', defaultSelfDeps)).toBe(false);
            expect(checkCanInviteSelf(null, defaultSelfDeps)).toBe(false);
        });

        test('returns true for own instance', () => {
            expect(
                checkCanInviteSelf(
                    'wrld_123:instance~private(usr_me)',
                    defaultSelfDeps
                )
            ).toBe(true);
        });

        test('returns true for public instance', () => {
            expect(
                checkCanInviteSelf('wrld_123:instance', defaultSelfDeps)
            ).toBe(true);
        });

        test('returns true for friends-only instance if user is a friend', () => {
            expect(
                checkCanInviteSelf('wrld_123:instance~friends(usr_owner)', {
                    ...defaultSelfDeps,
                    friends: new Map([['usr_owner', {}]])
                })
            ).toBe(true);
        });

        test('returns false for friends-only instance if user is not a friend', () => {
            expect(
                checkCanInviteSelf(
                    'wrld_123:instance~friends(usr_other)',
                    defaultSelfDeps
                )
            ).toBe(false);
        });

        test('returns false for closed instance', () => {
            const location = 'wrld_123:instance';
            expect(
                checkCanInviteSelf(location, {
                    ...defaultSelfDeps,
                    cachedInstances: new Map([
                        [location, { closedAt: '2024-01-01' }]
                    ])
                })
            ).toBe(false);
        });

        test('returns true for invite instance (not owned, not closed)', () => {
            expect(
                checkCanInviteSelf(
                    'wrld_123:instance~private(usr_other)',
                    defaultSelfDeps
                )
            ).toBe(true);
        });
    });
});
