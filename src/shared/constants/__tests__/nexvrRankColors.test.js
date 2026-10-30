import { getNexvrRankColors, NEXVR_RANK_COLORS, sanitizeNexvrRankColorOverrides } from '../nexvrRankColors';

describe('official NexVR social rank palette', () => {
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
