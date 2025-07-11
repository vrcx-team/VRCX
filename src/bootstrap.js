import '@fontsource/noto-sans-kr';
import '@fontsource/noto-sans-jp';
import '@fontsource/noto-sans-sc';
import '@fontsource/noto-sans-tc';
import '@infolektuell/noto-color-emoji';

import Vue from 'vue';
import { PiniaVuePlugin } from 'pinia';
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
import { i18n } from './plugin';

configRepository.init();
i18n.locale = await configRepository.getString('VRCX_appLanguage', 'en');

AppApi.SetUserAgent();

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
