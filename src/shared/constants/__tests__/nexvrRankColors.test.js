import { getNexvrRankColors, NEXVR_RANK_COLORS, sanitizeNexvrRankColorOverrides } from '../nexvrRankColors';

describe('official NexVR social rank palette', () => {
    it('matches all seven grades in light and dark modes', () => {
        expect(getNexvrRankColors(false)).toEqual({
            rankE: '#6b7280',
            rankD: '#1f9d55',
            rankC: '#2563eb',
            rankB: '#7c5cd6',
            rankA: '#e0701c',
            rankS: '#b8860b',
            rankSPlus: '#0a1024'
        });
        expect(getNexvrRankColors(true)).toEqual({
            rankE: '#8d94a3',
            rankD: '#6fdc8c',
            rankC: '#4f9cff',
            rankB: '#b48cff',
            rankA: '#ff9a52',
            rankS: '#ffd25a',
            rankSPlus: '#ffffff'
        });
    });

    it('applies custom colours only to the active theme', () => {
        const overrides = { rankD: '#123456' };
        expect(getNexvrRankColors(false, overrides).rankD).toBe('#123456');
        expect(getNexvrRankColors(true).rankD).toBe(NEXVR_RANK_COLORS.dark.rankD);
    });

    it('rejects unknown keys and invalid saved colours', () => {
        expect(
            sanitizeNexvrRankColorOverrides({
                rankE: '#aabbcc',
                rankSPlus: '#FFFFFF',
                rankS: 'red',
                untrusted: '#111111',
                evil: 'url(bad)'
            })
        ).toEqual({ rankE: '#aabbcc', rankSPlus: '#FFFFFF' });
        expect(sanitizeNexvrRankColorOverrides(null)).toEqual({});
        expect(sanitizeNexvrRankColorOverrides([])).toEqual({});
    });
});
