import { ElMessage } from 'element-plus';
import { storeToRefs } from 'pinia';

import { useAppearanceSettingsStore, useUiStore } from '../../../stores';
import { THEME_CONFIG } from '../../constants';
import { i18n } from '../../../plugin/i18n';

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

function changeAppThemeStyle(themeMode) {
    if (themeMode === 'system') {
        themeMode = systemIsDarkMode() ? 'dark' : 'light';
    }

    const themeConfig = THEME_CONFIG[themeMode];
    if (!themeConfig) {
        console.error('Invalid theme mode:', themeMode);
        themeMode = systemIsDarkMode() ? 'dark' : 'light';
    }

    let filePathPrefix = 'file://vrcx/';
    if (LINUX) {
        filePathPrefix = './';
    }
    if (process.env.NODE_ENV === 'development') {
        filePathPrefix = 'http://localhost:9000/';
        console.log('Using development file path prefix:', filePathPrefix);
    }

    let $appThemeStyle = document.getElementById('app-theme-style');
    if (!$appThemeStyle) {
        $appThemeStyle = document.createElement('link');
        $appThemeStyle.setAttribute('id', 'app-theme-style');
        $appThemeStyle.rel = 'stylesheet';
        document.head.appendChild($appThemeStyle);
    }
    $appThemeStyle.href = themeConfig.cssFile ? themeConfig.cssFile : '';

    if (themeConfig.isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    changeAppDarkStyle(themeConfig.isDark);

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
        s = h.s;
        v = h.v;
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

function getNextDialogIndex() {
    let z = 2000;
    document.querySelectorAll('.el-overlay,.el-modal-dialog').forEach((v) => {
        if (v.style.display === 'none') {
            return;
        }
        const _z = Number(v.style.zIndex) || 0;
        if (_z > z) {
            z = _z;
        }
    });
    return z + 1;
}

function changeHtmlLangAttribute(language) {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('lang', language);
}

// prevent flicker on login page
function setLoginContainerStyle(isDarkMode) {
    const loginContainerStyle = document.createElement('style');
    loginContainerStyle.id = 'login-container-style';
    loginContainerStyle.type = 'text/css';

    const backgroundColor = isDarkMode ? '#101010' : '#ffffff';
    const inputBackgroundColor = isDarkMode ? '#333333' : '#ffffff';
    const inputBorder = isDarkMode ? '1px solid #3b3b3b' : '1px solid #DCDFE6';

    loginContainerStyle.innerHTML = `
    .x-login-container {
        background-color: ${backgroundColor} !important;
        transition: background-color 0.3s ease;
    }

    .x-login-container .el-input__wrapper {
        background-color: ${inputBackgroundColor} !important;
        border: ${inputBorder} !important;
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }
        `;

    document.head.insertBefore(loginContainerStyle, document.head.firstChild);
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
    const uiStore = useUiStore();
    uiStore.menuActiveIndex = 'tools';
    ElMessage({
        message: i18n.global.t('view.tools.redirect_message'),
        type: 'primary',
        duration: 3000
    });
}

export {
    systemIsDarkMode,
    changeAppDarkStyle,
    changeAppThemeStyle,
    updateTrustColorClasses,
    refreshCustomCss,
    refreshCustomScript,
    HueToHex,
    HSVtoRGB,
    getNextDialogIndex,
    changeHtmlLangAttribute,
    setLoginContainerStyle,
    getThemeMode,
    redirectToToolsTab
};
