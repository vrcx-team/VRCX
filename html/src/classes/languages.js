import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        API.$on('CONFIG', function (args) {
            var languages =
                args.ref?.constants?.LANGUAGE?.SPOKEN_LANGUAGE_OPTIONS;
            if (!languages) {
                return;
            }
            $app.subsetOfLanguages = languages;
            var data = [];
            for (var key in languages) {
                var value = languages[key];
                data.push({
                    key,
                    value
                });
            }
            $app.languageDialog.languages = data;
        });

        API.$on('LOGOUT', function () {
            $app.languageDialog.visible = false;
        });
    }

    _data = {
        // vrchat to famfamfam language mappings
        languageMappings: {
            eng: 'us',
            kor: 'kr',
            rus: 'ru',
            spa: 'es',
            por: 'pt',
            zho: 'cn',
            deu: 'de',
            jpn: 'jp',
            fra: 'fr',
            swe: 'se',
            nld: 'nl',
            pol: 'pl',
            dan: 'dk',
            nor: 'no',
            ita: 'it',
            tha: 'th',
            fin: 'fi',
            hun: 'hu',
            ces: 'cz',
            tur: 'tr',
            ara: 'ae',
            ron: 'ro',
            vie: 'vn',
            ukr: 'ua',
            ase: 'us',
            bfi: 'gb',
            dse: 'nl',
            fsl: 'fr',
            jsl: 'jp',
            kvk: 'kr',

            mlt: 'mt',
            ind: 'id',
            hrv: 'hr',
            heb: 'he',
            afr: 'af',
            ben: 'be',
            bul: 'bg',
            cmn: 'cn',
            cym: 'cy',
            ell: 'el',
            est: 'et',
            fil: 'ph',
            gla: 'gd',
            gle: 'ga',
            hin: 'hi',
            hmn: 'cn',
            hye: 'hy',
            isl: 'is',
            lav: 'lv',
            lit: 'lt',
            ltz: 'lb',
            mar: 'hi',
            mkd: 'mk',
            msa: 'my',
            sco: 'gd',
            slk: 'sk',
            slv: 'sl',
            tel: 'hi',
            mri: 'nz',
            wuu: 'cn',
            yue: 'cn',
            tws: 'cn',
            asf: 'au',
            nzs: 'nz',
            gsg: 'de',
            epo: 'eo',
            tok: 'tok'
        },

        subsetOfLanguages: [],

        languageDialog: {
            visible: false,
            loading: false,
            languageChoice: false,
            languageValue: '',
            languages: []
        }
    };

    _methods = {
        languageClass(language) {
            var style = {};
            var mapping = this.languageMappings[language];
            if (typeof mapping !== 'undefined') {
                style[mapping] = true;
            } else {
                style.unknown = true;
            }
            return style;
        },

        addUserLanguage(language) {
            if (language !== String(language)) {
                return;
            }
            var D = this.languageDialog;
            D.loading = true;
            API.addUserTags({
                tags: [`language_${language}`]
            }).finally(function () {
                D.loading = false;
            });
        },

        removeUserLanguage(language) {
            if (language !== String(language)) {
                return;
            }
            var D = this.languageDialog;
            D.loading = true;
            API.removeUserTags({
                tags: [`language_${language}`]
            }).finally(function () {
                D.loading = false;
            });
        },

        showLanguageDialog() {
            this.$nextTick(() =>
                $app.adjustDialogZ(this.$refs.languageDialog.$el)
            );
            var D = this.languageDialog;
            D.visible = true;
        }
    };
}
