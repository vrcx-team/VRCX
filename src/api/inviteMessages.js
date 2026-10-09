import { request } from '../services/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

const inviteMessagesReq = {
    /**
     * @param {import('vrchat').InviteMessageType} messageType
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').InviteMessage[]>;
     *     messageType: import('vrchat').InviteMessageType;
     * }>}
     */
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

    /**
     * @param {import('vrchat').UpdateInviteMessageRequest} params
     * @param {import('vrchat').InviteMessageType} messageType
     * @param {number} slot
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').InviteMessage[]>;
     *     params: import('vrchat').UpdateInviteMessageRequest;
     *     messageType: import('vrchat').InviteMessageType;
     *     slot: number;
     * }>}
     */
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
