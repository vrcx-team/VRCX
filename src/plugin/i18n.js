import { createI18n } from 'vue-i18n';

import { getLocalizedStrings, languageCodes } from '../localization';

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    availableLocales: languageCodes,
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    warnHtmlMessage: false,
    fallbackWarn: false
});

async function loadLocalizedStrings(code) {
    const messages = await getLocalizedStrings(code);
    i18n.global.setLocaleMessage(code, messages);
}

async function updateLocalizedStrings() {
    // const newStrings = await getLocalizationStrings();
    // Object.entries(newStrings).forEach(([key, value]) => {
    //     i18n.global.setLocaleMessage(key.replaceAll('_', '-'), value);
    // });
}

export { i18n, loadLocalizedStrings, updateLocalizedStrings };
