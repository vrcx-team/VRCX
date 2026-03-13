import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock common.js
vi.mock('../common', () => ({
    convertFileUrlToImageUrl: vi.fn((url) => `converted:${url}`)
}));

// Mock base/format.js
vi.mock('../base/format', () => ({
    timeToText: vi.fn((ms) => `${Math.round(ms / 1000)}s`)
}));

// Mock base/ui.js
vi.mock('../base/ui', () => ({
    HueToHex: vi.fn((h) => `#hue${h}`)
}));

const storeMocks = vi.hoisted(() => ({
    useUserStore: vi.fn(() => ({
        currentUser: {
            id: 'usr_store',
            presence: { platform: 'standalonewindows' },
            onlineFriends: [],
            activeFriends: []
        }
    })),
    useAppearanceSettingsStore: vi.fn(() => ({
        displayVRCPlusIconsAsAvatar: false
    }))
}));

vi.mock('../../../stores', () => storeMocks);

import {
    languageClass,
    parseUserUrl,
    removeEmojis,
    statusClass,
    userImage,
    userImageFull,
    userOnlineFor,
    userOnlineForTimestamp,
    userStatusClass
} from '../user';

describe('User Utils', () => {
    describe('removeEmojis', () => {
        test('removes emoji characters from text', () => {
            expect(removeEmojis('Hello 🌍 World')).toBe('Hello World');
        });

        test('collapses multiple spaces after removal', () => {
            expect(removeEmojis('A  🎮  B')).toBe('A B');
        });

        test('returns empty string for falsy input', () => {
            expect(removeEmojis('')).toBe('');
            expect(removeEmojis(null)).toBe('');
            expect(removeEmojis(undefined)).toBe('');
        });

        test('returns original text when no emojis', () => {
            expect(removeEmojis('Hello World')).toBe('Hello World');
        });

        test('trims whitespace', () => {
            expect(removeEmojis('  Hello  ')).toBe('Hello');
        });
    });

    describe('statusClass', () => {
        test('returns online style for active status', () => {
            expect(statusClass('active')).toEqual({
                'status-icon': true,
                online: true
            });
        });

        test('returns joinme style for join me status', () => {
            expect(statusClass('join me')).toEqual({
                'status-icon': true,
                joinme: true
            });
        });

        test('returns askme style for ask me status', () => {
            expect(statusClass('ask me')).toEqual({
                'status-icon': true,
                askme: true
            });
        });

        test('returns busy style for busy status', () => {
            expect(statusClass('busy')).toEqual({
                'status-icon': true,
                busy: true
            });
        });

        test('returns null for undefined status', () => {
            expect(statusClass(undefined)).toBeNull();
        });

        test('returns null for unknown status strings', () => {
            expect(statusClass('offline')).toBeNull();
            expect(statusClass('unknown')).toBeNull();
        });
    });

    describe('languageClass', () => {
        test('returns mapped flag for known languages', () => {
            expect(languageClass('eng')).toEqual({ us: true });
            expect(languageClass('jpn')).toEqual({ jp: true });
            expect(languageClass('kor')).toEqual({ kr: true });
        });

        test('returns unknown flag for unmapped languages', () => {
            expect(languageClass('xyz')).toEqual({ unknown: true });
            expect(languageClass('')).toEqual({ unknown: true });
        });
    });

    describe('parseUserUrl', () => {
        test('extracts user ID from VRChat URL', () => {
            expect(
                parseUserUrl('https://vrchat.com/home/user/usr_abc123-def456')
            ).toBe('usr_abc123-def456');
        });

        test('returns undefined for non-user URLs', () => {
            expect(
                parseUserUrl('https://vrchat.com/home/world/wrld_abc')
            ).toBeUndefined();
        });

        test('throws for invalid URLs', () => {
            expect(() => parseUserUrl('not-a-url')).toThrow();
        });
    });

    describe('userOnlineForTimestamp', () => {
        test('returns ISO date for online user with $online_for', () => {
            const ts = Date.now() - 60000;
            const ctx = { ref: { state: 'online', $online_for: ts } };
            const result = userOnlineForTimestamp(ctx);
            expect(result).toBe(new Date(ts).toJSON());
        });

        test('returns ISO date for active user with $active_for', () => {
            const ts = Date.now() - 30000;
            const ctx = { ref: { state: 'active', $active_for: ts } };
            expect(userOnlineForTimestamp(ctx)).toBe(new Date(ts).toJSON());
        });

        test('returns ISO date for offline user with $offline_for', () => {
            const ts = Date.now() - 120000;
            const ctx = {
                ref: { state: 'offline', $offline_for: ts }
            };
            expect(userOnlineForTimestamp(ctx)).toBe(new Date(ts).toJSON());
        });

        test('returns null when no timestamp available', () => {
            const ctx = { ref: { state: 'offline' } };
            expect(userOnlineForTimestamp(ctx)).toBeNull();
        });

        test('prefers $online_for for online state', () => {
            const ts1 = Date.now() - 10000;
            const ts2 = Date.now() - 50000;
            const ctx = {
                ref: {
                    state: 'online',
                    $online_for: ts1,
                    $offline_for: ts2
                }
            };
            expect(userOnlineForTimestamp(ctx)).toBe(new Date(ts1).toJSON());
        });
    });

    describe('userOnlineFor', () => {
        test('returns formatted time for online user', () => {
            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);
            const ref = { state: 'online', $online_for: now - 5000 };
            expect(userOnlineFor(ref)).toBe('5s');
            vi.restoreAllMocks();
        });

        test('returns formatted time for active user', () => {
            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);
            const ref = { state: 'active', $active_for: now - 10000 };
            expect(userOnlineFor(ref)).toBe('10s');
            vi.restoreAllMocks();
        });

        test('returns formatted time for offline user with $offline_for', () => {
            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);
            const ref = { state: 'offline', $offline_for: now - 3000 };
            expect(userOnlineFor(ref)).toBe('3s');
            vi.restoreAllMocks();
        });

        test('returns dash when no timestamp available', () => {
            expect(userOnlineFor({ state: 'offline' })).toBe('-');
        });
    });

    describe('userStatusClass (explicit currentUser)', () => {
        let currentUser;

        beforeEach(() => {
            vi.clearAllMocks();
            currentUser = {
                id: 'usr_me',
                presence: { platform: 'standalonewindows' },
                onlineFriends: [],
                activeFriends: []
            };
        });

        test('does not access stores when currentUser is passed (pure path)', () => {
            userStatusClass(
                { id: 'usr_me', status: 'active', isFriend: true },
                false,
                currentUser
            );
            expect(storeMocks.useUserStore).not.toHaveBeenCalled();
        });

        test('returns null for undefined user', () => {
            expect(userStatusClass(undefined, false, currentUser)).toBeNull();
        });

        test('returns current user style with status', () => {
            const result = userStatusClass(
                {
                    id: 'usr_me',
                    status: 'active',
                    isFriend: true
                },
                false,
                currentUser
            );
            expect(result).toMatchObject({
                'status-icon': true,
                online: true,
                mobile: false
            });
        });

        test('returns mobile true for non-PC platform on current user', () => {
            currentUser.presence = { platform: 'android' };
            const result = userStatusClass(
                {
                    id: 'usr_me',
                    status: 'active'
                },
                false,
                currentUser
            );
            expect(result.mobile).toBe(true);
        });

        test('returns null for non-friend users', () => {
            expect(
                userStatusClass(
                    {
                        id: 'usr_other',
                        status: 'active',
                        isFriend: false
                    },
                    false,
                    currentUser
                )
            ).toBeNull();
        });

        test('returns offline style for pending offline friend', () => {
            const result = userStatusClass(
                { id: 'usr_other', isFriend: true, status: 'active' },
                true,
                currentUser
            );
            expect(result).toMatchObject({
                'status-icon': true,
                offline: true
            });
        });

        test('returns correct style for each friend status', () => {
            const cases = [
                {
                    status: 'active',
                    location: 'wrld_1',
                    state: 'online',
                    expected: 'online'
                },
                {
                    status: 'join me',
                    location: 'wrld_1',
                    state: 'online',
                    expected: 'joinme'
                },
                {
                    status: 'ask me',
                    location: 'wrld_1',
                    state: 'online',
                    expected: 'askme'
                },
                {
                    status: 'busy',
                    location: 'wrld_1',
                    state: 'online',
                    expected: 'busy'
                }
            ];
            for (const { status, location, state, expected } of cases) {
                const result = userStatusClass(
                    {
                        id: 'usr_friend',
                        isFriend: true,
                        status,
                        location,
                        state
                    },
                    false,
                    currentUser
                );
                expect(result[expected]).toBe(true);
            }
        });

        test('returns offline style for location offline', () => {
            const result = userStatusClass(
                {
                    id: 'usr_f',
                    isFriend: true,
                    status: 'active',
                    location: 'offline',
                    state: ''
                },
                false,
                currentUser
            );
            expect(result.offline).toBe(true);
        });

        test('returns active style for state active', () => {
            const result = userStatusClass(
                {
                    id: 'usr_f',
                    isFriend: true,
                    status: 'busy',
                    location: 'private',
                    state: 'active'
                },
                false,
                currentUser
            );
            expect(result.active).toBe(true);
        });

        test('sets mobile flag for non-PC platform friend', () => {
            const result = userStatusClass(
                {
                    id: 'usr_f',
                    isFriend: true,
                    status: 'active',
                    location: 'wrld_1',
                    state: 'online',
                    $platform: 'android'
                },
                false,
                currentUser
            );
            expect(result.mobile).toBe(true);
        });

        test('no mobile flag for standalonewindows platform', () => {
            const result = userStatusClass(
                {
                    id: 'usr_f',
                    isFriend: true,
                    status: 'active',
                    location: 'wrld_1',
                    state: 'online',
                    $platform: 'standalonewindows'
                },
                false,
                currentUser
            );
            expect(result.mobile).toBeUndefined();
        });

        test('uses userId as fallback when id is not present', () => {
            const result = userStatusClass(
                {
                    userId: 'usr_me',
                    status: 'busy'
                },
                false,
                currentUser
            );
            expect(result).toMatchObject({
                'status-icon': true,
                busy: true,
                mobile: false
            });
        });

        test('handles private location with empty state (temp fix branch)', () => {
            currentUser.activeFriends = ['usr_f'];
            const result = userStatusClass(
                {
                    id: 'usr_f',
                    isFriend: true,
                    status: 'busy',
                    location: 'private',
                    state: ''
                },
                false,
                currentUser
            );
            // activeFriends includes usr_f → active
            expect(result.active).toBe(true);
        });

        test('handles private location temp fix → offline branch', () => {
            currentUser.activeFriends = [];
            const result = userStatusClass(
                {
                    id: 'usr_f',
                    isFriend: true,
                    status: 'busy',
                    location: 'private',
                    state: ''
                },
                false,
                currentUser
            );
            expect(result.offline).toBe(true);
        });
    });

    describe('userImage (explicit settings)', () => {
        test('does not access appearance store when setting is passed (pure path)', () => {
            userImage(
                { thumbnailUrl: 'https://img.com/thumb' },
                false,
                '128',
                false,
                false
            );
            expect(
                storeMocks.useAppearanceSettingsStore
            ).not.toHaveBeenCalled();
        });

        test('returns empty string for falsy user', () => {
            expect(userImage(null, false, '128', false, false)).toBe('');
            expect(userImage(undefined, false, '128', false, false)).toBe('');
        });

        test('returns profilePicOverrideThumbnail when available', () => {
            const user = {
                profilePicOverrideThumbnail: 'https://img.com/pic/256/thumb'
            };
            expect(userImage(user, false, '128', false, false)).toBe(
                'https://img.com/pic/256/thumb'
            );
        });

        test('replaces resolution for icon mode with profilePicOverrideThumbnail', () => {
            const user = {
                profilePicOverrideThumbnail: 'https://img.com/pic/256/thumb'
            };
            expect(userImage(user, true, '64', false, false)).toBe(
                'https://img.com/pic/64/thumb'
            );
        });

        test('returns profilePicOverride when no thumbnail', () => {
            const user = { profilePicOverride: 'https://img.com/full' };
            expect(userImage(user, false, '128', false, false)).toBe(
                'https://img.com/full'
            );
        });

        test('returns thumbnailUrl as fallback', () => {
            const user = { thumbnailUrl: 'https://img.com/thumb' };
            expect(userImage(user, false, '128', false, false)).toBe(
                'https://img.com/thumb'
            );
        });

        test('returns currentAvatarThumbnailImageUrl as fallback', () => {
            const user = {
                currentAvatarThumbnailImageUrl:
                    'https://img.com/avatar/256/thumb'
            };
            expect(userImage(user, false, '128', false, false)).toBe(
                'https://img.com/avatar/256/thumb'
            );
        });

        test('replaces resolution for icon mode with currentAvatarThumbnailImageUrl', () => {
            const user = {
                currentAvatarThumbnailImageUrl:
                    'https://img.com/avatar/256/thumb'
            };
            expect(userImage(user, true, '64', false, false)).toBe(
                'https://img.com/avatar/64/thumb'
            );
        });

        test('returns currentAvatarImageUrl as last resort', () => {
            const user = {
                currentAvatarImageUrl: 'https://img.com/avatar/full'
            };
            expect(userImage(user, false, '128', false, false)).toBe(
                'https://img.com/avatar/full'
            );
        });

        test('converts currentAvatarImageUrl for icon mode', () => {
            const user = {
                currentAvatarImageUrl: 'https://img.com/avatar/full'
            };
            expect(userImage(user, true, '128', false, false)).toBe(
                'converted:https://img.com/avatar/full'
            );
        });

        test('returns empty string when user has no image fields', () => {
            expect(userImage({}, false, '128', false, false)).toBe('');
        });

        test('returns userIcon when displayVRCPlusIconsAsAvatar is true', () => {
            const user = {
                userIcon: 'https://img.com/icon',
                thumbnailUrl: 'https://img.com/thumb'
            };
            expect(userImage(user, false, '128', false, true)).toBe(
                'https://img.com/icon'
            );
        });

        test('converts userIcon for icon mode when VRCPlus setting enabled', () => {
            const user = { userIcon: 'https://img.com/icon' };
            expect(userImage(user, true, '128', false, true)).toBe(
                'converted:https://img.com/icon'
            );
        });

        test('returns userIcon for isUserDialogIcon even if VRCPlus setting off', () => {
            const user = {
                userIcon: 'https://img.com/icon',
                thumbnailUrl: 'https://img.com/thumb'
            };
            expect(userImage(user, false, '128', true, false)).toBe(
                'https://img.com/icon'
            );
        });
    });

    describe('userImageFull (explicit settings)', () => {
        test('does not access appearance store when setting is passed (pure path)', () => {
            userImageFull(
                { currentAvatarImageUrl: 'https://img.com/avatar' },
                false
            );
            expect(
                storeMocks.useAppearanceSettingsStore
            ).not.toHaveBeenCalled();
        });

        test('returns empty string for falsy user', () => {
            expect(userImageFull(null, false)).toBe('');
        });

        test('returns profilePicOverride when available', () => {
            const user = {
                profilePicOverride: 'https://img.com/full',
                currentAvatarImageUrl: 'https://img.com/avatar'
            };
            expect(userImageFull(user, false)).toBe('https://img.com/full');
        });

        test('returns currentAvatarImageUrl as fallback', () => {
            const user = {
                currentAvatarImageUrl: 'https://img.com/avatar'
            };
            expect(userImageFull(user, false)).toBe('https://img.com/avatar');
        });

        test('returns userIcon when VRCPlus setting enabled', () => {
            const user = {
                userIcon: 'https://img.com/icon',
                profilePicOverride: 'https://img.com/full'
            };
            expect(userImageFull(user, true)).toBe('https://img.com/icon');
        });
    });
});
