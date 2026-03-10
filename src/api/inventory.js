import { queryClient } from '../queries';
import { request } from '../services/request';

/**
 *
 */
function refetchActiveInventoryQueries() {
    queryClient
        .invalidateQueries({
            queryKey: ['inventory'],
            refetchType: 'active'
        })
        .catch((err) => {
            console.error('Failed to refresh inventory queries:', err);
        });
}

const inventoryReq = {
    /**
     * @param {{ inventoryId: string, userId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getUserInventoryItem(params) {
        return request(
            `user/${params.userId}/inventory/${params.inventoryId}`,
            {
                method: 'GET'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ inventoryId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getInventoryItem(params) {
        return request(`inventory/${params.inventoryId}`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ n: number, offset: number, order: string, types?: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getInventoryItems(params) {
        return request('inventory', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ inventoryId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    consumeInventoryBundle(params) {
        return request(`inventory/${params.inventoryId}/consume`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveInventoryQueries();
            return args;
        });
    },

    /**
     * @param {{ inventoryTemplateId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getInventoryTemplate(params) {
        return request(`inventory/template/${params.inventoryTemplateId}`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ code: string }} params
     * @returns {Promise<{json: any, params}>}
     * Note: Do not redeem
     */
    redeemReward(params) {
        return request('reward/redeem', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveInventoryQueries();
            return args;
        });
    }
};

export default inventoryReq;
