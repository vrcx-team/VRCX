import { describe, expect, it } from 'vitest';

import { formatCsvField, formatCsvRow, needsCsvQuotes } from '../csv';

describe('needsCsvQuotes', () => {
    it('returns false for plain text', () => {
        expect(needsCsvQuotes('hello')).toBe(false);
    });

    it('returns true for text containing commas', () => {
        expect(needsCsvQuotes('hello,world')).toBe(true);
    });

    it('returns true for text containing double quotes', () => {
        expect(needsCsvQuotes('say "hi"')).toBe(true);
    });

    it('returns true for text with control characters', () => {
        expect(needsCsvQuotes('line\nbreak')).toBe(true);
        expect(needsCsvQuotes('tab\there')).toBe(true);
        expect(needsCsvQuotes('\x00null')).toBe(true);
    });

    it('returns false for empty string', () => {
        expect(needsCsvQuotes('')).toBe(false);
    });
});

describe('formatCsvField', () => {
    it('returns empty string for null', () => {
        expect(formatCsvField(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(formatCsvField(undefined)).toBe('');
    });

    it('returns plain string unchanged', () => {
        expect(formatCsvField('hello')).toBe('hello');
    });

    it('converts numbers to strings', () => {
        expect(formatCsvField(42)).toBe('42');
    });

    it('wraps text with commas in double quotes', () => {
        expect(formatCsvField('a,b')).toBe('"a,b"');
    });

    it('escapes existing double quotes by doubling', () => {
        expect(formatCsvField('say "hi"')).toBe('"say ""hi"""');
    });

    it('wraps text with newlines in double quotes', () => {
        expect(formatCsvField('line\nbreak')).toBe('"line\nbreak"');
    });
});

describe('formatCsvRow', () => {
    it('formats selected fields from an object', () => {
        const obj = {
            id: 'avtr_123',
            name: 'Test Avatar',
            authorName: 'Author'
        };
        expect(formatCsvRow(obj, ['id', 'name'])).toBe('avtr_123,Test Avatar');
    });

    it('handles missing fields as empty strings', () => {
        const obj = { id: 'avtr_123' };
        expect(formatCsvRow(obj, ['id', 'name'])).toBe('avtr_123,');
    });

    it('escapes fields that need quoting', () => {
        const obj = { id: 'avtr_123', name: 'Test, Avatar' };
        expect(formatCsvRow(obj, ['id', 'name'])).toBe(
            'avtr_123,"Test, Avatar"'
        );
    });

    it('handles null obj gracefully', () => {
        expect(formatCsvRow(null, ['id', 'name'])).toBe(',');
    });

    it('returns empty string for no fields', () => {
        expect(formatCsvRow({ id: '1' }, [])).toBe('');
    });
});
