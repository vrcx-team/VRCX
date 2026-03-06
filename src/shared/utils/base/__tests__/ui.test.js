import { describe, expect, it } from 'vitest';

import { HSVtoRGB } from '../ui';

describe('HSVtoRGB', () => {
    it('converts pure red (h=0, s=1, v=1)', () => {
        expect(HSVtoRGB(0, 1, 1)).toBe('#ff0000');
    });

    it('converts pure green (h=0.333, s=1, v=1)', () => {
        const result = HSVtoRGB(1 / 3, 1, 1);
        expect(result).toBe('#00ff00');
    });

    it('converts pure blue (h=0.667, s=1, v=1)', () => {
        const result = HSVtoRGB(2 / 3, 1, 1);
        expect(result).toBe('#0000ff');
    });

    it('converts white (s=0, v=1)', () => {
        expect(HSVtoRGB(0, 0, 1)).toBe('#ffffff');
    });

    it('converts black (v=0)', () => {
        expect(HSVtoRGB(0, 1, 0)).toBe('#000000');
    });

    it('converts yellow (h=1/6, s=1, v=1)', () => {
        expect(HSVtoRGB(1 / 6, 1, 1)).toBe('#ffff00');
    });

    it('converts cyan (h=0.5, s=1, v=1)', () => {
        expect(HSVtoRGB(0.5, 1, 1)).toBe('#00ffff');
    });

    it('handles object argument { h, s, v }', () => {
        expect(HSVtoRGB({ h: 0, s: 1, v: 1 })).toBe('#ff0000');
    });

    it('converts a mid-range value', () => {
        const result = HSVtoRGB(0, 0, 0.5);
        // gray: rgb(128,128,128)
        expect(result).toBe('#808080');
    });
});
