// #region | API: AvatarModeration

const avatarModerationReq = {
    getAvatarModerations() {
        return window.API.call('auth/user/avatarmoderations', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            window.API.$emit('AVATAR-MODERATION:LIST', args);
            return args;
        });
    },

    /**
     * @param {{ avatarModerationType: string, targetAvatarId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    sendAvatarModeration(params) {
        return window.API.call('auth/user/avatarmoderations', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('AVATAR-MODERATION', args);
            return args;
        });
    },

    /**
     * @param {{ avatarModerationType: string, targetAvatarId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    deleteAvatarModeration(params) {
        return window.API.call(
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
            window.API.$emit('AVATAR-MODERATION:DELETE', args);
            return args;
        });
    }
};

// #endregion
export default avatarModerationReq;
