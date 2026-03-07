import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';

import {
    searchAvatars,
    searchFavoriteAvatars,
    searchFavoriteWorlds,
    searchFriends,
    searchGroups,
    searchWorlds
} from '../shared/utils/globalSearchUtils';
import { useAvatarStore } from './avatar';
import { useFavoriteStore } from './favorite';
import { useFriendStore } from './friend';
import { useGroupStore } from './group';
import { useUserStore } from './user';
import { useWorldStore } from './world';

export const useGlobalSearchStore = defineStore('GlobalSearch', () => {
    const friendStore = useFriendStore();
    const favoriteStore = useFavoriteStore();
    const avatarStore = useAvatarStore();
    const worldStore = useWorldStore();
    const groupStore = useGroupStore();
    const userStore = useUserStore();

    const isOpen = ref(false);
    const query = ref('');

    const stringComparer = computed(
        () =>
            new Intl.Collator(undefined, {
                usage: 'search',
                sensitivity: 'base'
            })
    );

    // Reset query when dialog closes
    watch(isOpen, (open) => {
        if (!open) {
            query.value = '';
        }
    });

    const currentUserId = computed(() => userStore.currentUser?.id);

    const friendResults = computed(() => {
        if (!query.value || query.value.length < 2) return [];
        return searchFriends(
            query.value,
            friendStore.friends,
            stringComparer.value
        );
    });

    // Own avatars (filter cachedAvatars by authorId)
    const ownAvatarResults = computed(() => {
        if (!query.value || query.value.length < 2) return [];
        return searchAvatars(
            query.value,
            avatarStore.cachedAvatars,
            stringComparer.value,
            currentUserId.value
        );
    });

    // Favorite avatars (from favoriteStore, deduplicated against own)
    const favoriteAvatarResults = computed(() => {
        if (!query.value || query.value.length < 2) return [];
        const favResults = searchFavoriteAvatars(
            query.value,
            favoriteStore.favoriteAvatars,
            stringComparer.value
        );
        // Deduplicate: remove items already in ownAvatarResults
        const ownIds = new Set(ownAvatarResults.value.map((r) => r.id));
        return favResults.filter((r) => !ownIds.has(r.id));
    });

    // Own worlds (filter cachedWorlds by authorId)
    const ownWorldResults = computed(() => {
        if (!query.value || query.value.length < 2) return [];
        return searchWorlds(
            query.value,
            worldStore.cachedWorlds,
            stringComparer.value,
            currentUserId.value
        );
    });

    // Favorite worlds (from favoriteStore, deduplicated against own)
    const favoriteWorldResults = computed(() => {
        if (!query.value || query.value.length < 2) return [];
        const favResults = searchFavoriteWorlds(
            query.value,
            favoriteStore.favoriteWorlds,
            stringComparer.value
        );
        // Deduplicate: remove items already in ownWorldResults
        const ownIds = new Set(ownWorldResults.value.map((r) => r.id));
        return favResults.filter((r) => !ownIds.has(r.id));
    });

    // Own groups (filter by ownerId === currentUser)
    const ownGroupResults = computed(() => {
        if (!query.value || query.value.length < 2) return [];
        return searchGroups(
            query.value,
            groupStore.currentUserGroups,
            stringComparer.value,
            currentUserId.value
        );
    });

    // Joined groups (all matching groups, deduplicated against own)
    const joinedGroupResults = computed(() => {
        if (!query.value || query.value.length < 2) return [];
        const allResults = searchGroups(
            query.value,
            groupStore.currentUserGroups,
            stringComparer.value
        );
        const ownIds = new Set(ownGroupResults.value.map((r) => r.id));
        return allResults.filter((r) => !ownIds.has(r.id));
    });

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

    /**
     *
     */
    function open() {
        isOpen.value = true;
    }

    /**
     *
     */
    function close() {
        isOpen.value = false;
    }

    /**
     * @param {{id: string, type: string}} item
     */
    function selectResult(item) {
        if (!item) return;

        close();

        switch (item.type) {
            case 'friend':
                userStore.showUserDialog(item.id);
                break;
            case 'avatar':
                avatarStore.showAvatarDialog(item.id);
                break;
            case 'world':
                worldStore.showWorldDialog(item.id);
                break;
            case 'group':
                groupStore.showGroupDialog(item.id);
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
        selectResult
    };
});
