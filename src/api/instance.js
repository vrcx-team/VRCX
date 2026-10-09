import { toast } from 'vue-sonner';

import { i18n } from '../plugins/i18n';
import { request } from '../services/request';
import { useInstanceStore } from '../stores';

const instanceReq = {
    /**
     * @param {{ worldId: string; instanceId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Instance>;
     *     ref: import('@/types/vrcx').Json<import('vrchat').Instance>;
     *     params: { worldId: string; instanceId: string };
     * }>}
     */
    getInstance(params) {
        const instanceStore = useInstanceStore();
        return request(`instances/${params.worldId}:${params.instanceId}`, {
            method: 'GET'
        }).then((json) => {
            return {
                json,
                params,
                ref: instanceStore.applyInstance(json)
            };
        });
    },

    /**
     * @param {any} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Instance>; params: any }>}
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
     * @param {{ worldId: string; instanceId: string; shortName?: string }} instance
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').InstanceShortNameResponse>;
     *     instance: { worldId: string; instanceId: string };
     *     params?: { shortName?: string };
     * }>}
     */
    getInstanceShortName(instance) {
        const params = {};
        if (instance.shortName) {
            params.shortName = instance.shortName;
        }
        return request(`instances/${instance.worldId}:${instance.instanceId}/shortName`, {
            method: 'GET',
            params
        }).then((json) => {
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
     * @returns {Promise<{ json: any; params }>}
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
     *
     * @param {{ worldId: string; instanceId: string; shortName?: string }} instance
     * @returns {Promise<{ instance; json: any; params }>}
     */
    selfInvite(instance) {
        /**
         * @type {{ shortName?: string }}
         */
        const params = {};
        if (instance.shortName) {
            params.shortName = instance.shortName;
        }
        return request(`invite/myself/to/${instance.worldId}:${instance.instanceId}`, {
            method: 'POST',
            params
        })
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
    },

    /**
     * Send instance announcement
     *
     * @param {{ location: string; title: string; message: string; imageId?: string; imageVersion?: string }} params
     * @returns {Promise<{
     *     json: any;
     *     params: { location: string; title: string; message: string; imageId?: string; imageVersion?: string };
     * }>}
     */
    instanceAnnouncement(params) {
        return request(`instances/${params.location}/announce`, {
            method: 'POST',
            params
        }).then((json) => {
            return {
                json,
                params
            };
        });
    }
};

export default instanceReq;
