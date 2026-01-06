<template>
    <div class="x-container" ref="friendLogRef">
        <DataTableLayout
            :table="table"
            :table-style="tableHeightStyle"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange">
            <template #toolbar>
                <div style="margin: 0 0 10px; display: flex; align-items: center">
                    <el-select
                        v-model="friendLogTable.filters[0].value"
                        multiple
                        clearable
                        style="flex: 1"
                        :placeholder="t('view.friend_log.filter_placeholder')"
                        @change="saveTableFilters">
                        <el-option
                            v-for="type in [
                                'Friend',
                                'Unfriend',
                                'FriendRequest',
                                'CancelFriendRequest',
                                'DisplayName',
                                'TrustLevel'
                            ]"
                            :key="type"
                            :label="t('view.friend_log.filters.' + type)"
                            :value="type" />
                    </el-select>
                    <el-input
                        v-model="friendLogTable.filters[1].value"
                        :placeholder="t('view.friend_log.search_placeholder')"
                        style="flex: 0.4; margin-left: 10px" />
                </div>
            </template>
        </DataTableLayout>
    </div>
</template>

<script setup>
    import {
        getCoreRowModel,
        getFilteredRowModel,
        getPaginationRowModel,
        getSortedRowModel,
        useVueTable
    } from '@tanstack/vue-table';
    import { computed, ref, watch } from 'vue';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { useAppearanceSettingsStore, useFriendStore, useVrcxStore } from '../../stores';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { createColumns } from './columns.jsx';
    import { database } from '../../service/database';
    import { removeFromArray } from '../../shared/utils';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { valueUpdater } from '../../components/ui/table/utils';

    import configRepository from '../../service/config';

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();
    const { hideUnfriends } = storeToRefs(appearanceSettingsStore);
    const { friendLogTable } = storeToRefs(useFriendStore());

    const friendLogRef = ref(null);
    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(friendLogRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

    const friendLogDisplayData = computed(() => {
        const data = friendLogTable.value.data;
        const typeFilter = friendLogTable.value.filters?.[0]?.value ?? [];
        const searchFilter = friendLogTable.value.filters?.[1]?.value ?? '';
        const hideUnfriendsFilter = friendLogTable.value.filters?.[2]?.value;
        const typeSet = Array.isArray(typeFilter)
            ? new Set(typeFilter.map((value) => String(value).toLowerCase()))
            : null;
        const searchValue = String(searchFilter).trim().toLowerCase();

        const filtered = data.filter((row) => {
            if (hideUnfriendsFilter && row.type === 'Unfriend') {
                return false;
            }
            if (typeSet && typeSet.size > 0) {
                const rowType = String(row.type ?? '').toLowerCase();
                if (!typeSet.has(rowType)) {
                    return false;
                }
            }
            if (searchValue) {
                const displayName = row.displayName;
                if (
                    displayName === undefined ||
                    displayName === null ||
                    !String(displayName).toLowerCase().includes(searchValue)
                ) {
                    return false;
                }
            }
            return true;
        });

        return filtered.slice().sort((a, b) => {
            const aTime = typeof a?.created_at === 'string' ? a.created_at : '';
            const bTime = typeof b?.created_at === 'string' ? b.created_at : '';
            const aTs = dayjs(aTime).valueOf();
            const bTs = dayjs(bTime).valueOf();
            if (Number.isFinite(aTs) && Number.isFinite(bTs) && aTs !== bTs) {
                return bTs - aTs;
            }

            const aId = typeof a?.rowId === 'number' ? a.rowId : 0;
            const bId = typeof b?.rowId === 'number' ? b.rowId : 0;
            return bId - aId;
        });
    });

    watch(
        () => hideUnfriends.value,
        (newValue) => {
            friendLogTable.value.filters[2].value = newValue;
        },
        { immediate: true }
    );

    const { t } = useI18n();
    function saveTableFilters() {
        configRepository.setString('VRCX_friendLogTableFilters', JSON.stringify(friendLogTable.value.filters[0].value));
    }
    function deleteFriendLogPrompt(row) {
        ElMessageBox.confirm('Continue? Delete Log', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deleteFriendLog(row);
                }
            })
            .catch(() => {});
    }
    function deleteFriendLog(row) {
        removeFromArray(friendLogTable.value.data, row);
        database.deleteFriendLogHistory(row.rowId);
    }

    const columns = createColumns({
        onDelete: deleteFriendLog,
        onDeletePrompt: deleteFriendLogPrompt
    });

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const pageSize = computed(() =>
        friendLogTable.value.pageSizeLinked ? appearanceSettingsStore.tablePageSize : friendLogTable.value.pageSize
    );

    const sorting = ref([]);
    const pagination = ref({
        pageIndex: 0,
        pageSize: pageSize.value
    });

    const table = useVueTable({
        data: friendLogDisplayData,
        columns,
        getRowId: (row) => `${row.type}:${row.rowId ?? row.userId ?? row.created_at ?? ''}`,
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
        if (friendLogTable.value.pageSizeLinked) {
            appearanceSettingsStore.setTablePageSize(size);
        } else {
            friendLogTable.value.pageSize = size;
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
        color: var(--x-table-user-text-color);
    }
</style>
