import Vue from 'vue';
import { useAuthStore } from '../stores';

const eventHandlers = new Map();
const API = {};

API.debug = false;
API.debugWebSocket = false;
API.debugUserDiff = false;
API.debugCurrentUserDiff = false;
API.debugPhotonLogging = false;
API.debugGameLog = false;
API.debugWebRequests = false;
API.debugFriendState = false;

API.errorNoty = null;

API.dontLogMeOut = false;

/**
 * @param {string} name
 * @param {...*} args
 * @returns {void}
 */
API.$emit = function (name, ...args) {
    if (API.debug) {
        console.log(name, ...args);
    }
    const handlers = eventHandlers.get(name);
    if (typeof handlers === 'undefined') {
        return;
    }
    try {
        for (const handler of handlers) {
            handler.apply(this, args);
        }
    } catch (err) {
        console.error(err);
    }
};

/**
 * @param {string} name
 * @param {function} handler
 * @returns {void}
 */
API.$on = function (name, handler) {
    let handlers = eventHandlers.get(name);
    if (typeof handlers === 'undefined') {
        handlers = [];
        eventHandlers.set(name, handlers);
    }
    handlers.push(handler);
};

/**
 * @param {string} name
 * @param {function} handler
 * @returns {void}
 */
API.$off = function (name, handler) {
    const handlers = eventHandlers.get(name);
    if (typeof handlers === 'undefined') {
        return;
    }
    const { length } = handlers;
    for (let i = 0; i < length; ++i) {
        if (handlers[i] === handler) {
            if (length > 1) {
                handlers.splice(i, 1);
            } else {
                eventHandlers.delete(name);
            }
            break;
        }
    }
};

API.$on('CONFIG', function (args) {
    const authStore = useAuthStore();
    const ref = {
        ...args.json
    };
    args.ref = ref;
    authStore.cachedConfig = ref;
});

API.$on('CONFIG', function (args) {
    if (typeof args.ref?.whiteListedAssetUrls !== 'object') {
        console.error('Invalid config whiteListedAssetUrls');
    }
    AppApi.PopulateImageHosts(JSON.stringify(args.ref.whiteListedAssetUrls));
});

Vue.observable(API);

window.API = API;

export { API };
