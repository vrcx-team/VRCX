import type { InviteMessage, InviteMessageType, UpdateInviteMessageRequest } from 'vrchat';
import type { Json } from '../types/vrcx';
import { request } from '../services/request';
import { useUserStore } from '../stores';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

const inviteMessagesReq = {
    refreshInviteMessageTableData(
        messageType: InviteMessageType
    ): Promise<{ json: Json<InviteMessage[]>; messageType: InviteMessageType }> {
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

    editInviteMessage(
        params: UpdateInviteMessageRequest,
        messageType: InviteMessageType,
        slot: number
    ): Promise<{
        json: Json<InviteMessage[]>;
        params: UpdateInviteMessageRequest;
        messageType: InviteMessageType;
        slot: number;
    }> {
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
