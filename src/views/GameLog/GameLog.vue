<template>
    <div class="x-container x-container--auto-height" ref="gameLogRef">
        <template v-if="sessionsViewMode === 'sessions'">
            <GameLogSessions>
                <template #leading>
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        :model-value="sessionsViewMode"
                        @update:model-value="handleViewModeChange"
                        class="shrink-0">
                        <TooltipWrapper side="bottom" :content="t('view.game_log.sessions.switch_to_sessions')">
                            <ToggleGroupItem
                                value="sessions"
                                class="px-2"
                                :class="sessionsViewMode === 'sessions' && 'bg-accent text-accent-foreground'">
                                <Logs class="size-4" />
                            </ToggleGroupItem>
                        </TooltipWrapper>
                        <TooltipWrapper side="bottom" :content="t('view.game_log.sessions.switch_to_table')">
                            <ToggleGroupItem
                                value="table"
                                class="px-2"
                                :class="sessionsViewMode === 'table' && 'bg-accent text-accent-foreground'">
                                <Table2 class="size-4" />
                            </ToggleGroupItem>
                        </TooltipWrapper>
                    </ToggleGroup>
                </template>
            </GameLogSessions>
        </template>

        <template v-else>
            <DataTableLayout
                :table="table"
                :loading="gameLogTable.loading"
                auto-height
                :page-sizes="pageSizes"
                :total-items="totalItems"
                :on-page-size-change="handlePageSizeChange">
                <template #toolbar>
                    <div class="mt-0 mx-0 mb-2" style="display: flex; align-items: center">
                        <div class="mr-2" style="flex: none; display: flex; align-items: center">
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                size="sm"
                                :model-value="sessionsViewMode"
                                @update:model-value="handleViewModeChange"
                                class="mr-2">
                                <TooltipWrapper side="bottom" :content="t('view.game_log.sessions.switch_to_sessions')">
                                    <ToggleGroupItem
                                        value="sessions"
                                        class="px-2"
                                        :class="sessionsViewMode === 'sessions' && 'bg-accent text-accent-foreground'">
                                        <Logs class="size-4" />
                                    </ToggleGroupItem>
                                </TooltipWrapper>
                                <TooltipWrapper side="bottom" :content="t('view.game_log.sessions.switch_to_table')">
                                    <ToggleGroupItem
                                        value="table"
                                        class="px-2"
                                        :class="sessionsViewMode === 'table' && 'bg-accent text-accent-foreground'">
                                        <Table2 class="size-4" />
                                    </ToggleGroupItem>
                                </TooltipWrapper>
                            </ToggleGroup>
                            <TooltipWrapper side="bottom" :content="t('view.feed.favorites_only_tooltip')">
                                <div>
                                    <Toggle
                                        variant="outline"
                                        size="sm"
                                        :model-value="gameLogTable.vip"
                                        @update:modelValue="
                                            (v) => {
                                                gameLogTable.vip = v;
                                                gameLogTableLookup();
                                            }
                                        ">
                                        <Star />
                                    </Toggle>
                                </div>
                            </TooltipWrapper>
                        </div>
                        <Select
                            multiple
                            :model-value="Array.isArray(gameLogTable.filter) ? gameLogTable.filter : []"
                            @update:modelValue="handleGameLogFilterChange">
                            <SelectTrigger class="w-full" style="flex: 1">
                                <SelectValue :placeholder="t('view.game_log.filter_placeholder')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="type in [
                                            'Location',
                                            'OnPlayerJoined',
                                            'OnPlayerLeft',
                                            'VideoPlay',
                                            'Event',
                                            'External',
                                            'StringLoad',
                                            'ImageLoad'
                                        ]"
                                        :key="type"
                                        :value="type">
                                        {{ t('view.game_log.filters.' + type) }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <InputGroupField
                            class="ml-2"
                            v-model="gameLogTable.search"
                            :placeholder="t('view.game_log.search_placeholder')"
                            clearable
                            style="flex: 0.4"
                            @keyup.enter="gameLogTableLookup"
                            @change="gameLogTableLookup" />
                    </div>
                </template>
            </DataTableLayout>
        </template>
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref } from 'vue';
    import { Logs, Star, Table2 } from 'lucide-vue-next';
    import { Toggle } from '@/components/ui/toggle';
    import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useGameLogStore, useModalStore, useVrcxStore } from '../../stores';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { InputGroupField } from '../../components/ui/input-group';
    import { TooltipWrapper } from '../../components/ui/tooltip';
    import { createColumns } from './columns.jsx';
    import { database } from '../../services/database';
    import { removeFromArray } from '../../shared/utils';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';
    import GameLogSessions from './components/GameLogSessions.vue';

    const { gameLogTableLookup, setSessionsViewMode } = useGameLogStore();
    const { gameLogTable, gameLogTableData, sessionsViewMode } = storeToRefs(useGameLogStore());
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();
    const modalStore = useModalStore();

    /**
     *
     * @param row
     */
    function getGameLogCreatedAt(row) {
        if (typeof row?.created_at === 'string' && row.created_at.length > 0) {
            return row.created_at;
        }
        if (typeof row?.createdAt === 'string' && row.createdAt.length > 0) {
            return row.createdAt;
        }
        if (typeof row?.dt === 'string' && row.dt.length > 0) {
            return row.dt;
        }
        return '';
    }

    const { t } = useI18n();

    const gameLogRef = ref(null);

    /**
     *
     * @param row
     */
    function deleteGameLogEntryPrompt(row) {
        modalStore
            .confirm({
                description: t('confirm.delete_log'),
                title: t('common.actions.confirm')
            })
            .then(({ ok }) => ok && deleteGameLogEntry(row))
            .catch(() => {});
    }

    /**
     *
     * @param row
     */
    function deleteGameLogEntry(row) {
        removeFromArray(gameLogTableData.value, row);
        database.deleteGameLogEntry(row);
    }

    const columns = createColumns({
        getCreatedAt: getGameLogCreatedAt,
        onDelete: deleteGameLogEntry,
        onDeletePrompt: deleteGameLogEntryPrompt
    });

    /**
     *
     * @param value
     */
    function handleGameLogFilterChange(value) {
        gameLogTable.value.filter = Array.isArray(value) ? value : [];
        gameLogTableLookup();
    }

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);

    /**
     *
     * @param row
     */
    function getGameLogRowId(row) {
        if (row?.rowId != null) return `row:${row.rowId}`;

        const type = row?.type ?? '';
        const createdAt = row?.created_at ?? row?.createdAt ?? row?.dt ?? '';
        const userId = row?.userId ?? '';
        const displayName = row?.displayName ?? '';
        const location = row?.location ?? '';

        return `${type}:${createdAt}:${userId}:${displayName}:${location}`;
    }

    const { table, pagination } = useVrcxVueTable({
        persistKey: 'gameLog',
        get data() {
            return gameLogTableData.value;
        },
        columns,
        getRowId: getGameLogRowId,
        initialSorting: [],
        initialPagination: {
            pageIndex: 0,
            pageSize: appearanceSettingsStore.tablePageSize
        },
        tableOptions: {
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

    /**
     * @param {'sessions'|'table'|undefined} mode
     */
    function handleViewModeChange(mode) {
        if (mode === 'sessions' || mode === 'table') {
            setSessionsViewMode(mode);
        }
    }
</script>
