import { router } from './router';

import configRepository from '../service/config';

let version = '';

export async function isSentryEnabled() {
    const enabled = await configRepository.getString(
        'VRCX_SentryEnabled',
        'false'
    );
    version = await AppApi.GetVersion();
    const isNightly = version.includes('Nightly');
    if (enabled !== 'true' || !isNightly) {
        return false;
    }
    return true;
}

export async function initSentry(app) {
    try {
        if (!(await isSentryEnabled())) {
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
        const dsn = atob(response.data);
        const Sentry = await import('@sentry/vue');
        Sentry.init({
            app,
            dsn,
            environment: 'nightly',
            release: version,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 1.0,
            tracesSampleRate: 0.001,
            beforeSend(event, hint) {
                const error = hint.originalException;
                if (error && typeof error.message === 'string') {
                    if (
                        error.message.includes('401') ||
                        error.message.includes('403') ||
                        error.message.includes('404') ||
                        error.message.includes('500') ||
                        error.message.includes('503') ||
                        error.message.includes('No such host is known') ||
                        error.message.includes(
                            'The SSL connection could not be established'
                        ) ||
                        error.message.includes('A connection attempt failed') ||
                        error.message.includes(
                            'no data of the requested type was found'
                        ) ||
                        error.message.includes(
                            'An error occurred while sending the request'
                        ) ||
                        error.message.includes('database or disk is full') ||
                        error.message.includes(
                            'There is not enough space on the disk.'
                        )
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
                    usedJSHeapSize:
                        // @ts-ignore
                        window.performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize:
                        // @ts-ignore
                        window.performance.memory.totalJSHeapSize / 1024 / 1024,
                    jsHeapSizeLimit:
                        // @ts-ignore
                        window.performance.memory.jsHeapSizeLimit / 1024 / 1024,
                    vrcxId: vrcxId
                };
                return span;
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
                }),
                Sentry.feedbackIntegration({
                    showBranding: false,
                    autoInject: false,
                    enableScreenshot: false,
                    buttonLabel: 'Feedback',
                    submitButtonLabel: 'Send Feedback',
                    formTitle: 'Send Feedback'
                })
            ]
        });
        console.log('Sentry initialized');
    } catch (e) {
        console.error('Failed to initialize Sentry:', e);
        return;
    }
}
