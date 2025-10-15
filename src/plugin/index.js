import { initDayjs } from './dayjs';
import { initInteropApi } from './interopApi';
import { initNoty } from './noty';
import { initUi } from './ui';

export async function initPlugins(isVrOverlay = false) {
    await initInteropApi(isVrOverlay);
    if (!isVrOverlay) {
        await initUi();
    }
    initDayjs();
    initNoty(isVrOverlay);
}

export * from './i18n';
export * from './components';
export * from './sentry';
