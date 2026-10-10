import type {
    GetNotifications,
    InviteRequest,
    InviteResponse,
    Notification,
    NotificationV2,
    RequestInviteRequest,
    RespondNotificationV2Request,
    SentNotification,
    Success
} from 'vrchat';
import type { Json } from '../types/vrcx';
import { request } from '../services/request';
import { useGalleryStore } from '../stores';

const notificationReq = {
    getNotifications(
        params: GetNotifications['query']
    ): Promise<{ json: Json<Notification[]>; params: GetNotifications['query'] }> {
        return request('auth/user/notifications', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };

            return args;
        });
    },

    getHiddenFriendRequests(
        params: GetNotifications['query']
    ): Promise<{ json: Json<Notification[]>; params: GetNotifications['query'] }> {
        return request('auth/user/notifications', {
            method: 'GET',
            params: {
                type: 'friendRequest',
                hidden: true,
                ...params
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    getNotificationsV2(params: {
        n?: number;
        offset?: number;
        type?: string;
    }): Promise<{ json: Json<NotificationV2[]>; params: any }> {
        return request('notifications', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    sendInvite(
        params: InviteRequest & { worldId?: string; worldName?: string; rsvp?: boolean },
        receiverUserId: string
    ): Promise<{
        json: Json<SentNotification>;
        params: InviteRequest & { worldId?: string; worldName?: string; rsvp?: boolean };
        receiverUserId: string;
    }> {
        return request(`invite/${receiverUserId}`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            return args;
        });
    },
    sendInvitePhoto(
        params: InviteRequest & { worldId?: string; worldName?: string; rsvp?: boolean },
        receiverUserId: string
    ): Promise<{
        json: Json<SentNotification>;
        params: InviteRequest & { worldId?: string; worldName?: string; rsvp?: boolean };
        receiverUserId: string;
    }> {
        return request(`invite/${receiverUserId}/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: useGalleryStore().uploadImage
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            return args;
        });
    },

    sendRequestInvite(
        params: RequestInviteRequest & { platform?: string },
        receiverUserId: string
    ): Promise<{
        json: Json<Notification>;
        params: RequestInviteRequest & { platform?: string };
        receiverUserId: string;
    }> {
        return request(`requestInvite/${receiverUserId}`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            return args;
        });
    },

    sendRequestInvitePhoto(
        params: RequestInviteRequest & { platform?: string },
        receiverUserId: string
    ): Promise<{
        json: Json<Notification>;
        params: RequestInviteRequest & { platform?: string };
        receiverUserId: string;
    }> {
        return request(`requestInvite/${receiverUserId}/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: useGalleryStore().uploadImage
        }).then((json) => {
            const args = {
                json,
                params,
                receiverUserId
            };
            return args;
        });
    },

    sendInviteResponse(
        params: InviteResponse,
        inviteId: string
    ): Promise<{ json: Json<Notification>; params: InviteResponse; inviteId: string }> {
        return request(`invite/${inviteId}/response`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                inviteId
            };
            return args;
        });
    },

    sendInviteResponsePhoto(
        params: InviteResponse,
        inviteId: string
    ): Promise<{ json: Json<Notification>; params: InviteResponse; inviteId: string }> {
        return request(`invite/${inviteId}/response/photo`, {
            uploadImageLegacy: true,
            postData: JSON.stringify(params),
            imageData: useGalleryStore().uploadImage,
            inviteId
        }).then((json) => {
            const args = {
                json,
                params,
                inviteId
            };
            return args;
        });
    },

    acceptFriendRequestNotification(params: { notificationId: string }): Promise<{ json: Json<Success>; params }> {
        return request(`auth/user/notifications/${params.notificationId}/accept`, {
            method: 'PUT'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    hideNotification(params: { notificationId: string }): Promise<{ json: Json<Success>; params }> {
        return request(`auth/user/notifications/${params.notificationId}/hide`, {
            method: 'PUT'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    seeNotification(params: { notificationId: string }): Promise<{ json: Json<Notification>; params }> {
        return request(`auth/user/notifications/${params.notificationId}/see`, {
            method: 'PUT'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    seeNotificationV2(params: { notificationId: string }): Promise<{ json: Json<NotificationV2>; params }> {
        return request(`notifications/${params.notificationId}/see`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    sendNotificationResponse(
        params: { notificationId: string } & RespondNotificationV2Request
    ): Promise<{ json: string; params: { notificationId: string } & RespondNotificationV2Request }> {
        return request(`notifications/${params.notificationId}/respond`, {
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

    hideNotificationV2(notificationId: string): Promise<{ json: Json<Success>; params: { notificationId: string } }> {
        return request(`notifications/${notificationId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params: {
                    notificationId
                }
            };
            return args;
        });
    }
};

export default notificationReq;
