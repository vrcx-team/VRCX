import { beforeEach, describe, expect, test, vi } from 'vitest';

globalThis.VERSION = 'test-version';

const configState = {
    enabled: false,
    url: '',
    token: '',
    events: '{}'
};

vi.mock('../config', () => ({
    default: {
        getBool: vi.fn(async (key, defaultValue) => {
            if (key === 'VRCX_eventExportEnabled') {
                return configState.enabled;
            }
            return defaultValue;
        }),
        getString: vi.fn(async (key, defaultValue) => {
            if (key === 'VRCX_eventExportWebhookUrl') {
                return configState.url;
            }
            if (key === 'VRCX_eventExportBearerToken') {
                return configState.token;
            }
            if (key === 'VRCX_eventExportEnabledEvents') {
                return configState.events;
            }
            return defaultValue;
        }),
        setBool: vi.fn(async (key, value) => {
            if (key === 'VRCX_eventExportEnabled') {
                configState.enabled = Boolean(value);
            }
        }),
        setString: vi.fn(async (key, value) => {
            if (key === 'VRCX_eventExportWebhookUrl') {
                configState.url = String(value);
            }
            if (key === 'VRCX_eventExportBearerToken') {
                configState.token = String(value);
            }
            if (key === 'VRCX_eventExportEnabledEvents') {
                configState.events = String(value);
            }
        })
    }
}));

import {
    configureWebhookEventExporter,
    emitWebhookEvent
} from '../webhookEvent';

describe('webhookEvent export gating', () => {
    beforeEach(async () => {
        configState.enabled = false;
        configState.url = '';
        configState.token = '';
        configState.events = '{}';
        globalThis.fetch = vi.fn(async () => ({ ok: true }));

        await configureWebhookEventExporter({
            enabled: true,
            webhookUrl: 'https://example.com/webhook',
            bearerToken: '',
            enabledEvents: {
                'friend.online': true,
                'notification.invite.received': true
            }
        });
    });

    test('does not send when event is disabled in event map', async () => {
        await configureWebhookEventExporter({
            enabled: true,
            webhookUrl: 'https://example.com/webhook',
            bearerToken: '',
            enabledEvents: {
                'friend.online': false
            }
        });

        const ok = await emitWebhookEvent('friend.online', { userId: 'usr_1' });

        expect(ok).toBe(false);
        expect(fetch).not.toHaveBeenCalled();
    });

    test('sends when event is enabled in event map', async () => {
        await configureWebhookEventExporter({
            enabled: true,
            webhookUrl: 'https://example.com/webhook',
            bearerToken: '',
            enabledEvents: {
                'friend.online': true
            }
        });

        const ok = await emitWebhookEvent('friend.online', { userId: 'usr_1' });

        expect(ok).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('handles notification.<type>.received with dynamic matcher', async () => {
        await configureWebhookEventExporter({
            enabled: true,
            webhookUrl: 'https://example.com/webhook',
            bearerToken: '',
            enabledEvents: {
                'notification.received.dynamic': true
            }
        });

        const ok = await emitWebhookEvent('notification.group_invite.received', {
            id: 'noty_1'
        });

        expect(ok).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('rejects unregistered events by default', async () => {
        await configureWebhookEventExporter({
            enabled: true,
            webhookUrl: 'https://example.com/webhook',
            bearerToken: '',
            enabledEvents: {
                'friend.online': true
            }
        });

        const ok = await emitWebhookEvent('unknown.custom.event', { foo: 'bar' });

        expect(ok).toBe(false);
        expect(fetch).not.toHaveBeenCalled();
    });
});

