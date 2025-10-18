import { router } from './router';

import configRepository from '../service/config';

import * as Sentry from '@sentry/vue';

export async function initSentry(app) {
    const enabled = await configRepository.getString(
        'VRCX_SentryEnabled',
        'false'
    );
    const version = await AppApi.GetVersion();
    const isNightly = version.includes('Nightly');
    if (enabled !== 'true' || !isNightly) {
        return;
    }
    const vrcxId = await configRepository.getString('VRCX_id', '');
    const response = await webApiService.execute({
        url: 'https://api0.vrcx.app/errorreporting/getdsn',
        method: 'GET',
        headers: {
            Referer: 'https://vrcx.app',
            'VRCX-ID': vrcxId
        }
    });
    if (response.status !== 200) {
        console.error(
            'Failed to get Sentry DSN:',
            response.status,
            response.data
        );
        return;
    }
    try {
        const dsn = atob(response.data);
        Sentry.init({
            app,
            dsn,
            environment: 'nightly',
            release: version,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 1.0,
            tracesSampleRate: 0.05,
            beforeSend(event) {
                if (
                    event.request?.status !== 404 &&
                    event.request?.status !== 403 &&
                    event.request?.status !== -1
                ) {
                    return event;
                }
            },
            integrations: [
                Sentry.replayIntegration({
                    maskAllText: true,
                    blockAllMedia: true
                }),
                Sentry.browserTracingIntegration({ router }),
                Sentry.vueIntegration({
                    tracingOptions: {
                        trackComponents: true
                    }
                })
            ]
        });
        console.log('Sentry initialized');
    } catch (e) {
        console.error('Failed to initialize Sentry:', e);
        return;
    }
}
