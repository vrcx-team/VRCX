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
            :on-page-size-change="handlePageSizeChange"
            :on-page-change="handlePageChange">
            <template #toolbar>
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <span style="font-size: 14px" v-text="headerText"></span>
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
    defineOptions({ name: 'PreviousInstancesListDialog' });

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
    import { createPreviousInstancesColumns } from './previousInstancesColumns.jsx';
    import { database } from '../../../service/database';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const props = defineProps({
        variant: {
            type: String,
            required: true,
            validator: (value) => ['user', 'world', 'group'].includes(value)
        }
    });

    const instanceStore = useInstanceStore();
    const { showPreviousInstancesInfoDialog } = instanceStore;
    const { previousInstancesListState, previousInstancesListDialog } = storeToRefs(instanceStore);
    const { shiftHeld } = storeToRefs(useUiStore());
    const { stringComparer } = storeToRefs(useSearchStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { showLaunchDialog } = useLaunchStore();
    const modalStore = useModalStore();
    const vrcxStore = useVrcxStore();
    const { t } = useI18n();

    const dialogState = computed(() => {
        return previousInstancesListDialog.value;
    });

    const getListState = () => {
        const state = previousInstancesListState.value[props.variant];
        if (state) {
            return state;
        }
        previousInstancesListState.value[props.variant] = {
            search: '',
            pageSize: 10,
            pageIndex: 0
        };
        return previousInstancesListState.value[props.variant];
    };

    const loading = ref(false);
    const rawRows = ref([]);
    const pageSizes = [10, 25, 50, 100];
    const pageSize = computed({
        get: () => getListState().pageSize,
        set: (value) => {
            getListState().pageSize = value;
        }
    });
    const tableStyle = { maxHeight: '400px' };
    const search = computed({
        get: () => getListState().search,
        set: (value) => {
            getListState().search = value;
        }
    });

    const headerText = computed(() => {
        const state = dialogState.value;
        if (props.variant === 'user') return state?.userRef?.displayName ?? '';
        if (props.variant === 'world') return state?.worldRef?.name ?? '';
        return state?.groupRef?.name ?? '';
    });

    const persistKey = computed(() => {
        if (props.variant === 'user') return 'previousInstancesUserDialog';
        if (props.variant === 'world') return 'previousInstancesWorldDialog';
        return 'previousInstancesGroupDialog';
    });

    const pageIndex = computed({
        get: () => getListState().pageIndex,
        set: (value) => {
            getListState().pageIndex = value;
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

    function deleteGameLogInstance(row) {
        if (props.variant === 'user') {
            database.deleteGameLogInstance({
                id: previousInstancesListDialog.value.userRef.id,
                displayName: previousInstancesListDialog.value.userRef.displayName,
                location: row.location,
                events: row.events
            });
        } else {
            database.deleteGameLogInstanceByInstanceId({ location: row.location });
        }
        removeFromArray(rawRows.value, row);
    }

    function deleteGameLogInstancePrompt(row) {
        const description =
            props.variant === 'user'
                ? 'Continue? Delete User From GameLog Instance'
                : 'Continue? Delete GameLog Instance';
        modalStore
            .confirm({
                description,
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (!ok) return;
                deleteGameLogInstance(row);
            })
            .catch(() => {});
    }

    const handleShowInfo = (location) => {
        const instanceId = location ?? '';
        showPreviousInstancesInfoDialog(instanceId);
    };

    const columns = computed(() =>
        createPreviousInstancesColumns(props.variant, {
            shiftHeld,
            currentUserId: currentUser.value?.id,
            forceUpdateKey: previousInstancesListDialog.value?.forceUpdate,
            onLaunch: showLaunchDialog,
            onShowInfo: handleShowInfo,
            onDelete: deleteGameLogInstance,
            onDeletePrompt: deleteGameLogInstancePrompt
        })
    );

    const { table } = useVrcxVueTable({
        persistKey: persistKey.value,
        data: displayRows,
        columns: columns.value,
        getRowId: (row) => `${row?.location ?? ''}:${row?.created_at ?? ''}`,
        initialSorting: [{ id: 'created_at', desc: true }],
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

    const handlePageChange = (page) => {
        pageIndex.value = Math.max(0, page - 1);
    };

    const refreshTable = async () => {
        loading.value = true;
        const array = [];
        try {
            if (props.variant === 'user') {
                const data = await database.getPreviousInstancesByUserId(previousInstancesListDialog.value.userRef);
                for (const item of data.values()) {
                    item.$location = parseLocation(item.location);
                    item.timer = item.time > 0 ? timeToText(item.time) : '';
                    array.push(item);
                }
            } else if (props.variant === 'world') {
                const D = previousInstancesListDialog.value;
                const data = await database.getPreviousInstancesByWorldId(D.worldRef);
                for (const ref of data.values()) {
                    ref.$location = parseLocation(ref.location);
                    ref.timer = ref.time > 0 ? timeToText(ref.time) : '';
                    array.push(ref);
                }
            } else {
                const D = previousInstancesListDialog.value;
                const data = await database.getPreviousInstancesByGroupId(D.groupRef.id);
                for (const ref of data.values()) {
                    ref.$location = parseLocation(ref.location);
                    ref.timer = ref.time > 0 ? timeToText(ref.time) : '';
                    array.push(ref);
                }
            }
            array.sort(compareByCreatedAt);
            rawRows.value = array;
        } finally {
            loading.value = false;
        }
    };

    watch(
        () => dialogState.value?.visible,
        (visible) => {
            if (visible) {
                refreshTable();
            }
        },
        { immediate: true }
    );

    watch(
        () => dialogState.value?.openFlg,
        () => {
            if (dialogState.value?.visible) {
                refreshTable();
            }
        }
    );
</script>
