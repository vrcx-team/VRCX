import { describe, expect, it } from 'vitest';

import { getAvailablePlatforms } from '../platformUtils';

describe('getAvailablePlatforms', () => {
    it('detects PC platform', () => {
        const packages = [{ platform: 'standalonewindows' }];
        expect(getAvailablePlatforms(packages)).toEqual({
            isPC: true,
            isQuest: false,
            isIos: false
        });
    });

    it('detects Quest (android) platform', () => {
        const packages = [{ platform: 'android' }];
        expect(getAvailablePlatforms(packages)).toEqual({
            isPC: false,
            isQuest: true,
            isIos: false
        });
    });

    it('detects iOS platform', () => {
        const packages = [{ platform: 'ios' }];
        expect(getAvailablePlatforms(packages)).toEqual({
            isPC: false,
            isQuest: false,
            isIos: true
        });
    });

    it('detects multiple platforms', () => {
        const packages = [
            { platform: 'standalonewindows' },
            { platform: 'android' },
            { platform: 'ios' }
        ];
        expect(getAvailablePlatforms(packages)).toEqual({
            isPC: true,
            isQuest: true,
            isIos: true
        });
    });

    it('skips non-standard/non-security variants', () => {
        const packages = [
            { platform: 'standalonewindows', variant: 'custom_variant' },
            { platform: 'android', variant: 'standard' }
        ];
        expect(getAvailablePlatforms(packages)).toEqual({
            isPC: false,
            isQuest: true,
            isIos: false
        });
    });

    it('allows security variant', () => {
        const packages = [
            { platform: 'standalonewindows', variant: 'security' }
        ];
        expect(getAvailablePlatforms(packages)).toEqual({
            isPC: true,
            isQuest: false,
            isIos: false
        });
    });

    it('returns all false for empty array', () => {
        expect(getAvailablePlatforms([])).toEqual({
            isPC: false,
            isQuest: false,
            isIos: false
        });
    });

    it('returns all false for non-object input', () => {
        expect(getAvailablePlatforms('string')).toEqual({
            isPC: false,
            isQuest: false,
            isIos: false
        });
    });

    it('throws for null input (typeof null === "object" but not iterable)', () => {
        expect(() => getAvailablePlatforms(null)).toThrow();
    });
});
