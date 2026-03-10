import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import {
    compareByCreatedAt,
    compareByName,
    compareByUpdatedAt
} from '../../../shared/utils';
import {
    useAdvancedSettingsStore,
    useAvatarStore,
    useSearchStore
} from '../../../stores';

/**
 * Avatar search composable for Search view.
 * Manages avatar search state, local/remote filtering, sorting, and pagination.
 */
export function useSearchAvatar() {
    const { avatarRemoteDatabase } = storeToRefs(useAdvancedSettingsStore());
    const { lookupAvatars, cachedAvatars } = useAvatarStore();
    const { searchText } = storeToRefs(useSearchStore());

    const searchAvatarFilter = ref('');
    const searchAvatarSort = ref('');
    const searchAvatarFilterRemote = ref('');
    const searchAvatarPageNum = ref(0);
    const searchAvatarResults = ref([]);
    const searchAvatarPage = ref([]);
    const isSearchAvatarLoading = ref(false);

    /**
     *
     */
    async function searchAvatar() {
        let ref;
        isSearchAvatarLoading.value = true;
        if (!searchAvatarFilter.value) {
            searchAvatarFilter.value = 'all';
        }
        if (!searchAvatarSort.value) {
            searchAvatarSort.value = 'name';
        }
        if (!searchAvatarFilterRemote.value) {
            searchAvatarFilterRemote.value = 'all';
        }
        if (searchAvatarFilterRemote.value !== 'local') {
            searchAvatarSort.value = 'name';
        }
        const avatars = new Map();
        const query = searchText.value;
        const queryUpper = query.toUpperCase();
        if (!query) {
            for (ref of cachedAvatars.values()) {
                switch (searchAvatarFilter.value) {
                    case 'all':
                        avatars.set(ref.id, ref);
                        break;
                    case 'public':
                        if (ref.releaseStatus === 'public') {
                            avatars.set(ref.id, ref);
                        }
                        break;
                    case 'private':
                        if (ref.releaseStatus === 'private') {
                            avatars.set(ref.id, ref);
                        }
                        break;
                }
            }
            isSearchAvatarLoading.value = false;
        } else {
            if (
                searchAvatarFilterRemote.value === 'all' ||
                searchAvatarFilterRemote.value === 'local'
            ) {
                for (ref of cachedAvatars.values()) {
                    let match = ref.name.toUpperCase().includes(queryUpper);
                    if (!match && ref.description) {
                        match = ref.description
                            .toUpperCase()
                            .includes(queryUpper);
                    }
                    if (!match && ref.authorName) {
                        match = ref.authorName
                            .toUpperCase()
                            .includes(queryUpper);
                    }
                    if (match) {
                        switch (searchAvatarFilter.value) {
                            case 'all':
                                avatars.set(ref.id, ref);
                                break;
                            case 'public':
                                if (ref.releaseStatus === 'public') {
                                    avatars.set(ref.id, ref);
                                }
                                break;
                            case 'private':
                                if (ref.releaseStatus === 'private') {
                                    avatars.set(ref.id, ref);
                                }
                                break;
                        }
                    }
                }
            }
            if (
                (searchAvatarFilterRemote.value === 'all' ||
                    searchAvatarFilterRemote.value === 'remote') &&
                avatarRemoteDatabase.value &&
                query.length >= 3
            ) {
                const data = await lookupAvatars('search', query);
                if (data && typeof data === 'object') {
                    data.forEach((avatar) => {
                        avatars.set(avatar.id, avatar);
                    });
                }
            }
            isSearchAvatarLoading.value = false;
        }
        const avatarsArray = Array.from(avatars.values());
        if (searchAvatarFilterRemote.value === 'local') {
            switch (searchAvatarSort.value) {
                case 'updated':
                    avatarsArray.sort(compareByUpdatedAt);
                    break;
                case 'created':
                    avatarsArray.sort(compareByCreatedAt);
                    break;
                case 'name':
                    avatarsArray.sort(compareByName);
                    break;
            }
        }
        searchAvatarPageNum.value = 0;
        searchAvatarResults.value = avatarsArray;
        searchAvatarPage.value = avatarsArray.slice(0, 10);
    }
    /**
     *
     * @param n
     */
    function moreSearchAvatar(n) {
        let offset;
        if (n === -1) {
            searchAvatarPageNum.value--;
            offset = searchAvatarPageNum.value * 10;
        }
        if (n === 1) {
            searchAvatarPageNum.value++;
            offset = searchAvatarPageNum.value * 10;
        }
        searchAvatarPage.value = searchAvatarResults.value.slice(
            offset,
            offset + 10
        );
    }

    /**
     *
     * @param value
     */
    function handleSearchAvatarFilterChange(value) {
        searchAvatarFilter.value = value;
        searchAvatar();
    }

    /**
     *
     * @param value
     */
    function handleSearchAvatarFilterRemoteChange(value) {
        searchAvatarFilterRemote.value = value;
        searchAvatar();
    }

    /**
     *
     * @param value
     */
    function handleSearchAvatarSortChange(value) {
        searchAvatarSort.value = value;
        searchAvatar();
    }

    /**
     *
     */
    function clearAvatarSearch() {
        searchAvatarResults.value = [];
        searchAvatarPage.value = [];
        searchAvatarPageNum.value = 0;
    }

    return {
        searchAvatarFilter,
        searchAvatarSort,
        searchAvatarFilterRemote,
        searchAvatarPageNum,
        searchAvatarResults,
        searchAvatarPage,
        isSearchAvatarLoading,
        searchAvatar,
        moreSearchAvatar,
        handleSearchAvatarFilterChange,
        handleSearchAvatarFilterRemoteChange,
        handleSearchAvatarSortChange,
        clearAvatarSearch
    };
}
