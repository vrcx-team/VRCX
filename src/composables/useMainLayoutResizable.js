import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useAppearanceSettingsStore } from '../stores';

export function useMainLayoutResizable() {
    const asideMaxPx = 700;
    const mainMinPx = 320;

    const appearanceStore = useAppearanceSettingsStore();
    const { setAsideWidth } = appearanceStore;
    const { asideWidth, isSideBarTabShow, isNavCollapsed } =
        storeToRefs(appearanceStore);

    const fallbackWidth =
        typeof window !== 'undefined' && window.innerWidth
            ? window.innerWidth
            : 1200;

    const panelGroupRef = ref(null);
    const asidePanelRef = ref(null);
    const groupWidth = ref(fallbackWidth);
    let resizeObserver = null;

    // size helpers: panelGroupRef, groupWidth, fallbackWidth
    const getGroupWidthRaw = () => {
        const element = panelGroupRef.value?.$el ?? panelGroupRef.value;
        const width = element?.getBoundingClientRect?.().width;
        return Number.isFinite(width) ? width : null;
    };

    const getGroupWidth = () => {
        const width = getGroupWidthRaw();
        return Number.isFinite(width) && width > 0 ? width : fallbackWidth;
    };

    const pxToPercent = (px, width, min = 1) => {
        const w = Number.isFinite(width) && width > 0 ? width : getGroupWidth();
        return Math.min(100, Math.max(min, (px / w) * 100));
    };

    const percentToPx = (percent, groupWidth) => (percent / 100) * groupWidth;

    const getMaxAsidePx = (width) =>
        Math.min(asideMaxPx, Math.max(0, width - mainMinPx));

    const clampAsidePx = (px, width) =>
        Math.min(getMaxAsidePx(width), Math.max(0, px));

    // layout state: isAsideCollapsed, asideMaxSize, asideDefaultSize, mainDefaultSize
    const isAsideCollapsed = (layout) =>
        Array.isArray(layout) &&
        layout.length >= 2 &&
        layout[layout.length - 1] <= 1;

    const asideMaxSize = computed(() =>
        pxToPercent(getMaxAsidePx(groupWidth.value), groupWidth.value, 0)
    );

    const asideDefaultSize = computed(() => {
        if (!isSideBarTabShow.value) {
            return 0;
        }
        const percent = pxToPercent(asideWidth.value, groupWidth.value, 0);
        return Math.min(asideMaxSize.value, percent);
    });

    const mainDefaultSize = computed(
        () => 100 - (isSideBarTabShow.value ? asideDefaultSize.value : 0)
    );

    // drag -> store: handleLayout, asideWidth
    const handleLayout = (sizes) => {
        if (!Array.isArray(sizes) || sizes.length < 1) {
            return;
        }

        if (!isSideBarTabShow.value || sizes.length < 2) {
            return;
        }

        const rawWidth = getGroupWidthRaw();
        if (!Number.isFinite(rawWidth) || rawWidth <= 0) {
            return;
        }
        const width = rawWidth;

        const asideSize = sizes[sizes.length - 1];
        if (!Number.isFinite(asideSize)) {
            return;
        }

        const nextAsidePx =
            asideSize <= 1
                ? 0
                : clampAsidePx(
                      Math.round(percentToPx(asideSize, width)),
                      width
                  );
        if (nextAsidePx === asideWidth.value) {
            return;
        }
        setAsideWidth(nextAsidePx);
    };

    // sync store -> panel: resizeAsidePanel, syncAsidePanelSize
    const resizeAsidePanel = (targetSize) =>
        asidePanelRef.value?.resize?.(targetSize);

    const syncAsidePanelSize = (width) => {
        if (!isSideBarTabShow.value) {
            return;
        }
        const maxAsidePx = getMaxAsidePx(width);
        const clampedAsidePx = Math.min(
            maxAsidePx,
            Math.max(0, asideWidth.value)
        );
        if (maxAsidePx > 0 && clampedAsidePx !== asideWidth.value) {
            setAsideWidth(clampedAsidePx);
        }
        const asideTargetSize =
            maxAsidePx > 0 && clampedAsidePx > 0
                ? pxToPercent(clampedAsidePx, width, 0)
                : 0;
        resizeAsidePanel(asideTargetSize);
    };

    // window resize: updateGroupWidth, resizeObserver
    const updateGroupWidth = () => {
        const width = getGroupWidth();
        groupWidth.value = width;
        syncAsidePanelSize(width);
    };

    onMounted(async () => {
        await nextTick();
        updateGroupWidth();

        const element = panelGroupRef.value?.$el ?? panelGroupRef.value;
        if (element && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(updateGroupWidth);
            resizeObserver.observe(element);
        }
    });

    watch(
        () => [isSideBarTabShow.value, asideWidth.value],
        () => {
            syncAsidePanelSize(groupWidth.value);
        }
    );

    onUnmounted(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
    });

    return {
        panelGroupRef,
        asidePanelRef,
        asideDefaultSize,
        asideMaxSize,
        asideMaxPx,
        mainDefaultSize,
        handleLayout,
        isAsideCollapsed,
        isNavCollapsed,
        isSideBarTabShow
    };
}
