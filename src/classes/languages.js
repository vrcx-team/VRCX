import { baseClass, $app, API, $t, $utils } from './baseClass.js';
import { userRequest } from '../api';

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
    }

    _data = {
        subsetOfLanguages: [],

        languageDialog: {
            visible: false,
            loading: false,
            languageChoice: false,
            languages: []
        }
    };

    _methods = {};
}
