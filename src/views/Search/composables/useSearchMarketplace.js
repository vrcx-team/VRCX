import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useSearchStore } from '../../../stores';
import { replaceBioSymbols } from '../../../shared/utils';
import { marketplaceRequest } from '../../../api';

function createDefaultSearchMarketplaceParams() {
    return {
        n: 50,
        offset: 0,
        releaseStatus: 'public',
        order: 'ascending',
        marketplace: 'all',
        metadata: true,
        search: ''
    };
}

/**
 * Marketplace avatar search composable for Search view.
 * Manages marketplace search state and pagination.
 */
export function useSearchMarketplace() {
    const { searchText } = storeToRefs(useSearchStore());

    const searchMarketplaceParams = ref(createDefaultSearchMarketplaceParams());
    const searchMarketplaceResults = ref([]);
    const searchMarketplaceHasNext = ref(false);
    const isSearchMarketplaceLoading = ref(false);

    async function searchMarketplace() {
        searchMarketplaceParams.value = {
            ...createDefaultSearchMarketplaceParams(),
            search: replaceBioSymbols(searchText.value)
        };
        await moreSearchMarketplace();
    }

    /**
     * @param go
     */
    async function moreSearchMarketplace(go) {
        const params = searchMarketplaceParams.value;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        isSearchMarketplaceLoading.value = true;
        await marketplaceRequest
            .searchAvatars(params)
            .finally(() => {
                isSearchMarketplaceLoading.value = false;
            })
            .then((args) => {
                const map = new Map();
                for (const json of args.json.results ?? []) {
                    map.set(json.id, {
                        ...json,
                        name: replaceBioSymbols(json.name),
                        authorName: replaceBioSymbols(json.authorName)
                    });
                }
                searchMarketplaceResults.value = Array.from(map.values());
                searchMarketplaceHasNext.value = Boolean(args.json.hasNext);
                return args;
            });
    }

    function clearMarketplaceSearch() {
        searchMarketplaceParams.value = createDefaultSearchMarketplaceParams();
        searchMarketplaceResults.value = [];
        searchMarketplaceHasNext.value = false;
    }

    return {
        searchMarketplaceParams,
        searchMarketplaceResults,
        searchMarketplaceHasNext,
        isSearchMarketplaceLoading,
        searchMarketplace,
        moreSearchMarketplace,
        clearMarketplaceSearch
    };
}
