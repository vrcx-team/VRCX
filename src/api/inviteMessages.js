import { request } from '../service/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

const inviteMessagesReq = {
    refreshInviteMessageTableData(messageType) {
        return request(`message/${getCurrentUserId()}/${messageType}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                messageType
            };
            return args;
        });
    },

    editInviteMessage(params, messageType, slot) {
        return request(`message/${getCurrentUserId()}/${messageType}/${slot}`, {
            method: 'PUT',
            params
        }).then((json) => {
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

export default inviteMessagesReq;
