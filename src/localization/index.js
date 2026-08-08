const localizedStringsUrls = import.meta.glob('./*.json', {
    eager: true,
    query: '?url',
    import: 'default'
});

/**
 * Retrieves localized strings for the specified language code
 * @param {string} code - The language code
 * @returns {Promise<Object>} A promise that resolves to the localized strings
 */
async function getLocalizedStrings(code) {
    const fallbackUrl = localizedStringsUrls['./en.json'];
    const url = localizedStringsUrls[`./${code}.json`] || fallbackUrl;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status}`);
        return await res.json();
    } catch {
        if (url !== fallbackUrl) {
            try {
                const res = await fetch(fallbackUrl);
                return await res.json();
            } catch {
                return {};
            }
        }
        return {};
    }
}

const languageNames = import.meta.glob('./*.json', {
    eager: true,
    import: 'language'
});

/**
 * Retrieves the name of the specified language code
 * @param {string} code - The language code
 * @returns {string} The language name
 */
function getLanguageName(code) {
    return String(languageNames[`./${code}.json`] ?? code);
}

/**
 * Resolves the system language to a supported language code
 * @param {string} systemLanguage - BCP-47 code from AppApi.CurrentLanguage()
 * @param {string[]} codes - supported language codes
 * @returns {string | null} matched language code, or null
 */
function resolveSystemLanguage(systemLanguage, codes) {
    if (!systemLanguage) return null;

    // Exact match (e.g. zh-CN → zh-CN)
    if (codes.includes(systemLanguage)) {
        return systemLanguage;
    }

    const lang = systemLanguage.split('-')[0];

    // Chinese: script-tag and region-aware mapping
    // BCP-47 forms: zh-CN, zh-TW, zh-Hant, zh-Hans, zh-Hant-HK, zh-Hans-CN, etc.
    if (lang === 'zh') {
        const parts = systemLanguage.split('-').slice(1); // everything after 'zh'
        const hasHant = parts.includes('Hant');
        const hasHans = parts.includes('Hans');
        const traditionalRegions = ['TW', 'HK', 'MO'];
        const hasTraditionalRegion = parts.some((p) =>
            traditionalRegions.includes(p)
        );

        if (hasHant || hasTraditionalRegion) {
            return codes.includes('zh-TW') ? 'zh-TW' : null;
        }
        if (hasHans) {
            return codes.includes('zh-CN') ? 'zh-CN' : null;
        }
        // Bare 'zh' or unknown region (e.g. zh-SG) → simplified
        return codes.includes('zh-CN') ? 'zh-CN' : null;
    }

    // Generic prefix match (e.g. ja-JP → ja)
    return codes.find((code) => code.split('-')[0] === lang) ?? null;
}

export * from './locales';
export { getLanguageName, getLocalizedStrings, resolveSystemLanguage };
