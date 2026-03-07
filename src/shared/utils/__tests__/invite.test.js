import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock stores
vi.mock('../../../stores', () => ({
    useFriendStore: vi.fn(),
    useInstanceStore: vi.fn(),
    useLocationStore: vi.fn(),
    useUserStore: vi.fn()
}));

// Mock transitive deps
vi.mock('../../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../../plugin/router', () => ({
    default: { push: vi.fn(), currentRoute: { value: {} } }
}));

import {
    useFriendStore,
    useInstanceStore,
    useLocationStore,
    useUserStore
} from '../../../stores';
import { checkCanInvite, checkCanInviteSelf } from '../invite';

describe('Invite Utils', () => {
    beforeEach(() => {
        useUserStore.mockReturnValue({
            currentUser: { id: 'usr_me' }
        });
        useLocationStore.mockReturnValue({
            lastLocation: { location: 'wrld_last:12345' }
        });
        useInstanceStore.mockReturnValue({
            cachedInstances: new Map()
        });
        useFriendStore.mockReturnValue({
            friends: new Map()
        });
    });

    describe('checkCanInvite', () => {
        test('returns false for empty location', () => {
            expect(checkCanInvite('')).toBe(false);
            expect(checkCanInvite(null)).toBe(false);
        });

        test('returns true for public instance', () => {
            expect(checkCanInvite('wrld_123:instance')).toBe(true);
        });

        test('returns true for group instance', () => {
            expect(
                checkCanInvite(
                    'wrld_123:instance~group(grp_123)~groupAccessType(public)'
                )
            ).toBe(true);
        });

        test('returns true for own instance', () => {
            expect(checkCanInvite('wrld_123:instance~private(usr_me)')).toBe(
                true
            );
        });

        test('returns false for invite-only instance owned by another', () => {
            expect(checkCanInvite('wrld_123:instance~private(usr_other)')).toBe(
                false
            );
        });

        test('returns false for friends-only instance', () => {
            expect(checkCanInvite('wrld_123:instance~friends(usr_other)')).toBe(
                false
            );
        });

        test('returns true for friends+ instance if current location matches', () => {
            const location = 'wrld_123:instance~hidden(usr_other)';
            useLocationStore.mockReturnValue({
                lastLocation: { location }
            });
            expect(checkCanInvite(location)).toBe(true);
        });

        test('returns false for friends+ instance if not in that location', () => {
            expect(checkCanInvite('wrld_123:instance~hidden(usr_other)')).toBe(
                false
            );
        });

        test('returns false for closed instance', () => {
            const location = 'wrld_123:instance';
            useInstanceStore.mockReturnValue({
                cachedInstances: new Map([
                    [location, { closedAt: '2024-01-01' }]
                ])
            });
            expect(checkCanInvite(location)).toBe(false);
        });
    });

    describe('checkCanInviteSelf', () => {
        test('returns false for empty location', () => {
            expect(checkCanInviteSelf('')).toBe(false);
            expect(checkCanInviteSelf(null)).toBe(false);
        });

        test('returns true for own instance', () => {
            expect(
                checkCanInviteSelf('wrld_123:instance~private(usr_me)')
            ).toBe(true);
        });

        test('returns true for public instance', () => {
            expect(checkCanInviteSelf('wrld_123:instance')).toBe(true);
        });

        test('returns true for friends-only instance if user is a friend', () => {
            useFriendStore.mockReturnValue({
                friends: new Map([['usr_owner', {}]])
            });
            expect(
                checkCanInviteSelf('wrld_123:instance~friends(usr_owner)')
            ).toBe(true);
        });

        test('returns false for friends-only instance if user is not a friend', () => {
            expect(
                checkCanInviteSelf('wrld_123:instance~friends(usr_other)')
            ).toBe(false);
        });

        test('returns false for closed instance', () => {
            const location = 'wrld_123:instance';
            useInstanceStore.mockReturnValue({
                cachedInstances: new Map([
                    [location, { closedAt: '2024-01-01' }]
                ])
            });
            expect(checkCanInviteSelf(location)).toBe(false);
        });

        test('returns true for invite instance (not owned, not closed)', () => {
            expect(
                checkCanInviteSelf('wrld_123:instance~private(usr_other)')
            ).toBe(true);
        });
    });
});
