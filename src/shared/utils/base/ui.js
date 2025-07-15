import { storeToRefs } from 'pinia';
import { useAppearanceSettingsStore } from '../../../stores';

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

/**
 *
 * @param {string} themeMode
 * @returns
 */
function changeAppThemeStyle(themeMode) {
    const themeStyle = {};
    switch (themeMode) {
        case 'light':
            themeStyle.href = '';
            break;
        case 'dark':
            themeStyle.href = '';
            break;
        case 'darkvanillaold':
            themeStyle.href = 'theme.darkvanillaold.css';
            break;
        case 'darkvanilla':
            themeStyle.href = 'theme.darkvanilla.css';
            break;
        case 'pink':
            themeStyle.href = 'theme.pink.css';
            break;
        case 'material3':
            themeStyle.href = 'theme.material3.css';
            break;
        case 'system':
            themeStyle.href = '';
            break;
    }

    /**
     * prevents flickering
     * giving absolute paths does prevent flickering
     * when switching from another dark theme to 'dark' theme
     * <del>works on my machine</del>
     */
    let filePathPrefix = 'file://vrcx/';
    if (LINUX) {
        filePathPrefix = './';
    }

    let $appThemeStyle = document.getElementById('app-theme-style');
    if (!$appThemeStyle) {
        $appThemeStyle = document.createElement('link');
        $appThemeStyle.setAttribute('id', 'app-theme-style');
        $appThemeStyle.rel = 'stylesheet';
        document.head.appendChild($appThemeStyle);
    }
    $appThemeStyle.href = themeStyle.href
        ? `${filePathPrefix}${themeStyle.href}`
        : '';

    let $appThemeDarkStyle = document.getElementById('app-theme-dark-style');

    const darkThemeCssPath = `${filePathPrefix}theme.dark.css`;

    if (!$appThemeDarkStyle && themeMode !== 'light') {
        if (themeMode === 'system' && !systemIsDarkMode()) {
            return;
        }
        $appThemeDarkStyle = document.createElement('link');
        $appThemeDarkStyle.setAttribute('id', 'app-theme-dark-style');
        $appThemeDarkStyle.rel = 'stylesheet';
        $appThemeDarkStyle.href = darkThemeCssPath;
        document.head.insertBefore($appThemeDarkStyle, $appThemeStyle);
    } else {
        if (themeMode === 'system' && systemIsDarkMode()) {
            if ($appThemeDarkStyle.href === darkThemeCssPath) {
                return;
            }
            $appThemeDarkStyle.href = darkThemeCssPath;
        } else if (themeMode !== 'light' && themeMode !== 'system') {
            if ($appThemeDarkStyle.href === darkThemeCssPath) {
                return;
            }
            $appThemeDarkStyle.href = darkThemeCssPath;
        } else {
            $appThemeDarkStyle && $appThemeDarkStyle.remove();
        }
    }
}

/**
 * CJK character in Japanese, Korean, Chinese are different
 * so change font-family order when users change language to display CJK character correctly
 * @param {string} lang
 */
function changeCJKFontsOrder(lang) {
    const otherFonts = window
        .getComputedStyle(document.body)
        .fontFamily.split(',')
        .filter((item) => !item.includes('Noto Sans'))
        .join(', ');
    const notoSans = 'Noto Sans';

    const fontFamilies = {
        ja_JP: ['JP', 'KR', 'TC', 'SC'],
        ko: ['KR', 'JP', 'TC', 'SC'],
        zh_TW: ['TC', 'JP', 'KR', 'SC'],
        zh_CN: ['SC', 'JP', 'KR', 'TC']
    };

    if (fontFamilies[lang]) {
        const CJKFamily = fontFamilies[lang]
            .map((item) => `${notoSans} ${item}`)
            .join(', ');
        document.body.style.fontFamily = `${CJKFamily}, ${otherFonts}`;
    }
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

function refreshCustomCss() {
    if (document.contains(document.getElementById('app-custom-style'))) {
        document.getElementById('app-custom-style').remove();
    }
    AppApi.CustomCssPath().then((customCss) => {
        const head = document.head;
        if (customCss) {
            const $appCustomStyle = document.createElement('link');
            $appCustomStyle.setAttribute('id', 'app-custom-style');
            $appCustomStyle.rel = 'stylesheet';
            $appCustomStyle.href = `file://${customCss}?_=${Date.now()}`;
            head.appendChild($appCustomStyle);
        }
    });
}

function refreshCustomScript() {
    if (document.contains(document.getElementById('app-custom-script'))) {
        document.getElementById('app-custom-script').remove();
    }
    AppApi.CustomScriptPath().then((customScript) => {
        const head = document.head;
        if (customScript) {
            const $appCustomScript = document.createElement('script');
            $appCustomScript.setAttribute('id', 'app-custom-script');
            $appCustomScript.src = `file://${customScript}?_=${Date.now()}`;
            head.appendChild($appCustomScript);
        }
    });
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

function adjustDialogZ(el) {
    let z = 0;
    document.querySelectorAll('.v-modal,.el-dialog__wrapper').forEach((v) => {
        const _z = Number(v.style.zIndex) || 0;
        if (_z && _z > z && v !== el) {
            z = _z;
        }
    });
    if (z) {
        el.style.zIndex = z + 1;
    }
}

export {
    systemIsDarkMode,
    changeAppDarkStyle,
    changeAppThemeStyle,
    changeCJKFontsOrder,
    updateTrustColorClasses,
    refreshCustomCss,
    refreshCustomScript,
    HueToHex,
    HSVtoRGB,
    adjustDialogZ
};
