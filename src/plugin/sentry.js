import { router } from './router';
import { startRendererMemoryThresholdReport } from './piniaActionTrail';

import configRepository from '../service/config';

export async function isSentryOptedIn() {
    return NIGHTLY && configRepository.getBool('VRCX_SentryEnabled', false);
}

/**
 * Guarded import, prevents leaking Sentry into non-nightly bundles.
 */
export function getSentry() {
    return NIGHTLY ? import('@sentry/vue') : null;
}

export async function initSentry(app) {
    if (!NIGHTLY) return;

    try {
        if (!(await isSentryOptedIn())) return;

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
        const Sentry = await getSentry();
        Sentry.init({
            app,
            dsn,
            environment: 'nightly',
            release: VERSION,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 1.0,
            tracesSampleRate: 0.0001,
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
                        error.message.includes('disk I/O error') ||
                        error.message.includes(
                            'There is not enough space on the disk.'
                        ) ||
                        error.message.includes(
                            'The requested address is not valid in its context.'
                        )
                    ) {
                        return null;
                    }
                    return event;
                }
                return event;
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

        startRendererMemoryThresholdReport(Sentry, {
            thresholdRatio: 0.8,
            intervalMs: 10_000,
            cooldownMs: 5 * 60_000
        });
    } catch (e) {
        console.error('Failed to initialize Sentry:', e);
        return;
    }
}
