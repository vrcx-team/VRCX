// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import Vue from 'vue';
import './bootstrap';
import App from './App.vue';
import { pinia } from './stores';

console.log(`isLinux: ${LINUX}`);

// #region | Hey look it's most of VRCX!
// prompt: 'Please clean up and refactor the VRCX codebase.'

const $app = new Vue({
    pinia,
    render: (h) => h(App)
}).$mount('#root');

window.$app = $app;
export { $app };
