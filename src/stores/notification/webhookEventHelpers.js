export function getNotificationWebhookType(type) {
    const map = {
        friendRequest: 'friend_request',
        ignoredFriendRequest: 'friend_request',
        requestInvite: 'request_invite',
        invite: 'invite'
    };

    if (!type || typeof type !== 'string') {
        return '';
    }

    return (map[type] || type)
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\./g, '_')
        .toLowerCase();
}

export function buildNotificationWebhookPayload(ref) {
    if (!ref || typeof ref !== 'object') {
        return {
            id: '',
            type: '',
            webhookType: '',
            senderUserId: '',
            senderUsername: '',
            message: '',
            details: {},
            data: {},
            createdAt: '',
            version: 1,
            seen: false,
            expiresAt: ''
        };
    }

    const type = ref.type || '';
    return {
        id: ref.id || '',
        type,
        webhookType: getNotificationWebhookType(type),
        senderUserId: ref.senderUserId || '',
        senderUsername: ref.senderUsername || '',
        message: ref.message || '',
        details: ref.details || {},
        data: ref.data || {},
        createdAt: ref.created_at || ref.createdAt || '',
        version: ref.version || 1,
        seen: Boolean(ref.seen),
        expiresAt: ref.expiresAt || ''
    };
}
