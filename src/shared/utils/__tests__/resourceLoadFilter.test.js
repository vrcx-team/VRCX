import { describe, expect, it } from 'vitest';
import { compileResourceLoadFilters, isResourceLoadExcluded } from '../resourceLoadFilter';

describe('resource load URL exclusions', () => {
    const filters = compileResourceLoadFilters([
        String.raw`telemetry\.vrclinking\.com`,
        String.raw`^https://vr-m\.net/1/wh/p/[0-9]+$`
    ]);

    it.each(['StringLoad', 'ImageLoad'])('matches either pattern for %s', (type) => {
        for (const resourceUrl of [
            'https://telemetry.vrclinking.com/v1/worlds/example',
            'https://vr-m.net/1/wh/p/792'
        ]) {
            expect(isResourceLoadExcluded({ type, resourceUrl }, filters)).toBe(true);
            expect(isResourceLoadExcluded({ type, resourceUrl }, filters)).toBe(true);
        }
        expect(isResourceLoadExcluded({ type, resourceUrl: 'https://vr-m.net/other' }, filters)).toBe(false);
    });

    it('never excludes other event types or missing URLs', () => {
        const all = compileResourceLoadFilters(['.*']);
        expect(isResourceLoadExcluded({ type: 'VideoPlay', resourceUrl: 'https://example.com' }, all)).toBe(false);
        expect(isResourceLoadExcluded({ type: 'StringLoad' }, all)).toBe(false);
    });

    it('ignores blank and invalid patterns without suppressing valid patterns', () => {
        const compiled = compileResourceLoadFilters(['', '  ', '[', 'example']);
        expect(compiled[2].error).not.toBe('');
        expect(isResourceLoadExcluded({ type: 'ImageLoad', resourceUrl: 'other' }, compiled)).toBe(false);
        expect(isResourceLoadExcluded({ type: 'ImageLoad', resourceUrl: 'example' }, compiled)).toBe(true);
    });

    it('supports exact URLs and preserves case-sensitive matching', () => {
        const exact = compileResourceLoadFilters([String.raw`^https://vr-m\.net/1/wh/p/792$`]);
        expect(isResourceLoadExcluded({ type: 'StringLoad', resourceUrl: 'https://vr-m.net/1/wh/p/7920' }, exact)).toBe(
            false
        );
        expect(isResourceLoadExcluded({ type: 'StringLoad', resourceUrl: 'https://VR-M.net/1/wh/p/792' }, exact)).toBe(
            false
        );
    });
});
