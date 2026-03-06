import { describe, expect, it } from 'vitest';

import { getFaviconUrl, replaceVrcPackageUrl } from '../urlUtils';

describe('getFaviconUrl', () => {
    it('returns favicon URL for valid URL', () => {
        expect(getFaviconUrl('https://vrchat.com/home')).toBe(
            'https://icons.duckduckgo.com/ip2/vrchat.com.ico'
        );
    });

    it('extracts host from complex URL', () => {
        expect(getFaviconUrl('https://store.steampowered.com/app/12345')).toBe(
            'https://icons.duckduckgo.com/ip2/store.steampowered.com.ico'
        );
    });

    it('returns empty string for empty input', () => {
        expect(getFaviconUrl('')).toBe('');
        expect(getFaviconUrl(null)).toBe('');
        expect(getFaviconUrl(undefined)).toBe('');
    });

    it('returns empty string for invalid URL', () => {
        expect(getFaviconUrl('not-a-url')).toBe('');
    });
});

describe('replaceVrcPackageUrl', () => {
    it('replaces api.vrchat.cloud with vrchat.com', () => {
        expect(
            replaceVrcPackageUrl('https://api.vrchat.cloud/api/1/file/123')
        ).toBe('https://vrchat.com/api/1/file/123');
    });

    it('returns URL unchanged if no match', () => {
        expect(replaceVrcPackageUrl('https://example.com/test')).toBe(
            'https://example.com/test'
        );
    });

    it('returns empty string for empty/null input', () => {
        expect(replaceVrcPackageUrl('')).toBe('');
        expect(replaceVrcPackageUrl(null)).toBe('');
        expect(replaceVrcPackageUrl(undefined)).toBe('');
    });
});
