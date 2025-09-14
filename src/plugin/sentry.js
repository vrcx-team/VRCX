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
                    sampleRate: 0.1,
                    beforeSend(event) {
                        if (
                            event.message &&
                            (event.message.toLowerCase().includes('password') ||
                                event.message.toLowerCase().includes('token'))
                        ) {
                            return null;
                        }
                        return event;
                    },
                    integrations: []
                });
                console.log('Sentry initialized');
            }
        });
}
