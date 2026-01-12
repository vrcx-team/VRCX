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
                            <Switch v-model="gameLogTable.vip" @update:modelValue="gameLogTableLookup" />
                        </TooltipWrapper>
                    </div>
                    <el-select
                        v-model="gameLogTable.filter"
                        multiple
                        clearable
                        style="flex: 1"
                        :placeholder="t('view.game_log.filter_placeholder')"
                        @change="gameLogTableLookup">
                        <el-option
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
                            :label="t('view.game_log.filters.' + type)"
                            :value="type"></el-option>
                    </el-select>
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
    import { computed, ref, watch } from 'vue';
    import { ElMessageBox } from 'element-plus';
    import { Switch } from '@/components/ui/switch';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { useAppearanceSettingsStore, useGameLogStore, useVrcxStore } from '../../stores';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { InputGroupField } from '../../components/ui/input-group';
    import { createColumns } from './columns.jsx';
    import { database } from '../../service/database';
    import { removeFromArray } from '../../shared/utils';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    const { gameLogTableLookup } = useGameLogStore();
    const { gameLogTable } = storeToRefs(useGameLogStore());
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();

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

    function getGameLogCreatedAtTs(row) {
        const createdAtRaw = row?.created_at ?? row?.createdAt ?? row?.dt;
        if (typeof createdAtRaw === 'number') {
            const ts = createdAtRaw > 1_000_000_000_000 ? createdAtRaw : createdAtRaw * 1000;
            return Number.isFinite(ts) ? ts : 0;
        }

        const createdAt = getGameLogCreatedAt(row);
        const ts = dayjs(createdAt).valueOf();
        return Number.isFinite(ts) ? ts : 0;
    }

    const gameLogDisplayData = computed(() => {
        const data = gameLogTable.value.data;
        return data.slice().sort((a, b) => {
            const aTs = getGameLogCreatedAtTs(a);
            const bTs = getGameLogCreatedAtTs(b);
            if (aTs !== bTs) {
                return bTs - aTs;
            }

            const aRowId = typeof a?.rowId === 'number' ? a.rowId : 0;
            const bRowId = typeof b?.rowId === 'number' ? b.rowId : 0;
            if (aRowId !== bRowId) {
                return bRowId - aRowId;
            }

            const aUid = typeof a?.uid === 'string' ? a.uid : '';
            const bUid = typeof b?.uid === 'string' ? b.uid : '';
            return aUid < bUid ? 1 : aUid > bUid ? -1 : 0;
        });
    });

    const { t } = useI18n();

    const gameLogRef = ref(null);
    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(gameLogRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

    function deleteGameLogEntryPrompt(row) {
        ElMessageBox.confirm('Continue? Delete Log', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deleteGameLogEntry(row);
                }
            })
            .catch(() => {});
    }

    function deleteGameLogEntry(row) {
        removeFromArray(gameLogTable.value.data, row);
        database.deleteGameLogEntry(row);
    }

    const columns = createColumns({
        getCreatedAt: getGameLogCreatedAt,
        onDelete: deleteGameLogEntry,
        onDeletePrompt: deleteGameLogEntryPrompt
    });

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const pageSize = computed(() =>
        gameLogTable.value.pageSizeLinked ? appearanceSettingsStore.tablePageSize : gameLogTable.value.pageSize
    );

    const { table, pagination } = useVrcxVueTable({
        persistKey: 'gameLog',
        data: gameLogDisplayData,
        columns,
        getRowId: (row) => `${row.type}:${row.rowId ?? row.displayName + row.location + row.time}`,
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

<style scoped>
    .table-user {
        color: var(--x-table-user-text-color) !important;
    }
</style>
