import { createApp } from 'vue';

import ElementPlus from 'element-plus';

import {
    i18n,
    initComponents,
    initPlugins,
    initRouter,
    initSentry
} from './plugin';
import { initPiniaPlugins, pinia } from './stores';

import App from './App.vue';

await initPlugins();
await initPiniaPlugins();

// #region | Hey look it's most of VRCX!

const app = createApp(App);

app.use(pinia).use(i18n).use(ElementPlus);
initComponents(app);
initRouter(app);
await initSentry(app);

app.mount('#root');
