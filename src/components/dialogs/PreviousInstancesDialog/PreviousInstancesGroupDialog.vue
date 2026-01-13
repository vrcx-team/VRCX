<template>
    <el-dialog
        :z-index="previousInstancesGroupDialogIndex"
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
                    <span style="font-size: 14px" v-text="previousInstancesGroupDialog.groupRef.name"></span>
                    <InputGroupField
                        class="w-1/3"
                        v-model="search"
                        :placeholder="t('dialog.previous_instances.search_placeholder')"
                        clearable />
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
    import { useInstanceStore, useSearchStore, useUiStore, useVrcxStore } from '../../../stores';
    import { DataTableLayout } from '../../ui/data-table';
    import { createColumns } from './previousInstancesGroupColumns.jsx';
    import { database } from '../../../service/database';
    import { getNextDialogIndex } from '../../../shared/utils/base/ui';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = useUiStore();
    const { stringComparer } = storeToRefs(useSearchStore());
    const { t } = useI18n();

    const previousInstancesGroupDialogIndex = ref(2000);
    const loading = ref(false);

    const vrcxStore = useVrcxStore();
    const rawRows = ref([]);
    const search = ref('');
    const pageSizes = [10, 25, 50, 100];
    const pageSize = ref(10);
    const tableStyle = { maxHeight: '400px' };

    const props = defineProps({
        previousInstancesGroupDialog: { type: Object, required: true }
    });
    const emit = defineEmits(['update:previousInstancesGroupDialog']);

    const isVisible = computed({
        get: () => props.previousInstancesGroupDialog.visible,
        set: (value) => {
            emit('update:previousInstancesGroupDialog', {
                ...props.previousInstancesGroupDialog,
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
            onShowInfo: showPreviousInstancesInfoDialog,
            onDelete: deleteGameLogGroupInstance,
            onDeletePrompt: deleteGameLogGroupInstancePrompt
        })
    );

    const { table } = useVrcxVueTable({
        persistKey: 'previousInstancesGroupDialog',
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

    watch(
        () => props.previousInstancesGroupDialog.openFlg,
        () => {
            if (props.previousInstancesGroupDialog.visible) {
                nextTick(() => {
                    previousInstancesGroupDialogIndex.value = getNextDialogIndex();
                });
                refreshPreviousInstancesGroupTable();
            }
        }
    );

    function refreshPreviousInstancesGroupTable() {
        loading.value = true;
        const D = props.previousInstancesGroupDialog;
        database.getPreviousInstancesByGroupId(D.groupRef.id).then((data) => {
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

    function deleteGameLogGroupInstance(row) {
        database.deleteGameLogInstanceByInstanceId({ location: row.location });
        removeFromArray(rawRows.value, row);
    }

    function deleteGameLogGroupInstancePrompt(row) {
        ElMessageBox.confirm('Continue? Delete GameLog Instance', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deleteGameLogGroupInstance(row);
                }
            })
            .catch(() => {});
    }
</script>
