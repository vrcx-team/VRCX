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
                    <span style="font-size: 14px" v-text="previousInstancesWorldDialog.worldRef.name"></span>
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
    defineOptions({ name: 'PreviousInstancesWorldDialog' });

    import { computed, ref, watch } from 'vue';
    import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { InputGroupField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useInstanceStore,
        useModalStore,
        useSearchStore,
        useUiStore,
        useUserStore,
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
    import { createColumns } from './previousInstancesWorldColumns.jsx';
    import { database } from '../../../service/database';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const { t } = useI18n();

    const modalStore = useModalStore();

    const instanceStore = useInstanceStore();
    const { showPreviousInstancesInfoDialog } = instanceStore;
    const { previousInstancesWorldDialog } = storeToRefs(instanceStore);
    const { shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { stringComparer } = storeToRefs(useSearchStore());

    const vrcxStore = useVrcxStore();
    const rawRows = ref([]);
    const pageSizes = [10, 25, 50, 100];
    const pageSize = ref(10);
    const tableStyle = { maxHeight: '400px' };
    const loading = ref(false);
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
            currentUserId: currentUser.value?.id,
            forceUpdateKey: previousInstancesWorldDialog.value?.forceUpdate,
            onShowInfo: showPreviousInstancesInfoDialog,
            onDelete: deleteGameLogWorldInstance,
            onDeletePrompt: deleteGameLogWorldInstancePrompt
        })
    );

    const { table } = useVrcxVueTable({
        persistKey: 'previousInstancesWorldDialog',
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
                columns: /** @type {any} */ (next)
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

    function refreshPreviousInstancesWorldTable() {
        loading.value = true;
        const D = previousInstancesWorldDialog.value;
        database.getPreviousInstancesByWorldId(D.worldRef).then((data) => {
            const array = [];
            for (const ref of data.values()) {
                ref.$location = parseLocation(ref.location);
                ref.timer = ref.time > 0 ? timeToText(ref.time) : '';
                array.push(ref);
            }
            array.sort(compareByCreatedAt);
            rawRows.value = array;
            loading.value = false;
        });
    }

    function deleteGameLogWorldInstance(row) {
        database.deleteGameLogInstanceByInstanceId({ location: row.location });
        removeFromArray(rawRows.value, row);
    }

    function deleteGameLogWorldInstancePrompt(row) {
        modalStore
            .confirm({
                description: 'Continue? Delete GameLog Instance',
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (!ok) return;
                deleteGameLogWorldInstance(row);
            })
            .catch(() => {});
    }

    watch(
        () => previousInstancesWorldDialog.value.visible,
        (visible) => {
            if (visible) {
                refreshPreviousInstancesWorldTable();
            }
        },
        { immediate: true }
    );

    watch(
        () => previousInstancesWorldDialog.value.openFlg,
        () => {
            if (previousInstancesWorldDialog.value.visible) {
                refreshPreviousInstancesWorldTable();
            }
        }
    );
</script>
