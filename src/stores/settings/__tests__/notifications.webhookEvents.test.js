import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const configMap = new Map();
const configureWebhookEventExporterMock = vi.fn();

vi.mock('../../../service/config', () => ({
    default: {
        getString: vi.fn(async (key, defaultValue) => {
            if (configMap.has(key)) {
                return configMap.get(key);
            }
            return defaultValue;
        }),
        getBool: vi.fn(async (key, defaultValue) => {
            if (configMap.has(key)) {
                return configMap.get(key) === 'true';
            }
            return defaultValue;
        }),
        setString: vi.fn(async (key, value) => {
            configMap.set(key, String(value));
        }),
        setBool: vi.fn(async (key, value) => {
            configMap.set(key, value ? 'true' : 'false');
        })
    }
}));

vi.mock('../../../service/webhookEvent', () => ({
    configureWebhookEventExporter: (...args) =>
        configureWebhookEventExporterMock(...args),
    emitWebhookEvent: vi.fn(async () => true)
}));

vi.mock('../../modal', () => ({
    useModalStore: () => ({
        prompt: vi.fn(),
        confirm: vi.fn()
    })
}));

vi.mock('../../vr', () => ({
    useVrStore: () => ({
        updateVRConfigVars: vi.fn()
    })
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('vue-sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

import {
    createDefaultWebhookEventEnabledMap
} from '../../../shared/constants/webhookEvents';
import { useNotificationsSettingsStore } from '../notifications';

describe('notifications webhook event map settings', () => {
    beforeEach(() => {
        configMap.clear();
        configureWebhookEventExporterMock.mockReset();
        configureWebhookEventExporterMock.mockResolvedValue(undefined);
        globalThis.speechSynthesis = {
            getVoices: () => [],
            cancel: vi.fn(),
            speak: vi.fn()
        };
        globalThis.SpeechSynthesisUtterance = class {
            constructor() {
                this.voice = null;
                this.text = '';
            }
        };
        setActivePinia(createPinia());
    });

    test('loads and normalizes webhook event map from config', async () => {
        const defaults = createDefaultWebhookEventEnabledMap();
        configMap.set(
            'VRCX_eventExportEnabledEvents',
            JSON.stringify({
                ...defaults,
                'friend.online': false
            })
        );

        const store = useNotificationsSettingsStore();
        await vi.waitFor(() => {
            expect(store.webhookEventEnabledMap['friend.online']).toBe(false);
        });

        expect(store.webhookEventEnabledMap['friend.online']).toBe(false);
        expect(
            Object.keys(store.webhookEventEnabledMap).length
        ).toBeGreaterThan(0);
    });

    test('toggles single event and persists via configureWebhookEventExporter', async () => {
        const store = useNotificationsSettingsStore();
        await vi.waitFor(() => {
            expect(typeof store.webhookEventEnabledMap['friend.online']).toBe(
                'boolean'
            );
        });

        store.setWebhookEventEnabled('friend.online', false);

        await vi.waitFor(() => {
            expect(configureWebhookEventExporterMock).toHaveBeenCalled();
        });

        const lastCall = configureWebhookEventExporterMock.mock.calls.at(-1)?.[0];
        expect(lastCall.enabledEvents['friend.online']).toBe(false);
    });

    test('supports enable all, disable all and reset defaults', async () => {
        const store = useNotificationsSettingsStore();
        await vi.waitFor(() => {
            expect(typeof store.webhookEventEnabledMap['friend.online']).toBe(
                'boolean'
            );
        });

        store.setAllWebhookEventsEnabled(false);
        await vi.waitFor(() => {
            const last = configureWebhookEventExporterMock.mock.calls.at(-1)?.[0];
            expect(
                Object.values(last.enabledEvents).every((v) => v === false)
            ).toBe(true);
        });

        store.setAllWebhookEventsEnabled(true);
        await vi.waitFor(() => {
            const last = configureWebhookEventExporterMock.mock.calls.at(-1)?.[0];
            expect(
                Object.values(last.enabledEvents).every((v) => v === true)
            ).toBe(true);
        });

        store.resetWebhookEventEnabledDefaults();
        const defaults = createDefaultWebhookEventEnabledMap();
        await vi.waitFor(() => {
            const last = configureWebhookEventExporterMock.mock.calls.at(-1)?.[0];
            expect(last.enabledEvents).toEqual(defaults);
        });
    });
});
