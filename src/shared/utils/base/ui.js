import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue-sonner';

import {
    APP_FONT_CONFIG,
    APP_FONT_DEFAULT_KEY,
    THEME_COLORS,
    THEME_CONFIG
} from '../../constants';
import { i18n } from '../../../plugin/i18n';
import { router } from '../../../plugin/router';
import { textToHex } from './string';
import { useAppearanceSettingsStore } from '../../../stores';

import configRepository from '../../../service/config.js';

const THEME_COLOR_STORAGE_KEY = 'VRCX_themeColor';
const THEME_COLOR_STYLE_ID = 'app-theme-color-style';
const DEFAULT_THEME_COLOR_KEY = 'default';

const APP_FONT_LINK_ATTR = 'data-app-font';

const themeColors = THEME_COLORS.map((theme) => ({
    ...theme,
    href: theme.file
        ? new URL(`../../../styles/themes/${theme.file}`, import.meta.url).href
        : null
}));

const currentThemeColor = ref(DEFAULT_THEME_COLOR_KEY);
const isApplyingThemeColor = ref(false);

function resolveThemeColor(themeKey) {
    const normalized = String(themeKey).trim().toLowerCase();
    return (
        themeColors.find((theme) => theme.key === normalized) ||
        themeColors.find((theme) => theme.key === DEFAULT_THEME_COLOR_KEY)
    );
}

function applyThemeColorStyle(theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme-color', theme.key);

    let styleEl = document.getElementById(THEME_COLOR_STYLE_ID);
    if (!theme.href) {
        styleEl?.remove();
        return;
    }

    if (!styleEl) {
        styleEl = document.createElement('link');
        styleEl.id = THEME_COLOR_STYLE_ID;
        styleEl.rel = 'stylesheet';
        document.head.appendChild(styleEl);
    }

    if (styleEl.getAttribute('href') !== theme.href) {
        styleEl.setAttribute('href', theme.href);
    }
}

async function applyThemeColor(themeKey, { persist = true } = {}) {
    const resolved = resolveThemeColor(themeKey);
    isApplyingThemeColor.value = true;
    applyThemeColorStyle(resolved);
    currentThemeColor.value = resolved.key;
    if (persist) {
        try {
            await configRepository.setString(
                THEME_COLOR_STORAGE_KEY,
                resolved.key
            );
        } catch (error) {
            console.warn('Failed to persist theme color', error);
        }
    }
    isApplyingThemeColor.value = false;
    return resolved;
}

async function initThemeColor() {
    const storedKey = await configRepository.getString(THEME_COLOR_STORAGE_KEY);
    const resolved = resolveThemeColor(storedKey || DEFAULT_THEME_COLOR_KEY);
    applyThemeColorStyle(resolved);
    currentThemeColor.value = resolved.key;
}

function useThemeColor() {
    return {
        themeColors,
        currentThemeColor,
        isApplyingThemeColor,
        applyThemeColor,
        initThemeColor
    };
}

/**
 *
 * @returns {boolean}
 */
function systemIsDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 *
 * @param {boolean}isDark
 */
function changeAppDarkStyle(isDark) {
    if (isDark) {
        AppApi.ChangeTheme(1);
    } else {
        AppApi.ChangeTheme(0);
    }
}

function applyThemeFonts(themeKey, fontLinks = []) {
    document
        .querySelectorAll('link[data-theme-font]')
        .forEach((linkEl) => linkEl.remove());

    if (!fontLinks?.length) {
        return;
    }

    const head = document.head;
    fontLinks.forEach((href) => {
        if (!href) {
            return;
        }
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = href;
        fontLink.dataset.themeFont = themeKey;
        head.appendChild(fontLink);
    });
}

function resolveAppFontFamily(fontKey) {
    const normalized = String(fontKey || '')
        .trim()
        .toLowerCase();
    if (APP_FONT_CONFIG[normalized]) {
        return { key: normalized, ...APP_FONT_CONFIG[normalized] };
    }
    return {
        key: APP_FONT_DEFAULT_KEY,
        ...APP_FONT_CONFIG[APP_FONT_DEFAULT_KEY]
    };
}

function ensureAppFontLinks() {
    const head = document.head;
    if (!head) {
        return;
    }
    Object.entries(APP_FONT_CONFIG).forEach(([key, config]) => {
        if (!config?.cssImport) {
            return;
        }
        const existing = document.querySelector(
            `style[${APP_FONT_LINK_ATTR}="${key}"]`
        );
        if (existing) {
            return;
        }
        const styleEl = document.createElement('style');
        styleEl.setAttribute(APP_FONT_LINK_ATTR, key);
        styleEl.textContent = config.cssImport;
        head.appendChild(styleEl);
    });
}

function applyAppFontFamily(fontKey) {
    const resolved = resolveAppFontFamily(fontKey);
    const root = document.documentElement;
    root.style.setProperty('--font-western-primary', resolved.cssName);

    ensureAppFontLinks();

    return resolved;
}

function changeAppThemeStyle(themeMode) {
    if (themeMode === 'system') {
        themeMode = systemIsDarkMode() ? 'dark' : 'light';
    }

    let themeConfig = THEME_CONFIG[themeMode];
    if (!themeConfig) {
        // fallback to system
        console.error('Invalid theme mode:', themeMode);
        configRepository.setString('VRCX_ThemeMode', 'system');
        themeMode = systemIsDarkMode() ? 'dark' : 'light';
        themeConfig = THEME_CONFIG[themeMode];
    }

    applyThemeFonts(themeMode, themeConfig.fontLinks);

    document.documentElement.setAttribute('data-theme', themeMode);

    const shouldUseDarkClass = Boolean(themeConfig.isDark);
    if (shouldUseDarkClass) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    changeAppDarkStyle(themeConfig.isDark);

    return { isDark: themeConfig.isDark };

    // let $appThemeDarkStyle = document.getElementById('app-theme-dark-style');
    // const darkThemeCssPath = `${filePathPrefix}theme.dark.css`;
    // const shouldApplyDarkBase = themeConfig.isDark;
    // if (shouldApplyDarkBase) {
    //     if (!$appThemeDarkStyle) {
    //         $appThemeDarkStyle = document.createElement('link');
    //         $appThemeDarkStyle.setAttribute('id', 'app-theme-dark-style');
    //         $appThemeDarkStyle.rel = 'stylesheet';
    //         $appThemeDarkStyle.href = darkThemeCssPath;
    //         document.head.insertBefore($appThemeDarkStyle, $appThemeStyle);
    //     } else if ($appThemeDarkStyle.href !== darkThemeCssPath) {
    //         $appThemeDarkStyle.href = darkThemeCssPath;
    //     }
    // } else {
    //     $appThemeDarkStyle && $appThemeDarkStyle.remove();
    // }
}

/**
 *
 * @param {object} trustColor
 */
function updateTrustColorClasses(trustColor) {
    if (document.getElementById('trustColor') !== null) {
        document.getElementById('trustColor').outerHTML = '';
    }
    const style = document.createElement('style');
    style.id = 'trustColor';
    style.type = 'text/css';
    let newCSS = '';
    for (const rank in trustColor) {
        newCSS += `.x-tag-${rank} { color: ${trustColor[rank]} !important; border-color: ${trustColor[rank]} !important; } `;
    }
    style.innerHTML = newCSS;
    document.getElementsByTagName('head')[0].appendChild(style);
}

async function refreshCustomCss() {
    if (document.contains(document.getElementById('app-custom-style'))) {
        document.getElementById('app-custom-style').remove();
    }
    const customCss = await AppApi.CustomCss();
    if (customCss) {
        const head = document.head;
        const $appCustomStyle = document.createElement('link');
        $appCustomStyle.setAttribute('id', 'app-custom-style');
        $appCustomStyle.rel = 'stylesheet';
        $appCustomStyle.type = 'text/css';
        $appCustomStyle.href = URL.createObjectURL(
            new Blob([customCss], { type: 'text/css' })
        );
        head.appendChild($appCustomStyle);
    }
}

async function refreshCustomScript() {
    if (document.contains(document.getElementById('app-custom-script'))) {
        document.getElementById('app-custom-script').remove();
    }
    const customScript = await AppApi.CustomScript();
    if (customScript) {
        const head = document.head;
        const $appCustomScript = document.createElement('script');
        $appCustomScript.setAttribute('id', 'app-custom-script');
        $appCustomScript.type = 'text/javascript';
        $appCustomScript.textContent = customScript;
        head.appendChild($appCustomScript);
    }
}

/**
 *
 * @param {number} hue
 * @returns {string}
 */
function HueToHex(hue) {
    const appSettingsStore = useAppearanceSettingsStore();
    const { isDarkMode } = storeToRefs(appSettingsStore);
    // this.HSVtoRGB(hue / 65535, .8, .8);
    if (isDarkMode.value) {
        return HSVtoRGB(hue / 65535, 0.6, 1);
    }
    return HSVtoRGB(hue / 65535, 1, 0.7);
}

/**
 *
 * @param {number} h
 * @param {number} s
 * @param {number} v
 * @returns {string}
 */
function HSVtoRGB(h, s, v) {
    let r = 0;
    let g = 0;
    let b = 0;
    if (arguments.length === 1) {
        // @ts-ignore
        s = h.s;
        // @ts-ignore
        v = h.v;
        // @ts-ignore
        h = h.h;
    }
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    const red = Math.round(r * 255);
    const green = Math.round(g * 255);
    const blue = Math.round(b * 255);
    const decColor = 0x1000000 + blue + 0x100 * green + 0x10000 * red;
    return `#${decColor.toString(16).substr(1)}`;
}

function formatJsonVars(ref) {
    // remove all object keys that start with $
    const newRef = { ...ref };
    for (const key in newRef) {
        if (key.startsWith('$')) {
            delete newRef[key];
        }
    }
    // sort keys alphabetically
    const sortedKeys = Object.keys(newRef).sort();
    const sortedRef = {};
    sortedKeys.forEach((key) => {
        sortedRef[key] = newRef[key];
    });
    if ('displayName' in sortedRef) {
        // add _hexDisplayName to top
        return {
            // @ts-ignore
            _hexDisplayName: textToHex(sortedRef.displayName),
            ...sortedRef
        };
    }
    if ('name' in sortedRef) {
        // add _hexName to top
        return {
            // @ts-ignore
            _hexName: textToHex(sortedRef.name),
            ...sortedRef
        };
    }
    return sortedRef;
}

function changeHtmlLangAttribute(language) {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('lang', language);
}

async function getThemeMode(configRepository) {
    const initThemeMode = await configRepository.getString(
        'VRCX_ThemeMode',
        'system'
    );

    let isDarkMode;
    if (initThemeMode === 'light') {
        isDarkMode = false;
    } else if (initThemeMode === 'system') {
        isDarkMode = systemIsDarkMode();
    } else {
        isDarkMode = true;
    }

    return { initThemeMode, isDarkMode };
}

function redirectToToolsTab() {
    router.push({ name: 'tools' });
    toast(i18n.global.t('view.tools.redirect_message'), { duration: 3000 });
}

export {
    systemIsDarkMode,
    changeAppDarkStyle,
    changeAppThemeStyle,
    useThemeColor,
    applyThemeColor,
    initThemeColor,
    updateTrustColorClasses,
    refreshCustomCss,
    refreshCustomScript,
    applyAppFontFamily,
    HueToHex,
    HSVtoRGB,
    formatJsonVars,
    changeHtmlLangAttribute,
    getThemeMode,
    redirectToToolsTab
};
