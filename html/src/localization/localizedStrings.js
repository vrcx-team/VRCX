import en from './strings/en.json' assert { type: 'JSON' };
import elements_en from 'element-ui/lib/locale/lang/en';

import ja from './strings/ja.json' assert { type: 'JSON' };
import elements_ja from 'element-ui/lib/locale/lang/ja';

import zh_TW from './strings/zh_TW.json' assert { type: 'JSON' };
import elements_zh_TW from 'element-ui/lib/locale/lang/zh-TW';

import ko from './strings/ko.json' assert { type: 'JSON' };
import elements_ko from 'element-ui/lib/locale/lang/ko';

import zh_CN from './strings/zh_CN.json' assert { type: 'JSON' };
import elements_zh_CN from 'element-ui/lib/locale/lang/zh-CN';

import fr from './strings/fr.json' assert { type: 'JSON' };
import elements_fr from 'element-ui/lib/locale/lang/fr';

const localized_en = { ...en, ...elements_en };
const localized_zh_TW = { ...zh_TW, ...elements_zh_TW };
const localized_zh_CN = { ...zh_CN, ...elements_zh_CN };
const localized_ko = { ...ko, ...elements_ko };
const localized_ja = { ...ja, ...elements_ja };
const localized_fr = { ...fr, ...elements_fr };

export {
    localized_en as en,
    localized_zh_TW as zh_TW,
    localized_ko as ko,
    localized_zh_CN as zh_CN,
    localized_ja as ja_JP,
    localized_fr as fr
};
