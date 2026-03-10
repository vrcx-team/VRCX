import {
    computed,
    nextTick,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
    ref,
    watch
} from 'vue';

import configRepository from '../../../services/config.js';

/**
 * @param {object} options
 * @param {string} options.configKey
 * @param {number} [options.defaultSize]
 * @param {number} [options.maxPx]
 * @param {number} [options.minPx]
 * @returns {object}
 */
export function useFavoritesSplitter(options = {}) {
    const configKey = options.configKey ?? '';
    const defaultSize = options.defaultSize ?? 260;
    const maxPx = options.maxPx ?? 360;
    const minPx = options.minPx ?? 0;

    const splitterFallbackWidth =
        typeof window !== 'undefined' && window.innerWidth
            ? window.innerWidth
            : 1200;

    const splitterSize = ref(defaultSize);
    const splitterGroupRef = ref(null);
    const splitterPanelRef = ref(null);
    const splitterWidth = ref(splitterFallbackWidth);
    const splitterDraggingCount = ref(0);
    let splitterObserver = null;

    /**
     *
     */
    async function loadSplitterPreferences() {
        const storedSize = await configRepository.getString(
            configKey,
            String(defaultSize)
        );
        const parsedSize = Number(storedSize);
        if (Number.isFinite(parsedSize) && parsedSize >= 0) {
            splitterSize.value = parsedSize;
        }
    }

    const getSplitterWidthRaw = () => {
        const element = splitterGroupRef.value?.$el ?? splitterGroupRef.value;
        const width = element?.getBoundingClientRect?.().width;
        return Number.isFinite(width) ? width : null;
    };

    const getSplitterWidth = () => {
        const width = getSplitterWidthRaw();
        return Number.isFinite(width) && width > 0
            ? width
            : splitterFallbackWidth;
    };

    const resolveDraggingPayload = (payload) => {
        if (typeof payload === 'boolean') {
            return payload;
        }
        if (payload && typeof payload === 'object') {
            if (typeof payload.detail === 'boolean') {
                return payload.detail;
            }
            if (typeof payload.dragging === 'boolean') {
                return payload.dragging;
            }
        }
        return Boolean(payload);
    };

    const setDragging = (payload) => {
        const isDragging = resolveDraggingPayload(payload);
        const next = splitterDraggingCount.value + (isDragging ? 1 : -1);
        splitterDraggingCount.value = Math.max(0, next);
    };

    const pxToPercent = (px, groupWidth, min = 0) => {
        const width = groupWidth ?? getSplitterWidth();
        return Math.min(100, Math.max(min, (px / width) * 100));
    };

    const percentToPx = (percent, groupWidth) => (percent / 100) * groupWidth;

    const defaultSizePercent = computed(() =>
        pxToPercent(splitterSize.value, splitterWidth.value, 0)
    );
    const minSizePercent = computed(() =>
        pxToPercent(minPx, splitterWidth.value, 0)
    );
    const maxSizePercent = computed(() =>
        pxToPercent(maxPx, splitterWidth.value, 0)
    );

    const handleLayout = (sizes) => {
        if (!Array.isArray(sizes) || !sizes.length) {
            return;
        }

        if (splitterDraggingCount.value === 0) {
            return;
        }

        const rawWidth = getSplitterWidthRaw();
        if (!Number.isFinite(rawWidth) || rawWidth <= 0) {
            return;
        }

        const nextSize = sizes[0];
        if (!Number.isFinite(nextSize)) {
            return;
        }

        const nextPx = Math.round(percentToPx(nextSize, rawWidth));
        const clampedPx = Math.min(maxPx, Math.max(minPx, nextPx));
        splitterSize.value = clampedPx;
        configRepository.setString(configKey, clampedPx.toString());
    };

    const updateSplitterWidth = () => {
        const width = getSplitterWidth();
        splitterWidth.value = width;
        const targetSize = pxToPercent(splitterSize.value, width, 0);
        splitterPanelRef.value?.resize?.(targetSize);
    };

    onBeforeMount(() => {
        loadSplitterPreferences();
    });

    onMounted(async () => {
        await nextTick();
        updateSplitterWidth();
        const element = splitterGroupRef.value?.$el ?? splitterGroupRef.value;
        if (element && typeof ResizeObserver !== 'undefined') {
            splitterObserver = new ResizeObserver(updateSplitterWidth);
            splitterObserver.observe(element);
        }
    });

    watch(splitterSize, (value, previous) => {
        if (value === previous) {
            return;
        }
        if (splitterDraggingCount.value > 0) {
            return;
        }
        updateSplitterWidth();
    });

    onBeforeUnmount(() => {
        if (splitterObserver) {
            splitterObserver.disconnect();
            splitterObserver = null;
        }
    });

    return {
        splitterGroupRef,
        splitterPanelRef,
        defaultSize: defaultSizePercent,
        minSize: minSizePercent,
        maxSize: maxSizePercent,
        handleLayout,
        setDragging
    };
}
