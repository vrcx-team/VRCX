const languageCodes = [
    'cs',
    'en',
    'es',
    'fr',
    'hu',
    'ja',
    'ko',
    'pl',
    'pt',
    'ru',
    'th',
    'vi',
    'zh-CN',
    'zh-TW'
];

/**
 * @type {Record<string, string>}
 */
const languageNames = import.meta.glob('./*.json', {
    eager: true,
    import: 'language'
});

function getLanguageName(code) {
    return languageNames[`./${code}.json`];
}

const elementPlusStrings = {
    // Vite does not support dynamic imports to `node_modules`.
    // https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
    cs: () => import('element-plus/es/locale/lang/cs'),
    en: () => import('element-plus/es/locale/lang/en'),
    es: () => import('element-plus/es/locale/lang/es'),
    fr: () => import('element-plus/es/locale/lang/fr'),
    hu: () => import('element-plus/es/locale/lang/hu'),
    ja: () => import('element-plus/es/locale/lang/ja'),
    ko: () => import('element-plus/es/locale/lang/ko'),
    pl: () => import('element-plus/es/locale/lang/pl'),
    pt: () => import('element-plus/es/locale/lang/pt'),
    ru: () => import('element-plus/es/locale/lang/ru'),
    th: () => import('element-plus/es/locale/lang/th'),
    vi: () => import('element-plus/es/locale/lang/vi'),
    'zh-CN': () => import('element-plus/es/locale/lang/zh-cn'),
    'zh-TW': () => import('element-plus/es/locale/lang/zh-tw')
};

async function getElementPlusStrings(code) {
    return (await elementPlusStrings[code]()).default;
}

/**
 * @type {Record<string, () => Promise<object>>}
 */
const localizedStrings = import.meta.glob('./*.json', { eager: false });

async function getLocalizedStrings(code) {
    return {
        ...(await localizedStrings[`./${code}.json`]()),
        elementPlus: await getElementPlusStrings(code)
    };
}

export { languageCodes, getLanguageName, getLocalizedStrings };
