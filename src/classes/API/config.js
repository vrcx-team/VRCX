import { baseClass, $app, API, $t, $utils } from '../baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        API.getConfig = function () {
            return this.call('config', {
                method: 'GET'
            }).then((json) => {
                var args = {
                    json
                };
                this.$emit('CONFIG', args);
                return args;
            });
        };

        API.$on('CONFIG', function (args) {
            args.ref = this.applyConfig(args.json);
        });

        API.$on('CONFIG', function (args) {
            if (typeof args.ref?.whiteListedAssetUrls !== 'object') {
                console.error('Invalid config whiteListedAssetUrls');
            }
            AppApi.PopulateImageHosts(
                JSON.stringify(args.ref.whiteListedAssetUrls)
            );
        });

        API.applyConfig = function (json) {
            var ref = {
                ...json
            };
            this.cachedConfig = ref;
            return ref;
        };
    }

    _data = {};

    _methods = {};
}
