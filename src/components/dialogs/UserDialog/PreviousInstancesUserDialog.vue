<template>
    <div>
        <DialogHeader>
            <DialogTitle>{{ t('dialog.previous_instances.header') }}</DialogTitle>
        </DialogHeader>

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
                    <span style="font-size: 14px" v-text="previousInstancesUserDialog.userRef.displayName"></span>
                    <InputGroupField
                        v-model="search"
                        :placeholder="t('dialog.previous_instances.search_placeholder')"
                        clearable
                        class="w-1/3"
                        style="display: block" />
                </div>
            </template>
        </DataTableLayout>
    </div>
</template>

<script setup>
    defineOptions({ name: 'PreviousInstancesUserDialog' });

    import { computed, ref, watch } from 'vue';
    import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { InputGroupField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useInstanceStore,
        useLaunchStore,
        useModalStore,
        useSearchStore,
        useUiStore,
        useVrcxStore
    } from '../../../stores';
    import {
        compareByCreatedAt,
        localeIncludes,
        parseLocation,
        removeFromArray,
        timeToText
    } from '../../../shared/utils';
    import { DataTableLayout } from '../../ui/data-table';
    import { createColumns } from './previousInstancesUserColumns.jsx';
    import { database } from '../../../service/database';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const modalStore = useModalStore();
    const loading = ref(false);
    const rawRows = ref([]);
    const pageSizes = [10, 25, 50, 100];
    const pageSize = ref(10);
    const tableStyle = { maxHeight: '400px' };

    const { showLaunchDialog } = useLaunchStore();
    const instanceStore = useInstanceStore();
    const { showPreviousInstancesInfoDialog } = instanceStore;
    const { previousInstancesUserDialog } = storeToRefs(instanceStore);
    const { shiftHeld } = storeToRefs(useUiStore());
    const { stringComparer } = storeToRefs(useSearchStore());
    const vrcxStore = useVrcxStore();
    const { t } = useI18n();
    const search = ref('');

    const displayRows = computed(() => {
        const q = String(search.value ?? '')
            .trim()
            .toLowerCase();
        const rows = Array.isArray(rawRows.value) ? rawRows.value : [];
        if (!q) return rows;
        return rows.filter((row) => {
            return (
                localeIncludes(row?.worldName ?? '', q, stringComparer.value) ||
                localeIncludes(row?.groupName ?? '', q, stringComparer.value) ||
                localeIncludes(row?.location ?? '', q, stringComparer.value)
            );
        });
    });

    const columns = computed(() =>
        createColumns({
            shiftHeld,
            onLaunch: showLaunchDialog,
            onShowInfo: showPreviousInstancesInfoDialog,
            onDelete: deleteGameLogUserInstance,
            onDeletePrompt: deleteGameLogUserInstancePrompt
        })
    );

    const { table } = useVrcxVueTable({
        persistKey: 'previousInstancesUserDialog',
        data: displayRows,
        columns: columns.value,
        getRowId: (row) => `${row?.location ?? ''}:${row?.created_at ?? ''}`,
        initialSorting: [{ id: 'created_at', desc: true }],
        initialPagination: {
            pageIndex: 0,
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
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        pageSize.value = size;
    };

    const refreshPreviousInstancesUserTable = async () => {
        loading.value = true;
        const data = await database.getPreviousInstancesByUserId(previousInstancesUserDialog.value.userRef);
        const array = [];
        for (const item of data.values()) {
            item.$location = parseLocation(item.location);
            item.timer = item.time > 0 ? timeToText(item.time) : '';
            array.push(item);
        }
        array.sort(compareByCreatedAt);
        rawRows.value = array;
        loading.value = false;
    };

    watch(
        () => previousInstancesUserDialog.value.visible,
        (visible) => {
            if (visible) {
                refreshPreviousInstancesUserTable();
            }
        },
        { immediate: true }
    );

    watch(
        () => previousInstancesUserDialog.value.openFlg,
        () => {
            if (previousInstancesUserDialog.value.visible) {
                refreshPreviousInstancesUserTable();
            }
        }
    );

    function deleteGameLogUserInstance(row) {
        database.deleteGameLogInstance({
            id: previousInstancesUserDialog.value.userRef.id,
            displayName: previousInstancesUserDialog.value.userRef.displayName,
            location: row.location,
            events: row.events
        });
        removeFromArray(rawRows.value, row);
    }

    function deleteGameLogUserInstancePrompt(row) {
        modalStore
            .confirm({
                description: 'Continue? Delete User From GameLog Instance',
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (!ok) return;
                deleteGameLogUserInstance(row);
            })
            .catch(() => {});
    }
</script>

<style scoped>
    .button-pd-0 {
        padding: 0;
    }
</style>
