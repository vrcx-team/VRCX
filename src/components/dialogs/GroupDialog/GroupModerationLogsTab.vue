<template>
    <div class="flex h-full min-h-0 flex-col gap-2">
        <div class="flex items-center gap-2">
            <Button class="rounded-full" variant="outline" size="icon-sm" :disabled="loading" @click="$emit('refresh')">
                <Spinner v-if="loading" />
                <RefreshCw v-else />
            </Button>
            <span class="text-sm tabular-nums shrink-0">{{ tableData.data.length }}</span>
            <Select v-model="selectedAuditLogTypes" multiple>
                <SelectTrigger size="sm" class="w-64 shrink-0">
                    <SelectValue :placeholder="t('dialog.group_member_moderation.filter_type')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="type in auditLogTypes" :key="type" :value="type">
                        {{ getAuditLogTypeName(type) }}
                    </SelectItem>
                </SelectContent>
            </Select>
            <InputGroupField
                v-model="tableData.filters[0].value"
                clearable
                size="sm"
                class="flex-1"
                :placeholder="t('dialog.group.members.search')" />
            <Button size="sm" variant="outline" @click="$emit('export')">{{
                t('dialog.group_member_moderation.export_logs')
            }}</Button>
        </div>
        <DataTableLayout
            auto-height
            :table="tanstackTable"
            :loading="loading"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-change="handlePageChange" />
    </div>
</template>

<script setup>
    import { RefreshCw } from 'lucide-vue-next';
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { InputGroupField } from '@/components/ui/input-group';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { getAuditLogTypeName } from './groupModerationUtils';
    import { createColumns } from './groupMemberModerationLogsColumns.jsx';
    import { useVrcxVueTable } from '@/lib/table/useVrcxVueTable';

    const props = defineProps({
        loading: { type: Boolean, default: false },
        tableData: { type: Object, required: true },
        auditLogTypes: { type: /** @type {import('vue').PropType<string[]>} */ (Array), default: () => [] },
        pageSizes: { type: /** @type {import('vue').PropType<number[]>} */ (Array), required: true },
        columnContext: {
            type: /** @type {import('vue').PropType<Parameters<typeof createColumns>[0]>} */ (Object),
            required: true
        },
        handlePageChange: { type: Function, required: true }
    });

    const emit = defineEmits(['refresh', 'export']);

    const { t } = useI18n();

    const selectedAuditLogTypes = ref([]);

    defineExpose({ selectedAuditLogTypes });

    const logsSearch = computed(() =>
        String(props.tableData.filters?.[0]?.value ?? '')
            .trim()
            .toLowerCase()
    );

    const filteredRows = computed(() => {
        const rows = Array.isArray(props.tableData.data) ? props.tableData.data : [];
        const q = logsSearch.value;
        if (!q) {
            return rows;
        }
        return rows.filter((r) => {
            const desc = (r?.description ?? '').toString().toLowerCase();
            return desc.includes(q);
        });
    });

    const columns = computed(() => createColumns(props.columnContext));

    const { table: tanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:logs',
        get data() {
            return filteredRows.value;
        },
        columns,
        getRowId: (row) => String(row?.id ?? `${row?.created_at ?? ''}:${row?.eventType ?? ''}`),
        initialPagination: { pageIndex: props.tableData.pageIndex ?? 0, pageSize: props.tableData.pageSize ?? 15 },
        tableOptions: {
            autoResetPageIndex: false
        }
    });

    const totalItems = computed(() => tanstackTable.getFilteredRowModel().rows.length);
</script>
