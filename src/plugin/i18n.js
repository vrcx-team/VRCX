import { createI18n } from 'vue-i18n';

import { getLocalizationStrings } from '../localization/index.js';

const localizedStrings = await getLocalizationStrings();

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: Object.fromEntries(
        Object.entries(localizedStrings).map(([key, value]) => [
            key.replaceAll('_', '-'),
            value
        ])
    ),
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    warnHtmlMessage: false,
    fallbackWarn: false
});

async function updateLocalizedStrings() {
    const newStrings = await getLocalizationStrings();
    Object.entries(newStrings).forEach(([key, value]) => {
        i18n.global.setLocaleMessage(key.replaceAll('_', '-'), value);
    });
}

export { i18n, updateLocalizedStrings };
