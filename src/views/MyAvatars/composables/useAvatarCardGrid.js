import {
    computed,
    nextTick,
    onBeforeMount,
    ref,
    watch
} from 'vue';
import { useResizeObserver } from '@vueuse/core';

import configRepository from '../../../services/config.js';

/**
 *
 * @param value
 * @param min
 * @param max
 */
function clamp(value, min, max) {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
}

/**
 * @param options
 */
export function useAvatarCardGrid(options = {}) {
    const scaleSlider = {
        min: options.scaleMin ?? 0.3,
        max: options.scaleMax ?? 0.9,
        step: options.scaleStep ?? 0.01
    };
    const spacingSlider = {
        min: options.spacingMin ?? 0.5,
        max: options.spacingMax ?? 1.5,
        step: options.spacingStep ?? 0.05
    };

    const baseCardWidth = options.baseCardWidth ?? 200;
    const baseGap = options.baseGap ?? 12;
    const baseCardHeight = options.baseCardHeight ?? 200;
    const scaleConfigKey = options.scaleConfigKey ?? 'VRCX_MyAvatarsCardScale';
    const spacingConfigKey =
        options.spacingConfigKey ?? 'VRCX_MyAvatarsCardSpacing';

    const cardScaleBase = ref(0.6);
    const cardSpacingBase = ref(1);
    const gridContainerRef = ref(null);
    const containerWidth = ref(0);

    const updateContainerWidth = (el) => {
        const element = el ?? gridContainerRef.value;
        if (!element) {
            containerWidth.value = 0;
            return;
        }
        containerWidth.value = Math.max(
            element.clientWidth ?? element.offsetWidth ?? 0,
            0
        );
    };

    const cardScale = computed({
        get: () => cardScaleBase.value,
        set: (value) => {
            const next = clamp(
                Number(value) || 1,
                scaleSlider.min,
                scaleSlider.max
            );
            cardScaleBase.value = next;
            configRepository.setString(scaleConfigKey, String(next));
        }
    });

    const cardSpacing = computed({
        get: () => cardSpacingBase.value,
        set: (value) => {
            const next = clamp(
                Number(value) || 1,
                spacingSlider.min,
                spacingSlider.max
            );
            cardSpacingBase.value = next;
            configRepository.setString(spacingConfigKey, String(next));
        }
    });

    const cardScalePercent = computed(() => Math.round(cardScale.value * 100));
    const cardSpacingPercent = computed(() =>
        Math.round(cardSpacing.value * 100)
    );

    // Slider v-model helpers (shadcn Slider expects array)
    const cardScaleValue = computed({
        get: () => [cardScale.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') cardScale.value = next;
        }
    });

    const cardSpacingValue = computed({
        get: () => [cardSpacing.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') cardSpacing.value = next;
        }
    });

    /**
     * @param count
     */
    const getGridMetrics = (count = 1) => {
        const scale = cardScale.value;
        const spacing = cardSpacing.value;
        const minWidth = baseCardWidth * scale;
        const gap = Math.max(4, baseGap * spacing);
        const width = Math.max(containerWidth.value, 0);
        const itemCount = Math.max(Number(count) || 0, 0);
        const safeCount = itemCount > 0 ? itemCount : 1;
        const maxColumns =
            width > 0
                ? Math.max(1, Math.floor((width + gap) / (minWidth + gap)) || 1)
                : 1;
        const columns = Math.max(1, Math.min(safeCount, maxColumns));

        // Stretch cards to fill available width
        let cardWidth = minWidth;
        if (itemCount >= maxColumns && columns > 0) {
            const columnsWidth = width - gap * (columns - 1);
            const rawWidth =
                columnsWidth > 0 ? columnsWidth / columns : minWidth;
            if (Number.isFinite(rawWidth) && rawWidth > 0) {
                cardWidth = Math.max(minWidth, rawWidth);
            }
        }

        return { minWidth, gap, columns, cardWidth };
    };

    /**
     */
    const gridStyle = computed(() => {
        const scale = cardScale.value;
        const spacing = cardSpacing.value;
        const minWidth = baseCardWidth * scale;
        const gap = Math.max(4, baseGap * spacing);

        return (count = 1) => {
            const { columns, cardWidth } = getGridMetrics(count);
            return {
                '--avatar-card-min-width': `${Math.round(minWidth)}px`,
                '--avatar-card-gap': `${Math.round(gap)}px`,
                '--avatar-card-target-width': `${Math.round(cardWidth)}px`,
                '--avatar-grid-columns': `${columns}`
            };
        };
    });

    /**
     * @param items
     * @param keyPrefix
     */
    const chunkIntoRows = (items, keyPrefix = 'row') => {
        if (!Array.isArray(items) || !items.length) return [];
        const { columns } = getGridMetrics(items.length);
        const safeColumns = Math.max(1, columns);
        const rows = [];
        for (let i = 0; i < items.length; i += safeColumns) {
            rows.push({
                key: `${keyPrefix}:${i}`,
                items: items.slice(i, i + safeColumns)
            });
        }
        return rows;
    };

    /**
     * @param itemCount
     */
    const estimateRowHeight = (itemCount = 0) => {
        const scale = cardScale.value;
        const spacing = cardSpacing.value;
        const { columns, gap } = getGridMetrics(itemCount);
        const safeColumns = Math.max(1, columns);
        const rowCount = Math.max(1, Math.ceil(itemCount / safeColumns));
        // Card height = image (aspect 4:3 of width) + name area
        const cardHeight = baseCardHeight * scale * spacing;
        return rowCount * cardHeight + (rowCount - 1) * gap + 4;
    };

    // Watch container ref for resize
    watch(
        gridContainerRef,
        (element) => {
            if (!element) {
                containerWidth.value = 0;
                return;
            }
            nextTick(() => updateContainerWidth(element));
        },
        { immediate: true }
    );

    useResizeObserver(gridContainerRef, (entries) => {
        const [entry] = entries;
        containerWidth.value = Math.max(
            entry?.contentRect?.width ?? gridContainerRef.value?.clientWidth ?? 0,
            0
        );
    });

    onBeforeMount(async () => {
        try {
            const [storedScale, storedSpacing] = await Promise.all([
                configRepository.getString(scaleConfigKey, '0.6'),
                configRepository.getString(spacingConfigKey, '1')
            ]);

            const parsedScale = parseFloat(storedScale);
            if (!Number.isNaN(parsedScale)) {
                cardScaleBase.value = clamp(
                    parsedScale,
                    scaleSlider.min,
                    scaleSlider.max
                );
            }

            const parsedSpacing = parseFloat(storedSpacing);
            if (!Number.isNaN(parsedSpacing)) {
                cardSpacingBase.value = clamp(
                    parsedSpacing,
                    spacingSlider.min,
                    spacingSlider.max
                );
            }
        } catch (error) {
            console.error('Failed to load avatar card grid preferences', error);
        }
    });

    return {
        cardScale,
        cardSpacing,
        cardScalePercent,
        cardSpacingPercent,
        cardScaleValue,
        cardSpacingValue,
        scaleSlider,
        spacingSlider,
        gridContainerRef,
        gridStyle,
        getGridMetrics,
        chunkIntoRows,
        estimateRowHeight,
        updateContainerWidth
    };
}
