import { describe, expect, it } from 'vitest';

import {
    aggregateFriendDaysToBuckets,
    buildPerBucketTopNPercentageSeries,
    computeZoomRange
} from '../relationshipTimelineUtils';

function createFriendDaysMap() {
    return new Map([
        [
            'a',
            {
                displayName: 'Alice',
                days: new Map([
                    [0, { totalTime: 1000, joinCount: 0 }],
                    [1, { totalTime: 0, joinCount: 0 }]
                ])
            }
        ],
        [
            'b',
            {
                displayName: 'Bob',
                days: new Map([
                    [0, { totalTime: 800, joinCount: 0 }],
                    [1, { totalTime: 100, joinCount: 0 }]
                ])
            }
        ],
        [
            'c',
            {
                displayName: 'Carol',
                days: new Map([
                    [0, { totalTime: 700, joinCount: 0 }],
                    [1, { totalTime: 900, joinCount: 0 }]
                ])
            }
        ]
    ]);
}

describe('relationshipTimelineUtils', () => {
    it('computes default zoom range as latest 10 units when bucket count exceeds 10', () => {
        const range = computeZoomRange(25, null, 10);
        expect(range.start).toBeCloseTo(60);
        expect(range.end).toBe(100);
    });

    it('keeps persisted zoom range when provided', () => {
        const range = computeZoomRange(25, { start: 12.5, end: 78.5 }, 10);
        expect(range).toEqual({ start: 12.5, end: 78.5 });
    });

    it('uses per-bucket topN and allows legend to exceed N via union', () => {
        const aggregation = aggregateFriendDaysToBuckets(createFriendDaysMap(), 1);
        const chart = buildPerBucketTopNPercentageSeries({
            aggregation,
            friendCount: 2,
            showOthers: true,
            resolveDisplayName: (_id, name) => name,
            othersName: 'Others',
            colorPalette: ['#1', '#2', '#3']
        });

        expect(chart.xLabels).toHaveLength(2);
        const seriesNames = chart.series.map((item) => item.name);
        expect(seriesNames[0]).toBe('Others');
        expect(seriesNames.slice(1).sort()).toEqual(['Alice', 'Bob', 'Carol']);

        const bucket0Total = chart.series.reduce((sum, item) => sum + item.data[0], 0);
        const bucket1Total = chart.series.reduce((sum, item) => sum + item.data[1], 0);
        expect(bucket0Total).toBeCloseTo(100, 2);
        expect(bucket1Total).toBeCloseTo(100, 2);

        const others = chart.series.find((item) => item.name === 'Others');
        expect(others.data[0]).toBeCloseTo(28, 2);
        expect(others.data[1]).toBe(0);
    });
});
