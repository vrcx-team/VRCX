import * as workerTimers from 'worker-timers';
/* eslint-disable no-unused-vars */
let VRCXStorage = {};
/* eslint-enable no-unused-vars */

export default class {
    constructor(_VRCXStorage) {
        VRCXStorage = _VRCXStorage;
        this.init();
    }

    init() {
        VRCXStorage.GetArray = async function (key) {
            try {
                var array = JSON.parse(await this.Get(key));
                if (Array.isArray(array)) {
                    return array;
                }
            } catch (err) {
                console.error(err);
            }
            return [];
        };

        VRCXStorage.SetArray = function (key, value) {
            this.Set(key, JSON.stringify(value));
        };

        VRCXStorage.GetObject = async function (key) {
            try {
                var object = JSON.parse(await this.Get(key));
                if (object === Object(object)) {
                    return object;
                }
            } catch (err) {
                console.error(err);
            }
            return {};
        };

        VRCXStorage.SetObject = function (key, value) {
            this.Set(key, JSON.stringify(value));
        };

        workerTimers.setInterval(
            () => {
                VRCXStorage.Flush();
            },
            5 * 60 * 1000
        );
    }
}
