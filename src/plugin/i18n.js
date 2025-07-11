import ElementUI from 'element-ui';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { createI18n } from 'vue-i18n-bridge';
import * as localizedStrings from '../localization/localizedStrings';

// i18n: execution order matters here
Vue.use(VueI18n, { bridge: true });
const i18n = createI18n(
    {
        locale: 'en',
        fallbackLocale: 'en',
        messages: localizedStrings,
        legacy: false,
        globalInjection: true,
        missingWarn: false,
        warnHtmlMessage: false,
        fallbackWarn: false
    },
    VueI18n
);

Vue.use(i18n);
Vue.use(ElementUI, {
    i18n: (key, value) => i18n.global.t(key, value)
});

const t = i18n.global.t;

export { i18n, t };
