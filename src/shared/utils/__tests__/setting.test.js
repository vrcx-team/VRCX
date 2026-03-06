import { getVRChatResolution } from '../setting';

describe('getVRChatResolution', () => {
    test.each([
        ['1280x720', '1280x720 (720p)'],
        ['1920x1080', '1920x1080 (1080p)'],
        ['2560x1440', '2560x1440 (1440p)'],
        ['3840x2160', '3840x2160 (4K)'],
        ['7680x4320', '7680x4320 (8K)']
    ])('maps %s to %s', (input, expected) => {
        expect(getVRChatResolution(input)).toBe(expected);
    });

    test('returns Custom for unknown resolutions', () => {
        expect(getVRChatResolution('1024x768')).toBe('1024x768 (Custom)');
        expect(getVRChatResolution('800x600')).toBe('800x600 (Custom)');
    });

    test('handles empty/undefined input', () => {
        expect(getVRChatResolution('')).toBe(' (Custom)');
        expect(getVRChatResolution(undefined)).toBe('undefined (Custom)');
    });
});
