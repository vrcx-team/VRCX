import { nextTick } from 'vue';

export function useVirtualizerAnchor({
    virtualizer,
    virtualRows,
    scrollViewportRef
}) {
    const captureScrollAnchor = () => {
        const viewport = scrollViewportRef.value;
        const items = virtualizer.value?.getVirtualItems?.() ?? [];
        if (!viewport || !items.length) {
            return null;
        }
        const firstItem = items[0];
        const row = virtualRows.value[firstItem.index];
        const key = row?.key ?? firstItem.key;
        if (typeof key === 'undefined') {
            return null;
        }
        return {
            key,
            offset: viewport.scrollTop - firstItem.start
        };
    };

    const restoreScrollAnchor = (anchor) => {
        if (!anchor) {
            return;
        }
        const index = virtualRows.value.findIndex(
            (row) => row?.key === anchor.key
        );
        if (index === -1) {
            return;
        }
        const offsetInfo = virtualizer.value?.getOffsetForIndex?.(
            index,
            'start'
        );
        const targetStart = Array.isArray(offsetInfo) ? offsetInfo[0] : null;
        if (typeof targetStart !== 'number') {
            return;
        }
        virtualizer.value?.scrollToOffset?.(targetStart + anchor.offset);
    };

    const measureWithAnchor = (measureFn) => {
        const anchor = captureScrollAnchor();
        nextTick(() => {
            if (measureFn) {
                measureFn();
            }
            restoreScrollAnchor(anchor);
        });
    };

    return {
        captureScrollAnchor,
        restoreScrollAnchor,
        measureWithAnchor
    };
}
