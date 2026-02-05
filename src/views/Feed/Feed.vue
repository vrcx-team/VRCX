<template>
    <div class="x-container feed" ref="feedRef">
        <DataTableLayout
            :table="table"
            :loading="feedTable.loading"
            :table-style="tableHeightStyle"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange">
            <template #toolbar>
                <div style="margin: 0 0 10px; display: flex; align-items: center">
                    <div style="flex: none; margin-right: 10px; display: flex; align-items: center">
                        <TooltipWrapper side="bottom" :content="t('view.feed.favorites_only_tooltip')">
                            <span class="inline-flex">
                                <Switch v-model="feedTable.vip" @update:modelValue="feedTableLookup" />
                            </span>
                        </TooltipWrapper>
                    </div>
                    <ToggleGroup
                        type="multiple"
                        variant="outline"
                        size="sm"
                        :model-value="Array.isArray(feedTable.filter) ? feedTable.filter : []"
                        @update:model-value="handleFeedFilterChange"
                        class="w-full justify-start"
                        style="flex: 1">
                        <ToggleGroupItem v-for="type in feedFilterTypes" :key="type" :value="type">
                            {{ t('view.feed.filters.' + type) }}
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <InputGroupField
                        v-model="feedTable.search"
                        :placeholder="t('view.feed.search_placeholder')"
                        clearable
                        style="flex: 0.4; margin-left: 10px"
                        @keyup.enter="feedTableLookup"
                        @change="feedTableLookup" />
                </div>
            </template>
        </DataTableLayout>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useFeedStore, useVrcxStore } from '../../stores';
    import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { InputGroupField } from '../../components/ui/input-group';
    import { Switch } from '../../components/ui/switch';
    import { columns as baseColumns } from './columns.jsx';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    const { feedTable, feedTableData } = storeToRefs(useFeedStore());
    const { feedTableLookup } = useFeedStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();

    const { t } = useI18n();
    const feedFilterTypes = ['GPS', 'Online', 'Offline', 'Status', 'Avatar', 'Bio'];

    const feedRef = ref(null);

    // TODO: simplify
    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(feedRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const pageSize = computed(() =>
        feedTable.value.pageSizeLinked ? appearanceSettingsStore.tablePageSize : feedTable.value.pageSize
    );

    const { table, pagination } = useVrcxVueTable({
        get data() {
            return feedTableData.value;
        },
        persistKey: 'feed',
        columns: baseColumns,
        getRowId: (row, index) => `${row.type}:${row.created_at ?? ''}:${row.rowId ?? index}`,
        enableExpanded: true,
        getRowCanExpand: () => true,
        initialSorting: [],
        initialExpanded: {},
        initialPagination: {
            pageIndex: 0,
            pageSize: pageSize.value
        }
    });

    const totalItems = computed(() => {
        const length = table.getFilteredRowModel().rows.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        if (feedTable.value.pageSizeLinked) {
            appearanceSettingsStore.setTablePageSize(size);
        } else {
            feedTable.value.pageSize = size;
        }
    };

    function handleFeedFilterChange(value) {
        const selected = Array.isArray(value) ? value : [];
        feedTable.value.filter = selected.length === feedFilterTypes.length ? [] : selected;
        feedTableLookup();
    }

    watch(pageSize, (size) => {
        if (pagination.value.pageSize === size) {
            return;
        }
        pagination.value = {
            ...pagination.value,
            pageIndex: 0,
            pageSize: size
        };
        table.setPageSize(size);
    });
</script>
