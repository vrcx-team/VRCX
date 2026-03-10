import { request } from '../services/request';
import { handleConfig } from '../coordinators/userCoordinator';

const loginReq = {
    /**
     * @param {{ code: string }} params One-time password
     * @returns {Promise<{json: any, params: { code: string }}>}
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
     * @returns {Promise<{json: any, params: { code: string }}>}
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
     * @returns {Promise<{json: any, params: { code: string }}>}
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

    /**
     * @returns {Promise<{json: any}>}
     */
    getConfig() {
        return request('config', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            handleConfig(args);
            return args;
        });
    }
};

export default loginReq;
