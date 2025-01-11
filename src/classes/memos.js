import { baseClass, $app, API, $t, $utils } from './baseClass.js';
import database from '../repository/database.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {}

    _data = {
        hideUserMemos: false
    };

    _methods = {
        async migrateMemos() {
            var json = JSON.parse(await VRCXStorage.GetAll());
            database.begin();
            for (var line in json) {
                if (line.substring(0, 8) === 'memo_usr') {
                    var userId = line.substring(5);
                    var memo = json[line];
                    if (memo) {
                        await this.saveUserMemo(userId, memo);
                        VRCXStorage.Remove(`memo_${userId}`);
                    }
                }
            }
            database.commit();
        },

        onUserMemoChange() {
            var D = this.userDialog;
            this.saveUserMemo(D.id, D.memo);
        },

        async getUserMemo(userId) {
            try {
                return await database.getUserMemo(userId);
            } catch (err) {
                console.error(err);
                return {
                    userId: '',
                    editedAt: '',
                    memo: ''
                };
            }
        },

        saveUserMemo(id, memo) {
            if (memo) {
                database.setUserMemo({
                    userId: id,
                    editedAt: new Date().toJSON(),
                    memo
                });
            } else {
                database.deleteUserMemo(id);
            }
            var ref = this.friends.get(id);
            if (ref) {
                ref.memo = String(memo || '');
                if (memo) {
                    var array = memo.split('\n');
                    ref.$nickName = array[0];
                } else {
                    ref.$nickName = '';
                }
            }
        },

        async getAllUserMemos() {
            var memos = await database.getAllUserMemos();
            memos.forEach((memo) => {
                var ref = $app.friends.get(memo.userId);
                if (typeof ref !== 'undefined') {
                    ref.memo = memo.memo;
                    ref.$nickName = '';
                    if (memo.memo) {
                        var array = memo.memo.split('\n');
                        ref.$nickName = array[0];
                    }
                }
            });
        },

        onWorldMemoChange() {
            var D = this.worldDialog;
            this.saveWorldMemo(D.id, D.memo);
        },

        async getWorldMemo(worldId) {
            try {
                return await database.getWorldMemo(worldId);
            } catch (err) {
                console.error(err);
                return {
                    worldId: '',
                    editedAt: '',
                    memo: ''
                };
            }
        },

        saveWorldMemo(worldId, memo) {
            if (memo) {
                database.setWorldMemo({
                    worldId,
                    editedAt: new Date().toJSON(),
                    memo
                });
            } else {
                database.deleteWorldMemo(worldId);
            }
        },

        onAvatarMemoChange() {
            var D = this.avatarDialog;
            this.saveAvatarMemo(D.id, D.memo);
        },

        async getAvatarMemo(avatarId) {
            try {
                return await database.getAvatarMemoDB(avatarId);
            } catch (err) {
                console.error(err);
                return {
                    avatarId: '',
                    editedAt: '',
                    memo: ''
                };
            }
        },

        saveAvatarMemo(avatarId, memo) {
            if (memo) {
                database.setAvatarMemo({
                    avatarId,
                    editedAt: new Date().toJSON(),
                    memo
                });
            } else {
                database.deleteAvatarMemo(avatarId);
            }
        }
    };
}
