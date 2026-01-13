<template>
    <el-dialog
        :z-index="previousInstancesUserDialogIndex"
        v-model="isVisible"
        :title="t('dialog.previous_instances.header')"
        width="1000px"
        append-to-body>
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
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { ElMessageBox } from 'element-plus';
    import { InputGroupField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        compareByCreatedAt,
        localeIncludes,
        parseLocation,
        removeFromArray,
        timeToText
    } from '../../../shared/utils';
    import { useInstanceStore, useLaunchStore, useSearchStore, useUiStore, useVrcxStore } from '../../../stores';
    import { DataTableLayout } from '../../ui/data-table';
    import { createColumns } from './previousInstancesUserColumns.jsx';
    import { database } from '../../../service/database';
    import { getNextDialogIndex } from '../../../shared/utils/base/ui';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const props = defineProps({
        previousInstancesUserDialog: {
            type: Object,
            default: () => ({
                visible: false,
                userRef: {},
                loading: false,
                forceUpdate: 0,
                previousInstances: [],
                previousInstancesTable: {
                    data: [],
                    filters: [{ prop: 'displayName', value: '' }],
                    tableProps: { stripe: true, size: 'small', height: '400px' }
                }
            })
        }
    });

    const emit = defineEmits(['update:previous-instances-user-dialog']);
    const loading = ref(false);
    const rawRows = ref([]);
    const search = ref('');
    const pageSizes = [10, 25, 50, 100];
    const pageSize = ref(10);
    const tableStyle = { maxHeight: '400px' };

    const { showLaunchDialog } = useLaunchStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { stringComparer } = storeToRefs(useSearchStore());
    const vrcxStore = useVrcxStore();
    const { t } = useI18n();

    const previousInstancesUserDialogIndex = ref(2000);

    const isVisible = computed({
        get: () => props.previousInstancesUserDialog.visible,
        set: (value) => {
            emit('update:previous-instances-user-dialog', {
                ...props.previousInstancesUserDialog,
                visible: value
            });
        }
    });

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
        const data = await database.getPreviousInstancesByUserId(props.previousInstancesUserDialog.userRef);
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
        () => props.previousInstancesUserDialog.openFlg,
        () => {
            if (props.previousInstancesUserDialog.visible) {
                nextTick(() => {
                    previousInstancesUserDialogIndex.value = getNextDialogIndex();
                });
                refreshPreviousInstancesUserTable();
            }
        }
    );

    function deleteGameLogUserInstance(row) {
        database.deleteGameLogInstance({
            id: props.previousInstancesUserDialog.userRef.id,
            displayName: props.previousInstancesUserDialog.userRef.displayName,
            location: row.location,
            events: row.events
        });
        removeFromArray(rawRows.value, row);
    }

    function deleteGameLogUserInstancePrompt(row) {
        ElMessageBox.confirm('Continue? Delete User From GameLog Instance', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') deleteGameLogUserInstance(row);
            })
            .catch(() => {});
    }
</script>

<style scoped>
    .button-pd-0 {
        padding: 0;
    }
</style>
