import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { replaceBioSymbols } from '../../../shared/utils';
import { useAuthStore, useSearchStore, useWorldStore } from '../../../stores';
import { worldRequest } from '../../../api';

/**
 * World search composable for Search view.
 * Manages world search state, category selection, and pagination.
 */
export function useSearchWorld() {
    const { cachedWorlds } = useWorldStore();
    const { searchText } = storeToRefs(useSearchStore());
    const { cachedConfig } = storeToRefs(useAuthStore());

    const searchWorldOption = ref('');
    const searchWorldLabs = ref(false);
    const searchWorldParams = ref({});
    const searchWorldCategoryIndex = ref(null);
    const searchWorldResults = ref([]);
    const isSearchWorldLoading = ref(false);

    /**
     *
     * @param ref
     */
    function searchWorld(ref) {
        searchWorldOption.value = '';
        searchWorldCategoryIndex.value = ref?.index ?? null;
        const params = {
            n: 10,
            offset: 0
        };
        switch (ref.sortHeading) {
            case 'featured':
                params.sort = 'order';
                params.featured = 'true';
                break;
            case 'trending':
                params.sort = 'popularity';
                params.featured = 'false';
                break;
            case 'updated':
                params.sort = 'updated';
                break;
            case 'created':
                params.sort = 'created';
                break;
            case 'publication':
                params.sort = 'publicationDate';
                break;
            case 'shuffle':
                params.sort = 'shuffle';
                break;
            case 'active':
                searchWorldOption.value = 'active';
                break;
            case 'recent':
                searchWorldOption.value = 'recent';
                break;
            case 'favorite':
                searchWorldOption.value = 'favorites';
                break;
            case 'labs':
                params.sort = 'labsPublicationDate';
                break;
            case 'heat':
                params.sort = 'heat';
                params.featured = 'false';
                break;
            default:
                params.sort = 'relevance';
                params.search = replaceBioSymbols(searchText.value);
                break;
        }
        params.order = ref.sortOrder || 'descending';
        if (ref.sortOwnership === 'mine') {
            params.user = 'me';
            params.releaseStatus = 'all';
        }
        if (ref.tag) {
            params.tag = ref.tag;
        }
        if (!searchWorldLabs.value) {
            if (params.tag) {
                params.tag += ',system_approved';
            } else {
                params.tag = 'system_approved';
            }
        }
        // TODO: option.platform
        searchWorldParams.value = params;
        moreSearchWorld();
    }

    /**
     *
     * @param index
     */
    function handleSearchWorldCategorySelect(index) {
        searchWorldCategoryIndex.value = index;
        const row = cachedConfig.value?.dynamicWorldRows?.find(
            (r) => r.index === index
        );
        searchWorld(row || {});
    }

    /**
     *
     * @param go
     */
    function moreSearchWorld(go) {
        const params = searchWorldParams.value;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        isSearchWorldLoading.value = true;
        worldRequest
            .getWorlds(params, searchWorldOption.value)
            .finally(() => {
                isSearchWorldLoading.value = false;
            })
            .then((args) => {
                const map = new Map();
                for (const json of args.json) {
                    const ref = cachedWorlds.get(json.id);
                    if (typeof ref !== 'undefined') {
                        map.set(ref.id, ref);
                    }
                }
                searchWorldResults.value = Array.from(map.values());
                return args;
            });
    }

    /**
     *
     */
    function clearWorldSearch() {
        searchWorldParams.value = {};
        searchWorldResults.value = [];
    }

    return {
        searchWorldOption,
        searchWorldLabs,
        searchWorldParams,
        searchWorldCategoryIndex,
        searchWorldResults,
        isSearchWorldLoading,
        searchWorld,
        moreSearchWorld,
        handleSearchWorldCategorySelect,
        clearWorldSearch
    };
}
