import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useAppearanceSettingsStore } from '../stores';

import configRepository from '../service/config';

export function useMainLayoutResizable() {
    const asideMaxPx = 700;

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
    const draggingCount = ref(0);
    let resizeObserver = null;

    const getGroupWidthRaw = () => {
        const element = panelGroupRef.value?.$el ?? panelGroupRef.value;
        const width = element?.getBoundingClientRect?.().width;
        return Number.isFinite(width) ? width : null;
    };

    const getGroupWidth = () => {
        const width = getGroupWidthRaw();
        return Number.isFinite(width) && width > 0 ? width : fallbackWidth;
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

    const setIsDragging = (payload) => {
        const isDragging = resolveDraggingPayload(payload);
        const next = draggingCount.value + (isDragging ? 1 : -1);
        draggingCount.value = Math.max(0, next);
    };

    const pxToPercent = (px, groupWidth, min = 1) => {
        const w = groupWidth ?? getGroupWidth();
        return Math.min(100, Math.max(min, (px / w) * 100));
    };

    const percentToPx = (percent, groupWidth) => (percent / 100) * groupWidth;

    const isAsideCollapsed = (layout) =>
        Array.isArray(layout) &&
        layout.length >= 2 &&
        layout[layout.length - 1] <= 1;

    const asideDefaultSize = computed(() =>
        pxToPercent(asideWidth.value, undefined, 0)
    );
    const asideMaxSize = computed(() => pxToPercent(asideMaxPx, undefined, 0));

    const mainDefaultSize = computed(
        () => 100 - (isSideBarTabShow.value ? asideDefaultSize.value : 0)
    );

    const handleLayout = (sizes) => {
        if (!Array.isArray(sizes) || sizes.length < 1) {
            return;
        }

        if (draggingCount.value === 0) {
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

        if (asideSize <= 1) {
            setAsideWidth(0);
            return;
        }

        setAsideWidth(Math.round(percentToPx(asideSize, width)));
    };

    const resizeAsidePanel = (targetSize) =>
        asidePanelRef.value?.resize?.(targetSize);

    const updateGroupWidth = () => {
        const width = getGroupWidth();
        groupWidth.value = width;

        if (!isSideBarTabShow.value) {
            return;
        }

        void syncAsidePanelWidth(width);
    };

    let asideSyncPromise = null;
    const syncAsidePanelWidth = async (width) => {
        if (asideSyncPromise) {
            return asideSyncPromise;
        }
        asideSyncPromise = (async () => {
            const storedAsidePx = await configRepository.getInt(
                'VRCX_sidePanelWidth',
                asideWidth.value
            );
            if (
                Number.isFinite(storedAsidePx) &&
                storedAsidePx !== asideWidth.value
            ) {
                setAsideWidth(storedAsidePx);
            }
            const asideTargetSize =
                storedAsidePx > 0 ? pxToPercent(storedAsidePx, width, 0) : 0;
            resizeAsidePanel(asideTargetSize);
        })();
        try {
            return await asideSyncPromise;
        } finally {
            asideSyncPromise = null;
        }
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
        setIsDragging,
        isAsideCollapsed,
        isNavCollapsed,
        isSideBarTabShow
    };
}
