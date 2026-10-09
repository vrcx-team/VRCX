import { request } from '../services/request';

const avatarModerationReq = {
    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').AvatarModeration[]> }>}
     */
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
     * @param {import('vrchat').CreateAvatarModerationRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').AvatarModerationCreated>;
     *     params: import('vrchat').CreateAvatarModerationRequest;
     * }>}
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
     * @param {import('vrchat').DeleteGlobalAvatarModeration['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').OkStatus2>;
     *     params: import('vrchat').DeleteGlobalAvatarModeration['query'];
     * }>}
     */
    deleteAvatarModeration(params) {
        return request(
            `auth/user/avatarmoderations?targetAvatarId=${encodeURIComponent(
                params.targetAvatarId
            )}&avatarModerationType=${encodeURIComponent(params.avatarModerationType)}`,
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
