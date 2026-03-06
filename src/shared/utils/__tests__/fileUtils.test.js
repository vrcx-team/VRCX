import { describe, expect, it } from 'vitest';

import {
    extractFileId,
    extractFileVersion,
    extractVariantVersion
} from '../fileUtils';

describe('extractFileId', () => {
    it('extracts file ID from a URL', () => {
        expect(
            extractFileId(
                'https://api.vrchat.cloud/file/file_abc123-def/1/file'
            )
        ).toBe('file_abc123-def');
    });

    it('extracts file ID from a plain string', () => {
        expect(extractFileId('file_0123456789abcdef')).toBe(
            'file_0123456789abcdef'
        );
    });

    it('returns empty string when no match', () => {
        expect(extractFileId('no-match-here')).toBe('');
        expect(extractFileId('')).toBe('');
    });

    it('handles null/undefined input', () => {
        expect(extractFileId(null)).toBe('');
        expect(extractFileId(undefined)).toBe('');
    });
});

describe('extractFileVersion', () => {
    it('extracts version number from file URL', () => {
        expect(extractFileVersion('/file_abc123/5/file')).toBe('5');
    });

    it('extracts multi-digit version', () => {
        expect(extractFileVersion('/file_abc-def-123/123/file')).toBe('123');
    });

    it('returns empty string when no match', () => {
        expect(extractFileVersion('no-version')).toBe('');
        expect(extractFileVersion('')).toBe('');
    });
});

describe('extractVariantVersion', () => {
    it('extracts version from query parameter', () => {
        expect(extractVariantVersion('https://example.com/file?v=42')).toBe(
            '42'
        );
    });

    it('returns 0 when no v parameter', () => {
        expect(extractVariantVersion('https://example.com/file?other=1')).toBe(
            '0'
        );
    });

    it('returns 0 for empty/null input', () => {
        expect(extractVariantVersion('')).toBe('0');
        expect(extractVariantVersion(null)).toBe('0');
        expect(extractVariantVersion(undefined)).toBe('0');
    });

    it('returns 0 for invalid URL', () => {
        expect(extractVariantVersion('not-a-url')).toBe('0');
    });
});
