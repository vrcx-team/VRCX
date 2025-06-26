const inventoryReq = {
    /**
     * @param {{ inventoryId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getInventoryItem(params) {
        return window.API.call(`inventory/${params.inventoryId}`, {
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
     * @param {{ n: number, offset: number, order: string, types: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getInventoryItems(params) {
        return window.API.call('inventory', {
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
        return window.API.call(`inventory/${params.inventoryId}/consume`, {
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
     * @param {{ inventoryTemplateId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getInventoryTemplate(params) {
        return window.API.call(
            `inventory/template/${params.inventoryTemplateId}`,
            {
                method: 'GET',
                params
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }
};

export default inventoryReq;
