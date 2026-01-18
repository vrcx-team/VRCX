const APP_FONT_DEFAULT_KEY = 'inter';

const APP_FONT_CONFIG = Object.freeze({
    inter: {
        cssName: "'Inter'",
        link: null
    },
    noto_sans: {
        cssName: "'Noto Sans'",
        cssImport:
            "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap');"
    },
    source_sans_3: {
        cssName: "'Source Sans 3'",
        cssImport:
            "@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap');"
    },
    ibm_plex_sans: {
        cssName: "'IBM Plex Sans'",
        cssImport:
            "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap');"
    },
    harmonyos_sans: {
        cssName: "'HarmonyOS Sans'",
        cssImport:
            "@import url('https://fonts.cdnfonts.com/css/harmonyos-sans');"
    },
    system_ui: {
        cssName: 'system-ui',
        link: null
    }
});

const APP_FONT_FAMILIES = Object.freeze(Object.keys(APP_FONT_CONFIG));

export { APP_FONT_CONFIG, APP_FONT_DEFAULT_KEY, APP_FONT_FAMILIES };
