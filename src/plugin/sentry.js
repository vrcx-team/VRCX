import * as Sentry from '@sentry/vue';
import configRepository from '../service/config';

export function initSentry(app) {
    configRepository
        .getString('VRCX_SentryEnabled', 'false')
        .then((enabled) => {
            let isNightly = false;
            AppApi.GetVersion().then(
                (v) => (isNightly = v.includes('Nightly'))
            );
            if (enabled === 'true' && isNightly) {
                Sentry.init({
                    app,
                    dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
                    environment: 'nightly',
                    replaysSessionSampleRate: 0.1,
                    replaysOnErrorSampleRate: 1.0,
                    integrations: [
                        Sentry.replayIntegration({
                            maskAllText: true,
                            blockAllMedia: true
                        })
                    ]
                });
                console.log('Sentry initialized');
            }
        });
}
