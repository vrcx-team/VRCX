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
    globalInjection: false
});

const t = i18n.global.t;

export { i18n, t };
