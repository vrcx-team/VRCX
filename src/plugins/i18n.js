import { createI18n } from 'vue-i18n';

import { getLocalizedStrings } from '../localization';

const FALLBACK_LOCALE = 'en';

const i18n = createI18n({
    locale: FALLBACK_LOCALE,
    fallbackLocale: FALLBACK_LOCALE,
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    warnHtmlMessage: false,
    fallbackWarn: false
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

export { i18n, loadLocalizedStrings, updateLocalizedStrings };
