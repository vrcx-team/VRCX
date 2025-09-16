// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import { createApp } from 'vue';
import { pinia } from './stores';
import { initPlugins } from './plugin';
import { i18n } from './plugin/i18n';
import { initComponents } from './plugin/components';
import ElementPlus from 'element-plus';
import App from './App.vue';

await initPlugins();

// #region | Hey look it's most of VRCX!

const app = createApp(App);

app.use(pinia);
app.use(i18n);
app.use(ElementPlus);
initComponents(app);

app.mount('#root');

window.$app = app;
