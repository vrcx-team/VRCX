import {
    computed,
    nextTick,
    onBeforeMount,
    onBeforeUnmount,
    ref,
    watch
} from 'vue';

import configRepository from '../../../service/config.js';

function clamp(value, min, max) {
    if (Number.isNaN(value)) {
        return min;
    }
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

export function useFavoritesCardScaling(options = {}) {
    const slider = {
        min: options.min ?? 0.6,
        max: options.max ?? 1,
        step: options.step ?? 0.01
    };
    const spacingSlider = {
        min: options.spacingMin ?? 0.5,
        max: options.spacingMax ?? 1.5,
        step: options.spacingStep ?? 0.05
    };
    const baseWidth = options.baseWidth ?? 260;
    const baseGap = options.baseGap ?? 12;
    const gapStep = options.gapStep ?? 8;
    const configKey = options.configKey ?? '';
    const spacingConfigKey = options.spacingConfigKey ?? '';
    const basePaddingY = options.basePaddingY ?? 8;
    const basePaddingX = options.basePaddingX ?? 10;
    const baseContentGap = options.baseContentGap ?? 10;
    const baseActionGap = options.baseActionGap ?? 8;
    const baseActionGroupGap = options.baseActionGroupGap ?? 6;
    const baseActionMargin = options.baseActionMargin ?? 8;
    const baseCheckboxMargin = options.baseCheckboxMargin ?? 10;
    const minGap = options.minGap ?? 4;
    const minPadding = options.minPadding ?? 4;
    const defaultSpacing = clamp(
        options.defaultSpacing ?? 1,
        spacingSlider.min,
        spacingSlider.max
    );

    const cardScaleBase = ref(1);
    const cardSpacingBase = ref(defaultSpacing);
    const containerRef = ref(null);
    const containerWidth = ref(0);

    let resizeObserver;
    let cleanupWindowResize;

    const updateContainerWidth = (el = containerRef.value) => {
        const element = el ?? containerRef.value;
        if (!element) {
            containerWidth.value = 0;
            return;
        }
        containerWidth.value = Math.max(
            element.clientWidth ?? element.offsetWidth ?? 0,
            0
        );
    };

    const disconnectResizeObserver = () => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = undefined;
        }
        if (cleanupWindowResize) {
            cleanupWindowResize();
            cleanupWindowResize = undefined;
        }
    };

    const cardScale = computed({
        get: () => cardScaleBase.value,
        set: (value) => {
            const nextValue = clamp(Number(value) || 1, slider.min, slider.max);
            cardScaleBase.value = nextValue;
            if (configKey) {
                configRepository.setString(configKey, String(nextValue));
            }
        }
    });

    const cardSpacing = computed({
        get: () => cardSpacingBase.value,
        set: (value) => {
            const nextValue = clamp(
                Number(value) || 1,
                spacingSlider.min,
                spacingSlider.max
            );
            cardSpacingBase.value = nextValue;
            if (spacingConfigKey) {
                configRepository.setString(spacingConfigKey, String(nextValue));
            }
        }
    });

    const gridStyle = computed(() => {
        const minWidth = baseWidth * cardScale.value;
        const spacing = cardSpacing.value;
        const adjustedGapBase = baseGap + (cardScale.value - 1) * gapStep;
        const gap = Math.max(minGap, adjustedGapBase * spacing);
        const paddingY = Math.max(
            minPadding,
            basePaddingY * cardScale.value * spacing
        );
        const paddingX = Math.max(
            minPadding,
            basePaddingX * cardScale.value * spacing
        );
        const contentGap = Math.max(
            minPadding,
            baseContentGap * cardScale.value * spacing
        );
        const actionsGap = Math.max(
            minPadding,
            baseActionGap * cardScale.value * spacing
        );
        const actionsGroupGap = Math.max(
            minPadding,
            baseActionGroupGap * cardScale.value * spacing
        );
        const actionsMargin = Math.max(
            0,
            baseActionMargin * cardScale.value * spacing
        );
        const checkboxMargin = Math.max(
            0,
            baseCheckboxMargin * cardScale.value * spacing
        );

        return (count = 1, options = {}) => {
            const width = Math.max(containerWidth.value ?? 0, 0);
            const itemCount = Math.max(Number(count) || 0, 0);
            const safeCount = itemCount > 0 ? itemCount : 1;
            const maxColumns =
                width > 0
                    ? Math.max(
                          1,
                          Math.floor((width + gap) / (minWidth + gap)) || 1
                      )
                    : 1;
            const preferredColumns = options?.preferredColumns;
            const requestedColumns = preferredColumns
                ? Math.max(
                      1,
                      Math.min(Math.round(preferredColumns), maxColumns)
                  )
                : maxColumns;
            const columns = Math.max(1, Math.min(safeCount, requestedColumns));
            const forceStretch = Boolean(options?.forceStretch);
            const disableAutoStretch = Boolean(options?.disableAutoStretch);
            const matchMaxColumnWidth = Boolean(options?.matchMaxColumnWidth);
            const shouldStretch =
                !disableAutoStretch &&
                (forceStretch || itemCount >= maxColumns);

            let cardWidth = minWidth;
            const maxColumnWidth =
                maxColumns > 0
                    ? (width - gap * (maxColumns - 1)) / maxColumns
                    : minWidth;

            if (shouldStretch && columns > 0) {
                const columnsWidth = width - gap * (columns - 1);
                const rawWidth =
                    columnsWidth > 0 ? columnsWidth / columns : minWidth;
                if (Number.isFinite(rawWidth) && rawWidth > 0) {
                    cardWidth = Math.max(minWidth, rawWidth);
                }
            } else if (
                matchMaxColumnWidth &&
                Number.isFinite(maxColumnWidth) &&
                maxColumnWidth > 0
            ) {
                cardWidth = Math.max(minWidth, maxColumnWidth);
            }

            return {
                '--favorites-card-min-width': `${Math.round(minWidth)}px`,
                '--favorites-card-gap': `${Math.round(gap)}px`,
                '--favorites-card-target-width': `${Math.round(cardWidth)}px`,
                '--favorites-grid-columns': `${columns}`,
                '--favorites-card-scale': `${cardScale.value.toFixed(2)}`,
                '--favorites-card-padding-y': `${Math.round(paddingY)}px`,
                '--favorites-card-padding-x': `${Math.round(paddingX)}px`,
                '--favorites-card-content-gap': `${Math.round(contentGap)}px`,
                '--favorites-card-action-gap': `${Math.round(actionsGap)}px`,
                '--favorites-card-action-group-gap': `${Math.round(actionsGroupGap)}px`,
                '--favorites-card-action-margin': `${Math.round(actionsMargin)}px`,
                '--favorites-card-checkbox-margin': `${Math.round(checkboxMargin)}px`,
                '--favorites-card-spacing-scale': `${cardSpacing.value.toFixed(2)}`
            };
        };
    });

    watch(
        containerRef,
        (element) => {
            disconnectResizeObserver();
            if (!element) {
                containerWidth.value = 0;
                return;
            }

            nextTick(() => updateContainerWidth(element));

            if (typeof ResizeObserver !== 'undefined') {
                const observedElement = element;
                resizeObserver = new ResizeObserver((entries) => {
                    if (!entries?.length) {
                        return;
                    }
                    const [entry] = entries;
                    const width =
                        entry.contentRect?.width ??
                        observedElement?.clientWidth ??
                        0;
                    containerWidth.value = Math.max(width, 0);
                });
                resizeObserver.observe(element);
                return;
            }

            if (typeof window !== 'undefined') {
                const handleResize = () => updateContainerWidth(element);
                window.addEventListener('resize', handleResize, {
                    passive: true
                });
                cleanupWindowResize = () => {
                    window.removeEventListener('resize', handleResize);
                };
            }
        },
        { immediate: true }
    );

    onBeforeUnmount(() => {
        disconnectResizeObserver();
    });

    onBeforeMount(async () => {
        try {
            if (configKey) {
                const storedScale = await configRepository.getString(
                    configKey,
                    '1'
                );
                const parsedScale = parseFloat(storedScale);
                if (!Number.isNaN(parsedScale)) {
                    cardScaleBase.value = clamp(
                        parsedScale,
                        slider.min,
                        slider.max
                    );
                }
            }

            if (spacingConfigKey) {
                const storedSpacing = await configRepository.getString(
                    spacingConfigKey,
                    String(defaultSpacing)
                );
                const parsedSpacing = parseFloat(storedSpacing);
                if (!Number.isNaN(parsedSpacing)) {
                    cardSpacingBase.value = clamp(
                        parsedSpacing,
                        spacingSlider.min,
                        spacingSlider.max
                    );
                }
            }
        } catch (error) {
            console.error('Failed to load favorites card preferences', error);
        }
    });

    return {
        cardScale,
        cardSpacing,
        slider,
        spacingSlider,
        containerRef,
        gridStyle
    };
}
