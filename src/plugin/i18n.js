import { createI18n } from 'vue-i18n';
import * as localizedStrings from '../localization/localizedStrings';

// Vue I18n 11.x configuration
const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: localizedStrings,
    legacy: false,
    globalInjection: true,
    missingWarn: false,
    warnHtmlMessage: false,
    fallbackWarn: false,
    silentTranslationWarn: true,
    silentFallbackWarn: true
});

export { i18n };
