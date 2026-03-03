import { describe, expect, it } from 'vitest';

import {
    findMatchingDetailData,
    formatWorldName,
    generateYAxisLabel,
    isDetailDataFiltered
} from '../useChartHelpers';

describe('isDetailDataFiltered', () => {
    it('returns false when both filters are enabled', () => {
        const detailData = [{ isFriend: true }, { isFriend: false }];
        expect(isDetailDataFiltered(detailData, true, true)).toBe(false);
    });

    it('returns false when detailData is null/undefined', () => {
        expect(isDetailDataFiltered(null, false, false)).toBe(false);
        expect(isDetailDataFiltered(undefined, true, false)).toBe(false);
    });

    it('filters solo instance when isSoloInstanceVisible is false and only 1 entry', () => {
        const detailData = [{ isFriend: false }];
        expect(isDetailDataFiltered(detailData, false, true)).toBe(true);
    });

    it('does not filter solo when isSoloInstanceVisible is true', () => {
        const detailData = [{ isFriend: false }];
        expect(isDetailDataFiltered(detailData, true, true)).toBe(false);
    });

    it('filters no-friend instance when isNoFriendInstanceVisible is false', () => {
        const detailData = [{ isFriend: false }, { isFriend: false }];
        expect(isDetailDataFiltered(detailData, true, false)).toBe(true);
    });

    it('does not filter when at least one friend exists', () => {
        const detailData = [{ isFriend: true }, { isFriend: false }];
        expect(isDetailDataFiltered(detailData, true, false)).toBe(false);
    });
});

describe('findMatchingDetailData', () => {
    const currentUser = { id: 'user1' };

    it('returns null when activityItem is null', () => {
        expect(findMatchingDetailData(null, [], currentUser)).toBeNull();
    });

    it('returns null when currentUser is null', () => {
        expect(
            findMatchingDetailData({ location: 'loc1' }, [], null)
        ).toBeNull();
    });

    it('finds matching detail data by location and joinTime', () => {
        const joinTime = { isSame: (other) => other === 100 };
        const activityItem = { location: 'wrld_abc', joinTime: 100 };
        const detailData = [
            [
                { location: 'wrld_abc', user_id: 'user1', joinTime },
                {
                    location: 'wrld_abc',
                    user_id: 'user2',
                    joinTime: { isSame: () => false }
                }
            ],
            [
                {
                    location: 'wrld_xyz',
                    user_id: 'user1',
                    joinTime: { isSame: () => false }
                }
            ]
        ];

        const result = findMatchingDetailData(
            activityItem,
            detailData,
            currentUser
        );
        expect(result).toBe(detailData[0]);
    });

    it('returns undefined when no match is found', () => {
        const activityItem = { location: 'wrld_abc', joinTime: 100 };
        const detailData = [
            [
                {
                    location: 'wrld_xyz',
                    user_id: 'user1',
                    joinTime: { isSame: () => false }
                }
            ]
        ];

        const result = findMatchingDetailData(
            activityItem,
            detailData,
            currentUser
        );
        expect(result).toBeUndefined();
    });
});

describe('generateYAxisLabel', () => {
    it('returns filtered label format for filtered data', () => {
        expect(generateYAxisLabel('TestWorld', true)).toBe(
            '{filtered|TestWorld}'
        );
    });

    it('returns normal label format for non-filtered data', () => {
        expect(generateYAxisLabel('TestWorld', false)).toBe(
            '{normal|TestWorld}'
        );
    });

    it('truncates long world names', () => {
        const longName = 'A'.repeat(30);
        const result = generateYAxisLabel(longName, false);
        expect(result).toBe(`{normal|${'A'.repeat(20)}...}`);
    });

    it('respects custom maxLength', () => {
        const result = generateYAxisLabel('Hello World!', false, 5);
        expect(result).toBe('{normal|Hello...}');
    });
});

describe('formatWorldName', () => {
    it('returns name as-is when within maxLength', () => {
        expect(formatWorldName('Short')).toBe('Short');
    });

    it('truncates and adds ellipsis when name exceeds maxLength', () => {
        const longName = 'A'.repeat(25);
        expect(formatWorldName(longName)).toBe(`${'A'.repeat(20)}...`);
    });

    it('respects custom maxLength', () => {
        expect(formatWorldName('Hello World', 5)).toBe('Hello...');
    });

    it('does not truncate at exact maxLength boundary', () => {
        const exactName = 'A'.repeat(20);
        expect(formatWorldName(exactName)).toBe(exactName);
    });
});
