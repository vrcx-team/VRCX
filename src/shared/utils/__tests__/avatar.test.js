import { describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';

import { getPlatformInfo, parseAvatarUrl, storeAvatarImage } from '../avatar';

vi.mock('../../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../../plugin/router', () => ({
    router: {
        beforeEach: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
        currentRoute: ref({ path: '/', name: '', meta: {} }),
        isReady: vi.fn().mockResolvedValue(true)
    },
    initRouter: vi.fn()
}));

describe('storeAvatarImage', () => {
    function makeArgs(name, ownerId, createdAt = '2024-01-01T00:00:00Z') {
        return {
            params: { fileId: 'file_abc123' },
            json: {
                name,
                ownerId,
                versions: [{ created_at: createdAt }]
            }
        };
    }

    test('extracts avatar name from standard image file name', () => {
        const cache = new Map();
        const result = storeAvatarImage(
            makeArgs('Avatar - Cool Robot - Image - 2024.01.01', 'usr_owner1'),
            cache
        );
        expect(result.avatarName).toBe('Cool Robot');
        expect(result.ownerId).toBe('usr_owner1');
        expect(result.fileCreatedAt).toBe('2024-01-01T00:00:00Z');
    });

    test('stores result in cachedAvatarNames map', () => {
        const cache = new Map();
        storeAvatarImage(
            makeArgs('Avatar - Test - Image - x', 'usr_123'),
            cache
        );
        expect(cache.has('file_abc123')).toBe(true);
        expect(cache.get('file_abc123').avatarName).toBe('Test');
    });

    test('returns empty avatarName when name does not match pattern', () => {
        const cache = new Map();
        const result = storeAvatarImage(
            makeArgs('SomeOtherFileName.png', 'usr_456'),
            cache
        );
        expect(result.avatarName).toBe('');
    });

    test('handles special characters in avatar name', () => {
        const cache = new Map();
        const result = storeAvatarImage(
            makeArgs('Avatar - ★ Fancy (Name) ★ - Image - v1', 'usr_789'),
            cache
        );
        expect(result.avatarName).toContain('Fancy');
    });
});

describe('parseAvatarUrl', () => {
    test('extracts avatar ID from valid avatar URL', () => {
        const result = parseAvatarUrl(
            'https://api.vrchat.cloud/file/avatar/avtr_12345-abcde'
        );
        expect(result).toBe('avtr_12345-abcde');
    });

    test('returns null for non-avatar URL', () => {
        const result = parseAvatarUrl(
            'https://api.vrchat.cloud/api/1/worlds/wrld_12345'
        );
        expect(result).toBeNull();
    });

    test('returns null for unrelated URL', () => {
        const result = parseAvatarUrl('https://example.com/something');
        expect(result).toBeNull();
    });
});

describe('getPlatformInfo', () => {
    test('separates packages by platform', () => {
        const packages = [
            {
                platform: 'standalonewindows',
                performanceRating: 'Good',
                variant: 'standard'
            },
            {
                platform: 'android',
                performanceRating: 'Medium',
                variant: 'standard'
            },
            { platform: 'ios', performanceRating: 'Poor', variant: 'standard' }
        ];
        const result = getPlatformInfo(packages);
        expect(result.pc.platform).toBe('standalonewindows');
        expect(result.android.platform).toBe('android');
        expect(result.ios.platform).toBe('ios');
    });

    test('skips non-standard/non-security variants', () => {
        const packages = [
            {
                platform: 'standalonewindows',
                performanceRating: 'Good',
                variant: 'impostor'
            }
        ];
        const result = getPlatformInfo(packages);
        expect(result.pc).toEqual({});
    });

    test('allows standard and security variants', () => {
        const packages = [
            {
                platform: 'standalonewindows',
                performanceRating: 'Good',
                variant: 'security'
            }
        ];
        const result = getPlatformInfo(packages);
        expect(result.pc.platform).toBe('standalonewindows');
    });

    test('skips None performanceRating if platform already has a rating', () => {
        const packages = [
            {
                platform: 'standalonewindows',
                performanceRating: 'Good',
                variant: 'standard'
            },
            {
                platform: 'standalonewindows',
                performanceRating: 'None',
                variant: 'standard'
            }
        ];
        const result = getPlatformInfo(packages);
        expect(result.pc.performanceRating).toBe('Good');
    });

    test('accepts None performanceRating when no prior entry exists', () => {
        const packages = [
            {
                platform: 'android',
                performanceRating: 'None',
                variant: 'standard'
            }
        ];
        const result = getPlatformInfo(packages);
        expect(result.android.performanceRating).toBe('None');
    });

    test('returns empty objects when input is undefined', () => {
        const result = getPlatformInfo(undefined);
        expect(result.pc).toEqual({});
        expect(result.android).toEqual({});
        expect(result.ios).toEqual({});
    });

    test('returns empty objects for empty array', () => {
        const result = getPlatformInfo([]);
        expect(result.pc).toEqual({});
        expect(result.android).toEqual({});
        expect(result.ios).toEqual({});
    });

    test('allows packages without variant (undefined)', () => {
        const packages = [
            { platform: 'standalonewindows', performanceRating: 'Good' }
        ];
        const result = getPlatformInfo(packages);
        expect(result.pc.platform).toBe('standalonewindows');
    });
});
