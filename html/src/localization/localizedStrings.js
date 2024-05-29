import en from './en/en.json' assert { type: 'JSON' };
import elements_en from 'element-ui/lib/locale/lang/en';

import ja from './ja/en.json' assert { type: 'JSON' };
import elements_ja from 'element-ui/lib/locale/lang/ja';

import zh_TW from './zh-TW/en.json' assert { type: 'JSON' };
import elements_zh_TW from 'element-ui/lib/locale/lang/zh-TW';

import ko from './ko/en.json' assert { type: 'JSON' };
import elements_ko from 'element-ui/lib/locale/lang/ko';

import zh_cn from './zh-CN/en.json' assert { type: 'JSON' };
import elements_zh_cn from 'element-ui/lib/locale/lang/zh-cn';

import fr from './fr/en.json' assert { type: 'JSON' };
import elements_fr from 'element-ui/lib/locale/lang/fr';

import vi from './vi/en.json' assert { type: 'JSON' };
import elements_vi from 'element-ui/lib/locale/lang/vi';

import ru_RU from './ru/en.json' assert { type: 'JSON' };
import elements_ru from 'element-ui/lib/locale/lang/ru-RU';

import es from './es/en.json' assert { type: 'JSON' };
import elements_es from 'element-ui/lib/locale/lang/es';

import pl from './pl/en.json' assert { type: 'JSON' };
import elements_pl from 'element-ui/lib/locale/lang/pl';

const localized_en = { ...en, ...elements_en };
const localized_zh_TW = { ...zh_TW, ...elements_zh_TW };
const localized_zh_cn = { ...zh_cn, ...elements_zh_cn };
const localized_ko = { ...ko, ...elements_ko };
const localized_ja = { ...ja, ...elements_ja };
const localized_fr = { ...fr, ...elements_fr };
const localized_vi = { ...vi, ...elements_vi };
const localized_ru = { ...ru_RU, ...elements_ru };
const localized_es = { ...es, ...elements_es };
const localized_pl = { ...pl, ...elements_pl };

export {
    localized_en as en,
    localized_zh_TW as zh_TW,
    localized_ko as ko,
    localized_zh_cn as zh_cn,
    localized_ja as ja_JP,
    localized_fr as fr,
    localized_vi as vi,
    localized_ru as ru_RU,
    localized_es as es,
    localized_pl as pl
};
