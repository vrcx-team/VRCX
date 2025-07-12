import { request } from '../service/request';
import { useUserStore } from '../stores';

const loginReq = {
    /**
     * @param {{ code: string }} params One-time password
     * @returns {Promise<{json: any, params}>}
     */
    verifyOTP(params) {
        return request('auth/twofactorauth/otp/verify', {
            method: 'POST',
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
     * @param {{ code: string }} params One-time token
     * @returns {Promise<{json: any, params}>}
     */
    verifyTOTP(params) {
        return request('auth/twofactorauth/totp/verify', {
            method: 'POST',
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
     * @param {{ code: string }} params One-time token
     * @returns {Promise<{json: any, params}>}
     */
    verifyEmailOTP(params) {
        return request('auth/twofactorauth/emailotp/verify', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getConfig() {
        return request('config', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            useUserStore().handleConfig(args);
            return args;
        });
    }
};

export default loginReq;
