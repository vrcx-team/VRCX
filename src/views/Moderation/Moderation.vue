<template>
    <div class="x-container" ref="moderationRef">
        <div class="tool-slot">
            <Select
                multiple
                :model-value="
                    Array.isArray(playerModerationTable.filters?.[0]?.value)
                        ? playerModerationTable.filters[0].value
                        : []
                "
                @update:modelValue="handleModerationFilterChange">
                <SelectTrigger class="w-full" style="flex: 1">
                    <SelectValue :placeholder="t('view.moderation.filter_placeholder')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem v-for="item in moderationTypes" :key="item" :value="item">
                            {{ t('view.moderation.filters.' + item) }}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <InputGroupField
                v-model="playerModerationTable.filters[1].value"
                :placeholder="t('view.moderation.search_placeholder')"
                class="filter-input" />
            <TooltipWrapper side="bottom" :content="t('view.moderation.refresh_tooltip')">
                <Button
                    class="rounded-full"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="playerModerationTable.loading"
                    @click="refreshPlayerModerations()">
                    <Spinner v-if="playerModerationTable.loading" />
                    <RefreshCw v-else />
                </Button>
            </TooltipWrapper>
        </div>

        <DataTableLayout
            :table="table"
            :loading="playerModerationTable.loading"
            :table-style="tableHeightStyle"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange" />
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupField } from '@/components/ui/input-group';
    import { RefreshCw } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useModalStore, useModerationStore, useVrcxStore } from '../../stores';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { createColumns } from './columns.jsx';
    import { moderationTypes } from '../../shared/constants';
    import { playerModerationRequest } from '../../api';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    import configRepository from '../../service/config.js';

    const { t } = useI18n();
    const { playerModerationTable } = storeToRefs(useModerationStore());
    const { refreshPlayerModerations, handlePlayerModerationDelete } = useModerationStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();
    const modalStore = useModalStore();

    const moderationRef = ref(null);
    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(moderationRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

    async function init() {
        playerModerationTable.value.filters[0].value = JSON.parse(
            await configRepository.getString('VRCX_playerModerationTableFilters', '[]')
        );
    }

    init();

    function saveTableFilters() {
        configRepository.setString(
            'VRCX_playerModerationTableFilters',
            JSON.stringify(playerModerationTable.value.filters[0].value)
        );
    }

    function handleModerationFilterChange(value) {
        playerModerationTable.value.filters[0].value = Array.isArray(value) ? value : [];
        saveTableFilters();
    }

    async function deletePlayerModeration(row) {
        const args = await playerModerationRequest.deletePlayerModeration({
            moderated: row.targetUserId,
            type: row.type
        });
        handlePlayerModerationDelete(args);
    }

    function deletePlayerModerationPrompt(row) {
        modalStore
            .confirm({
                description: `Continue? Moderation ${row.type}`,
                title: 'Confirm'
            })
            .then(({ ok }) => ok && deletePlayerModeration(row))
            .catch(() => {});
    }

    const moderationDisplayData = computed(() => {
        const data = playerModerationTable.value.data;
        const typeFilter = playerModerationTable.value.filters?.[0]?.value ?? [];
        const searchFilter = playerModerationTable.value.filters?.[1]?.value ?? '';
        const typeSet = Array.isArray(typeFilter)
            ? new Set(typeFilter.map((value) => String(value).toLowerCase()))
            : null;
        const searchValue = String(searchFilter).trim().toLowerCase();

        return data.filter((row) => {
            if (typeSet && typeSet.size > 0) {
                const rowType = String(row.type ?? '').toLowerCase();
                if (!typeSet.has(rowType)) {
                    return false;
                }
            }
            if (searchValue) {
                const source = String(row.sourceDisplayName ?? '').toLowerCase();
                const target = String(row.targetDisplayName ?? '').toLowerCase();
                if (!source.includes(searchValue) && !target.includes(searchValue)) {
                    return false;
                }
            }
            return true;
        });
    });

    const columns = createColumns({
        onDelete: deletePlayerModeration,
        onDeletePrompt: deletePlayerModerationPrompt
    });

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const pageSize = computed(() =>
        playerModerationTable.value.pageSizeLinked
            ? appearanceSettingsStore.tablePageSize
            : playerModerationTable.value.pageSize
    );

    const { table, pagination } = useVrcxVueTable({
        persistKey: 'moderation',
        data: moderationDisplayData,
        columns,
        getRowId: (row) => row.id ?? `${row.type}:${row.sourceUserId}:${row.targetUserId}:${row.created ?? ''}`,
        initialSorting: [{ id: 'created', desc: true }],
        initialPagination: {
            pageIndex: 0,
            pageSize: pageSize.value
        }
    });

    const totalItems = computed(() => {
        const length = table.getFilteredRowModel().rows.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        if (playerModerationTable.value.pageSizeLinked) {
            appearanceSettingsStore.setTablePageSize(size);
        } else {
            playerModerationTable.value.pageSize = size;
        }
    };

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

<style scoped>
    .tool-slot {
        margin: 0 0 10px;
        display: flex;
        align-items: center;
    }
    .filter-input {
        width: 150px;
        margin: 0 10px;
    }
</style>
