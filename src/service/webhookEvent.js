import configRepository from './config';
import {
    createDefaultWebhookEventEnabledMap,
    isWebhookEventAllowed,
    normalizeWebhookEventEnabledMap
} from '../shared/constants/webhookEvents';

const EVENT_EXPORT_ENABLED_KEY = 'VRCX_eventExportEnabled';
const EVENT_EXPORT_URL_KEY = 'VRCX_eventExportWebhookUrl';
const EVENT_EXPORT_TOKEN_KEY = 'VRCX_eventExportBearerToken';
const EVENT_EXPORT_EVENTS_KEY = 'VRCX_eventExportEnabledEvents';

const source = {
    app: 'VRCX',
    platform: WINDOWS ? 'windows' : LINUX ? 'linux' : 'unknown',
    version: VERSION
};

let cachedConfig = {
    enabled: false,
    webhookUrl: '',
    bearerToken: '',
    enabledEvents: createDefaultWebhookEventEnabledMap()
};
let lastConfigLoadAt = 0;

function parseEnabledEvents(raw) {
    if (!raw || typeof raw !== 'string') {
        return createDefaultWebhookEventEnabledMap();
    }
    try {
        const parsed = JSON.parse(raw);
        return normalizeWebhookEventEnabledMap(parsed);
    } catch {
        return createDefaultWebhookEventEnabledMap();
    }
}

async function loadConfig(force = false) {
    const now = Date.now();
    if (!force && now - lastConfigLoadAt < 5000) {
        return cachedConfig;
    }
    const [enabled, webhookUrl, bearerToken, enabledEventsRaw] =
        await Promise.all([
            configRepository.getBool(EVENT_EXPORT_ENABLED_KEY, false),
            configRepository.getString(EVENT_EXPORT_URL_KEY, ''),
            configRepository.getString(EVENT_EXPORT_TOKEN_KEY, ''),
            configRepository.getString(EVENT_EXPORT_EVENTS_KEY, '{}')
        ]);
    cachedConfig = {
        enabled,
        webhookUrl: webhookUrl?.trim() || '',
        bearerToken: bearerToken?.trim() || '',
        enabledEvents: parseEnabledEvents(enabledEventsRaw)
    };
    lastConfigLoadAt = now;
    return cachedConfig;
}

function createEventEnvelope(event, payload) {
    let eventId = '';
    if (globalThis.crypto?.randomUUID) {
        eventId = globalThis.crypto.randomUUID();
    } else {
        eventId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    return {
        id: eventId,
        ts: new Date().toISOString(),
        event,
        source,
        payload
    };
}

export async function emitWebhookEvent(event, payload = {}) {
    if (!event || typeof event !== 'string') {
        return false;
    }
    let config;
    try {
        config = await loadConfig();
    } catch (err) {
        console.warn('[event-export] failed to load config', err);
        return false;
    }
    if (!config.enabled || !config.webhookUrl) {
        return false;
    }
    if (!isWebhookEventAllowed(event, config.enabledEvents)) {
        console.warn(`[event-export] blocked disabled or unknown event: ${event}`);
        return false;
    }

    const body = JSON.stringify(createEventEnvelope(event, payload));
    const headers = {
        'Content-Type': 'application/json',
        'X-VRCX-Event': event
    };
    if (config.bearerToken) {
        headers.Authorization = `Bearer ${config.bearerToken}`;
    }

    fetch(config.webhookUrl, {
        method: 'POST',
        headers,
        body
    }).catch((err) => {
        console.warn(`[event-export] failed to deliver ${event}`, err);
    });
    return true;
}

export async function configureWebhookEventExporter(config) {
    const enabled = Boolean(config?.enabled);
    const webhookUrl = String(config?.webhookUrl || '');
    const bearerToken = String(config?.bearerToken || '');

    let enabledEvents = config?.enabledEvents;
    if (typeof enabledEvents === 'undefined') {
        const loaded = await loadConfig();
        enabledEvents = loaded.enabledEvents;
    }
    const normalizedEnabledEvents = normalizeWebhookEventEnabledMap(enabledEvents);

    await Promise.all([
        configRepository.setBool(EVENT_EXPORT_ENABLED_KEY, enabled),
        configRepository.setString(EVENT_EXPORT_URL_KEY, webhookUrl),
        configRepository.setString(EVENT_EXPORT_TOKEN_KEY, bearerToken),
        configRepository.setString(
            EVENT_EXPORT_EVENTS_KEY,
            JSON.stringify(normalizedEnabledEvents)
        )
    ]);
    await loadConfig(true);
}
