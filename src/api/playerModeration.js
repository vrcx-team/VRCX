// #region | API: PlayerModeration

const playerModerationReq = {
    getPlayerModerations() {
        return window.API.call('auth/user/playermoderations', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            window.API.$emit('PLAYER-MODERATION:LIST', args);
            return args;
        });
    },

    /**
     * @param {{ moderated: string, type: string }} params
     * @return { Promise<{json: any, params}> }
     */
    // old-way: POST auth/user/blocks {blocked:userId}
    sendPlayerModeration(params) {
        return window.API.call('auth/user/playermoderations', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('PLAYER-MODERATION:SEND', args);
            return args;
        });
    },

    /**
     * @param {{ moderated: string, type: string }} params
     * @return { Promise<{json: any, params}> }
     */
    // old-way: PUT auth/user/unblocks {blocked:userId}
    deletePlayerModeration(params) {
        return window.API.call('auth/user/unplayermoderate', {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('PLAYER-MODERATION:DELETE', args);
            return args;
        });
    }
};

// #endregion
export default playerModerationReq;
