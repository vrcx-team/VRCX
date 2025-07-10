import '@fontsource/noto-sans-kr';
import '@fontsource/noto-sans-jp';
import '@fontsource/noto-sans-sc';
import '@fontsource/noto-sans-tc';
import '@infolektuell/noto-color-emoji';

await configRepository.init();

import { PiniaVuePlugin } from 'pinia';
import Vue from 'vue';
import { DataTables } from 'vue-data-tables';
import VueLazyload from 'vue-lazyload';
import configRepository from './service/config';
import vrcxJsonStorage from './service/jsonStorage';
import {
    changeAppDarkStyle,
    changeAppThemeStyle,
    refreshCustomCss,
    refreshCustomScript,
    systemIsDarkMode
} from './shared/utils';
import './plugin';
import { i18n } from './plugin';

AppApi.SetUserAgent();

const appLanguage = await configRepository.getString('VRCX_appLanguage', 'en');
i18n.locale = appLanguage;

const initThemeMode = await configRepository.getString(
    'VRCX_ThemeMode',
    'system'
);

let isDarkMode;

if (initThemeMode === 'light') {
    isDarkMode = false;
} else if (initThemeMode === 'system') {
    isDarkMode = systemIsDarkMode();
} else {
    isDarkMode = true;
}
changeAppDarkStyle(isDarkMode);
changeAppThemeStyle(initThemeMode);

refreshCustomCss();
refreshCustomScript();

Vue.use(PiniaVuePlugin);
Vue.use(DataTables);

Vue.use(VueLazyload, {
    preLoad: 1,
    observer: true,
    observerOptions: {
        rootMargin: '0px',
        threshold: 0
    },
    attempt: 3
});

new vrcxJsonStorage(VRCXStorage);

// some workaround for failing to get voice list first run
speechSynthesis.getVoices();

if (process.env.NODE_ENV !== 'production') {
    Vue.config.errorHandler = function (err, vm, info) {
        console.error('Vue Error：', err);
        console.error('Component：', vm);
        console.error('Error Info：', info);
    };
    Vue.config.warnHandler = function (msg, vm, trace) {
        console.warn('Vue Warning：', msg);
        console.warn('Component：', vm);
        console.warn('Trace：', trace);
    };
}
