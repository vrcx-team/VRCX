import {
    changeAppDarkStyle,
    changeAppThemeStyle,
    getThemeMode,
    refreshCustomCss,
    setLoginContainerStyle
} from '../shared/utils/base/ui';
import { i18n } from './i18n';

import configRepository from '../service/config';

export async function initUi() {
    try {
        // @ts-ignore
        i18n.locale = await configRepository.getString(
            'VRCX_appLanguage',
            'en'
        );

        const { initThemeMode, isDarkMode } =
            await getThemeMode(configRepository);

        setLoginContainerStyle(isDarkMode);
        changeAppDarkStyle(isDarkMode);
        changeAppThemeStyle(initThemeMode);
    } catch (error) {
        console.error('Error initializing locale and theme:', error);
    }

    refreshCustomCss();
}
