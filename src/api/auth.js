import { request } from '../services/request';
import { handleConfig } from '../coordinators/userCoordinator';

const loginReq = {
    /**
     * @param {import('vrchat').TwoFactorAuthCode} params One-time password
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Verify2FaResult>;
     *     params: import('vrchat').TwoFactorAuthCode;
     * }>}
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
     * @param {import('vrchat').TwoFactorAuthCode} params One-time token
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Verify2FaResult>;
     *     params: import('vrchat').TwoFactorAuthCode;
     * }>}
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
     * @param {import('vrchat').TwoFactorEmailCode} params One-time token
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Verify2FaEmailCodeResult>;
     *     params: import('vrchat').TwoFactorEmailCode;
     * }>}
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
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').ApiConfig> }>}
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
    },

    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Permission[]> }>}
     */
    getPermissions() {
        return request('auth/permissions', {
            method: 'GET',
            params: { condensed: true }
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    }
};

export default loginReq;
