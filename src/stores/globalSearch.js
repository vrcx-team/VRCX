import { ref, watch, computed } from 'vue';
import { defineStore } from 'pinia';
import { useAvatarStore } from './avatar';
import { useFavoriteStore } from './favorite';
import { useFriendStore } from './friend';
import { useGroupStore } from './group';
import { useUserStore } from './user';
import { useWorldStore } from './world';
import { showGroupDialog } from '../coordinators/groupCoordinator';
import { showWorldDialog } from '../coordinators/worldCoordinator';
import { showAvatarDialog } from '../coordinators/avatarCoordinator';
import { showUserDialog } from '../coordinators/userCoordinator';

import SearchWorker from './searchWorker.js?worker';

export const useGlobalSearchStore = defineStore('GlobalSearch', () => {
    const friendStore = useFriendStore();
    const favoriteStore = useFavoriteStore();
    const avatarStore = useAvatarStore();
    const worldStore = useWorldStore();
    const groupStore = useGroupStore();
    const userStore = useUserStore();

    const isOpen = ref(false);
    const query = ref('');

    // Worker instance (lazy)
    let worker = null;
    let indexUpdateTimer = null;

    function getWorker() {
        if (!worker) {
            worker = new SearchWorker();
            worker.onmessage = handleWorkerMessage;
        }
        return worker;
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

    watch(isOpen, (open) => {
        if (!open) {
            query.value = '';
            clearResults();
        }
    });

    // Send index update to worker when data changes
    function scheduleIndexUpdate() {
        if (indexUpdateTimer) clearTimeout(indexUpdateTimer);
        indexUpdateTimer = setTimeout(() => {
            indexUpdateTimer = null;
            sendIndexUpdate();
        }, 200);
    }

    function sendIndexUpdate() {
        const w = getWorker();

        const friends = [];
        for (const ctx of friendStore.friends.values()) {
            if (typeof ctx.ref === 'undefined') continue;
            friends.push({
                id: ctx.id,
                name: ctx.name,
                memo: ctx.memo || '',
                note: ctx.ref.note || '',
                imageUrl: ctx.ref.currentAvatarThumbnailImageUrl
            });
        }

        const avatars = [];
        for (const ref of avatarStore.cachedAvatars.values()) {
            if (!ref || !ref.name) continue;
            avatars.push({
                id: ref.id,
                name: ref.name,
                authorId: ref.authorId,
                imageUrl: ref.thumbnailImageUrl || ref.imageUrl
            });
        }

        const worlds = [];
        for (const ref of worldStore.cachedWorlds.values()) {
            if (!ref || !ref.name) continue;
            worlds.push({
                id: ref.id,
                name: ref.name,
                authorId: ref.authorId,
                imageUrl: ref.thumbnailImageUrl || ref.imageUrl
            });
        }

        const groups = [];
        for (const ref of groupStore.currentUserGroups.values()) {
            if (!ref || !ref.name) continue;
            groups.push({
                id: ref.id,
                name: ref.name,
                ownerId: ref.ownerId,
                imageUrl: ref.iconUrl || ref.bannerUrl
            });
        }

        const favAvatars = [];
        for (const ctx of favoriteStore.favoriteAvatars) {
            if (!ctx?.ref?.name) continue;
            favAvatars.push({
                id: ctx.ref.id,
                name: ctx.ref.name,
                imageUrl: ctx.ref.thumbnailImageUrl || ctx.ref.imageUrl
            });
        }

        const favWorlds = [];
        for (const ctx of favoriteStore.favoriteWorlds) {
            if (!ctx?.ref?.name) continue;
            favWorlds.push({
                id: ctx.ref.id,
                name: ctx.ref.name,
                imageUrl: ctx.ref.thumbnailImageUrl || ctx.ref.imageUrl
            });
        }

        w.postMessage({
            type: 'updateIndex',
            payload: { friends, avatars, worlds, groups, favAvatars, favWorlds }
        });
    }

    watch(
        () => friendStore.friends,
        () => scheduleIndexUpdate(),
        { deep: true }
    );

    watch(
        () => avatarStore.cachedAvatars,
        () => scheduleIndexUpdate(),
        { deep: true }
    );

    watch(
        () => worldStore.cachedWorlds,
        () => scheduleIndexUpdate(),
        { deep: true }
    );

    watch(
        () => groupStore.currentUserGroups,
        () => scheduleIndexUpdate(),
        { deep: true }
    );

    watch(
        () => favoriteStore.favoriteAvatars,
        () => scheduleIndexUpdate(),
        { deep: true }
    );

    watch(
        () => favoriteStore.favoriteWorlds,
        () => scheduleIndexUpdate(),
        { deep: true }
    );

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
        if (query.value && query.value.length >= 2) dispatchSearch();
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
        sendIndexUpdate();
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
