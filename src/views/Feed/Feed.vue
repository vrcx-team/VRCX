<template>
    <div class="x-container feed x-container--auto-height" ref="feedRef">
        <DataTableLayout
            :table="table"
            :loading="feedTable.loading"
            auto-height
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange">
            <template #toolbar>
                <div class="mt-0 mx-0 mb-2" style="display: flex; align-items: center">
                    <div style="flex: none; display: flex; align-items: center" class="mr-2">
                        <Popover v-model:open="popoverOpen">
                            <PopoverTrigger as-child>
                                <Button variant="outline" size="sm" class="mx-2 h-8 gap-1.5">
                                    <ListFilter class="size-4" />
                                    {{ t('view.my_avatars.filter') }}
                                    <Badge
                                        v-if="activeFilterCount"
                                        variant="secondary"
                                        class="ml-0.5 h-4.5 min-w-4.5 rounded-full px-1 text-xs">
                                        {{ activeFilterCount }}
                                    </Badge>
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
                        <TooltipWrapper side="bottom" :content="t('view.feed.favorites_only_tooltip')">
                            <div>
                                <Toggle
                                    variant="outline"
                                    size="sm"
                                    :model-value="feedTable.vip"
                                    @update:modelValue="
                                        (v) => {
                                            feedTable.vip = v;
                                            feedTableLookup();
                                        }
                                    ">
                                    <Star />
                                </Toggle>
                            </div>
                        </TooltipWrapper>
                    </div>
                    <ToggleGroup
                        type="multiple"
                        variant="outline"
                        size="sm"
                        :model-value="activeFilterSelection"
                        @update:model-value="handleFeedFilterChange"
                        class="w-full justify-start"
                        style="flex: 1">
                        <ToggleGroupItem value="All">
                            {{ t('view.search.avatar.all') }}
                        </ToggleGroupItem>
                        <ToggleGroupItem v-for="type in feedFilterTypes" :key="type" :value="type">
                            {{ t('view.feed.filters.' + type) }}
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <InputGroupField
                        class="ml-2"
                        v-model="feedTable.search"
                        :placeholder="t('view.feed.search_placeholder')"
                        clearable
                        style="flex: 0.4"
                        @keyup.enter="feedTableLookup"
                        @change="feedTableLookup" />
                </div>
            </template>
        </DataTableLayout>
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { ListFilter, Star } from 'lucide-vue-next';
    import { getLocalTimeZone, today } from '@internationalized/date';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
    import { useAppearanceSettingsStore, useFeedStore, useVrcxStore } from '../../stores';
    import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
    import { Badge } from '../../components/ui/badge';
    import { Button } from '../../components/ui/button';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { InputGroupField } from '../../components/ui/input-group';
    import { RangeCalendar } from '../../components/ui/range-calendar';
    import { Toggle } from '../../components/ui/toggle';
    import { columns as baseColumns } from './columns.jsx';
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
    const activeFilterCount = computed(() => (hasDateFilter.value ? 1 : 0));

    /**
     *
     */
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

    /**
     *
     */
    function clearDateFilter() {
        dateRange.value = undefined;
        feedTable.value.dateFrom = '';
        feedTable.value.dateTo = '';
        popoverOpen.value = false;
        feedTableLookup();
    }

    const feedRef = ref(null);

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);

    /**
     *
     * @param row
     */
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
            pageSize: appearanceSettingsStore.tablePageSize
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
        pagination.value = {
            ...pagination.value,
            pageIndex: 0,
            pageSize: size
        };
    };

    const activeFilterSelection = computed(() => {
        const filter = feedTable.value.filter;
        if (!Array.isArray(filter) || filter.length === 0) {
            return ['All'];
        }
        return filter;
    });

    /**
     *
     * @param value
     */
    function handleFeedFilterChange(value) {
        const selected = Array.isArray(value) ? value : [];
        const wasAll = activeFilterSelection.value.includes('All');
        const hasAll = selected.includes('All');
        const types = selected.filter((v) => v !== 'All');

        if (hasAll && !wasAll) {
            feedTable.value.filter = [];
        } else if (wasAll && types.length) {
            feedTable.value.filter = types;
        } else {
            feedTable.value.filter = types.length === feedFilterTypes.length ? [] : types.length ? types : [];
        }
        feedTableLookup();
    }
</script>

<style scoped>
    .feed :deep(.x-text-removed) {
        text-decoration: line-through;
        color: #ff0000;
        background-color: rgba(255, 0, 0, 0.2);
        padding: 2px 2px;
        border-radius: 4px;
    }

    .feed :deep(.x-text-added) {
        color: rgb(35, 188, 35);
        background-color: rgba(76, 255, 80, 0.2);
        padding: 2px 2px;
        border-radius: 4px;
    }
</style>
