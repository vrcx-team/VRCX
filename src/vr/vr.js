// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import { createApp } from 'vue';
import { initPlugins } from '../plugin';
import { i18n } from '../plugin/i18n';
import Vr from './Vr.vue';

await initPlugins(true);

const vr = createApp(Vr);
vr.use(i18n);

vr.mount('#root');
