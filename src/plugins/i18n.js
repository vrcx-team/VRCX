import { createI18n } from 'vue-i18n';

import { getLocalizedStrings } from '../localization';

const FALLBACK_LOCALE = 'en';

// Arabic pluralization rules
// Arabic has 6 plural forms: zero, one, two, few, many, other
function arPluralizationRule(choice, _choicesLength) {
    if (choice === 0) return 0; // zero
    if (choice === 1) return 1; // one
    if (choice === 2) return 2; // two
    const absoluteChoice = Math.abs(choice);
    const mod100 = absoluteChoice % 100;
    if (mod100 >= 3 && mod100 <= 10) return 3; // few
    if (mod100 >= 11 && mod100 <= 99) return 4; // many
    return 5; // other
}

const pluralRules = {
    ar: arPluralizationRule
};

const i18n = createI18n({
    locale: FALLBACK_LOCALE,
    fallbackLocale: FALLBACK_LOCALE,
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    warnHtmlMessage: false,
    fallbackWarn: false,
    pluralRules
});

async function loadLocalizedStrings(code) {
    const localesToLoad =
        code === FALLBACK_LOCALE ? [FALLBACK_LOCALE] : [FALLBACK_LOCALE, code];

    for (const locale of localesToLoad) {
        const messages = await getLocalizedStrings(locale);
        i18n.global.setLocaleMessage(locale, messages);
    }
}

async function updateLocalizedStrings() {
    await loadLocalizedStrings(i18n.global.locale.value);
}

/**
 * Translate a single key using a specific locale without switching global UI language.
 *
 * @param {string} locale
 * @param {string} key
 * @param {import('vue-i18n').NamedValue=} params
 * @returns {Promise<string>}
 */
async function tForLocale(locale, key, params = {}) {
    await loadLocalizedStrings(locale);
    return i18n.global.t(key, params, { locale });
}

export { i18n, loadLocalizedStrings, tForLocale, updateLocalizedStrings };
