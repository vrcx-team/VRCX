import { computed } from 'vue';

import { useThemeColor } from '@/shared/utils/base/ui';

import { THEME_CONFIG } from '../../../shared/constants';

export function useNavTheme({ t, appearanceSettingsStore }) {
    const themes = computed(() => Object.keys(THEME_CONFIG));
    const {
        themeColors,
        currentThemeColor,
        isApplyingThemeColor,
        applyThemeColor,
        initThemeColor
    } = useThemeColor();

    const themeDisplayName = (themeKey) => {
        const i18nKey = `view.settings.appearance.appearance.theme_mode_${themeKey}`;
        const translated = t(i18nKey);
        if (translated !== i18nKey) {
            return translated;
        }
        return THEME_CONFIG[themeKey]?.name ?? themeKey;
    };

    const themeColorDisplayName = (theme) => {
        if (!theme) {
            return '';
        }
        const i18nKey = `view.settings.appearance.theme_color.${theme.key}`;
        const translated = t(i18nKey);
        if (translated !== i18nKey) {
            return translated;
        }
        return theme.label || theme.key;
    };

    const handleThemeSelect = (theme) => {
        appearanceSettingsStore.setThemeMode(theme);
    };

    const handleThemeToggle = () => {
        appearanceSettingsStore.toggleThemeMode();
    };

    const handleTableDensitySelect = (density) => {
        appearanceSettingsStore.setTableDensity(density);
    };

    const handleThemeColorSelect = async (theme) => {
        if (!theme) {
            return;
        }
        await applyThemeColor(theme.key);
    };

    return {
        themes,
        themeColors,
        currentThemeColor,
        isApplyingThemeColor,
        initThemeColor,
        themeDisplayName,
        themeColorDisplayName,
        handleThemeSelect,
        handleThemeToggle,
        handleTableDensitySelect,
        handleThemeColorSelect
    };
}
