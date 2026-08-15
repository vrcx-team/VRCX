import { request } from '../services/request';

const cosmeticsReq = {
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

    gatNameplateEffects() {
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
