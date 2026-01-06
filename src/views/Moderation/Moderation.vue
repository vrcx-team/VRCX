<template>
    <div class="x-container" ref="moderationRef">
        <div class="tool-slot">
            <el-select
                v-model="playerModerationTable.filters[0].value"
                @change="saveTableFilters()"
                multiple
                clearable
                style="flex: 1"
                :placeholder="t('view.moderation.filter_placeholder')">
                <el-option
                    v-for="item in moderationTypes"
                    :key="item"
                    :label="t('view.moderation.filters.' + item)"
                    :value="item" />
            </el-select>
            <el-input
                v-model="playerModerationTable.filters[1].value"
                :placeholder="t('view.moderation.search_placeholder')"
                class="filter-input" />
            <el-tooltip placement="bottom" :content="t('view.moderation.refresh_tooltip')">
                <el-button
                    type="default"
                    :loading="playerModerationTable.loading"
                    @click="refreshPlayerModerations()"
                    :icon="Refresh"
                    circle />
            </el-tooltip>
        </div>

        <DataTableLayout
            :table="table"
            :loading="playerModerationTable.loading"
            :table-style="tableHeightStyle"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange" />
    </div>
</template>

<script setup>
    import { Refresh } from '@element-plus/icons-vue';
    import { ElMessageBox } from 'element-plus';
    import {
        getCoreRowModel,
        getFilteredRowModel,
        getPaginationRowModel,
        getSortedRowModel,
        useVueTable
    } from '@tanstack/vue-table';
    import { computed, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useModerationStore, useVrcxStore } from '../../stores';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { createColumns } from './columns.jsx';
    import { moderationTypes } from '../../shared/constants';
    import { playerModerationRequest } from '../../api';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { valueUpdater } from '../../components/ui/table/utils';

    import configRepository from '../../service/config.js';

    const { t } = useI18n();
    const { playerModerationTable } = storeToRefs(useModerationStore());
    const { refreshPlayerModerations, handlePlayerModerationDelete } = useModerationStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();

    const moderationRef = ref(null);
    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(moderationRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

    async function init() {
        playerModerationTable.value.filters[0].value = JSON.parse(
            await configRepository.getString('VRCX_playerModerationTableFilters', '[]')
        );
    }

    init();

    function saveTableFilters() {
        configRepository.setString(
            'VRCX_playerModerationTableFilters',
            JSON.stringify(playerModerationTable.value.filters[0].value)
        );
    }

    async function deletePlayerModeration(row) {
        const args = await playerModerationRequest.deletePlayerModeration({
            moderated: row.targetUserId,
            type: row.type
        });
        handlePlayerModerationDelete(args);
    }

    function deletePlayerModerationPrompt(row) {
        ElMessageBox.confirm(`Continue? Delete Moderation ${row.type}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deletePlayerModeration(row);
                }
            })
            .catch(() => {});
    }

    const moderationDisplayData = computed(() => {
        const data = playerModerationTable.value.data;
        const typeFilter = playerModerationTable.value.filters?.[0]?.value ?? [];
        const searchFilter = playerModerationTable.value.filters?.[1]?.value ?? '';
        const typeSet = Array.isArray(typeFilter)
            ? new Set(typeFilter.map((value) => String(value).toLowerCase()))
            : null;
        const searchValue = String(searchFilter).trim().toLowerCase();

        return data.filter((row) => {
            if (typeSet && typeSet.size > 0) {
                const rowType = String(row.type ?? '').toLowerCase();
                if (!typeSet.has(rowType)) {
                    return false;
                }
            }
            if (searchValue) {
                const source = String(row.sourceDisplayName ?? '').toLowerCase();
                const target = String(row.targetDisplayName ?? '').toLowerCase();
                if (!source.includes(searchValue) && !target.includes(searchValue)) {
                    return false;
                }
            }
            return true;
        });
    });

    const columns = createColumns({
        onDelete: deletePlayerModeration,
        onDeletePrompt: deletePlayerModerationPrompt
    });

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const pageSize = computed(() =>
        playerModerationTable.value.pageSizeLinked
            ? appearanceSettingsStore.tablePageSize
            : playerModerationTable.value.pageSize
    );

    const sorting = ref([{ id: 'created', desc: true }]);
    const pagination = ref({
        pageIndex: 0,
        pageSize: pageSize.value
    });

    const table = useVueTable({
        data: moderationDisplayData,
        columns,
        getRowId: (row) => row.id ?? `${row.type}:${row.sourceUserId}:${row.targetUserId}:${row.created ?? ''}`,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
        onPaginationChange: (updaterOrValue) => valueUpdater(updaterOrValue, pagination),
        state: {
            get sorting() {
                return sorting.value;
            },
            get pagination() {
                return pagination.value;
            }
        }
    });

    const totalItems = computed(() => {
        const length = table.getFilteredRowModel().rows.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        if (playerModerationTable.value.pageSizeLinked) {
            appearanceSettingsStore.setTablePageSize(size);
        } else {
            playerModerationTable.value.pageSize = size;
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
    .tool-slot {
        margin: 0 0 10px;
        display: flex;
        align-items: center;
    }
    .filter-input {
        width: 150px;
        margin: 0 10px;
    }
</style>
