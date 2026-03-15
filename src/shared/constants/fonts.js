const APP_FONT_DEFAULT_KEY = 'inter';
const APP_CJK_FONT_PACK_DEFAULT_KEY = 'noto';

const APP_FONT_CONFIG = Object.freeze({
    inter: {
        cssName: "'Inter Variable'",
        link: null
    },
    noto_sans: {
        cssName: "'Noto Sans'",
        cssImport:
            "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap');"
    },
    geist: {
        cssName: "'Geist'",
        cssImport:
            "@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap');"
    },
    nunito_sans: {
        cssName: "'Nunito Sans'",
        cssImport:
            "@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap');"
    },
    ibm_plex_sans: {
        cssName: "'IBM Plex Sans'",
        cssImport:
            "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap');"
    },
    jetbrains_mono: {
        cssName: "'JetBrains Mono'",
        cssImport:
            "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');"
    },
    fantasque_sans_mono: {
        cssName: "'Fantasque Sans Mono'",
        cssImport:
            "@import url('https://fonts.cdnfonts.com/css/fantasque-sans-mono');"
    },
    system_ui: {
        cssName: 'system-ui',
        link: null
    },
    custom: {
        cssName: '',
        link: null
    }
});

const APP_FONT_FAMILIES = Object.freeze(Object.keys(APP_FONT_CONFIG));

const APP_CJK_FONT_PACK_CONFIG = Object.freeze({
    noto: {
        cssName: Object.freeze({
            jp: "'Noto Sans JP Variable'",
            kr: "'Noto Sans KR Variable'",
            sc: "'Noto Sans SC Variable'",
            tc: "'Noto Sans TC Variable'"
        }),
        link: null
    },
    pht: {
        cssName: Object.freeze({
            jp: "'PHT Sans JP'",
            kr: "'PHT Sans KR'",
            sc: "'PHT Sans SC'",
            tc: "'PHT Sans TC'"
        }),
        cssImport: [
            '/* Simplified Chinese */',
            "@font-face { font-family: 'PHT Sans SC'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/sc/phtsansSC-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }",
            "@font-face { font-family: 'PHT Sans SC'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/sc/phtsansSC-Medium.woff2') format('woff2'); font-weight: 500; font-display: swap; }",
            "@font-face { font-family: 'PHT Sans SC'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/sc/phtsansSC-SemiBold.woff2') format('woff2'); font-weight: 600; font-display: swap; }",
            "@font-face { font-family: 'PHT Sans SC'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/sc/phtsansSC-Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }",
            '/* Traditional Chinese */',
            "@font-face { font-family: 'PHT Sans TC'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/tc/phtsansTC-55.woff2') format('woff2'); font-weight: 400; font-display: swap; }",
            "@font-face { font-family: 'PHT Sans TC'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/tc/phtsansTC-75.woff2') format('woff2'); font-weight: 600; font-display: swap; }",
            '/* Japanese */',
            "@font-face { font-family: 'PHT Sans JP'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/jp/phtsansJP-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }",
            "@font-face { font-family: 'PHT Sans JP'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/jp/phtsansJP-Medium.woff2') format('woff2'); font-weight: 500; font-display: swap; }",
            "@font-face { font-family: 'PHT Sans JP'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/jp/phtsansJP-Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }",
            '/* Korean */',
            "@font-face { font-family: 'PHT Sans KR'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/kr/phtsansKR-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }",
            "@font-face { font-family: 'PHT Sans KR'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/kr/phtsansKR-Medium.woff2') format('woff2'); font-weight: 500; font-display: swap; }",
            "@font-face { font-family: 'PHT Sans KR'; src: url('https://cdn.jsdelivr.net/gh/map1en/pht@1.0.0/kr/phtsansKR-Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }"
        ].join('\n')
    },
    system: {
        cssName: Object.freeze({
            jp: 'system-ui',
            kr: 'system-ui',
            sc: 'system-ui',
            tc: 'system-ui'
        }),
        link: null
    }
});

const APP_CJK_FONT_PACKS = Object.freeze(Object.keys(APP_CJK_FONT_PACK_CONFIG));

export {
    APP_FONT_CONFIG,
    APP_FONT_DEFAULT_KEY,
    APP_FONT_FAMILIES,
    APP_CJK_FONT_PACK_CONFIG,
    APP_CJK_FONT_PACK_DEFAULT_KEY,
    APP_CJK_FONT_PACKS
};
