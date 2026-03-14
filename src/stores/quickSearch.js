import { computed, effectScope, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useFriendStore } from './friend';
import { useSearchIndexStore } from './searchIndex';
import { useUserStore } from './user';
import { showGroupDialog } from '../coordinators/groupCoordinator';
import { showWorldDialog } from '../coordinators/worldCoordinator';
import { showAvatarDialog } from '../coordinators/avatarCoordinator';
import { showUserDialog } from '../coordinators/userCoordinator';

import QuickSearchWorker from './quickSearchWorker.js?worker&inline';

export const useQuickSearchStore = defineStore('QuickSearch', () => {
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const searchIndexStore = useSearchIndexStore();

    const isOpen = ref(false);
    const query = ref('');

    // Worker instance (lazy)
    let worker = null;
    let indexUpdateTimer = null;
    let indexWatchScope = null;

    function getWorker() {
        if (!worker) {
            worker = new QuickSearchWorker();
            worker.onmessage = handleWorkerMessage;
        }
        return worker;
    }

    function disposeWorker() {
        if (!worker) return;
        worker.terminate();
        worker = null;
    }

    // Search results (updated from worker messages)
    const friendResults = ref([]);
    const ownAvatarResults = ref([]);
    const favoriteAvatarResults = ref([]);
    const ownWorldResults = ref([]);
    const favoriteWorldResults = ref([]);
    const ownGroupResults = ref([]);
    const joinedGroupResults = ref([]);

    const hasResults = computed(
        () =>
            friendResults.value.length > 0 ||
            ownAvatarResults.value.length > 0 ||
            favoriteAvatarResults.value.length > 0 ||
            ownWorldResults.value.length > 0 ||
            favoriteWorldResults.value.length > 0 ||
            ownGroupResults.value.length > 0 ||
            joinedGroupResults.value.length > 0
    );

    const currentUserId = computed(() => userStore.currentUser?.id);

    // Send index update to worker when data changes
    function scheduleIndexUpdate() {
        if (!isOpen.value) return;
        if (indexUpdateTimer) clearTimeout(indexUpdateTimer);
        indexUpdateTimer = setTimeout(() => {
            indexUpdateTimer = null;
            if (!isOpen.value) return;
            sendIndexUpdate();
            if (query.value && query.value.length >= 2) {
                dispatchSearch();
            }
        }, 200);
    }

    function sendIndexUpdate() {
        const w = getWorker();
        const payload = searchIndexStore.getSnapshot();
        w.postMessage({ type: 'updateIndex', payload });
    }

    function stopIndexWatchers() {
        if (indexUpdateTimer) {
            clearTimeout(indexUpdateTimer);
            indexUpdateTimer = null;
        }
        if (indexWatchScope) {
            indexWatchScope.stop();
            indexWatchScope = null;
        }
    }

    function startIndexWatchers() {
        if (indexWatchScope) return;

        indexWatchScope = effectScope();
        indexWatchScope.run(() => {
            watch(
                () => searchIndexStore.version,
                () => scheduleIndexUpdate()
            );
        });
    }

    let searchSeq = 0;

    function dispatchSearch() {
        const q = query.value;
        if (!q || q.length < 2) {
            ++searchSeq;
            clearResults();
            return;
        }
        const seq = ++searchSeq;
        const w = getWorker();
        w.postMessage({
            type: 'search',
            payload: {
                seq,
                query: q,
                currentUserId: currentUserId.value,
                language: navigator.language
            }
        });
    }

    watch(query, dispatchSearch);
    watch(currentUserId, () => {
        if (query.value && query.value.length >= 2) {
            dispatchSearch();
        }
    });

    watch(isOpen, (open) => {
        if (open) {
            startIndexWatchers();
            sendIndexUpdate();
            if (query.value && query.value.length >= 2) {
                dispatchSearch();
            }
            return;
        }

        query.value = '';
        clearResults();
        stopIndexWatchers();
        disposeWorker();
    });

    function handleWorkerMessage(event) {
        const { type, payload } = event.data;
        if (type === 'searchResult') {
            if (payload.seq !== searchSeq) return;

            // Enrich friend results with reactive ref from store
            // (Worker can't serialize Vue reactive objects)
            friendResults.value = payload.friends.map((item) => {
                const friendEntry = friendStore.friends.get(item.id);
                return { ...item, ref: friendEntry?.ref };
            });
            ownAvatarResults.value = payload.ownAvatars;
            favoriteAvatarResults.value = payload.favAvatars;
            ownWorldResults.value = payload.ownWorlds;
            favoriteWorldResults.value = payload.favWorlds;
            ownGroupResults.value = payload.ownGroups;
            joinedGroupResults.value = payload.joinedGroups;
        }
    }

    function clearResults() {
        friendResults.value = [];
        ownAvatarResults.value = [];
        favoriteAvatarResults.value = [];
        ownWorldResults.value = [];
        favoriteWorldResults.value = [];
        ownGroupResults.value = [];
        joinedGroupResults.value = [];
    }

    function open() {
        isOpen.value = true;
    }

    function close() {
        isOpen.value = false;
    }

    /**
     * @param {string} value
     */
    function setQuery(value) {
        query.value = value;
    }

    /**
     * @param {{id: string, type: string}} item
     */
    function selectResult(item) {
        if (!item) return;

        close();

        switch (item.type) {
            case 'friend':
                showUserDialog(item.id);
                break;
            case 'avatar':
                showAvatarDialog(item.id);
                break;
            case 'world':
                showWorldDialog(item.id);
                break;
            case 'group':
                showGroupDialog(item.id);
                break;
        }
    }

    return {
        isOpen,
        query,
        friendResults,
        ownAvatarResults,
        favoriteAvatarResults,
        ownWorldResults,
        favoriteWorldResults,
        ownGroupResults,
        joinedGroupResults,
        hasResults,

        open,
        close,
        setQuery,
        selectResult
    };
});
