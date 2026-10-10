import type { Instance, InstanceShortNameResponse, SentNotification } from 'vrchat';
import type { Json } from '../types/vrcx';
import { toast } from 'vue-sonner';

import { i18n } from '../plugins/i18n';
import { request } from '../services/request';
import { useInstanceStore } from '../stores';

const instanceReq = {
    getInstance(params: {
        worldId: string;
        instanceId: string;
    }): Promise<{ json: Json<Instance>; ref: Json<Instance>; params: { worldId: string; instanceId: string } }> {
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

    createInstance(params: any): Promise<{ json: Json<Instance>; params: any }> {
        const instanceStore = useInstanceStore();
        return request('instances', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                ref: instanceStore.applyInstance(json)
            };
            return args;
        });
    },

    getInstanceShortName(instance: { worldId: string; instanceId: string; shortName?: string }): Promise<{
        json: Json<InstanceShortNameResponse>;
        instance: { worldId: string; instanceId: string };
        params?: { shortName?: string };
    }> {
        const params: { shortName?: string } = {};
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

    getInstanceFromShortName(params: { shortName: string }): Promise<{ json: Json<Instance>; params }> {
        const instanceStore = useInstanceStore();
        return request(`instances/s/${params.shortName}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params,
                ref: instanceStore.applyInstance(json)
            };
            return args;
        });
    },

    selfInvite(instance: {
        worldId: string;
        instanceId: string;
        shortName?: string;
    }): Promise<{ instance; json: Json<SentNotification>; params }> {
        const params: { shortName?: string } = {};
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

    instanceAnnouncement(params: {
        location: string;
        title: string;
        message: string;
        imageId?: string;
        imageVersion?: string;
    }): Promise<{
        json: any;
        params: { location: string; title: string; message: string; imageId?: string; imageVersion?: string };
    }> {
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
