<template>
    <el-dialog
        :z-index="previousInstancesWorldDialogIndex"
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
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
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
    import { getNextDialogIndex } from '../../../shared/utils/base/ui';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const { t } = useI18n();

    const modalStore = useModalStore();

    const props = defineProps({
        previousInstancesWorldDialog: {
            type: Object,
            required: true
        }
    });
    const emit = defineEmits(['update:previous-instances-world-dialog']);

    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { stringComparer } = storeToRefs(useSearchStore());

    const vrcxStore = useVrcxStore();
    const rawRows = ref([]);
    const search = ref('');
    const pageSizes = [10, 25, 50, 100];
    const pageSize = ref(10);
    const tableStyle = { maxHeight: '400px' };
    const loading = ref(false);
    const previousInstancesWorldDialogIndex = ref(2000);

    const isVisible = computed({
        get: () => props.previousInstancesWorldDialog.visible,
        set: (value) => {
            emit('update:previous-instances-world-dialog', {
                ...props.previousInstancesWorldDialog,
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
            currentUserId: currentUser.value?.id,
            forceUpdateKey: props.previousInstancesWorldDialog?.forceUpdate,
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
        const D = props.previousInstancesWorldDialog;
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
        () => props.previousInstancesWorldDialog.openFlg,
        () => {
            if (props.previousInstancesWorldDialog.visible) {
                nextTick(() => {
                    previousInstancesWorldDialogIndex.value = getNextDialogIndex();
                });
                refreshPreviousInstancesWorldTable();
            }
        }
    );
</script>
