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
     * Also overrides the built-in filter when query < 2 chars so that
     * hint category items remain visible.
     */
    import { nextTick, watch } from 'vue';
    import { useCommand } from '@/components/ui/command';

    import { useQuickSearchStore } from '../stores/quickSearch';

    const { filterState, allItems, allGroups } = useCommand();
    const quickSearchStore = useQuickSearchStore();

    watch(
        () => filterState.search,
        async (value) => {
            quickSearchStore.setQuery(value);

            // When query < 2 chars, override the built-in filter
            // so all items (hint categories) stay visible
            if (value && value.length < 2) {
                await nextTick();
                for (const id of allItems.value.keys()) {
                    filterState.filtered.items.set(id, 1);
                }
                filterState.filtered.count = allItems.value.size;
                for (const groupId of allGroups.value.keys()) {
                    filterState.filtered.groups.add(groupId);
                }
            }
        }
    );
</script>
