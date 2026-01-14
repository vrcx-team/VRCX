<template>
    <div class="photon-event-table">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap">
            <Select
                :model-value="photonEventTableTypeFilter"
                multiple
                @update:modelValue="
                    (v) => {
                        photonEventTableTypeFilter = v;
                        photonEventTableFilterChange();
                    }
                ">
                <SelectTrigger style="width: 220px">
                    <SelectValue :placeholder="t('view.player_list.photon.filter_placeholder')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="type in photonEventTableTypeFilterList" :key="type" :value="type">{{
                        type
                    }}</SelectItem>
                </SelectContent>
            </Select>
            <InputGroupField
                v-model="photonEventTableFilter"
                :placeholder="t('view.player_list.photon.search_placeholder')"
                clearable
                style="width: 150px"
                @input="photonEventTableFilterChange" />
            <Button variant="outline" @click="emitShowChatboxBlacklist">{{
                t('view.player_list.photon.chatbox_blacklist')
            }}</Button>
            <TooltipWrapper side="bottom" :content="t('view.player_list.photon.status_tooltip')">
                <div style="display: inline-flex; align-items: center; font-size: 14px">
                    <span v-if="ipcEnabled && !photonEventIcon">🟢</span>
                    <span v-else-if="ipcEnabled">⚪</span>
                    <span v-else>🔴</span>
                </div>
            </TooltipWrapper>
        </div>
        <TabsUnderline default-value="current" :items="photonTabs" :unmount-on-hide="false">
            <template #current>
                <DataTableLayout
                    class="min-w-0 w-full"
                    :table="currentTable"
                    :loading="false"
                    :table-style="tableStyle"
                    :page-sizes="pageSizes"
                    :total-items="currentTotal"
                    :on-page-size-change="handleCurrentPageSizeChange"
                    style="margin-bottom: 10px" />
            </template>
            <template #previous>
                <DataTableLayout
                    class="min-w-0 w-full"
                    :table="previousTable"
                    :loading="false"
                    :table-style="tableStyle"
                    :page-sizes="pageSizes"
                    :total-items="previousTotal"
                    :on-page-size-change="handlePreviousPageSizeChange"
                    style="margin-bottom: 10px" />
            </template>
        </TabsUnderline>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { InputGroupField } from '@/components/ui/input-group';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { localeIncludes } from '@/shared/utils';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useSearchStore } from '@/stores';
    import { useVrcxVueTable } from '@/lib/table/useVrcxVueTable';

    import {
        useAvatarStore,
        useGalleryStore,
        useGroupStore,
        usePhotonStore,
        useUserStore,
        useVrcxStore,
        useWorldStore
    } from '../../../stores';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
    import { createColumns } from './photonEventColumns.jsx';
    import { photonEventTableTypeFilterList } from '../../../shared/constants/photon';

    const emit = defineEmits(['show-chatbox-blacklist']);
    const { t } = useI18n();

    const photonStore = usePhotonStore();
    const photonTabs = computed(() => [
        { value: 'current', label: t('view.player_list.photon.current') },
        { value: 'previous', label: t('view.player_list.photon.previous') }
    ]);
    const {
        photonEventTableTypeFilter,
        photonEventTableFilter,
        photonEventTable,
        photonEventTablePrevious,
        photonEventIcon
    } = storeToRefs(photonStore);
    const { photonEventTableFilterChange, showUserFromPhotonId } = photonStore;

    const { stringComparer } = storeToRefs(useSearchStore());

    const { lookupUser } = useUserStore();
    const { showAvatarDialog } = useAvatarStore();
    const { showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { showFullscreenImageDialog } = useGalleryStore();
    const { ipcEnabled } = storeToRefs(useVrcxStore());

    const pageSizes = [10, 25, 50, 100];
    const tableStyle = { maxHeight: '320px' };

    const q = computed(() =>
        String(photonEventTableFilter.value ?? '')
            .trim()
            .toLowerCase()
    );
    const typeFilterSet = computed(() => new Set(photonEventTableTypeFilter.value ?? []));

    const filterRows = (rows) => {
        const query = q.value;
        const types = typeFilterSet.value;
        const comparer = stringComparer.value;
        const src = Array.isArray(rows) ? rows : [];

        return src.filter((row) => {
            if (types.size && !types.has(row?.type)) return false;
            if (!query) return true;

            return (
                localeIncludes(row?.displayName ?? '', query, comparer) ||
                localeIncludes(row?.text ?? '', query, comparer)
            );
        });
    };

    const currentRawRows = computed(() =>
        Array.isArray(photonEventTable.value?.data) ? photonEventTable.value.data.slice() : []
    );
    const previousRawRows = computed(() =>
        Array.isArray(photonEventTablePrevious.value?.data) ? photonEventTablePrevious.value.data.slice() : []
    );

    const currentRows = computed(() => filterRows(currentRawRows.value));
    const previousRows = computed(() => filterRows(previousRawRows.value));

    const currentTotal = computed(() => currentRows.value.length);
    const previousTotal = computed(() => previousRows.value.length);

    const currentPageSize = ref(photonEventTable.value?.pageSize ?? 10);
    const previousPageSize = ref(photonEventTablePrevious.value?.pageSize ?? 10);

    const currentColumns = computed(() =>
        createColumns({
            isPrevious: false,
            onShowUser: (row) => showUserFromPhotonId(row?.photonId),
            onShowAvatar: showAvatarDialog,
            onShowGroup: showGroupDialog,
            onShowWorld: showWorldDialog,
            onShowImage: showFullscreenImageDialog
        })
    );

    const previousColumns = computed(() =>
        createColumns({
            isPrevious: true,
            onShowUser: (row) => lookupUser(row),
            onShowAvatar: showAvatarDialog,
            onShowGroup: showGroupDialog,
            onShowWorld: showWorldDialog,
            onShowImage: showFullscreenImageDialog
        })
    );

    const { table: currentTable } = useVrcxVueTable({
        persistKey: 'photonEventTable:current',
        data: currentRows,
        columns: currentColumns.value,
        getRowId: (row) => `${row?.photonId ?? ''}:${row?.created_at ?? ''}:${row?.type ?? ''}`,
        initialSorting: [{ id: 'created_at', desc: true }],
        initialPagination: { pageIndex: 0, pageSize: currentPageSize.value }
    });

    const { table: previousTable } = useVrcxVueTable({
        persistKey: 'photonEventTable:previous',
        data: previousRows,
        columns: previousColumns.value,
        getRowId: (row) => `${row?.photonId ?? ''}:${row?.created_at ?? ''}:${row?.type ?? ''}`,
        initialSorting: [{ id: 'created_at', desc: true }],
        initialPagination: { pageIndex: 0, pageSize: previousPageSize.value }
    });

    const handleCurrentPageSizeChange = (size) => {
        currentPageSize.value = size;
    };
    const handlePreviousPageSizeChange = (size) => {
        previousPageSize.value = size;
    };

    watch(currentColumns, (next) => {
        currentTable.setOptions((prev) => ({ ...prev, columns: next }));
    });

    watch(previousColumns, (next) => {
        previousTable.setOptions((prev) => ({ ...prev, columns: next }));
    });

    function emitShowChatboxBlacklist() {
        emit('show-chatbox-blacklist');
    }
</script>
