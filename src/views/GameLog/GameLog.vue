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
                <div class="mt-0 mx-0 mb-2" style="display: flex; align-items: center">
                    <div class="mr-2" style="flex: none; display: flex; align-items: center">
                        <TooltipWrapper side="bottom" :content="t('view.feed.favorites_only_tooltip')">
                            <div>
                                <Toggle
                                    variant="outline"
                                    size="sm"
                                    :model-value="gameLogTable.vip"
                                    @update:modelValue="
                                        (v) => {
                                            gameLogTable.vip = v;
                                            gameLogTableLookup();
                                        }
                                    ">
                                    <Star />
                                </Toggle>
                            </div>
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
                        class="ml-2"
                        v-model="gameLogTable.search"
                        :placeholder="t('view.game_log.search_placeholder')"
                        clearable
                        style="flex: 0.4"
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
    import { Star } from 'lucide-vue-next';
    import { Toggle } from '@/components/ui/toggle';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useGameLogStore, useModalStore, useVrcxStore } from '../../stores';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { InputGroupField } from '../../components/ui/input-group';
    import { createColumns } from './columns.jsx';
    import { database } from '../../services/database';
    import { removeFromArray } from '../../shared/utils';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    const { gameLogTableLookup } = useGameLogStore();
    const { gameLogTable, gameLogTableData } = storeToRefs(useGameLogStore());
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();
    const modalStore = useModalStore();

    /**
     *
     * @param row
     */
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

    /**
     *
     * @param row
     */
    function deleteGameLogEntryPrompt(row) {
        modalStore
            .confirm({
                description: t('confirm.delete_log'),
                title: 'Confirm'
            })
            .then(({ ok }) => ok && deleteGameLogEntry(row))
            .catch(() => {});
    }

    /**
     *
     * @param row
     */
    function deleteGameLogEntry(row) {
        removeFromArray(gameLogTableData.value, row);
        database.deleteGameLogEntry(row);
    }

    const columns = createColumns({
        getCreatedAt: getGameLogCreatedAt,
        onDelete: deleteGameLogEntry,
        onDeletePrompt: deleteGameLogEntryPrompt
    });

    /**
     *
     * @param value
     */
    function handleGameLogFilterChange(value) {
        gameLogTable.value.filter = Array.isArray(value) ? value : [];
        gameLogTableLookup();
    }

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);

    /**
     *
     * @param row
     */
    function getGameLogRowId(row) {
        if (row?.rowId != null) return `row:${row.rowId}`;

        const type = row?.type ?? '';
        const createdAt = row?.created_at ?? row?.createdAt ?? row?.dt ?? '';
        const userId = row?.userId ?? '';
        const displayName = row?.displayName ?? '';
        const location = row?.location ?? '';

        return `${type}:${createdAt}:${userId}:${displayName}:${location}`;
    }

    const { table, pagination } = useVrcxVueTable({
        persistKey: 'gameLog',
        get data() {
            return gameLogTableData.value;
        },
        columns,
        getRowId: getGameLogRowId,
        initialSorting: [],
        initialPagination: {
            pageIndex: 0,
            pageSize: appearanceSettingsStore.tablePageSize
        },
        tableOptions: {
            autoResetPageIndex: false
        }
    });

    const totalItems = computed(() => {
        const length = table.getFilteredRowModel().rows.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        pagination.value = {
            ...pagination.value,
            pageIndex: 0,
            pageSize: size
        };
    };
</script>
