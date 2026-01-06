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
    const loader = elementPlusStrings[code] || elementPlusStrings.en;
    return (await loader().catch(() => elementPlusStrings.en())).default;
}

const localizedStringsUrls = import.meta.glob('./*.json', {
    eager: true,
    query: '?url',
    import: 'default'
});

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.warn(`Failed to fetch localization: ${response.status}`);
    }
    return response.json();
}

async function getLocalizedStrings(code) {
    const fallbackUrl = localizedStringsUrls['./en.json'];
    const localizedStringsUrl =
        localizedStringsUrls[`./${code}.json`] || fallbackUrl;

    let localizedStrings = {};
    try {
        localizedStrings = await fetchJson(localizedStringsUrl);
    } catch {
        if (localizedStringsUrl !== fallbackUrl) {
            localizedStrings = await fetchJson(fallbackUrl).catch(() => ({}));
        }
    }

    return {
        ...localizedStrings,
        elementPlus: await getElementPlusStrings(code)
    };
}

const languageNames = import.meta.glob('./*.json', {
    eager: true,
    import: 'language'
});

function getLanguageName(code) {
    return languageNames[`./${code}.json`];
}

export * from './locales';
export { getLanguageName, getLocalizedStrings };
