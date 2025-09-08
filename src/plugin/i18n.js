import { createI18n } from 'vue-i18n';
import * as localizedStrings from '../localization/localizedStrings';

// Vue I18n 11.x configuration
const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: Object.fromEntries(
        Object.entries(localizedStrings).map(([key, value]) => [
            key.replace('_', '-'),
            value
        ])
    ),
    legacy: false,
    globalInjection: true,
    missingWarn: false,
    warnHtmlMessage: false,
    fallbackWarn: false,
    silentTranslationWarn: true,
    silentFallbackWarn: true
});

const t = i18n.global.t;

export { i18n, t };
