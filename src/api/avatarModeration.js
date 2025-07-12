import { request } from '../service/request';

const avatarModerationReq = {
    getAvatarModerations() {
        return request('auth/user/avatarmoderations', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    /**
     * @param {{ avatarModerationType: string, targetAvatarId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    sendAvatarModeration(params) {
        return request('auth/user/avatarmoderations', {
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
     * @param {{ avatarModerationType: string, targetAvatarId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    deleteAvatarModeration(params) {
        return request(
            `auth/user/avatarmoderations?targetAvatarId=${encodeURIComponent(
                params.targetAvatarId
            )}&avatarModerationType=${encodeURIComponent(
                params.avatarModerationType
            )}`,
            {
                method: 'DELETE'
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

export default avatarModerationReq;
