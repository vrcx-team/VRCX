<template>
    <div class="x-container" ref="gameLogRef">
        <DataTableLayout
            :table="table"
            :loading="gameLogTable.loading"
            :table-style="tableHeightStyle"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange">
            <template #toolbar>
                <div style="margin: 0 0 10px; display: flex; align-items: center">
                    <div style="flex: none; margin-right: 10px; display: flex; align-items: center">
                        <TooltipWrapper side="bottom" :content="t('view.feed.favorites_only_tooltip')">
                            <span class="inline-flex">
                                <Switch v-model="gameLogTable.vip" @update:modelValue="gameLogTableLookup" />
                            </span>
                        </TooltipWrapper>
                    </div>
                    <Select
                        multiple
                        :model-value="Array.isArray(gameLogTable.filter) ? gameLogTable.filter : []"
                        @update:modelValue="handleGameLogFilterChange">
                        <SelectTrigger class="w-full" style="flex: 1">
                            <SelectValue :placeholder="t('view.game_log.filter_placeholder')" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem
                                    v-for="type in [
                                        'Location',
                                        'OnPlayerJoined',
                                        'OnPlayerLeft',
                                        'VideoPlay',
                                        'Event',
                                        'External',
                                        'StringLoad',
                                        'ImageLoad'
                                    ]"
                                    :key="type"
                                    :value="type">
                                    {{ t('view.game_log.filters.' + type) }}
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputGroupField
                        v-model="gameLogTable.search"
                        :placeholder="t('view.game_log.search_placeholder')"
                        clearable
                        style="flex: 0.4; margin-left: 10px"
                        @keyup.enter="gameLogTableLookup"
                        @change="gameLogTableLookup" />
                </div>
            </template>
        </DataTableLayout>
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref, watch } from 'vue';
    import { Switch } from '@/components/ui/switch';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useGameLogStore, useModalStore, useVrcxStore } from '../../stores';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { InputGroupField } from '../../components/ui/input-group';
    import { createColumns } from './columns.jsx';
    import { database } from '../../service/database';
    import { removeFromArray } from '../../shared/utils';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    const { gameLogTableLookup } = useGameLogStore();
    const { gameLogTable, gameLogTableData } = storeToRefs(useGameLogStore());
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();
    const modalStore = useModalStore();

    function getGameLogCreatedAt(row) {
        if (typeof row?.created_at === 'string' && row.created_at.length > 0) {
            return row.created_at;
        }
        if (typeof row?.createdAt === 'string' && row.createdAt.length > 0) {
            return row.createdAt;
        }
        if (typeof row?.dt === 'string' && row.dt.length > 0) {
            return row.dt;
        }
        return '';
    }

    const { t } = useI18n();

    const gameLogRef = ref(null);
    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(gameLogRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

    function deleteGameLogEntryPrompt(row) {
        modalStore
            .confirm({
                description: t('confirm.delete_log'),
                title: 'Confirm'
            })
            .then(({ ok }) => ok && deleteGameLogEntry(row))
            .catch(() => {});
    }

    function deleteGameLogEntry(row) {
        removeFromArray(gameLogTableData.value, row);
        database.deleteGameLogEntry(row);
    }

    const columns = createColumns({
        getCreatedAt: getGameLogCreatedAt,
        onDelete: deleteGameLogEntry,
        onDeletePrompt: deleteGameLogEntryPrompt
    });

    function handleGameLogFilterChange(value) {
        gameLogTable.value.filter = Array.isArray(value) ? value : [];
        gameLogTableLookup();
    }

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const pageSize = computed(() =>
        gameLogTable.value.pageSizeLinked ? appearanceSettingsStore.tablePageSize : gameLogTable.value.pageSize
    );

    const { table, pagination } = useVrcxVueTable({
        persistKey: 'gameLog',
        data: gameLogTableData,
        columns,
        getRowId: (row, index) => `${row.type}:${row.rowId ?? index}`,
        initialSorting: [],
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
        if (gameLogTable.value.pageSizeLinked) {
            appearanceSettingsStore.setTablePageSize(size);
        } else {
            gameLogTable.value.pageSize = size;
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
