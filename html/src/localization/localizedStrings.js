import en from './strings/en.json' assert {type: 'JSON'};
import elements_en from 'element-ui/lib/locale/lang/en';
// import ja from './strings/ja.json' assert { type: 'JSON' };
import zh_TW from './strings/zh_TW.json' assert {type: 'JSON'};
import elements_zh_TW from 'element-ui/lib/locale/lang/zh-TW';

const localized_en = {...en, ...elements_en};
const localized_zh_TW = {...zh_TW, ...elements_zh_TW};

export {localized_en as en, localized_zh_TW as zh_TW};
