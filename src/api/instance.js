import { $app } from '../app';
import { t } from '../plugin';
import { API } from '../service/eventBus';
import { request } from '../service/request';

const instanceReq = {
    /**
     * @param {{worldId: string, instanceId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    getInstance(params) {
        return request(`instances/${params.worldId}:${params.instanceId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('INSTANCE', args);
            return args;
        });
    },

    /**
     * CreateInstanceParameter
     * @typedef {Object} CreateInstanceParameter
     * @property {string} worldId
     * @property {string} type
     * @property {string} region
     * @property {string} ownerId
     * @property {string[]} roleIds
     * @property {string} groupAccessType
     * @property {boolean} queueEnabled
     */
    /**
     * @param {CreateInstanceParameter} params
     * @returns {Promise<{json: any, params}>}
     */
    createInstance(params) {
        return request('instances', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('INSTANCE', args);
            return args;
        });
    },

    /**
     * @param {{ worldId: string, instanceId: string, shortName: string }} instance
     * @returns {Promise<{instance, json: T, params: {}}>}
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
        return request(`instances/s/${params.shortName}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('INSTANCE', args);
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
                    $app.$message({
                        message: err.error.message,
                        type: 'error'
                    });
                    throw err;
                }
                $app.$message({
                    message: t('message.instance.not_allowed'),
                    type: 'error'
                });
                throw err;
            });
    }
};

export default instanceReq;
