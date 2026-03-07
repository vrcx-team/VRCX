import { describe, expect, test } from 'vitest';

import {
    buildNotificationWebhookPayload,
    getNotificationWebhookType
} from '../webhookEventHelpers';

describe('notification webhook event helpers', () => {
    test('maps notification types to normalized webhook type', () => {
        expect(getNotificationWebhookType('friendRequest')).toBe(
            'friend_request'
        );
        expect(getNotificationWebhookType('requestInvite')).toBe(
            'request_invite'
        );
        expect(getNotificationWebhookType('group.queueReady')).toBe(
            'group_queue_ready'
        );
    });

    test('builds normalized webhook payload from notification row', () => {
        const payload = buildNotificationWebhookPayload({
            id: 'noty_1',
            type: 'friendRequest',
            senderUserId: 'usr_1',
            senderUsername: 'alice',
            message: 'hello',
            details: { foo: 'bar' },
            data: { x: 1 },
            created_at: '2026-03-07T00:00:00.000Z',
            version: 2,
            seen: false,
            expiresAt: ''
        });

        expect(payload).toEqual({
            id: 'noty_1',
            type: 'friendRequest',
            webhookType: 'friend_request',
            senderUserId: 'usr_1',
            senderUsername: 'alice',
            message: 'hello',
            details: { foo: 'bar' },
            data: { x: 1 },
            createdAt: '2026-03-07T00:00:00.000Z',
            version: 2,
            seen: false,
            expiresAt: ''
        });
    });
});
