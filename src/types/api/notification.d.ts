// Exported API functions
export type GetNotifications = (params: {
    n: number;
    offset: number;
    sent: boolean;
    type: string;
    after: 'five_minutes_ago' | string;
}) => Promise<{
    json: NotificationResponse[];
    params: any;
}>;

export type GetHiddenFriendRequests = (params: {
    n?: number;
    offset?: number;
}) => Promise<{
    json: NotificationResponse[];
    params: any;
}>;

export type GetNotificationsV2 = (params: {
    n?: number;
    offset?: number;
    type?: string;
}) => Promise<{
    json: NotificationResponse[];
    params: any;
}>;

export type SendNotification = (params: {
    receiverUserId: string;
    type: string;
    message: string;
    seen: boolean;
    details: string;
}) => Promise<{
    json: NotificationResponse;
    params: any;
}>;

// Exported interfaces
export interface NotificationResponse {
    id: string;
    type: string;
    senderUserId: string;
    receiverUserId: string;
    message: string;
    details: any;
    seen: boolean;
    created_at: string;
    [key: string]: any;
}
