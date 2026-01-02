import { onMounted, onUnmounted, ref } from 'vue';

export function useTableHeight(tableRef, options = {}) {
    const containerRef = ref(null);
    const offset = options.offset ?? 127;
    const immediate = options.immediate ?? true;

    let resizeObserver;

    const setTableHeight = () => {
        if (!tableRef?.value || !containerRef.value) {
            return;
        }

        tableRef.value.tableProps = {
            ...(tableRef.value.tableProps || {}),
            // @ts-ignore default is null
            height: containerRef.value.clientHeight - offset
        };
    };

    onMounted(() => {
        if (immediate) {
            setTableHeight();
        }

        resizeObserver = new ResizeObserver(() => {
            setTableHeight();
        });

        if (containerRef.value) {
            resizeObserver.observe(containerRef.value);
        }
    });

    onUnmounted(() => {
        resizeObserver?.disconnect();
    });

    return {
        containerRef,
        setTableHeight
    };
}
