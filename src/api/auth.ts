import type {
    ApiConfig,
    Permission,
    TwoFactorAuthCode,
    TwoFactorEmailCode,
    Verify2FaEmailCodeResult,
    Verify2FaResult
} from 'vrchat';
import type { Json } from '../types/vrcx';
import { request } from '../services/request';
import { handleConfig } from '../coordinators/userCoordinator';

const loginReq = {
    verifyOTP(params: TwoFactorAuthCode): Promise<{ json: Json<Verify2FaResult>; params: TwoFactorAuthCode }> {
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

    verifyTOTP(params: TwoFactorAuthCode): Promise<{ json: Json<Verify2FaResult>; params: TwoFactorAuthCode }> {
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

    verifyEmailOTP(
        params: TwoFactorEmailCode
    ): Promise<{ json: Json<Verify2FaEmailCodeResult>; params: TwoFactorEmailCode }> {
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

    getConfig(): Promise<{ json: Json<ApiConfig> }> {
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

    getPermissions(): Promise<{ json: Json<Permission[]> }> {
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
