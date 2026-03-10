import removeConfusables, { removeWhitespace } from '../confusables.js';

describe('removeConfusables', () => {
    test('returns ASCII strings unchanged (fast path)', () => {
        expect(removeConfusables('Hello World')).toBe('HelloWorld');
    });

    test('converts circled letters to ASCII', () => {
        expect(removeConfusables('Ⓗⓔⓛⓛⓞ')).toBe('Hello');
    });

    test('converts fullwidth letters to ASCII', () => {
        expect(removeConfusables('Ｈｅｌｌｏ')).toBe('Hello');
    });

    test('converts Cyrillic confusables', () => {
        // Cyrillic А, В, С look like Latin A, B, C
        expect(removeConfusables('АВС')).toBe('ABC');
    });

    test('handles mixed confusables and normal chars', () => {
        expect(removeConfusables('Ⓣest')).toBe('Test');
    });

    test('strips combining marks', () => {
        // 'e' + combining acute accent → normalized then combining mark stripped → 'e'
        const input = 'e\u0301';
        const result = removeConfusables(input);
        expect(result).toBe('e');
    });

    test('returns empty string for empty input', () => {
        expect(removeConfusables('')).toBe('');
    });
});

describe('removeWhitespace', () => {
    test('removes regular spaces', () => {
        expect(removeWhitespace('a b c')).toBe('abc');
    });

    test('removes tabs and newlines', () => {
        expect(removeWhitespace('a\tb\nc')).toBe('abc');
    });

    test('returns string without whitespace unchanged', () => {
        expect(removeWhitespace('abc')).toBe('abc');
    });

    test('returns empty string for empty input', () => {
        expect(removeWhitespace('')).toBe('');
    });
});
