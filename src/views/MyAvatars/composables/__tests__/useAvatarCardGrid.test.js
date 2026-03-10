import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../services/config.js', () => ({
    default: {
        getString: vi.fn().mockResolvedValue('0.6'),
        setString: vi.fn()
    }
}));

import { useAvatarCardGrid } from '../useAvatarCardGrid';

/**
 *
 * @param options
 */
function createGrid(options = {}) {
    return useAvatarCardGrid(options);
}

describe('useAvatarCardGrid', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('defaults', () => {
        it('returns default scale of 0.6', () => {
            const { cardScale } = createGrid();
            expect(cardScale.value).toBe(0.6);
        });

        it('returns default spacing of 1', () => {
            const { cardSpacing } = createGrid();
            expect(cardSpacing.value).toBe(1);
        });

        it('exposes scale/spacing percentage', () => {
            const { cardScalePercent, cardSpacingPercent } = createGrid();
            expect(cardScalePercent.value).toBe(60);
            expect(cardSpacingPercent.value).toBe(100);
        });
    });

    describe('scale clamping', () => {
        it('clamps scale to min', () => {
            const { cardScale } = createGrid();
            cardScale.value = 0.1;
            expect(cardScale.value).toBe(0.3);
        });

        it('clamps scale to max', () => {
            const { cardScale } = createGrid();
            cardScale.value = 2.0;
            expect(cardScale.value).toBe(0.9);
        });

        it('handles NaN gracefully', () => {
            const { cardScale } = createGrid();
            cardScale.value = NaN;
            // NaN → Number(NaN) || 1 = 1, clamped to max 0.9
            expect(cardScale.value).toBeLessThanOrEqual(0.9);
            expect(cardScale.value).toBeGreaterThanOrEqual(0.3);
        });

        it('uses custom scale range', () => {
            const { cardScale } = createGrid({ scaleMin: 0.5, scaleMax: 0.8 });
            cardScale.value = 0.2;
            expect(cardScale.value).toBe(0.5);
            cardScale.value = 1.0;
            expect(cardScale.value).toBe(0.8);
        });
    });

    describe('spacing clamping', () => {
        it('clamps spacing to min', () => {
            const { cardSpacing } = createGrid();
            cardSpacing.value = 0.1;
            expect(cardSpacing.value).toBe(0.5);
        });

        it('clamps spacing to max', () => {
            const { cardSpacing } = createGrid();
            cardSpacing.value = 5;
            expect(cardSpacing.value).toBe(1.5);
        });
    });

    describe('slider v-model helpers', () => {
        it('cardScaleValue returns array', () => {
            const { cardScaleValue } = createGrid();
            expect(cardScaleValue.value).toEqual([0.6]);
        });

        it('cardScaleValue setter updates scale', () => {
            const { cardScaleValue, cardScale } = createGrid();
            cardScaleValue.value = [0.7];
            expect(cardScale.value).toBe(0.7);
        });

        it('cardSpacingValue returns array', () => {
            const { cardSpacingValue } = createGrid();
            expect(cardSpacingValue.value).toEqual([1]);
        });

        it('cardSpacingValue setter updates spacing', () => {
            const { cardSpacingValue, cardSpacing } = createGrid();
            cardSpacingValue.value = [0.8];
            expect(cardSpacing.value).toBe(0.8);
        });
    });

    describe('getGridMetrics', () => {
        it('returns 1 column when containerWidth is 0', () => {
            const { getGridMetrics } = createGrid();
            const result = getGridMetrics(10);
            expect(result.columns).toBe(1);
        });

        it('returns correct minWidth based on scale', () => {
            const { getGridMetrics, cardScale } = createGrid();
            // default scale 0.6, baseCardWidth 200 → 120
            const result = getGridMetrics(1);
            expect(result.minWidth).toBe(200 * cardScale.value);
        });

        it('returns correct gap based on spacing', () => {
            const { getGridMetrics } = createGrid();
            // default spacing 1, baseGap 12 → max(4, 12) = 12
            const result = getGridMetrics(1);
            expect(result.gap).toBe(12);
        });

        it('gap is at least 4', () => {
            const { getGridMetrics, cardSpacing } = createGrid();
            cardSpacing.value = 0.5;
            // spacing 0.5, baseGap 12 → max(4, 6) = 6
            const result = getGridMetrics(1);
            expect(result.gap).toBeGreaterThanOrEqual(4);
        });

        it('handles count=0 gracefully', () => {
            const { getGridMetrics } = createGrid();
            const result = getGridMetrics(0);
            expect(result.columns).toBe(1);
        });

        it('handles negative count gracefully', () => {
            const { getGridMetrics } = createGrid();
            const result = getGridMetrics(-5);
            expect(result.columns).toBe(1);
        });
    });

    describe('chunkIntoRows', () => {
        it('returns empty array for empty input', () => {
            const { chunkIntoRows } = createGrid();
            expect(chunkIntoRows([])).toEqual([]);
        });

        it('returns empty array for null input', () => {
            const { chunkIntoRows } = createGrid();
            expect(chunkIntoRows(null)).toEqual([]);
        });

        it('returns empty array for non-array input', () => {
            const { chunkIntoRows } = createGrid();
            expect(chunkIntoRows('not-array')).toEqual([]);
        });

        it('chunks items into rows with key prefix', () => {
            const { chunkIntoRows } = createGrid();
            // containerWidth=0 → 1 column → each item is its own row
            const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const rows = chunkIntoRows(items, 'test');
            expect(rows).toHaveLength(3);
            expect(rows[0].key).toBe('test:0');
            expect(rows[0].items).toEqual([{ id: 1 }]);
            expect(rows[1].key).toBe('test:1');
            expect(rows[2].key).toBe('test:2');
        });

        it('uses default key prefix', () => {
            const { chunkIntoRows } = createGrid();
            const rows = chunkIntoRows([{ id: 1 }]);
            expect(rows[0].key).toBe('row:0');
        });
    });

    describe('estimateRowHeight', () => {
        it('returns positive height for any item count', () => {
            const { estimateRowHeight } = createGrid();
            expect(estimateRowHeight(1)).toBeGreaterThan(0);
            expect(estimateRowHeight(10)).toBeGreaterThan(0);
            expect(estimateRowHeight(100)).toBeGreaterThan(0);
        });

        it('returns positive height for 0 items', () => {
            const { estimateRowHeight } = createGrid();
            expect(estimateRowHeight(0)).toBeGreaterThan(0);
        });

        it('height increases with more rows', () => {
            const { estimateRowHeight } = createGrid();
            // containerWidth=0 → 1 column → height scales with count
            const h1 = estimateRowHeight(1);
            const h5 = estimateRowHeight(5);
            expect(h5).toBeGreaterThan(h1);
        });

        it('height changes with scale', () => {
            const { estimateRowHeight, cardScale } = createGrid();
            const h1 = estimateRowHeight(5);
            cardScale.value = 0.9;
            const h2 = estimateRowHeight(5);
            expect(h2).toBeGreaterThan(h1);
        });
    });

    describe('gridStyle', () => {
        it('returns a function', () => {
            const { gridStyle } = createGrid();
            expect(typeof gridStyle.value).toBe('function');
        });

        it('returns CSS variable object', () => {
            const { gridStyle } = createGrid();
            const style = gridStyle.value(10);
            expect(style).toHaveProperty('--avatar-card-min-width');
            expect(style).toHaveProperty('--avatar-card-gap');
            expect(style).toHaveProperty('--avatar-card-target-width');
            expect(style).toHaveProperty('--avatar-grid-columns');
        });

        it('CSS variables contain px units for widths', () => {
            const { gridStyle } = createGrid();
            const style = gridStyle.value(1);
            expect(style['--avatar-card-min-width']).toMatch(/^\d+px$/);
            expect(style['--avatar-card-gap']).toMatch(/^\d+px$/);
            expect(style['--avatar-card-target-width']).toMatch(/^\d+px$/);
        });

        it('columns is a plain number string', () => {
            const { gridStyle } = createGrid();
            const style = gridStyle.value(1);
            expect(style['--avatar-grid-columns']).toMatch(/^\d+$/);
        });
    });

    describe('persistence', () => {
        it('calls configRepository.setString when scale changes', async () => {
            const config = (await import('../../../../services/config.js'))
                .default;
            const { cardScale } = createGrid();
            cardScale.value = 0.7;
            expect(config.setString).toHaveBeenCalledWith(
                'VRCX_MyAvatarsCardScale',
                '0.7'
            );
        });

        it('calls configRepository.setString when spacing changes', async () => {
            const config = (await import('../../../../services/config.js'))
                .default;
            const { cardSpacing } = createGrid();
            cardSpacing.value = 0.8;
            expect(config.setString).toHaveBeenCalledWith(
                'VRCX_MyAvatarsCardSpacing',
                '0.8'
            );
        });

        it('uses custom config keys', async () => {
            const config = (await import('../../../../services/config.js'))
                .default;
            const { cardScale } = createGrid({
                scaleConfigKey: 'CUSTOM_SCALE'
            });
            cardScale.value = 0.5;
            expect(config.setString).toHaveBeenCalledWith(
                'CUSTOM_SCALE',
                '0.5'
            );
        });
    });

    describe('slider metadata', () => {
        it('exposes scaleSlider with defaults', () => {
            const { scaleSlider } = createGrid();
            expect(scaleSlider.min).toBe(0.3);
            expect(scaleSlider.max).toBe(0.9);
            expect(scaleSlider.step).toBe(0.01);
        });

        it('exposes spacingSlider with defaults', () => {
            const { spacingSlider } = createGrid();
            expect(spacingSlider.min).toBe(0.5);
            expect(spacingSlider.max).toBe(1.5);
            expect(spacingSlider.step).toBe(0.05);
        });

        it('accepts custom slider options', () => {
            const { scaleSlider, spacingSlider } = createGrid({
                scaleMin: 0.1,
                scaleMax: 2.0,
                scaleStep: 0.1,
                spacingMin: 0.2,
                spacingMax: 3.0,
                spacingStep: 0.1
            });
            expect(scaleSlider).toEqual({ min: 0.1, max: 2.0, step: 0.1 });
            expect(spacingSlider).toEqual({ min: 0.2, max: 3.0, step: 0.1 });
        });
    });
});
