import {
    escapeTag,
    escapeTagRecursive,
    textToHex,
    commaNumber,
    localeIncludes,
    changeLogRemoveLinks
} from '../string';

describe('String Utils', () => {
    describe('escapeTag', () => {
        test('escapes HTML characters', () => {
            expect(escapeTag('<script>')).toBe('&#60;script&#62;');
            expect(escapeTag('Hello & goodbye')).toBe('Hello &#38; goodbye');
            expect(escapeTag('"test"')).toBe('&#34;test&#34;');
        });

        test('handles different types', () => {
            expect(escapeTag('')).toBe('');
            // @ts-ignore
            expect(escapeTag(null)).toBe('null');
            // @ts-ignore
            expect(escapeTag(123)).toBe('123');
        });
    });

    describe('escapeTagRecursive', () => {
        test('escapes nested objects', () => {
            const input = {
                name: '<script>alert("xss")</script>',
                data: { value: 'Hello & world' }
            };
            const result = escapeTagRecursive(input);
            expect(result.name).toBe(
                '&#60;script&#62;alert(&#34;xss&#34;)&#60;/script&#62;'
            );
            expect(result.data.value).toBe('Hello &#38; world');
        });

        test('handles arrays', () => {
            const input = ['<script>', 'normal text'];
            const result = escapeTagRecursive(input);
            expect(result[0]).toBe('&#60;script&#62;');
            expect(result[1]).toBe('normal text');
        });
    });

    describe('textToHex', () => {
        test('converts basic text', () => {
            expect(textToHex('ABC')).toBe('41 42 43');
            expect(textToHex('Hello')).toBe('48 65 6c 6c 6f');
        });

        test('handles special cases', () => {
            expect(textToHex('')).toBe('');
            // @ts-ignore
            expect(textToHex(123)).toBe('31 32 33');
        });
    });

    describe('commaNumber', () => {
        test('formats numbers', () => {
            expect(commaNumber(1000)).toBe('1,000');
            expect(commaNumber(1234567)).toBe('1,234,567');
        });

        test('handles edge cases', () => {
            expect(commaNumber(0)).toBe('0');
            // @ts-ignore
            expect(commaNumber(null)).toBe('0');
            // @ts-ignore
            expect(commaNumber('abc')).toBe('0');
        });
    });

    describe('localeIncludes', () => {
        const comparer = {
            compare: (a, b) => a.toLowerCase().localeCompare(b.toLowerCase())
        };

        test('finds substrings', () => {
            expect(localeIncludes('Hello World', 'hello', comparer)).toBe(true);
            expect(localeIncludes('Hello World', 'xyz', comparer)).toBe(false);
        });

        test('handles empty search', () => {
            expect(localeIncludes('Hello', '', comparer)).toBe(true);
        });
    });

    describe('changeLogRemoveLinks', () => {
        test('removes markdown links', () => {
            expect(
                changeLogRemoveLinks('Hello [world](http://example.com)')
            ).toBe('Hello ');
        });

        test('preserves image links', () => {
            expect(changeLogRemoveLinks('![image](url)')).toBe('![image](url)');
        });
    });
});
