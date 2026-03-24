import {
    applyAppCjkFontPack,
    applyAppFontFamily,
    changeAppThemeStyle,
    changeHtmlLangAttribute,
    getThemeMode,
    initThemeColor,
    refreshCustomCss
} from '../shared/utils/base/ui';
import {
    APP_CJK_FONT_PACK_DEFAULT_KEY,
    APP_FONT_DEFAULT_KEY
} from '../shared/constants';
import { i18n, loadLocalizedStrings } from './i18n';

import configRepository from '../services/config';

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

        const { initThemeMode } = await getThemeMode(configRepository);
        changeAppThemeStyle(initThemeMode);
        await initThemeColor();
    } catch (error) {
        console.error('Error initializing locale and theme:', error);
    }

    refreshCustomCss();
}

export async function initUiForVrOverlay() {
    try {
        const [language, fontFamily, customFontFamily, cjkFontPack] =
            await Promise.all([
                configRepository.getString('VRCX_appLanguage', 'en'),
                configRepository.getString(
                    'VRCX_fontFamily',
                    APP_FONT_DEFAULT_KEY
                ),
                configRepository.getString('VRCX_customFontFamily', ''),
                configRepository.getString(
                    'VRCX_cjkFontPack',
                    APP_CJK_FONT_PACK_DEFAULT_KEY
                )
            ]);

        // @ts-ignore
        i18n.locale = language;
        await loadLocalizedStrings(language);
        changeHtmlLangAttribute(language);
        applyAppFontFamily(fontFamily, customFontFamily);
        applyAppCjkFontPack(cjkFontPack);
    } catch (error) {
        console.error('Error initializing VR locale and fonts:', error);
    }
}
