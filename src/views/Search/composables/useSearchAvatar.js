import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useAdvancedSettingsStore, useSearchStore } from '../../../stores';
import { lookupAvatars } from '../../../coordinators/avatarCoordinator';

/**
 * Avatar search composable for Search view.
 * Searches remote avatar databases only (local avatar browsing is handled by My Avatars page).
 */
export function useSearchAvatar() {
    const { avatarRemoteDatabase } = storeToRefs(useAdvancedSettingsStore());
    const { searchText } = storeToRefs(useSearchStore());

    const searchAvatarPageNum = ref(0);
    const searchAvatarResults = ref([]);
    const searchAvatarPage = ref([]);
    const isSearchAvatarLoading = ref(false);

    /**
     *
     */
    async function searchAvatar() {
        isSearchAvatarLoading.value = true;
        const avatars = new Map();
        const query = searchText.value;

        if (query && query.length >= 3 && avatarRemoteDatabase.value) {
            const data = await lookupAvatars('search', query);
            if (data && typeof data === 'object') {
                data.forEach((avatar) => {
                    avatars.set(avatar.id, avatar);
                });
            }
        }

        isSearchAvatarLoading.value = false;
        const avatarsArray = Array.from(avatars.values());
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
     */
    function clearAvatarSearch() {
        searchAvatarResults.value = [];
        searchAvatarPage.value = [];
        searchAvatarPageNum.value = 0;
    }

    return {
        searchAvatarPageNum,
        searchAvatarResults,
        searchAvatarPage,
        isSearchAvatarLoading,
        searchAvatar,
        moreSearchAvatar,
        clearAvatarSearch
    };
}
