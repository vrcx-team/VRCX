import { timeToText } from '../format';

describe('Format Utils', () => {
    describe('timeToText', () => {
        test('formats basic durations', () => {
            expect(timeToText(1000)).toBe('1s');
            expect(timeToText(60000)).toBe('1m');
            expect(timeToText(3600000)).toBe('1h');
        });

        test('formats with seconds flag', () => {
            expect(timeToText(60000, true)).toBe('1m 0s');
            expect(timeToText(90000, true)).toBe('1m 30s');
        });

        test('handles zero and negative', () => {
            expect(timeToText(0)).toBe('0s');
            expect(timeToText(-1000)).toBe('1s');
        });

        test('handles complex time', () => {
            const result = timeToText(90061000);
            expect(result).toContain('1d');
            expect(result).toContain('1h');
        });
    });
});
