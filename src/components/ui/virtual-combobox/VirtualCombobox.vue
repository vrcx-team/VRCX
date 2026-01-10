<template>
    <Popover v-model:open="isOpen">
        <PopoverTrigger as-child>
            <Button variant="outline" size="sm" role="combobox" class="w-full justify-between" :disabled="disabled">
                <slot name="trigger" :text="selectionSummaryText" :clear="clearSelection">
                    <span class="truncate">
                        {{ selectionSummaryText || placeholder }}
                    </span>
                </slot>

                <div class="flex items-center gap-2">
                    <span class="opacity-60">▾</span>
                </div>
            </Button>
        </PopoverTrigger>

        <PopoverContent class="w-(--reka-popover-trigger-width) p-2">
            <Input v-if="searchable" v-model="searchText" :placeholder="searchPlaceholder" class="mb-2" />

            <div
                ref="scrollContainerRef"
                class="overflow-auto rounded-md border"
                :style="{ maxHeight: `${maxHeight}px` }">
                <div
                    :style="{
                        height: `${virtualizer.getTotalSize()}px`,
                        position: 'relative'
                    }">
                    <template v-for="virtualRow in virtualizer.getVirtualItems()" :key="String(virtualRow.key)">
                        <div
                            class="absolute left-0 top-0 w-full"
                            :style="{ transform: `translateY(${virtualRow.start}px)` }">
                            <template v-if="virtualListEntries[virtualRow.index]?.type === 'group'">
                                <div
                                    class="px-2 text-xs font-medium opacity-70 flex items-center"
                                    :style="{ height: `${groupHeaderHeight}px` }">
                                    <slot name="group" :group="virtualListEntries[virtualRow.index].group">
                                        {{ virtualListEntries[virtualRow.index].group.label }}
                                    </slot>
                                </div>
                            </template>

                            <template v-else>
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-2 px-2 text-left"
                                    :style="{ height: `${itemHeight}px` }"
                                    @click="toggleSelection(virtualListEntries[virtualRow.index].value)">
                                    <slot
                                        name="item"
                                        :item="virtualListEntries[virtualRow.index].item"
                                        :selected="selectedValueSet.has(virtualListEntries[virtualRow.index].value)">
                                        <span class="truncate text-sm">
                                            {{ virtualListEntries[virtualRow.index].item.label }}
                                        </span>
                                        <span
                                            v-if="selectedValueSet.has(virtualListEntries[virtualRow.index].value)"
                                            class="ml-auto opacity-70">
                                            ✓
                                        </span>
                                    </slot>
                                </button>
                            </template>
                        </div>
                    </template>

                    <div v-if="virtualListEntries.length === 0" class="p-3 text-sm opacity-70">
                        <slot name="empty">Nothing found</slot>
                    </div>
                </div>
            </div>
        </PopoverContent>
    </Popover>
</template>

<script setup>
    import { computed, ref, shallowRef, watch } from 'vue';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { useVirtualizer } from '@tanstack/vue-virtual';

    const props = defineProps({
        modelValue: { type: [String, Number, Array, null], default: null },
        groups: { type: Array, required: true },

        multiple: { type: Boolean, default: false },
        disabled: { type: Boolean, default: false },
        clearable: { type: Boolean, default: true },

        placeholder: { type: String, default: 'Select…' },
        searchPlaceholder: { type: String, default: 'Search…' },

        searchable: { type: Boolean, default: true },

        maxHeight: { type: Number, default: 320 },
        itemHeight: { type: Number, default: 40 },
        groupHeaderHeight: { type: Number, default: 28 },

        closeOnSelect: { type: Boolean, default: false },
        deselectOnReselect: { type: Boolean, default: false }
    });

    const emit = defineEmits(['update:modelValue', 'change', 'clear']);

    const isOpen = ref(false);
    const searchText = ref('');
    const scrollContainerRef = shallowRef(null);

    const normalizedGroups = computed(() => /** @type {Array<any>} */ (props.groups ?? []));

    const selectedValueSet = computed(() => {
        if (props.multiple) {
            const values = Array.isArray(props.modelValue) ? props.modelValue : [];
            return new Set(values.map(String));
        }
        return new Set(props.modelValue != null ? [String(props.modelValue)] : []);
    });

    const virtualListEntries = computed(() => {
        const normalizedSearch = props.searchable ? searchText.value.toLowerCase().trim() : '';

        const entries = [];

        for (const group of normalizedGroups.value) {
            const groupItems = Array.isArray(group?.items) ? group.items : [];

            const filteredItems = normalizedSearch
                ? groupItems.filter((item) =>
                      (item.search ?? item.label ?? '').toLowerCase().includes(normalizedSearch)
                  )
                : groupItems;

            if (!filteredItems.length) continue;

            entries.push({
                type: 'group',
                key: `group:${group?.key ?? ''}`,
                group
            });

            for (const item of filteredItems) {
                entries.push({
                    type: 'item',
                    key: `item:${group?.key ?? ''}:${item?.value}`,
                    group,
                    item,
                    value: String(item.value)
                });
            }
        }

        return entries;
    });

    const selectionSummaryText = computed(() => {
        const selectedValues = Array.from(selectedValueSet.value);
        if (!selectedValues.length) return '';

        const valueToLabelMap = new Map();

        for (const group of normalizedGroups.value) {
            for (const item of group?.items ?? []) {
                valueToLabelMap.set(String(item.value), item.label);
            }
        }

        const visibleLabels = selectedValues.slice(0, 3).map((value) => valueToLabelMap.get(value) ?? value);

        return selectedValues.length <= 3
            ? visibleLabels.join(', ')
            : `${visibleLabels.join(', ')} +${selectedValues.length - 3}`;
    });

    function toggleSelection(value) {
        if (props.multiple) {
            const current = Array.isArray(props.modelValue) ? props.modelValue.map(String) : [];

            const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

            emit('update:modelValue', next);
            emit('change', next);
        } else {
            if (props.deselectOnReselect && selectedValueSet.value.has(value)) {
                clearSelection();
                if (props.closeOnSelect) {
                    isOpen.value = false;
                }
                return;
            }
            emit('update:modelValue', value);
            emit('change', value);

            if (props.closeOnSelect) {
                isOpen.value = false;
            }
        }
    }

    function clearSelection() {
        const nextValue = props.multiple ? [] : null;
        emit('update:modelValue', nextValue);
        emit('clear');
        emit('change', nextValue);
    }

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: virtualListEntries.value.length,
            getScrollElement: () => scrollContainerRef.value,
            estimateSize: (index) =>
                virtualListEntries.value[index]?.type === 'group' ? props.groupHeaderHeight : props.itemHeight,
            overscan: 10
        }))
    );

    watch(searchText, () => {
        virtualizer.value?.scrollToOffset?.(0);
    });
</script>
