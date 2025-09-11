import { createI18n } from 'vue-i18n';
import * as localizedStrings from '../localization/localizedStrings';

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

export { i18n };
