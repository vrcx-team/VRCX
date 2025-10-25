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
            beforeSend(event, hint) {
                const error = hint.originalException;
                if (error && typeof error.message === 'string') {
                    if (
                        error.message.includes('401') ||
                        error.message.includes('403') ||
                        error.message.includes('404') ||
                        error.message.includes('500') ||
                        error.message.includes('503') ||
                        error.message.includes('database or disk is full')
                    ) {
                        return null;
                    }
                    return event;
                }
                return event;
            },
            beforeSendSpan(span) {
                span.data = {
                    ...span.data,
                    // @ts-ignore
                    memory_usage: window.performance.memory.usedJSHeapSize
                };
                return span;
            },
            integrations: [
                Sentry.replayIntegration({
                    maskAllText: true,
                    blockAllMedia: true
                }),
                Sentry.browserTracingIntegration({ router }),
                Sentry.browserProfilingIntegration(),
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
