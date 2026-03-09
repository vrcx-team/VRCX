<template>
    <div style="margin-top: 8px">
        <div class="flex justify-between">
            <div class="flex gap-2 items-center">
                <Button
                    class="rounded-full"
                    variant="outline"
                    size="icon-sm"
                    :disabled="loading"
                    @click="$emit('refresh')">
                    <Spinner v-if="loading" />
                    <RefreshCw v-else />
                </Button>
                <Button size="sm" variant="outline" @click="$emit('select-all', tableData.data)">{{
                    t('dialog.group_member_moderation.select_all')
                }}</Button>
                <span class="text-sm mx-1.5">{{ tableData.data.length }}</span>
            </div>

            <div class="flex gap-2 items-center">
                <Button variant="outline" size="sm" :disabled="!tableData.data.length" @click="$emit('export')">{{
                    t('dialog.group_member_moderation.export_bans')
                }}</Button>
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="!hasGroupPermission(groupRef, 'group-bans-manage')"
                    @click="$emit('import')"
                    >{{ t('dialog.group_member_moderation.import_bans') }}</Button
                >
                <InputGroupField
                    v-model="tableData.filters[0].value"
                    clearable
                    size="sm"
                    class="w-80"
                    :placeholder="t('dialog.group.members.search')" />
            </div>
        </div>

        <DataTableLayout
            style="margin-top: 8px"
            :table="tanstackTable"
            :loading="loading"
            :page-sizes="pageSizes"
            :total-items="totalItems" />
    </div>
</template>

<script setup>
    import { RefreshCw } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { InputGroupField } from '@/components/ui/input-group';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { hasGroupPermission } from '@/shared/utils';
    import { createColumns } from './groupMemberModerationBansColumns.jsx';
    import { useVrcxVueTable } from '@/lib/table/useVrcxVueTable';

    const props = defineProps({
        loading: { type: Boolean, default: false },
        tableData: { type: Object, required: true },
        groupRef: { type: Object, default: () => ({}) },
        pageSizes: { type: Array, required: true },
        columnContext: { type: Object, required: true }
    });

    defineEmits(['refresh', 'select-all', 'export', 'import']);

    const { t } = useI18n();

    const bansSearch = computed(() =>
        String(props.tableData.filters?.[0]?.value ?? '')
            .trim()
            .toLowerCase()
    );

    const filteredRows = computed(() => {
        const rows = Array.isArray(props.tableData.data) ? props.tableData.data : [];
        const q = bansSearch.value;
        if (!q) {
            return rows;
        }
        return rows.filter((r) => {
            const name = (r?.$displayName ?? r?.user?.displayName ?? '').toString().toLowerCase();
            return name.includes(q);
        });
    });

    const columns = computed(() => createColumns(props.columnContext));

    const { table: tanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:bans',
        get data() {
            return filteredRows.value;
        },
        columns,
        getRowId: (row) => String(row?.userId ?? row?.id ?? ''),
        initialPagination: { pageIndex: 0, pageSize: props.tableData.pageSize ?? 15 }
    });

    const totalItems = computed(() => tanstackTable.getFilteredRowModel().rows.length);
</script>
