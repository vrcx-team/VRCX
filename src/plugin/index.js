import { initDayjs } from './dayjs';
import { initInteropApi } from './interopApi';
import { initNoty } from './noty';
import { initUi } from './ui';

/**
 * @param {boolean} isVrOverlay
 * @returns {Promise<void>}
 */
export async function initPlugins(isVrOverlay = false) {
    await initInteropApi(isVrOverlay);
    if (!isVrOverlay) {
        await initUi();
    }
    initDayjs();
    if (isVrOverlay) {
        initNoty(true);
    }
}

export * from './i18n';
export * from './components';
export * from './sentry';
export * from './router';
