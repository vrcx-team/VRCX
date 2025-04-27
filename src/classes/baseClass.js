import $utils from './utils';
/* eslint-disable no-unused-vars */
let $app = {};
let API = {};
let $t = {};
/* eslint-enable no-unused-vars */

class baseClass {
    constructor(_app, _API, _t) {
        $app = _app;
        API = _API;
        $t = _t;

        this.init();
    }

    updateRef(_app) {
        $app = _app;
    }

    init() {}

    _data = {};

    _methods = {};
}

export { baseClass, $app, API, $t, $utils };
