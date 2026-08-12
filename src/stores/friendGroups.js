import { ref } from 'vue';

import { defineStore } from 'pinia';

/**
 * 好友群组同步状态（#1739 Popular group between Friends）。
 */
export const useFriendGroupsStore = defineStore('FriendGroups', () => {
    const isSyncing = ref(false);
    const total = ref(0);
    const done = ref(0);
    const failed = ref(0);
    const lastSyncedAt = ref('');
    /** 本轮同步的开始时间戳（毫秒），用于估算剩余时间 */
    const startedAt = ref(0);

    function resetSyncState() {
        isSyncing.value = false;
        total.value = 0;
        done.value = 0;
        failed.value = 0;
        lastSyncedAt.value = '';
        startedAt.value = 0;
    }

    return {
        isSyncing,
        total,
        done,
        failed,
        lastSyncedAt,
        startedAt,
        resetSyncState
    };
});
