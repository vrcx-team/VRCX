import {
    changeAppDarkStyle,
    changeAppThemeStyle,
    changeHtmlLangAttribute,
    getThemeMode,
    refreshCustomCss,
    setLoginContainerStyle
} from '../shared/utils/base/ui';
import { i18n, loadLocalizedStrings } from './i18n';

import configRepository from '../service/config';

export async function initUi() {
    try {
        const language = await configRepository.getString(
            'VRCX_appLanguage',
            'en'
        );
        // @ts-ignore
        i18n.locale = language;
        await loadLocalizedStrings(language);
        changeHtmlLangAttribute(language);

        const { initThemeMode, isDarkMode } =
            await getThemeMode(configRepository);
        setLoginContainerStyle(isDarkMode);
        changeAppThemeStyle(initThemeMode);
    } catch (error) {
        console.error('Error initializing locale and theme:', error);
    }

    refreshCustomCss();
}
