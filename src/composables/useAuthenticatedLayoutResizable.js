import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useAppearanceSettingsStore } from '../stores';

export function useAuthenticatedLayoutResizable() {
    const navCollapsedPx = 64;
    const navDefaultPx = 240;
    const navMinPx = 180;
    const navMaxPx = 300;
    const asideMaxPx = 500;

    const appearanceStore = useAppearanceSettingsStore();
    const { setAsideWidth, setNavWidth } = appearanceStore;
    const { asideWidth, isNavCollapsed, isSideBarTabShow, navWidth } =
        storeToRefs(appearanceStore);

    const panelGroupRef = ref(null);
    const navPanelRef = ref(null);
    const navExpandedSize = ref(null);

    const fallbackWidth =
        typeof window !== 'undefined' && window.innerWidth
            ? window.innerWidth
            : 1200;

    const getGroupWidth = () => {
        const element = panelGroupRef.value?.$el ?? panelGroupRef.value;
        const width = element?.getBoundingClientRect?.().width;
        return Number.isFinite(width) && width > 0 ? width : fallbackWidth;
    };

    const pxToPercent = (px, groupWidth, min = 1) => {
        const w = groupWidth ?? getGroupWidth();
        return Math.min(100, Math.max(min, (px / w) * 100));
    };

    const percentToPx = (percent, groupWidth) => (percent / 100) * groupWidth;

    const isAsideCollapsed = (layout) =>
        Array.isArray(layout) &&
        layout.length >= 3 &&
        layout[layout.length - 1] <= 1;

    const navCollapsedSize = computed(() => pxToPercent(navCollapsedPx));
    const navExpandedPx = computed(() => navWidth.value || navDefaultPx);

    const navDefaultSize = computed(() =>
        isNavCollapsed.value
            ? navCollapsedSize.value
            : pxToPercent(navExpandedPx.value)
    );

    const navMinSize = computed(() =>
        isNavCollapsed.value ? navCollapsedSize.value : pxToPercent(navMinPx)
    );
    const navMaxSize = computed(() =>
        isNavCollapsed.value ? navCollapsedSize.value : pxToPercent(navMaxPx)
    );

    const asideDefaultSize = computed(() =>
        pxToPercent(asideWidth.value, undefined, 0)
    );
    const asideMaxSize = computed(() => pxToPercent(asideMaxPx, undefined, 0));

    const handleLayout = (sizes) => {
        if (!Array.isArray(sizes) || sizes.length < 2) {
            return;
        }

        const groupWidth = getGroupWidth();
        if (!Number.isFinite(groupWidth) || groupWidth <= 0) {
            return;
        }

        const navSize = sizes[0];
        if (!isNavCollapsed.value && Number.isFinite(navSize) && navSize > 0) {
            navExpandedSize.value = navSize;
            setNavWidth(Math.round(percentToPx(navSize, groupWidth)));
        }

        if (!isSideBarTabShow.value || sizes.length < 3) {
            return;
        }

        const asideSize = sizes[sizes.length - 1];
        if (!Number.isFinite(asideSize)) {
            return;
        }

        if (asideSize <= 1) {
            setAsideWidth(0);
            return;
        }

        setAsideWidth(Math.round(percentToPx(asideSize, groupWidth)));
    };

    const resizeNavPanel = (targetSize) =>
        navPanelRef.value?.resize?.(targetSize);

    watch(isNavCollapsed, async (collapsed) => {
        await nextTick();
        if (collapsed) {
            resizeNavPanel(navCollapsedSize.value);
            return;
        }
        const targetSize =
            navExpandedSize.value ?? pxToPercent(navExpandedPx.value);
        resizeNavPanel(targetSize);
    });

    onMounted(async () => {
        await nextTick();
        let panelSize = null;
        panelSize = navPanelRef.value?.getSize?.() ?? null;

        navExpandedSize.value = panelSize ?? navDefaultSize.value;
        if (isNavCollapsed.value) {
            resizeNavPanel(navCollapsedSize.value);
        }
    });

    return {
        panelGroupRef,
        navPanelRef,
        navDefaultSize,
        navMinSize,
        navMaxSize,
        asideDefaultSize,
        asideMaxSize,
        handleLayout,
        isAsideCollapsed,
        isNavCollapsed,
        isSideBarTabShow
    };
}
