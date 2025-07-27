import { storeToRefs } from 'pinia';
import { useAppearanceSettingsStore } from '../../../stores';
import { THEME_CONFIG } from '../../constants';

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
    const themeConfig = THEME_CONFIG[themeMode];
    if (!themeConfig) return;

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
    $appThemeStyle.href = themeConfig.cssFile
        ? `${filePathPrefix}${themeConfig.cssFile}`
        : '';

    let $appThemeDarkStyle = document.getElementById('app-theme-dark-style');
    const darkThemeCssPath = `${filePathPrefix}theme.dark.css`;
    const shouldApplyDarkBase =
        themeConfig.requiresDarkBase ||
        (themeMode === 'system' && systemIsDarkMode());

    if (shouldApplyDarkBase) {
        if (!$appThemeDarkStyle) {
            $appThemeDarkStyle = document.createElement('link');
            $appThemeDarkStyle.setAttribute('id', 'app-theme-dark-style');
            $appThemeDarkStyle.rel = 'stylesheet';
            $appThemeDarkStyle.href = darkThemeCssPath;
            document.head.insertBefore($appThemeDarkStyle, $appThemeStyle);
        } else if ($appThemeDarkStyle.href !== darkThemeCssPath) {
            $appThemeDarkStyle.href = darkThemeCssPath;
        }
    } else {
        $appThemeDarkStyle && $appThemeDarkStyle.remove();
    }

    let isDarkForExternalApp = themeConfig.isDark;
    if (isDarkForExternalApp === 'system') {
        isDarkForExternalApp = systemIsDarkMode();
    }
    changeAppDarkStyle(isDarkForExternalApp);
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
