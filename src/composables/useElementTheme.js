import { ref } from 'vue';

import colors from 'tailwindcss/colors';

import configRepository from '../service/config';

// Tailwind indigo-500 in OKLCH
export const DEFAULT_PRIMARY_COLOR = 'oklch(58.5% 0.233 277.117)';
const DARK_WEIGHT = 0.2;
const CONFIG_KEY = 'VRCX_elPrimaryColor';
const STYLE_ID = 'el-dynamic-theme';

let elementThemeInstance = null;

const INVALID_TAILWIND_COLOR_KEYS = new Set([
    'inherit',
    'current',
    'transparent',
    'black',
    'white',
    'lightBlue',
    'warmGray',
    'trueGray',
    'coolGray',
    'blueGray'
]);

/**
 * Normalize a theme color and prevent CSS injection.
 */
function toPrimaryColor(color, fallback = DEFAULT_PRIMARY_COLOR) {
    if (typeof color !== 'string') {
        return fallback;
    }

    const normalized = color.trim();
    if (!normalized) {
        return fallback;
    }

    if (!CSS?.supports?.('color', normalized)) {
        return fallback;
    }

    return normalized;
}

/**
 * Update Element Plus CSS variables based on a primary color.
 * Light colors use Tailwind palette directly; only dark-2 is calculated.
 * Dark mode overrides light-9 with a softer tint for better contrast.
 * @param {string} primary
 * @param {object|null} palette
 */
function setElementPlusColors(primary, palette = null) {
    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        document.head.appendChild(styleEl);
    }

    // Derive Element Plus light steps either from a palette or by mixing with white.
    const lightValues = palette
        ? ['400', '300', '200', '100', '50', '50', '50', '50', '50'].map(
              (key) => palette[key] || primary
          )
        : Array.from({ length: 9 }, (_, idx) => {
              const whitePercent = (idx + 1) * 10;
              const primaryPercent = 100 - whitePercent;
              return `color-mix(in oklch, ${primary} ${primaryPercent}%, white ${whitePercent}%)`;
          });

    const lights = lightValues
        .map(
            (value, index) =>
                `    --el-color-primary-light-${index + 1}: ${value};`
        )
        .join('\n');

    const darkPercent = DARK_WEIGHT * 100;
    const primaryPercent = 100 - darkPercent;
    const darkValue = `color-mix(in oklch, ${primary} ${primaryPercent}%, black ${darkPercent}%)`;
    const darkLight9 = `color-mix(in oklch, ${primary} 18%, transparent)`;

    const baseSelector =
        ":root, html.dark, :root.dark, :root[data-theme='dark']";
    const darkSelector = "html.dark, :root.dark, :root[data-theme='dark']";
    styleEl.textContent =
        `${baseSelector} {\n    --el-color-primary: ${primary};\n${lights}\n    --el-color-primary-dark-2: ${darkValue};\n}\n` +
        `${darkSelector} {\n    --el-color-primary-light-9: ${darkLight9};\n}`;
}

const TAILWIND_COLOR_FAMILIES = Object.entries(colors)
    .filter(([name, palette]) => {
        return (
            !INVALID_TAILWIND_COLOR_KEYS.has(name) &&
            palette &&
            typeof palette === 'object' &&
            palette['500']
        );
    })
    .map(([name, palette]) => ({
        name,
        base: palette['500'],
        palette
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

/**
 * Shared Element Plus theme controller.
 * @param {string} defaultColor
 */
export function useElementTheme(defaultColor = DEFAULT_PRIMARY_COLOR) {
    if (elementThemeInstance) {
        return elementThemeInstance;
    }

    const currentPrimary = ref(defaultColor);
    const isApplying = ref(false);
    let initialized = false;

    const applyPrimaryColor = async (color, palette = null) => {
        const nextColor = toPrimaryColor(color, currentPrimary.value);
        const effectivePalette = palette || null;
        isApplying.value = true;
        setElementPlusColors(nextColor, effectivePalette);
        currentPrimary.value = nextColor;
        try {
            await configRepository.setString(CONFIG_KEY, nextColor);
        } catch (error) {
            console.warn('Failed to persist theme color', error);
        } finally {
            isApplying.value = false;
        }
    };

    const initPrimaryColor = async (fallbackColor = currentPrimary.value) => {
        if (initialized) {
            return;
        }
        initialized = true;

        const storedColor =
            (await configRepository.getString(CONFIG_KEY)) ||
            fallbackColor ||
            DEFAULT_PRIMARY_COLOR;
        await applyPrimaryColor(storedColor);
    };

    elementThemeInstance = {
        currentPrimary,
        isApplying,
        applyPrimaryColor,
        initPrimaryColor
    };

    return elementThemeInstance;
}

export function useThemePrimaryColor() {
    const { currentPrimary, isApplying, applyPrimaryColor, initPrimaryColor } =
        useElementTheme(DEFAULT_PRIMARY_COLOR);
    const colorFamilies = TAILWIND_COLOR_FAMILIES;

    const selectPaletteColor = async (colorFamily) => {
        if (!colorFamily) {
            return;
        }
        await applyPrimaryColor(colorFamily.base, colorFamily.palette);
    };

    const applyCustomPrimaryColor = async (color) => {
        if (!color) {
            return;
        }
        await applyPrimaryColor(color);
    };

    return {
        currentPrimary,
        isApplying,
        initPrimaryColor,
        applyCustomPrimaryColor,
        colorFamilies,
        selectPaletteColor
    };
}
