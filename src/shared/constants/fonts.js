const APP_FONT_DEFAULT_KEY = 'noto_sans';

const APP_FONT_CONFIG = Object.freeze({
    inter: {
        cssName: "'Inter'",
        link: null
    },
    noto_sans: {
        cssName: "'Noto Sans Variable'",
        link: null
    },
    harmonyos_sans: {
        cssName: "'HarmonyOS Sans'",
        cssImport:
            "@import url('https://fonts.cdnfonts.com/css/harmonyos-sans');"
    }
});

const APP_FONT_FAMILIES = Object.freeze(Object.keys(APP_FONT_CONFIG));

export { APP_FONT_CONFIG, APP_FONT_DEFAULT_KEY, APP_FONT_FAMILIES };
