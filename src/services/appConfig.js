import { reactive } from 'vue';

import dayjs from 'dayjs';

import * as utils from '../shared/utils';

const AppDebug = reactive({
    debug: false,
    debugWebSocket: false,
    debugUserDiff: false,
    debugPhotonLogging: false,
    debugGameLog: false,
    debugWebRequests: false,
    debugFriendState: false,
    debugRecompute: false,
    debugIPC: false,
    debugVrcPlus: false,
    errorNoty: null,
    dontLogMeOut: false,
    endpointDomain: 'https://nexvr.net/api',
    endpointDomainVrchat: 'https://nexvr.net/api',
    websocketDomain: 'wss://nexvr.net/api/realtime',
    websocketDomainVrchat: 'wss://nexvr.net/api/realtime'
});

window.$debug = AppDebug;
window.utils = utils;
window.dayjs = dayjs;

/**
 * @param {string} tag
 * @param {string | unknown[]} target
 * @param {...any} rest
 */
export function logWebRequest(tag, target, ...rest) {
    if (!AppDebug.debugWebRequests) return;
    console.log(tag, target, ...rest);
}

let _queryLogDepth = 0;

/**
 * Wraps an async fn so that any API request made inside
 * will NOT emit the default [API …] debug log (the query
 * layer prints its own log instead).
 *
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withQueryLog(fn) {
    _queryLogDepth++;
    try {
        return await fn();
    } finally {
        _queryLogDepth--;
    }
}

/**
 * @returns {boolean} True when inside a withQueryLog callback
 */
export function isApiLogSuppressed() {
    return _queryLogDepth > 0;
}

export { AppDebug };
