import { queryClient } from '../queries';
import { request } from '../services/request';

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
     * @param {{ inventoryId: string; userId: string; flags }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').InventoryItem>; params }>}
     */
    getUserInventoryItem(params) {
        return request(`user/${params.userId}/inventory/${params.inventoryId}`, {
            method: 'GET'
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
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').InventoryItem>; params }>}
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
     * @param {import('vrchat').GetInventory['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Inventory>;
     *     params: import('vrchat').GetInventory['query'];
     * }>}
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
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').InventoryConsumptionResults>; params }>}
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
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').InventoryTemplate>; params }>}
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
     * @param {import('vrchat').RewardRedemptionRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').RewardRedemptionResult[]>;
     *     params: import('vrchat').RewardRedemptionRequest;
     * }>}
     *   Note: Do not redeem
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
    },

    /**
     * @returns {Promise<{ json: any; params }>}
     */
    getGlobalInventory() {
        return request('inventory/global', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params: {}
            };
            return args;
        });
    },

    /**
     * @param {import('vrchat').GetInventory['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Inventory>;
     *     params: import('vrchat').GetInventory['query'];
     * }>}
     */
    getEquipSlot(params) {
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
     * @param {{ inventoryId: string } & import('vrchat').EquipInventoryItemRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').InventoryItem>;
     *     params: { inventoryId: string } & import('vrchat').EquipInventoryItemRequest;
     * }>}
     */
    equipItem(params) {
        return request(`inventory/${params.inventoryId}/equip`, {
            method: 'PUT',
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
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').InventoryItem>;
     *     params: { inventoryId: string };
     * }>}
     */
    archiveItem(params) {
        return request(`inventory/${params.inventoryId}`, {
            method: 'PUT',
            params: {
                isArchived: true
            }
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
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').InventoryItem>;
     *     params: { inventoryId: string };
     * }>}
     */
    unArchiveItem(params) {
        return request(`inventory/${params.inventoryId}`, {
            method: 'PUT',
            params: {
                isArchived: false
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default inventoryReq;
