import { createApp } from 'vue';

import { i18n } from '../plugins/i18n';
import { initPlugins } from '../plugins';

import Vr from './Vr.vue';

await initPlugins(true);

const vr = createApp(Vr);
vr.use(i18n);

vr.mount('#root');
