import { createI18n } from 'vue-i18n';
import { getLocalizedStrings, languageCodes } from '../localization';

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
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
    await loadLocalizedStrings(i18n.global.locale.value);
}

export { i18n, loadLocalizedStrings, updateLocalizedStrings };
