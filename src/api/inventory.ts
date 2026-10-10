import type {
    EquipInventoryItemRequest,
    GetInventory,
    Inventory,
    InventoryConsumptionResults,
    InventoryItem,
    InventoryTemplate,
    RewardRedemptionRequest,
    RewardRedemptionResult
} from 'vrchat';
import type { Json } from '../types/vrcx';
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
    getUserInventoryItem(params: {
        inventoryId: string;
        userId: string;
        flags;
    }): Promise<{ json: Json<InventoryItem>; params }> {
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

    getInventoryItem(params: { inventoryId: string }): Promise<{ json: Json<InventoryItem>; params }> {
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

    getInventoryItems(
        params: GetInventory['query']
    ): Promise<{ json: Json<Inventory>; params: GetInventory['query'] }> {
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

    consumeInventoryBundle(params: {
        inventoryId: string;
    }): Promise<{ json: Json<InventoryConsumptionResults>; params }> {
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

    getInventoryTemplate(params: { inventoryTemplateId: string }): Promise<{ json: Json<InventoryTemplate>; params }> {
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

    redeemReward(
        params: RewardRedemptionRequest
    ): Promise<{ json: Json<RewardRedemptionResult[]>; params: RewardRedemptionRequest }> {
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

    getGlobalInventory(): Promise<{ json: any; params }> {
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

    getEquipSlot(params: GetInventory['query']): Promise<{ json: Json<Inventory>; params: GetInventory['query'] }> {
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

    equipItem(
        params: { inventoryId: string } & EquipInventoryItemRequest
    ): Promise<{ json: Json<InventoryItem>; params: { inventoryId: string } & EquipInventoryItemRequest }> {
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

    archiveItem(params: {
        inventoryId: string;
    }): Promise<{ json: Json<InventoryItem>; params: { inventoryId: string } }> {
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

    unArchiveItem(params: {
        inventoryId: string;
    }): Promise<{ json: Json<InventoryItem>; params: { inventoryId: string } }> {
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
