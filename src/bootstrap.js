import '@fontsource/noto-sans-kr/korean.css';
import '@fontsource/noto-sans-jp/japanese.css';
import '@fontsource/noto-sans-sc/chinese-simplified.css';
import '@fontsource/noto-sans-tc/chinese-traditional.css';

import '@fontsource/noto-sans-kr';
import '@fontsource/noto-sans-jp';
import '@fontsource/noto-sans-sc';
import '@fontsource/noto-sans-tc';

import configRepository from './service/config';
import vrcxJsonStorage from './service/jsonStorage';

import {
    changeAppDarkStyle,
    changeAppThemeStyle,
    refreshCustomCss,
    refreshCustomScript,
    systemIsDarkMode
} from './shared/utils/base/ui';
import { i18n } from './plugin/i18n';
import { initNoty } from './plugin/noty';
import './plugin/ipc';
import './plugin/dayjs';

initNoty(false);

configRepository.init();

AppApi.SetUserAgent();

// prevent flicker on login page
function setLoginContainerStyle(isDarkMode) {
    const loginContainerStyle = document.createElement('style');
    loginContainerStyle.id = 'login-container-style';
    loginContainerStyle.type = 'text/css';

    const backgroundColor = isDarkMode ? '#101010' : '#ffffff';
    const inputBackgroundColor = isDarkMode ? '#333333' : '#ffffff';
    const inputBorder = isDarkMode ? '1px solid #3b3b3b' : '1px solid #DCDFE6';

    loginContainerStyle.innerHTML = `
    .x-login-container {
        background-color: ${backgroundColor} !important;
        transition: background-color 0.3s ease;
    }

    .x-login-container .el-input__inner {
        background-color: ${inputBackgroundColor} !important;
        border: ${inputBorder} !important;
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }
        `;

    document.head.insertBefore(loginContainerStyle, document.head.firstChild);
}

async function getThemeMode() {
    const initThemeMode = await configRepository.getString(
        'VRCX_ThemeMode',
        'system'
    );

    let isDarkMode;

    if (initThemeMode === 'light') {
        isDarkMode = false;
    } else if (initThemeMode === 'system') {
        isDarkMode = systemIsDarkMode();
    } else {
        isDarkMode = true;
    }

    return { initThemeMode, isDarkMode };
}

try {
    // @ts-ignore
    i18n.locale = await configRepository.getString('VRCX_appLanguage', 'en');

    const { initThemeMode, isDarkMode } = await getThemeMode();

    setLoginContainerStyle(isDarkMode);
    changeAppDarkStyle(isDarkMode);
    changeAppThemeStyle(initThemeMode);
} catch (error) {
    console.error('Error initializing locale and theme:', error);
}

refreshCustomCss();
refreshCustomScript();

new vrcxJsonStorage(VRCXStorage);

// some workaround for failing to get voice list first run
speechSynthesis.getVoices();
