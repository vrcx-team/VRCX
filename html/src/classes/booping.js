import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        /**
        * @params {{
            userId: string,
            emojiId: string
        }} params
        * @returns {Promise<{json: any, params}>}
        */
        API.sendBoop = function (params) {
            return this.call(`users/${params.userId}/boop`, {
                method: 'POST',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('BOOP:SEND', args);
                return args;
            });
        };
    }

    _data = {
        sendBoopDialog: {
            visible: false,
            userId: '',
            fileId: ''
        }
    };

    _methods = {
        sendBoop() {
            var D = this.sendBoopDialog;
            this.dismissBoop(D.userId);
            var params = {
                userId: D.userId
            };
            if (D.fileId) {
                params.emojiId = D.fileId;
            }
            API.sendBoop(params);
            D.visible = false;
        },

        dismissBoop(userId) {
            // JANK: This is a hack to remove boop notifications when responding
            var array = this.notificationTable.data;
            for (var i = array.length - 1; i >= 0; i--) {
                var ref = array[i];
                if (
                    ref.type !== 'boop' ||
                    ref.$isExpired ||
                    ref.senderUserId !== userId
                ) {
                    continue;
                }
                API.sendNotificationResponse({
                    notificationId: ref.id,
                    responseType: 'delete',
                    responseData: ''
                });
            }
        },

        showSendBoopDialog(userId) {
            this.$nextTick(() =>
                $app.adjustDialogZ(this.$refs.sendBoopDialog.$el)
            );
            var D = this.sendBoopDialog;
            D.userId = userId;
            D.visible = true;
            if (this.emojiTable.length === 0 && API.currentUser.$isVRCPlus) {
                this.refreshEmojiTable();
            }
        },

        getEmojiValue(emojiName) {
            if (!emojiName) {
                return '';
            }
            return `vrchat_${emojiName.replace(/ /g, '_').toLowerCase()}`;
        },

        getEmojiName(emojiValue) {
            // uppercase first letter of each word
            if (!emojiValue) {
                return '';
            }
            return emojiValue
                .replace('vrchat_', '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());
        }
    };
}
