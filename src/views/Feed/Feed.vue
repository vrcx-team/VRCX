<template>
    <div class="x-container feed" ref="feedRef">
        <DataTableLayout
            :table="table"
            :loading="feedTable.loading"
            :table-style="tableHeightStyle"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange">
            <template #toolbar>
                <div style="margin: 0 0 10px; display: flex; align-items: center">
                    <div style="flex: none; margin-right: 10px; display: flex; align-items: center">
                        <TooltipWrapper side="bottom" :content="t('view.feed.favorites_only_tooltip')">
                            <span class="inline-flex">
                                <Switch v-model="feedTable.vip" @update:modelValue="feedTableLookup" />
                            </span>
                        </TooltipWrapper>
                    </div>
                    <ToggleGroup
                        type="multiple"
                        variant="outline"
                        size="sm"
                        :model-value="Array.isArray(feedTable.filter) ? feedTable.filter : []"
                        @update:model-value="handleFeedFilterChange"
                        class="w-full justify-start"
                        style="flex: 1">
                        <ToggleGroupItem v-for="type in feedFilterTypes" :key="type" :value="type">
                            {{ t('view.feed.filters.' + type) }}
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <InputGroupField
                        v-model="feedTable.search"
                        :placeholder="t('view.feed.search_placeholder')"
                        clearable
                        style="flex: 0.4; margin-left: 10px"
                        @keyup.enter="feedTableLookup"
                        @change="feedTableLookup" />
                    <Popover v-model:open="popoverOpen">
                        <PopoverTrigger as-child>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                class="ml-2 text-muted-foreground"
                                :class="{ 'text-accent-foreground': hasDateFilter }">
                                <Funnel />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-auto" side="bottom" align="end">
                            <RangeCalendar
                                v-model="dateRange"
                                :locale="locale"
                                :max-value="todayDate"
                                :number-of-months="2" />
                            <div class="flex justify-end gap-2 mt-3">
                                <Button variant="outline" size="sm" @click="clearDateFilter">
                                    {{ t('common.actions.clear') }}
                                </Button>
                                <Button size="sm" @click="applyDateFilter">
                                    {{ t('common.actions.confirm') }}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </template>
        </DataTableLayout>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { getLocalTimeZone, today } from '@internationalized/date';
    import { Funnel } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
    import { useAppearanceSettingsStore, useFeedStore, useVrcxStore } from '../../stores';
    import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
    import { Button } from '../../components/ui/button';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { InputGroupField } from '../../components/ui/input-group';
    import { RangeCalendar } from '../../components/ui/range-calendar';
    import { Switch } from '../../components/ui/switch';
    import { columns as baseColumns } from './columns.jsx';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    const { feedTable, feedTableData } = storeToRefs(useFeedStore());
    const { feedTableLookup } = useFeedStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();

    const { t, locale } = useI18n();
    const feedFilterTypes = ['GPS', 'Online', 'Offline', 'Status', 'Avatar', 'Bio'];

    const popoverOpen = ref(false);
    const todayDate = today(getLocalTimeZone());
    const dateRange = ref(undefined);
    const hasDateFilter = computed(() => !!(feedTable.value.dateFrom || feedTable.value.dateTo));

    function applyDateFilter() {
        if (dateRange.value?.start) {
            const s = dateRange.value.start;
            feedTable.value.dateFrom = dayjs(`${s.year}-${s.month}-${s.day}`).startOf('day').toISOString();
        } else {
            feedTable.value.dateFrom = '';
        }
        if (dateRange.value?.end) {
            const e = dateRange.value.end;
            feedTable.value.dateTo = dayjs(`${e.year}-${e.month}-${e.day}`).endOf('day').toISOString();
        } else {
            feedTable.value.dateTo = '';
        }
        popoverOpen.value = false;
        feedTableLookup();
    }

    function clearDateFilter() {
        dateRange.value = undefined;
        feedTable.value.dateFrom = '';
        feedTable.value.dateTo = '';
        popoverOpen.value = false;
        feedTableLookup();
    }

    const feedRef = ref(null);

    // TODO: simplify
    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(feedRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const pageSize = computed(() =>
        feedTable.value.pageSizeLinked ? appearanceSettingsStore.tablePageSize : feedTable.value.pageSize
    );

    function getFeedRowId(row) {
        if (row?.id != null) return `id:${row.id}`;
        if (row?.rowId != null) return `row:${row.rowId}`;

        const type = row?.type ?? '';
        const createdAt = row?.created_at ?? row?.createdAt ?? '';
        const userId = row?.userId ?? row?.senderUserId ?? '';
        const location = row?.location ?? row?.details?.location ?? '';
        const message = row?.message ?? '';

        return `${type}:${createdAt}:${userId}:${location}:${message}`;
    }

    const { table, pagination } = useVrcxVueTable({
        get data() {
            return feedTableData.value;
        },
        persistKey: 'feed',
        columns: baseColumns,
        getRowId: getFeedRowId,
        enableExpanded: true,
        getRowCanExpand: () => true,
        initialSorting: [],
        initialExpanded: {},
        initialPagination: {
            pageIndex: 0,
            pageSize: pageSize.value
        },
        tableOptions: {
            autoResetExpanded: false,
            autoResetPageIndex: false
        }
    });

    const totalItems = computed(() => {
        const length = table.getFilteredRowModel().rows.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        if (feedTable.value.pageSizeLinked) {
            appearanceSettingsStore.setTablePageSize(size);
        } else {
            feedTable.value.pageSize = size;
        }
    };

    function handleFeedFilterChange(value) {
        const selected = Array.isArray(value) ? value : [];
        feedTable.value.filter = selected.length === feedFilterTypes.length ? [] : selected;
        feedTableLookup();
    }

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
