import { database } from '../../service/database.js';
import { useFriendStore } from '../../stores';

/**
 * @returns {Promise<void>}
 */
async function migrateMemos() {
    const json = JSON.parse(await VRCXStorage.GetAll());
    for (const line in json) {
        if (line.substring(0, 8) === 'memo_usr') {
            const userId = line.substring(5);
            const memo = json[line];
            if (memo) {
                await saveUserMemo(userId, memo);
                VRCXStorage.Remove(`memo_${userId}`);
            }
        }
    }
}

/**
 *
 * @param {string} userId
 * @returns
 */
async function getUserMemo(userId) {
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
}

/**
 *
 * @param {string} id
 * @param {string} memo
 */
async function saveUserMemo(id, memo) {
    const friendStore = useFriendStore();
    if (memo) {
        await database.setUserMemo({
            userId: id,
            editedAt: new Date().toJSON(),
            memo
        });
    } else {
        await database.deleteUserMemo(id);
    }
    const ref = friendStore.friends.get(id);
    if (ref) {
        ref.memo = String(memo || '');
        if (memo) {
            const array = memo.split('\n');
            ref.$nickName = array[0];
        } else {
            ref.$nickName = '';
        }
    }
}

/**
 * @returns {Promise<void>}
 */
async function getAllUserMemos() {
    const friendStore = useFriendStore();
    const memos = await database.getAllUserMemos();
    memos.forEach((memo) => {
        const ref = friendStore.friends.get(memo.userId);
        if (typeof ref !== 'undefined') {
            ref.memo = memo.memo;
            ref.$nickName = '';
            if (memo.memo) {
                const array = memo.memo.split('\n');
                ref.$nickName = array[0];
            }
        }
    });
}

/**
 *
 * @param {string} worldId
 * @returns
 */
async function getWorldMemo(worldId) {
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
}

// async function getAvatarMemo(avatarId) {
//     try {
//         return await database.getAvatarMemoDB(avatarId);
//     } catch (err) {
//         console.error(err);
//         return {
//             avatarId: '',
//             editedAt: '',
//             memo: ''
//         };
//     }
// }

export {
    migrateMemos,
    getUserMemo,
    saveUserMemo,
    getAllUserMemos,
    getWorldMemo
    // getAvatarMemo
};
