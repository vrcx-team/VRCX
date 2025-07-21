import {
    getPrintFileName,
    getPrintLocalDate,
    getEmojiFileName
} from '../gallery';

describe('Gallery Utils', () => {
    describe('getPrintFileName', () => {
        test('generates filename with createdAt', () => {
            const print = {
                authorName: 'TestUser',
                createdAt: '2023-01-15T10:30:45.123Z',
                id: 'print_12345'
            };
            const result = getPrintFileName(print);
            expect(result).toContain('TestUser');
            expect(result).toContain('print_12345');
            expect(result).toContain('.png');
            // Check date formatting - should replace : with - and T with _
            expect(result).toMatch(
                /\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.\d{3}/
            );
        });

        test('generates filename with timestamp fallback', () => {
            const print = {
                authorName: 'TestUser2',
                timestamp: 1673776245123, // 2023-01-15T10:30:45.123Z
                id: 'print_67890'
            };
            const result = getPrintFileName(print);
            expect(result).toContain('TestUser2');
            expect(result).toContain('print_67890');
            expect(result).toContain('.png');
        });

        test('generates filename with current date fallback', () => {
            const print = {
                authorName: 'TestUser3',
                id: 'print_fallback'
            };
            const result = getPrintFileName(print);
            expect(result).toContain('TestUser3');
            expect(result).toContain('print_fallback');
            expect(result).toContain('.png');
            // Should still have valid date format
            expect(result).toMatch(
                /\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.\d{3}/
            );
        });

        test('handles missing authorName', () => {
            const print = {
                createdAt: '2023-01-15T10:30:45.123Z',
                id: 'print_no_author'
            };
            const result = getPrintFileName(print);
            expect(result).toContain('undefined_'); // authorName will be undefined
            expect(result).toContain('print_no_author');
        });

        test('handles special characters in authorName', () => {
            const print = {
                authorName: 'Test User / With : Chars',
                createdAt: '2023-01-15T10:30:45.123Z',
                id: 'print_special'
            };
            const result = getPrintFileName(print);
            expect(result).toContain('Test User / With : Chars'); // Should preserve original chars
            expect(result).toContain('print_special');
        });

        test('handles missing data gracefully', () => {
            const print = { id: 'test' };
            const result = getPrintFileName(print);
            expect(typeof result).toBe('string');
            expect(result).toContain('test');
            expect(result).toContain('.png');
        });
    });

    describe('getPrintLocalDate', () => {
        test('converts createdAt to local date', () => {
            const print = { createdAt: '2023-01-15T10:30:45.123Z' };
            const result = getPrintLocalDate(print);
            expect(result).toBeInstanceOf(Date);
            // Should have timezone offset applied
            const originalDate = new Date('2023-01-15T10:30:45.123Z');
            const expectedLocalTime =
                originalDate.getTime() -
                originalDate.getTimezoneOffset() * 60000;
            expect(result.getTime()).toBe(expectedLocalTime);
        });

        test('uses timestamp without timezone conversion', () => {
            const timestamp = 1673776245123; // 2023-01-15T10:30:45.123Z
            const print = { timestamp };
            const result = getPrintLocalDate(print);
            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBe(timestamp);
        });

        test('prefers createdAt over timestamp', () => {
            const print = {
                createdAt: '2023-01-15T10:30:45.123Z',
                timestamp: 1673000000000 // Different timestamp
            };
            const result = getPrintLocalDate(print);
            // Should use createdAt, not timestamp
            const originalDate = new Date('2023-01-15T10:30:45.123Z');
            const expectedLocalTime =
                originalDate.getTime() -
                originalDate.getTimezoneOffset() * 60000;
            expect(result.getTime()).toBe(expectedLocalTime);
        });

        test('defaults to current date with timezone adjustment', () => {
            const print = {};
            const result = getPrintLocalDate(print);

            expect(result).toBeInstanceOf(Date);
            // Should be approximately current time with timezone offset
            const currentDate = new Date();
            const expectedLocalTime =
                currentDate.getTime() - currentDate.getTimezoneOffset() * 60000;
            // Allow some tolerance for execution time
            expect(Math.abs(result.getTime() - expectedLocalTime)).toBeLessThan(
                1000
            );
        });

        test('handles invalid createdAt gracefully', () => {
            const print = { createdAt: 'invalid-date' };
            const result = getPrintLocalDate(print);
            expect(result).toBeInstanceOf(Date);
            // Should fall back to current date when createdAt is invalid
        });

        test('handles null/undefined inputs', () => {
            expect(getPrintLocalDate({})).toBeInstanceOf(Date);
            expect(getPrintLocalDate({ createdAt: null })).toBeInstanceOf(Date);
            expect(getPrintLocalDate({ timestamp: null })).toBeInstanceOf(Date);
        });
    });

    describe('getEmojiFileName', () => {
        test('creates animated filename with all properties', () => {
            const emoji = {
                name: 'happy',
                animationStyle: 'bounce',
                frames: 10,
                framesOverTime: 30,
                loopStyle: 'loop'
            };
            const result = getEmojiFileName(emoji);
            expect(result).toBe(
                'happy_bounceanimationStyle_10frames_30fps_looploopStyle.png'
            );
        });

        test('creates animated filename with default loopStyle', () => {
            const emoji = {
                name: 'wave',
                animationStyle: 'wiggle',
                frames: 5,
                framesOverTime: 15
            };
            const result = getEmojiFileName(emoji);
            expect(result).toBe(
                'wave_wiggleanimationStyle_5frames_15fps_linearloopStyle.png'
            );
        });

        test('creates static filename without frames', () => {
            const emoji = {
                name: 'smile',
                animationStyle: 'static'
            };
            const result = getEmojiFileName(emoji);
            expect(result).toBe('smile_staticanimationStyle.png');
        });

        test('treats zero frames as static', () => {
            const emoji = {
                name: 'neutral',
                animationStyle: 'none',
                frames: 0,
                framesOverTime: 0
            };
            const result = getEmojiFileName(emoji);
            expect(result).toBe('neutral_noneanimationStyle.png');
        });

        test('handles missing name gracefully', () => {
            const emoji = {
                animationStyle: 'bounce',
                frames: 5,
                framesOverTime: 10
            };
            const result = getEmojiFileName(emoji);
            expect(result).toContain('undefined_bounceanimationStyle');
        });

        test('handles missing animationStyle', () => {
            const emoji = {
                name: 'test',
                frames: 3,
                framesOverTime: 20
            };
            const result = getEmojiFileName(emoji);
            expect(result).toContain('test_undefinedanimationStyle');
        });

        test('handles special characters in name', () => {
            const emoji = {
                name: 'emoji-with_special.chars',
                animationStyle: 'bounce',
                frames: 8,
                framesOverTime: 24,
                loopStyle: 'pingpong'
            };
            const result = getEmojiFileName(emoji);
            expect(result).toBe(
                'emoji-with_special.chars_bounceanimationStyle_8frames_24fps_pingpongloopStyle.png'
            );
        });

        test('handles edge case values', () => {
            const emoji = {
                name: '',
                animationStyle: '',
                frames: -1,
                framesOverTime: 0,
                loopStyle: ''
            };
            const result = getEmojiFileName(emoji);
            // Should still generate a valid filename structure
            expect(result).toContain('animationStyle');
            expect(result).toContain('.png');
        });
    });

    describe('integration and edge cases', () => {
        test('getPrintFileName produces valid file names', () => {
            const testCases = [
                {
                    print: {
                        authorName: 'ValidUser',
                        createdAt: '2023-12-31T23:59:59.999Z',
                        id: 'print_test123'
                    },
                    expectValid: true
                },
                {
                    print: {
                        authorName: '',
                        createdAt: '2023-01-01T00:00:00.000Z',
                        id: ''
                    },
                    expectValid: true
                },
                {
                    print: {},
                    expectValid: true
                }
            ];

            testCases.forEach(({ print, expectValid }) => {
                const result = getPrintFileName(print);
                if (expectValid) {
                    expect(result).toMatch(/.*\.png$/);
                    expect(result.length).toBeGreaterThan(0);
                }
            });
        });

        test('date functions handle timezone consistency', () => {
            const testDate = '2023-06-15T12:00:00.000Z';
            const print = { createdAt: testDate };

            const localDate = getPrintLocalDate(print);
            const fileName = getPrintFileName({
                ...print,
                authorName: 'test',
                id: 'test'
            });

            // Both functions should produce consistent results
            expect(localDate).toBeInstanceOf(Date);
            expect(fileName).toMatch(
                /test_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.\d{3}_test\.png/
            );
        });

        test('emoji filename handles boundary conditions', () => {
            const extremeCases = [
                { name: 'a'.repeat(100), animationStyle: 'test' },
                { name: 'テスト', animationStyle: 'unicode' },
                {
                    name: 'test',
                    animationStyle: 'test',
                    frames: 999,
                    framesOverTime: 999
                }
            ];

            extremeCases.forEach((emoji) => {
                const result = getEmojiFileName(emoji);
                expect(typeof result).toBe('string');
                expect(result.endsWith('.png')).toBe(true);
            });
        });
    });
});
