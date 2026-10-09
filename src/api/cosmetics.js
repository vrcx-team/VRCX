import { request } from '../services/request';

const cosmeticsReq = {
    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').InventoryTemplate[]> }>}
     */
    getProfileEffects() {
        return request('cosmetics/index/profileEffect', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').InventoryTemplate[]> }>}
     */
    getIconFrames() {
        return request('cosmetics/index/iconFrame', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').InventoryTemplate[]> }>}
     */
    getNameplateEffects() {
        return request('cosmetics/index/nameplateEffect', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    }
};

export default cosmeticsReq;
