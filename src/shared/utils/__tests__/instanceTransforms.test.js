import {
    computeDisabledContentSettings,
    createDefaultInstanceRef
} from '../instanceTransforms';

describe('computeDisabledContentSettings', () => {
    const settingsList = ['gore', 'nudity', 'violence'];

    it('returns empty for null contentSettings', () => {
        expect(computeDisabledContentSettings(null, settingsList)).toEqual([]);
    });

    it('returns empty for empty object', () => {
        expect(computeDisabledContentSettings({}, settingsList)).toEqual([]);
    });

    it('returns disabled settings (false values)', () => {
        const result = computeDisabledContentSettings(
            { gore: false, nudity: true, violence: false },
            settingsList
        );
        expect(result).toEqual(['gore', 'violence']);
    });

    it('skips undefined settings', () => {
        const result = computeDisabledContentSettings(
            { gore: true },
            settingsList
        );
        expect(result).toEqual([]);
    });
});

describe('createDefaultInstanceRef', () => {
    it('creates object with defaults', () => {
        const ref = createDefaultInstanceRef({});
        expect(ref.id).toBe('');
        expect(ref.capacity).toBe(0);
        expect(ref.hasCapacityForYou).toBe(true);
        expect(ref.$fetchedAt).toBe('');
        expect(ref.$disabledContentSettings).toEqual([]);
    });

    it('spreads json over defaults', () => {
        const ref = createDefaultInstanceRef({
            id: 'wrld_123:12345',
            capacity: 40
        });
        expect(ref.id).toBe('wrld_123:12345');
        expect(ref.capacity).toBe(40);
    });
});
