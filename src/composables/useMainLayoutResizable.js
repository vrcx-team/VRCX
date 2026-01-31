import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useAppearanceSettingsStore } from '../stores';

export function useMainLayoutResizable() {
    const appearanceStore = useAppearanceSettingsStore();
    const { isSideBarTabShow } = storeToRefs(appearanceStore);

    const asideDefaultSize = 25;
    const mainDefaultSize = 75;
    const asideMinSize = 12;
    const asideMaxPx = 700;

    const isAsideCollapsed = (layout) =>
        Array.isArray(layout) &&
        layout.length >= 2 &&
        layout[layout.length - 1] <= 1;

    const isAsideCollapsedState = ref(false);
    const handleLayout = (sizes) => {
        if (!Array.isArray(sizes) || sizes.length < 2) {
            isAsideCollapsedState.value = false;
            return;
        }
        isAsideCollapsedState.value = isAsideCollapsed(sizes);
    };

    const isAsideCollapsedStatic = computed(
        () => !isSideBarTabShow.value || isAsideCollapsedState.value
    );

    return {
        asideDefaultSize,
        asideMinSize,
        asideMaxPx,
        mainDefaultSize,
        handleLayout,
        isAsideCollapsed,
        isAsideCollapsedStatic,
        isSideBarTabShow
    };
}
