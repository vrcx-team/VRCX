import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

export function useDataTableScrollHeight(containerRef, options = {}) {
    const {
        offset = 127,
        toolbarHeight = 0,
        paginationHeight = 0,
        extraOffsetRefs = [],
        subtractContainerPadding = false
    } = options;

    const maxHeight = ref(0);

    let resizeObserver;
    const observedElements = new Set();

    const getPadding = (el) => {
        if (!subtractContainerPadding || !el) {
            return 0;
        }
        const style = getComputedStyle(el);
        return (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);
    };

    const getHeight = (maybeRef) => {
        const el = maybeRef?.value;
        return el && typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect().height : 0;
    };

    const recalc = () => {
        const containerEl = containerRef?.value;
        if (!containerEl) {
            return;
        }

        const extraOffset = extraOffsetRefs.reduce((sum, ref) => sum + getHeight(ref), 0);

        const available =
            containerEl.clientHeight -
            getPadding(containerEl) -
            offset -
            toolbarHeight -
            paginationHeight -
            extraOffset;

        maxHeight.value = Math.max(0, available);
    };

    const updateObservedElements = () => {
        if (!resizeObserver) {
            return;
        }

        const nextObserved = new Set([
            containerRef?.value,
            ...extraOffsetRefs.map((ref) => ref?.value)
        ].filter(Boolean));

        for (const el of observedElements) {
            if (!nextObserved.has(el)) {
                resizeObserver.unobserve(el);
                observedElements.delete(el);
            }
        }

        for (const el of nextObserved) {
            if (!observedElements.has(el)) {
                resizeObserver.observe(el);
                observedElements.add(el);
            }
        }
    };

    onMounted(() => {
        resizeObserver = new ResizeObserver(recalc);

        updateObservedElements();
        recalc();
    });

    watch(
        () => [containerRef?.value, ...extraOffsetRefs.map((r) => r?.value)],
        () => {
            updateObservedElements();
            recalc();
        },
        { flush: 'post' }
    );

    onUnmounted(() => {
        resizeObserver?.disconnect();
        observedElements.clear();
    });

    const tableStyle = computed(() => {
        if (!Number.isFinite(maxHeight.value) || maxHeight.value <= 0) return undefined;
        return { maxHeight: `${maxHeight.value}px` };
    });

    return {
        tableStyle
    };
}
