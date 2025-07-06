import Noty from 'noty';
import { $app } from '../app.js';
import { t } from '../plugin';
import { statusCodes } from '../shared/constants/api.js';
import { escapeTag } from '../shared/utils';
import {
    useAuthStore,
    useAvatarStore,
    useNotificationStore,
    useUpdateLoopStore,
    useUserStore
} from '../stores';
import { API } from './eventBus.js';
import webApiService from './webapi.js';

API.endpointDomainVrchat = 'https://api.vrchat.cloud/api/1';
API.websocketDomainVrchat = 'wss://pipeline.vrchat.cloud';
API.endpointDomain = 'https://api.vrchat.cloud/api/1';
API.websocketDomain = 'wss://pipeline.vrchat.cloud';

const pendingGetRequests = new Map();
export let failedGetRequests = new Map();

/**
 * @param {string} endpoint
 * @param {RequestOptions} options
 * @returns {Promise<any>}
 */
export function request(endpoint, options) {
    const userStore = useUserStore();
    const avatarStore = useAvatarStore();
    const authStore = useAuthStore();
    const notificationStore = useNotificationStore();
    const updateLoopStore = useUpdateLoopStore();
    let req;
    const init = {
        url: `${API.endpointDomain}/${endpoint}`,
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
                    0,
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
            if (!response.data) {
                if (API.debugWebRequests) {
                    console.log(init, response, 'no data');
                }
                return response;
            }
            try {
                response.data = JSON.parse(response.data);
                if (API.debugWebRequests) {
                    console.log(init, response.data, 'parsed data');
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
                $app.$alert(
                    t('api.error.message.vpn_in_use'),
                    `403 ${t('api.error.message.login_error')}`
                );
                API.$emit('LOGOUT');
                $throw(403, endpoint);
            }
            if (
                init.method === 'GET' &&
                status === 404 &&
                endpoint.startsWith('avatars/')
            ) {
                $app.$message({
                    message: t('message.api_handler.avatar_private_or_deleted'),
                    type: 'error'
                });
                avatarStore.avatarDialog.visible = false;
                $throw(404, data.error?.message || '', endpoint);
            }
            if (status === 404 && endpoint.endsWith('/persist/exists')) {
                return false;
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
    let text = [];
    if (code > 0) {
        const status = statusCodes[code];
        if (typeof status === 'undefined') {
            text.push(`${code}`);
        } else {
            const codeText = t(`api.status_code.${code}`);
            text.push(`${code} ${codeText}`);
        }
    }
    if (typeof error !== 'undefined') {
        text.push(
            `${t('api.error.message.error_message')}: ${typeof error === 'string' ? error : JSON.stringify(error)}`
        );
    }
    if (typeof endpoint !== 'undefined') {
        text.push(
            `${t('api.error.message.endpoint')}: "${typeof endpoint === 'string' ? endpoint : JSON.stringify(endpoint)}"`
        );
    }
    text = text.map((s) => escapeTag(s)).join('<br>');
    if (text.length) {
        if (API.errorNoty) {
            API.errorNoty.close();
        }
        API.errorNoty = new Noty({
            type: 'error',
            text
        });
        API.errorNoty.show();
    }
    const e = new Error(text);
    e.status = code;
    e.endpoint = endpoint;
    throw e;
}

/**
 * Processes data in bulk by making paginated requests until all data is fetched or limits are reached.
 *
 * `API.bulk`の代わり
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
            const batchSize = result.json.length;

            if (typeof handle === 'function') {
                handle(result);
            }
            if (batchSize === 0) {
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

API.$bulk = function (options, args) {
    if ('handle' in options) {
        options.handle.call(this, args, options);
    }
    if (
        args.json.length > 0 &&
        ((options.params.offset += args.json.length),
        options.N > 0
            ? options.N > options.params.offset
            : options.N < 0
              ? args.json.length
              : options.params.n === args.json.length)
    ) {
        API.bulk(options);
    } else if ('done' in options) {
        options.done.call(this, true, options);
    }
    return args;
};

API.bulk = function (options) {
    if (typeof options.fn === 'function') {
        options
            .fn(options.params)
            .catch((err) => {
                if ('done' in options) {
                    options.done.call(this, false, options);
                }
                throw err;
            })
            .then((args) => API.$bulk(options, args));
    } else {
        this[options.fn](options.params)
            .catch((err) => {
                if ('done' in options) {
                    options.done.call(this, false, options);
                }
                throw err;
            })
            .then((args) => API.$bulk(options, args));
    }
};
