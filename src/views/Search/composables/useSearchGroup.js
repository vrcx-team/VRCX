import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useSearchStore } from '../../../stores';
import { replaceBioSymbols } from '../../../shared/utils';
import { groupRequest } from '../../../api';

/**
 * Group search composable for Search view.
 * Manages group search state and pagination.
 */
export function useSearchGroup() {
    const { searchText } = storeToRefs(useSearchStore());

    const searchGroupParams = ref({});
    const searchGroupResults = ref([]);
    const isSearchGroupLoading = ref(false);

    /**
     *
     */
    async function searchGroup() {
        searchGroupParams.value = {
            n: 10,
            offset: 0,
            query: replaceBioSymbols(searchText.value)
        };
        await moreSearchGroup();
    }

    /**
     *
     * @param go
     */
    async function moreSearchGroup(go) {
        const params = searchGroupParams.value;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        isSearchGroupLoading.value = true;
        await groupRequest
            .groupSearch(params)
            .finally(() => {
                isSearchGroupLoading.value = false;
            })
            .then((args) => {
                const map = new Map();
                for (const json of args.json) {
                    map.set(json.id, json);
                }
                searchGroupResults.value = Array.from(map.values());
                return args;
            });
    }

    /**
     *
     */
    function clearGroupSearch() {
        searchGroupParams.value = {};
        searchGroupResults.value = [];
    }

    return {
        searchGroupParams,
        searchGroupResults,
        isSearchGroupLoading,
        searchGroup,
        moreSearchGroup,
        clearGroupSearch
    };
}
