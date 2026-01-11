import { createApp } from 'vue';

import { i18n } from '../plugin/i18n';
import { initPlugins } from '../plugin';

import Vr from './Vr.vue';

await initPlugins(true);

const vr = createApp(Vr);
vr.use(i18n);

vr.mount('#root');
