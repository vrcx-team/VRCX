import { toast } from 'vue-sonner';

import { i18n } from '../plugin/i18n';
import { request } from '../service/request';
import { useInstanceStore } from '../stores';

const instanceReq = {
    /**
     * @type {import('../types/api/instance').GetInstance}
     */
    getInstance(params) {
        const instanceStore = useInstanceStore();
        return request(`instances/${params.worldId}:${params.instanceId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            args.ref = instanceStore.applyInstance(json);
            return args;
        });
    },

    /**
     * @param {{worldId: string, instanceId: string}} params
     * @returns {Promise<{json: any, ref: any, cache?: boolean, params}>}
     */
    getCachedInstance(params) {
        const instanceStore = useInstanceStore();
        return new Promise((resolve, reject) => {
            const ref = instanceStore.cachedInstances.get(
                `${params.worldId}:${params.instanceId}`
            );
            if (typeof ref === 'undefined') {
                instanceReq
                    .getInstance(params)
                    .then((args) => {
                        args.ref = instanceStore.applyInstance(args.json);
                        resolve(args);
                    })
                    .catch(reject);
            } else {
                resolve({
                    cache: true,
                    json: ref,
                    params,
                    ref
                });
            }
        });
    },

    /**
     * @type {import('../types/api/instance').CreateInstance}
     */
    createInstance(params) {
        const instanceStore = useInstanceStore();
        return request('instances', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            args.ref = instanceStore.applyInstance(json);
            return args;
        });
    },

    /**
     * @type {import('../types/api/instance').GetInstanceShortName}
     */
    getInstanceShortName(instance) {
        const params = {};
        if (instance.shortName) {
            params.shortName = instance.shortName;
        }
        return request(
            `instances/${instance.worldId}:${instance.instanceId}/shortName`,
            {
                method: 'GET',
                params
            }
        ).then((json) => {
            const args = {
                json,
                instance,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ shortName: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getInstanceFromShortName(params) {
        const instanceStore = useInstanceStore();
        return request(`instances/s/${params.shortName}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            args.ref = instanceStore.applyInstance(json);
            return args;
        });
    },

    /**
     * Send invite to current user.
     * @param {{ worldId: string, instanceId: string, shortName?: string }} instance
     * @returns {Promise<{instance, json: any, params}>}
     */
    selfInvite(instance) {
        /**
         * @type {{ shortName?: string }}
         */
        const params = {};
        if (instance.shortName) {
            params.shortName = instance.shortName;
        }
        return request(
            `invite/myself/to/${instance.worldId}:${instance.instanceId}`,
            {
                method: 'POST',
                params
            }
        )
            .then((json) => {
                return {
                    json,
                    instance,
                    params
                };
            })
            .catch((err) => {
                if (err?.error?.message) {
                    toast.error(err.error.message);
                    throw err;
                }
                toast.error(i18n.global.t('message.instance.not_allowed'));
                throw err;
            });
    }
};

export default instanceReq;
