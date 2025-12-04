import { ElMessage, ElMessageBox } from 'element-plus';

import Noty from 'noty';

import {
    useAuthStore,
    useAvatarStore,
    useNotificationStore,
    useUpdateLoopStore,
    useUserStore
} from '../stores';
import { AppDebug } from './appConfig.js';
import { escapeTag } from '../shared/utils';
import { i18n } from '../plugin/i18n';
import { statusCodes } from '../shared/constants/api.js';
import { watchState } from './watchState';

import webApiService from './webapi.js';

const pendingGetRequests = new Map();
export let failedGetRequests = new Map();

const t = i18n.global.t;

/**
 * @template T
 * @param {string} endpoint
 * @param {RequestInit & { params?: any }} [options]
 * @returns {Promise<T>}
 */
export function request(endpoint, options) {
    const userStore = useUserStore();
    const avatarStore = useAvatarStore();
    const authStore = useAuthStore();
    const notificationStore = useNotificationStore();
    const updateLoopStore = useUpdateLoopStore();
    if (
        !watchState.isLoggedIn &&
        endpoint.startsWith('/auth') &&
        endpoint !== 'config'
    ) {
        throw `API request blocked while logged out: ${endpoint}`;
    }
    let req;
    const init = {
        url: `${AppDebug.endpointDomain}/${endpoint}`,
        method: 'GET',
        ...options
    };
    const { params } = init;
    if (init.method === 'GET') {
        // don't retry recent 404/403
        if (failedGetRequests.has(endpoint)) {
            const lastRun = failedGetRequests.get(endpoint);
            if (lastRun >= Date.now() - 900000) {
                // 15mins
                $throw(
                    -1,
                    t('api.error.message.403_404_bailing_request'),
                    endpoint
                );
            }
            failedGetRequests.delete(endpoint);
        }
        // transform body to url
        if (params === Object(params)) {
            const url = new URL(init.url);
            const { searchParams } = url;
            for (const key in params) {
                searchParams.set(key, params[key]);
            }
            init.url = url.toString();
        }
        // merge requests
        req = pendingGetRequests.get(init.url);
        if (typeof req !== 'undefined') {
            if (req.time >= Date.now() - 10000) {
                // 10s
                return req.req;
            }
            pendingGetRequests.delete(init.url);
        }
    } else if (
        init.uploadImage ||
        init.uploadFilePUT ||
        init.uploadImageLegacy
    ) {
        // nothing
    } else {
        init.headers = {
            'Content-Type': 'application/json;charset=utf-8',
            ...init.headers
        };
        init.body = params === Object(params) ? JSON.stringify(params) : '{}';
    }
    req = webApiService
        .execute(init)
        .catch((err) => {
            $throw(0, err, endpoint);
        })
        .then((response) => {
            if (
                !watchState.isLoggedIn &&
                endpoint.startsWith('/auth') &&
                endpoint !== 'config'
            ) {
                throw `API request blocked while logged out: ${endpoint}`;
            }
            if (!response.data) {
                if (AppDebug.debugWebRequests) {
                    console.log(init, 'no data', response);
                }
                return response;
            }
            try {
                response.data = JSON.parse(response.data);
                if (AppDebug.debugWebRequests) {
                    console.log(init, 'parsed data', response.data);
                }
                return response;
            } catch (e) {
                console.error(e);
            }
            if (response.status === 200) {
                $throw(
                    0,
                    t('api.error.message.invalid_json_response'),
                    endpoint
                );
            }
            if (
                response.status === 429 &&
                init.url.endsWith('/instances/groups')
            ) {
                updateLoopStore.nextGroupInstanceRefresh = 120; // 1min
                $throw(429, t('api.status_code.429'), endpoint);
            }
            if (response.status === 504 || response.status === 502) {
                // ignore expected API errors
                $throw(response.status, response.data || '', endpoint);
            }
            $throw(
                response.status,
                response.data || response.statusText,
                endpoint
            );
        })
        .then(({ data, status }) => {
            if (status === 200) {
                if (!data) {
                    return data;
                }
                let text = '';
                if (data.success === Object(data.success)) {
                    text = data.success.message;
                } else if (data.OK === String(data.OK)) {
                    text = data.OK;
                }
                if (text) {
                    new Noty({
                        type: 'success',
                        text: escapeTag(text)
                    }).show();
                }
                return data;
            }
            if (status === 401) {
                if (data.error?.message === '"Missing Credentials"') {
                    authStore.handleAutoLogin();
                    $throw(
                        401,
                        t('api.error.message.missing_credentials'),
                        endpoint
                    );
                } else if (
                    data.error.message === '"Unauthorized"' &&
                    endpoint !== 'auth/user'
                ) {
                    // trigger 2FA dialog                }
                    if (!authStore.twoFactorAuthDialogVisible) {
                        userStore.getCurrentUser();
                    }
                    $throw(401, t('api.status_code.401'), endpoint);
                }
            }
            if (status === 403 && endpoint === 'config') {
                ElMessageBox.alert(
                    t('api.error.message.vpn_in_use'),
                    `403 ${t('api.error.message.login_error')}`
                ).catch(() => {});
                authStore.handleLogoutEvent();
                $throw(403, endpoint);
            }
            if (
                init.method === 'GET' &&
                status === 404 &&
                endpoint.startsWith('avatars/')
            ) {
                ElMessage({
                    message: t('message.api_handler.avatar_private_or_deleted'),
                    type: 'error'
                });
                avatarStore.avatarDialog.visible = false;
                $throw(404, data.error?.message || '', endpoint);
            }
            if (status === 404 && endpoint.endsWith('/persist/exists')) {
                return false;
            }
            if (status === 404 && endpoint.endsWith('/respond')) {
                // ignore when responding to expired notification
                return null;
            }
            if (
                init.method === 'GET' &&
                (status === 404 || status === 403) &&
                !endpoint.startsWith('auth/user')
            ) {
                failedGetRequests.set(endpoint, Date.now());
            }
            if (
                init.method === 'GET' &&
                status === 404 &&
                endpoint.startsWith('users/') &&
                endpoint.split('/').length - 1 === 1
            ) {
                $throw(404, data.error?.message || '', endpoint);
            }
            if (
                status === 404 &&
                endpoint.startsWith('invite/') &&
                init.inviteId
            ) {
                notificationStore.expireNotification(init.inviteId);
            }
            if (status === 403 && endpoint.startsWith('invite/myself/to/')) {
                $throw(403, data.error?.message || '', endpoint);
            }
            if (data && data.error === Object(data.error)) {
                $throw(
                    data.error.status_code || status,
                    data.error.message,
                    endpoint
                );
            } else if (data && typeof data.error === 'string') {
                $throw(data.status_code || status, data.error, endpoint);
            }
            $throw(status, data, endpoint);
        });
    if (init.method === 'GET') {
        req.finally(() => {
            pendingGetRequests.delete(init.url);
        });
        pendingGetRequests.set(init.url, {
            req,
            time: Date.now()
        });
    }
    return req;
}

/**
 * @param {number} code
 * @param {string|object} [error]
 * @param {string} [endpoint]
 */
export function $throw(code, error, endpoint) {
    let message = [];
    if (code > 0) {
        const status = statusCodes[code];
        if (typeof status === 'undefined') {
            message.push(`${code}`);
        } else {
            const codeText = t(`api.status_code.${code}`);
            message.push(`${code} ${codeText}`);
        }
    }
    if (typeof error !== 'undefined') {
        message.push(
            `${t('api.error.message.error_message')}: ${typeof error === 'string' ? error : JSON.stringify(error)}`
        );
    }
    if (typeof endpoint !== 'undefined') {
        message.push(
            `${t('api.error.message.endpoint')}: "${typeof endpoint === 'string' ? endpoint : JSON.stringify(endpoint)}"`
        );
    }
    const text = message.map((s) => escapeTag(s)).join('<br>');
    let ignoreError = false;
    if (
        (code === 404 || code === -1) &&
        typeof endpoint === 'string' &&
        endpoint.split('/').length === 2 &&
        (endpoint.startsWith('users/') ||
            endpoint.startsWith('worlds/') ||
            endpoint.startsWith('avatars/') ||
            endpoint.startsWith('groups/') ||
            endpoint.startsWith('file/'))
    ) {
        ignoreError = true;
    }
    if (
        (code === 403 || code === 404 || code === -1) &&
        endpoint?.startsWith('instances/')
    ) {
        ignoreError = true;
    }
    if (endpoint?.startsWith('analysis/')) {
        ignoreError = true;
    }
    if (endpoint.endsWith('/mutuals') && (code === 403 || code === -1)) {
        ignoreError = true;
    }
    if (text.length && !ignoreError) {
        if (AppDebug.errorNoty) {
            AppDebug.errorNoty.close();
        }
        AppDebug.errorNoty = new Noty({
            type: 'error',
            text
        });
        AppDebug.errorNoty.show();
    }
    const e = new Error(text);
    e.status = code;
    e.endpoint = endpoint;
    throw e;
}

/**
 * Processes data in bulk by making paginated requests until all data is fetched or limits are reached.
 *
 * @async
 * @function processBulk
 * @param {object} options - Configuration options for bulk processing
 * @param {function} options.fn - The function to call for each batch request. Must return a result with a 'json' property containing an array
 * @param {object} [options.params={}] - Parameters to pass to the function. Will be modified to include pagination
 * @param {number} [options.N=-1] - Maximum number of items to fetch. -1 for unlimited, 0 for fetch until page size not met
 * @param {string} [options.limitParam='n'] - The parameter name used for page size in the request
 * @param {function} [options.handle] - Callback function to handle each batch result
 * @param {function} [options.done] - Callback function called when processing is complete. Receives boolean indicating success
 * @returns {Promise<void>} Promise that resolves when bulk processing is complete
 *
 * @example
 * await processBulk({
 *   fn: fetchUsers,
 *   params: { n: 50 },
 *   N: 200,
 *   handle: (result) => console.log(`Fetched ${result.json.length} users`),
 *   done: (success) => console.log(success ? 'Complete' : 'Failed')
 * });
 */
export async function processBulk(options) {
    const {
        fn,
        params: rawParams = {},
        N = -1,
        limitParam = 'n',
        handle,
        done
    } = options;

    if (typeof fn !== 'function') {
        return;
    }

    const params = { ...rawParams };
    if (typeof params.offset !== 'number') {
        params.offset = 0;
    }
    const pageSize = params[limitParam];

    let totalFetched = 0;

    try {
        while (true) {
            const result = await fn(params);
            let batchSize = 0;
            if (Array.isArray(result.json)) {
                batchSize = result.json.length;
            } else if (Array.isArray(result.results)) {
                batchSize = result.results.length;
            } else {
                throw new Error(
                    'Invalid result format: expected an array in result.json or result.results'
                );
            }

            if (typeof handle === 'function') {
                handle(result);
            }
            if (batchSize === 0) {
                break;
            }
            if (typeof result.hasNext === 'boolean' && !result.hasNext) {
                break;
            }

            if (N > 0) {
                totalFetched += batchSize;
                if (totalFetched >= N) {
                    break;
                }
            } else if (N === 0) {
                if (batchSize < pageSize) {
                    break;
                }
                totalFetched += batchSize;
            } else {
                totalFetched += batchSize;
            }
            params.offset += batchSize;
        }

        if (typeof done === 'function') {
            done(true);
        }
    } catch (err) {
        console.error('Bulk processing error:', err);
        if (typeof done === 'function') {
            done(false);
        }
    }
}
