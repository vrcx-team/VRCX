<template>
    <div>
        <DialogHeader>
            <DialogTitle>{{ t('dialog.previous_instances.info') }}</DialogTitle>
        </DialogHeader>

        <DataTableLayout
            class="min-w-0 w-full"
            :table="table"
            :loading="loading"
            :table-style="tableStyle"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange"
            :on-page-change="handlePageChange"
            :on-sort-change="handleSortChange">
            <template #toolbar>
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <Location :location="location.tag" style="font-size: 14px" />
                    <InputGroupField
                        v-model="search"
                        :placeholder="t('dialog.previous_instances.search_placeholder')"
                        style="width: 150px"
                        clearable />
                </div>
            </template>
        </DataTableLayout>
    </div>
</template>

<script setup>
    defineOptions({ name: 'PreviousInstancesInfoDialog' });

    import { computed, nextTick, ref, watch } from 'vue';
    import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGameLogStore, useInstanceStore, useSearchStore, useUserStore, useVrcxStore } from '../../../stores';
    import { compareByCreatedAt, localeIncludes, parseLocation, timeToText } from '../../../shared/utils';
    import { DataTableLayout } from '../../ui/data-table';
    import { InputGroupField } from '../../../components/ui/input-group';
    import { createColumns } from './previousInstancesInfoColumns.jsx';
    import { database } from '../../../service/database';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const { lookupUser } = useUserStore();
    const { previousInstancesInfoDialog, previousInstancesInfoState } = storeToRefs(useInstanceStore());
    const { gameLogIsFriend, gameLogIsFavorite } = useGameLogStore();
    const { t } = useI18n();

    const dialogState = computed(() => {
        return previousInstancesInfoState.value;
    });

    const loading = ref(false);
    const rawRows = ref([]);
    const pageSizes = [10, 25, 50, 100];
    const pageSize = computed({
        get: () => dialogState.value.pageSize,
        set: (value) => {
            dialogState.value.pageSize = value;
        }
    });
    const pageIndex = computed({
        get: () => dialogState.value.pageIndex,
        set: (value) => {
            dialogState.value.pageIndex = value;
        }
    });
    const tableStyle = { maxHeight: '400px' };
    const search = computed({
        get: () => dialogState.value.search,
        set: (value) => {
            dialogState.value.search = value;
        }
    });
    const sortBy = computed({
        get: () => dialogState.value.sortBy,
        set: (value) => {
            dialogState.value.sortBy = value;
        }
    });

    const location = ref({
        tag: '',
        isOffline: false,
        isPrivate: false,
        isTraveling: false,
        isRealInstance: false,
        worldId: '',
        instanceId: '',
        instanceName: '',
        accessType: '',
        accessTypeName: '',
        region: '',
        shortName: '',
        userId: null,
        hiddenId: null,
        privateId: null,
        friendsId: null,
        groupId: null,
        groupAccessType: null,
        canRequestInvite: false,
        strict: false,
        ageGate: false
    });

    const { stringComparer } = storeToRefs(useSearchStore());
    const vrcxStore = useVrcxStore();

    const displayRows = computed(() => {
        const q = String(search.value ?? '')
            .trim()
            .toLowerCase();
        const rows = Array.isArray(rawRows.value) ? rawRows.value : [];
        if (!q) return rows;
        return rows.filter((row) => localeIncludes(row?.displayName ?? '', q, stringComparer.value));
    });

    const columns = computed(() =>
        createColumns({
            onLookupUser: lookupUser
        })
    );

    const { table } = useVrcxVueTable({
        persistKey: 'previousInstancesInfoDialog',
        get data() {
            return displayRows.value;
        },
        columns: columns.value,
        getRowId: (row) => row?.id ?? row?.userId ?? row?.displayName ?? JSON.stringify(row ?? {}),
        initialSorting: sortBy.value,
        initialPagination: {
            pageIndex: pageIndex.value,
            pageSize: pageSize.value
        },
        tableOptions: {
            autoResetPageIndex: false
        }
    });

    watch(
        columns,
        (next) => {
            table.setOptions((prev) => ({
                ...prev,
                columns: next
            }));
        },
        { immediate: true }
    );

    const totalItems = computed(() => {
        const length = table.getFilteredRowModel().rows.length;
        const max = vrcxStore.maxTableSize;
        return length > max ? max : length;
    });

    const handlePageSizeChange = (size) => {
        pageSize.value = size;
    };

    const handlePageChange = (page) => {
        pageIndex.value = Math.max(0, page - 1);
    };

    const handleSortChange = (sorting) => {
        sortBy.value = sorting;
    };

    watch(
        () => previousInstancesInfoDialog.value.visible,
        (value) => {
            if (value) {
                nextTick(() => {
                    init();
                    refreshPreviousInstancesInfoTable();
                });
            }
        },
        { immediate: true }
    );

    function init() {
        loading.value = true;
        location.value = parseLocation(previousInstancesInfoDialog.value.instanceId);
        if (previousInstancesInfoDialog.value.lastId !== previousInstancesInfoDialog.value.instanceId) {
            table.setPageIndex(0);
            previousInstancesInfoDialog.value.lastId = previousInstancesInfoDialog.value.instanceId;
        }
    }

    function refreshPreviousInstancesInfoTable() {
        database.getPlayersFromInstance(location.value.tag).then((data) => {
            const array = [];
            for (const entry of Array.from(data.values())) {
                entry.timer = timeToText(entry.time);
                entry.isFriend = gameLogIsFriend(entry);
                entry.isFavorite = gameLogIsFavorite(entry);
                array.push(entry);
            }
            array.sort(compareByCreatedAt);
            rawRows.value = array;
            loading.value = false;
        });
    }
</script>
