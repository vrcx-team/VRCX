import en from './en/en.json' assert { type: 'JSON' };
import elements_en from 'element-plus/es/locale/lang/en';

import es from './es/en.json' assert { type: 'JSON' };
import elements_es from 'element-plus/es/locale/lang/es';

import fr from './fr/en.json' assert { type: 'JSON' };
import elements_fr from 'element-plus/es/locale/lang/fr';

import hu from './hu/en.json' assert { type: 'JSON' };
import elements_hu from 'element-plus/es/locale/lang/hu';

import ja from './ja/en.json' assert { type: 'JSON' };
import elements_ja from 'element-plus/es/locale/lang/ja';

import ko from './ko/en.json' assert { type: 'JSON' };
import elements_ko from 'element-plus/es/locale/lang/ko';

import pl from './pl/en.json' assert { type: 'JSON' };
import elements_pl from 'element-plus/es/locale/lang/pl';

import pt from './pt/en.json' assert { type: 'JSON' };
import elements_pt from 'element-plus/es/locale/lang/pt';

import cs from './cs/en.json' assert { type: 'JSON' };
import elements_cs from 'element-plus/es/locale/lang/cs';

import ru from './ru/en.json' assert { type: 'JSON' };
import elements_ru from 'element-plus/es/locale/lang/ru';

import vi from './vi/en.json' assert { type: 'JSON' };
import elements_vi from 'element-plus/es/locale/lang/vi';

import zh_CN from './zh-CN/en.json' assert { type: 'JSON' };
import elements_zh_CN from 'element-plus/es/locale/lang/zh-CN';

import zh_TW from './zh-TW/en.json' assert { type: 'JSON' };
import elements_zh_TW from 'element-plus/es/locale/lang/zh-TW';

import th from './th/en.json' assert { type: 'JSON' };
import elements_th from 'element-plus/es/locale/lang/th';

const localized_en = { ...en, ...elements_en };
const localized_es = { ...es, ...elements_es };
const localized_fr = { ...fr, ...elements_fr };
const localized_hu = { ...hu, ...elements_hu };
const localized_ja = { ...ja, ...elements_ja };
const localized_ko = { ...ko, ...elements_ko };
const localized_pl = { ...pl, ...elements_pl };
const localized_pt = { ...pt, ...elements_pt };
const localized_cs = { ...cs, ...elements_cs };
const localized_ru = { ...ru, ...elements_ru };
const localized_vi = { ...vi, ...elements_vi };
const localized_zh_CN = { ...zh_CN, ...elements_zh_CN };
const localized_zh_TW = { ...zh_TW, ...elements_zh_TW };
const localized_th = { ...th, ...elements_th };

export {
    localized_en as en,
    localized_es as es,
    localized_fr as fr,
    localized_hu as hu,
    localized_ja as ja,
    localized_ko as ko,
    localized_pl as pl,
    localized_pt as pt,
    localized_cs as cs,
    localized_ru as ru,
    localized_vi as vi,
    localized_zh_CN as zh_CN,
    localized_zh_TW as zh_TW,
    localized_th as th
};
