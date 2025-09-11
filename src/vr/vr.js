// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import { createApp } from 'vue';
import { initNoty } from '../plugin/noty';
import { i18n } from '../plugin/i18n';
import InteropApi from '../ipc-electron/interopApi.js';
import Vr from './Vr.vue';

initNoty(true);

if (WINDOWS) {
    await CefSharp.BindObjectAsync('AppApiVr');
} else {
    // @ts-ignore
    window.AppApiVr = InteropApi.AppApiVrElectron;
}

const $app = createApp(Vr);

$app.use(i18n);

$app.mount('#root');
