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
                            <Switch v-model="feedTable.vip" @update:modelValue="feedTableLookup" />
                        </TooltipWrapper>
                    </div>
                    <el-select
                        v-model="feedTable.filter"
                        multiple
                        clearable
                        style="flex: 1"
                        :placeholder="t('view.feed.filter_placeholder')"
                        @change="feedTableLookup">
                        <el-option
                            v-for="type in ['GPS', 'Online', 'Offline', 'Status', 'Avatar', 'Bio']"
                            :key="type"
                            :label="t('view.feed.filters.' + type)"
                            :value="type"></el-option>
                    </el-select>
                    <el-input
                        v-model="feedTable.search"
                        :placeholder="t('view.feed.search_placeholder')"
                        clearable
                        style="flex: 0.4; margin-left: 10px"
                        @keyup.enter="feedTableLookup"
                        @change="feedTableLookup"></el-input>
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
    import { DataTableLayout } from '../../components/ui/data-table';
    import { Switch } from '../../components/ui/switch';
    import { columns as baseColumns } from './columns.jsx';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    const { feedTable } = storeToRefs(useFeedStore());
    const { feedTableLookup } = useFeedStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();

    const feedDisplayData = computed(() => feedTable.value.data.slice().reverse());

    const { t } = useI18n();

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
        persistKey: 'feed',
        data: feedDisplayData,
        columns: baseColumns,
        getRowId: (row) => `${row.type}:${row.rowId}:${row.created_at ?? ''}`,
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

<style scoped>
    .table-user {
        color: var(--x-table-user-text-color) !important;
    }
</style>
