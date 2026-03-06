import configRepository from './config';

const EVENT_EXPORT_ENABLED_KEY = 'VRCX_eventExportEnabled';
const EVENT_EXPORT_URL_KEY = 'VRCX_eventExportWebhookUrl';
const EVENT_EXPORT_TOKEN_KEY = 'VRCX_eventExportBearerToken';

const source = {
    app: 'VRCX',
    platform: WINDOWS ? 'windows' : LINUX ? 'linux' : 'unknown',
    version: VERSION
};

let cachedConfig = {
    enabled: false,
    webhookUrl: '',
    bearerToken: ''
};
let lastConfigLoadAt = 0;

async function loadConfig(force = false) {
    const now = Date.now();
    if (!force && now - lastConfigLoadAt < 5000) {
        return cachedConfig;
    }
    const [enabled, webhookUrl, bearerToken] = await Promise.all([
        configRepository.getBool(EVENT_EXPORT_ENABLED_KEY, false),
        configRepository.getString(EVENT_EXPORT_URL_KEY, ''),
        configRepository.getString(EVENT_EXPORT_TOKEN_KEY, '')
    ]);
    cachedConfig = {
        enabled,
        webhookUrl: webhookUrl?.trim() || '',
        bearerToken: bearerToken?.trim() || ''
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

    await Promise.all([
        configRepository.setBool(EVENT_EXPORT_ENABLED_KEY, enabled),
        configRepository.setString(EVENT_EXPORT_URL_KEY, webhookUrl),
        configRepository.setString(EVENT_EXPORT_TOKEN_KEY, bearerToken)
    ]);
    await loadConfig(true);
}
