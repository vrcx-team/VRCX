import { createI18n } from 'vue-i18n';
import * as localizedStrings from '../localization/localizedStrings';

// Vue I18n 11.x configuration
const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
        en: localizedStrings.en,
        es: localizedStrings.es,
        fr: localizedStrings.fr,
        ja: localizedStrings.ja_JP,
        ko: localizedStrings.ko,
        pl: localizedStrings.pl,
        pt: localizedStrings.pt,
        vi: localizedStrings.vi,
        'zh-CN': localizedStrings.zh_CN,
        'zh-TW': localizedStrings.zh_TW,
        th: localizedStrings.th
    },
    legacy: false,
    globalInjection: true,
    missingWarn: false,
    warnHtmlMessage: false,
    fallbackWarn: false,
    silentTranslationWarn: true,
    silentFallbackWarn: true
});

export { i18n };
