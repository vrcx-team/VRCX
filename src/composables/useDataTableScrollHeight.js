import { computed, onMounted, onUnmounted, ref } from 'vue';

export function useDataTableScrollHeight(containerRef, options = {}) {
    const offset = options.offset ?? 127;
    const toolbarHeight = options.toolbarHeight ?? 0;
    const paginationHeight = options.paginationHeight ?? 0;

    const maxHeight = ref(0);

    let resizeObserver;

    const recalc = () => {
        const containerEl = containerRef?.value;
        if (!containerEl) {
            return;
        }

        const available =
            containerEl.clientHeight -
            offset -
            toolbarHeight -
            paginationHeight;

        maxHeight.value = Math.max(0, available);
    };

    onMounted(() => {
        recalc();

        resizeObserver = new ResizeObserver(() => {
            recalc();
        });

        if (containerRef?.value) {
            resizeObserver.observe(containerRef.value);
        }
    });

    onUnmounted(() => {
        resizeObserver?.disconnect();
    });

    const tableStyle = computed(() => {
        if (!Number.isFinite(maxHeight.value) || maxHeight.value <= 0) {
            return undefined;
        }
        return {
            maxHeight: `${maxHeight.value}px`
        };
    });

    return {
        tableStyle
    };
}
