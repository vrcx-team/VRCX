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
    const baseWidth = options.baseWidth ?? 260;
    const baseGap = options.baseGap ?? 12;
    const gapStep = options.gapStep ?? 8;
    const configKey = options.configKey ?? '';

    const cardScaleBase = ref(1);
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
                configRepository.setString(configKey, nextValue);
            }
        }
    });

    const gridStyle = computed(() => {
        const minWidth = baseWidth * cardScale.value;
        const rawGap = baseGap + (cardScale.value - 1) * gapStep;
        const gap = Math.max(6, rawGap);

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
            const matchMaxColumnWidth = Boolean(
                options?.matchMaxColumnWidth
            );
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
                '--favorites-card-scale': `${cardScale.value.toFixed(2)}`
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
        if (!configKey) {
            return;
        }

        try {
            const storedScale = await configRepository.getString(
                configKey,
                '1'
            );
            const parsedValue = parseFloat(storedScale);
            if (!Number.isNaN(parsedValue)) {
                cardScaleBase.value = clamp(
                    parsedValue,
                    slider.min,
                    slider.max
                );
            }
        } catch (error) {
            console.error(
                'Failed to load favorites card scale preference',
                error
            );
        }
    });

    return {
        cardScale,
        slider,
        containerRef,
        gridStyle
    };
}
