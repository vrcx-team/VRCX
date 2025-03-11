// #region | App: Invite Messages

const inviteMessagesReq = {
    refreshInviteMessageTableData(messageType) {
        return window.API.call(
            `message/${window.API.currentUser.id}/${messageType}`,
            {
                method: 'GET'
            }
        ).then((json) => {
            const args = {
                json,
                messageType
            };
            window.API.$emit(`INVITE:${messageType.toUpperCase()}`, args);
            return args;
        });
    },

    editInviteMessage(params, messageType, slot) {
        return window.API.call(
            `message/${window.API.currentUser.id}/${messageType}/${slot}`,
            {
                method: 'PUT',
                params
            }
        ).then((json) => {
            const args = {
                json,
                params,
                messageType,
                slot
            };
            return args;
        });
    }
};

// #endregion

export default inviteMessagesReq;
