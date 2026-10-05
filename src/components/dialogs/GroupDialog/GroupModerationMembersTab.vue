<template>
    <div class="flex h-full min-h-0 flex-col gap-2">
        <div class="flex items-center gap-2">
            <Button class="rounded-full" variant="outline" size="icon-sm" :disabled="loading" @click="$emit('refresh')">
                <Spinner v-if="loading" />
                <RefreshCw v-else />
            </Button>
            <span class="text-sm tabular-nums shrink-0">{{ tableData.data.length }}/{{ groupRef.memberCount }}</span>
            <InputGroupField
                :model-value="memberSearch"
                :disabled="!hasGroupPermission(groupRef, 'group-bans-manage')"
                clearable
                size="sm"
                class="flex-1"
                :placeholder="t('dialog.group.members.search')"
                @update:model-value="$emit('update:memberSearch', $event)"
                @input="$emit('search')" />
            <DropdownMenu>
                <DropdownMenuTrigger as-child :disabled="sortFilterDisabled">
                    <Button size="sm" variant="outline" :disabled="sortFilterDisabled" @click.stop>
                        <span class="text-muted-foreground">{{ t('dialog.group.members.sort_by') }}</span>
                        {{ t(memberSortOrder.name) }}
                        <ArrowDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem
                        v-for="item in sortingOptions"
                        :key="item.name"
                        @click="$emit('sort-change', item)">
                        {{ t(item.name) }}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger as-child :disabled="sortFilterDisabled">
                    <Button size="sm" variant="outline" :disabled="sortFilterDisabled" @click.stop>
                        <span class="text-muted-foreground">{{ t('dialog.group.members.filter') }}</span>
                        {{ t(memberFilter.name) }}
                        <ArrowDown />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem
                        v-for="item in filterOptions"
                        :key="item.name"
                        @click="$emit('filter-change', item)">
                        {{ t(item.name) }}
                    </DropdownMenuItem>
                    <template v-for="role in groupRef.roles" :key="role.name">
                        <DropdownMenuItem v-if="!role.defaultRole" @click="$emit('filter-change', role)">
                            {{ t(role.name) }}
                        </DropdownMenuItem>
                    </template>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" @click="$emit('select-all', tableData.data)">{{
                t('dialog.group_member_moderation.select_all')
            }}</Button>
        </div>
        <DataTableLayout
            v-if="tableData.data.length"
            auto-height
            :on-page-change="handlePageChange"
            :table="tanstackTable"
            :loading="loading"
            :page-sizes="pageSizes"
            :total-items="totalItems" />
    </div>
</template>

<script setup>
    import { ArrowDown, RefreshCw } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { InputGroupField } from '@/components/ui/input-group';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { hasGroupPermission } from '@/shared/utils';
    import { createColumns } from './groupMemberModerationMembersColumns.jsx';
    import { useVrcxVueTable } from '@/lib/table/useVrcxVueTable';

    const props = defineProps({
        loading: { type: Boolean, default: false },
        tableData: { type: Object, required: true },
        groupRef: { type: Object, default: () => ({}) },
        memberSortOrder: { type: Object, required: true },
        memberFilter: { type: Object, required: true },
        memberSearch: { type: String, default: '' },
        sortingOptions: { type: Array, required: true },
        filterOptions: { type: Array, required: true },
        pageSizes: { type: Array, required: true },
        columnContext: { type: Object, required: true },
        handlePageChange: { type: Function, required: true }
    });

    defineEmits(['refresh', 'update:memberSearch', 'search', 'sort-change', 'filter-change', 'select-all']);

    const { t } = useI18n();

    const sortFilterDisabled = computed(() =>
        Boolean(props.loading || props.memberSearch.length || !hasGroupPermission(props.groupRef, 'group-bans-manage'))
    );

    const columns = computed(() => createColumns(props.columnContext));

    const { table: tanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:members',
        get data() {
            return computed(() => props.tableData.data).value;
        },
        columns,
        getRowId: (row) => String(row?.userId ?? ''),
        initialPagination: { pageIndex: props.tableData.pageIndex ?? 0, pageSize: props.tableData.pageSize ?? 15 },
        tableOptions: {
            autoResetPageIndex: false
        }
    });

    const totalItems = computed(() => tanstackTable.getFilteredRowModel().rows.length);
</script>
