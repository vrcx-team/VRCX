<template>
    <el-dialog
        :z-index="previousInstancesInfoDialogIndex"
        :model-value="previousInstancesInfoDialogVisible"
        :title="t('dialog.previous_instances.info')"
        width="800px"
        :fullscreen="fullscreen"
        destroy-on-close
        @close="closeDialog">
        <DataTableLayout
            class="min-w-0 w-full"
            :table="table"
            :loading="loading"
            :table-style="tableStyle"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange">
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
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGameLogStore, useInstanceStore, useSearchStore, useUserStore, useVrcxStore } from '../../../stores';
    import { compareByCreatedAt, localeIncludes, parseLocation, timeToText } from '../../../shared/utils';
    import { DataTableLayout } from '../../ui/data-table';
    import { InputGroupField } from '../../../components/ui/input-group';
    import { createColumns } from './previousInstancesInfoColumns.jsx';
    import { database } from '../../../service/database';
    import { getNextDialogIndex } from '../../../shared/utils/base/ui';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const { lookupUser } = useUserStore();
    const { previousInstancesInfoDialogVisible, previousInstancesInfoDialogInstanceId } =
        storeToRefs(useInstanceStore());
    const { gameLogIsFriend, gameLogIsFavorite } = useGameLogStore();
    const { t } = useI18n();

    const previousInstancesInfoDialogIndex = ref(2000);

    const loading = ref(false);
    const rawRows = ref([]);
    const search = ref('');
    const pageSizes = [10, 25, 50, 100];
    const pageSize = ref(10);
    const tableStyle = { maxHeight: '400px' };

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
    const fullscreen = ref(false);

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
        data: displayRows,
        columns: columns.value,
        getRowId: (row) => row?.id ?? row?.userId ?? row?.displayName ?? JSON.stringify(row ?? {}),
        initialSorting: [{ id: 'created_at', desc: true }],
        initialPagination: {
            pageIndex: 0,
            pageSize: pageSize.value
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
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        pageSize.value = size;
    };

    watch(
        () => previousInstancesInfoDialogVisible.value,
        (value) => {
            if (value) {
                nextTick(() => {
                    init();
                    refreshPreviousInstancesInfoTable();
                });
            }
        }
    );

    function init() {
        previousInstancesInfoDialogIndex.value = getNextDialogIndex();
        loading.value = true;
        location.value = parseLocation(previousInstancesInfoDialogInstanceId.value);
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

    function closeDialog() {
        previousInstancesInfoDialogVisible.value = false;
    }
</script>
