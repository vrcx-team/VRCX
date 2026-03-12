import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useSearchStore } from '../../../stores';

/**
 * User search composable for Search view.
 * Manages user search state, filters, and pagination.
 */
export function useSearchUser() {
    const { searchText } = storeToRefs(useSearchStore());
    const { moreSearchUser } = useSearchStore();

    const searchUserParams = ref({});
    const searchUserByBio = ref(false);
    const searchUserSortByLastLoggedIn = ref(false);
    const isSearchUserLoading = ref(false);

    /**
     *
     */
    async function searchUser() {
        searchUserParams.value = {
            n: 10,
            offset: 0,
            search: searchText.value,
            customFields: searchUserByBio.value ? 'bio' : 'displayName',
            sort: searchUserSortByLastLoggedIn.value
                ? 'last_login'
                : 'relevance'
        };
        await handleMoreSearchUser();
    }

    /**
     *
     * @param go
     */
    async function handleMoreSearchUser(go = null) {
        isSearchUserLoading.value = true;
        await moreSearchUser(go, searchUserParams.value);
        isSearchUserLoading.value = false;
    }

    /**
     *
     */
    function clearUserSearch() {
        searchUserParams.value = {};
    }

    return {
        searchUserParams,
        searchUserByBio,
        searchUserSortByLastLoggedIn,
        isSearchUserLoading,
        searchUser,
        handleMoreSearchUser,
        clearUserSearch
    };
}
