import { ref } from 'vue';

import colors from 'tailwindcss/colors';

import configRepository from '../service/config';

// Tailwind indigo-500 in OKLCH
const DEFAULT_PRIMARY = 'oklch(58.5% 0.233 277.117)';
const DARK_WEIGHT = 0.2;
const CONFIG_KEY = 'VRCX_elPrimaryColor';
const STYLE_ID = 'el-dynamic-theme';

let elementThemeInstance = null;

/**
 * Keep okLCH as-is; otherwise normalize hex; fallback to default.
 * @param {string} color
 * @param {string} fallback
 */
function toPrimaryColor(color, fallback = DEFAULT_PRIMARY) {
    if (typeof color === 'string' && color.trim()) {
        if (color.trim().startsWith('oklch(')) {
            return color.trim();
        }
    }
    return fallback;
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
    const safePalette = palette || null;
    const lightValues = safePalette
        ? ['400', '300', '200', '100', '50', '50', '50', '50', '50'].map(
              (key) => safePalette[key] || primary
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

function findTailwindPalette(primary) {
    const entries = Object.values(colors);
    for (const palette of entries) {
        if (
            palette &&
            typeof palette === 'object' &&
            palette['500'] === primary
        ) {
            return palette;
        }
    }
    return null;
}

/**
 * Shared Element Plus theme controller.
 * @param {string} defaultColor
 */
export function useElementTheme(defaultColor = DEFAULT_PRIMARY) {
    if (elementThemeInstance) {
        return elementThemeInstance;
    }

    const currentPrimary = ref(defaultColor);
    const isApplying = ref(false);
    let initialized = false;

    const applyPrimaryColor = async (color, palette = null) => {
        const nextColor = toPrimaryColor(color, currentPrimary.value);
        const effectivePalette = palette || findTailwindPalette(nextColor);
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
            DEFAULT_PRIMARY;
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

export { toPrimaryColor };
