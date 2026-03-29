<script>
    export default {
        render: () => null
    };
</script>

<script setup>
    /**
     * Renderless bridge component — must live inside the Command context.
     * Watches filterState.search (set by CommandInput) and syncs it
     * to the global search store's query ref.
     * Overrides the built-in Command filter so that visibility is fully
     * controlled by the Worker search results (which handle confusable
     * characters, diacritics, and locale-aware matching).
     */
    import { nextTick, watch } from 'vue';
    import { useCommand } from '@/components/ui/command';

    import { useQuickSearchStore } from '../stores/quickSearch';

    const { filterState, allItems, allGroups } = useCommand();
    const quickSearchStore = useQuickSearchStore();

    function overrideFilter() {
        for (const id of allItems.value.keys()) {
            filterState.filtered.items.set(id, 1);
        }
        filterState.filtered.count = allItems.value.size;
        for (const groupId of allGroups.value.keys()) {
            filterState.filtered.groups.add(groupId);
        }
    }

    watch(
        () => filterState.search,
        async (value) => {
            quickSearchStore.setQuery(value);

            // Override the built-in Command filter for all queries.
            // The Worker already handles confusable-character normalization
            // and locale-aware matching; the Command's built-in useFilter
            // (which uses a plain Intl.Collator) would otherwise hide
            // results that the Worker correctly matched via confusables.
            if (value) {
                await nextTick();
                overrideFilter();
            }

            // [OLD] Only override when query < 2 chars (hint categories).
            // If above approach causes issues, revert to this:
            // if (value && value.length < 2) {
            //     await nextTick();
            //     for (const id of allItems.value.keys()) {
            //         filterState.filtered.items.set(id, 1);
            //     }
            //     filterState.filtered.count = allItems.value.size;
            //     for (const groupId of allGroups.value.keys()) {
            //         filterState.filtered.groups.add(groupId);
            //     }
            // }
        }
    );
</script>
