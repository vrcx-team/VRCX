<template>
    <div style="margin-top: 8px">
        <Button class="rounded-full" variant="outline" size="icon-sm" :disabled="loading" @click="$emit('refresh')">
            <Spinner v-if="loading" />
            <RefreshCw v-else />
        </Button>
        <span class="text-sm mx-1.5">{{ tableData.data.length }}</span>
        <br />
        <div style="display: flex; justify-content: space-between; align-items: center">
            <div>
                <Select v-model="selectedAuditLogTypes" multiple>
                    <SelectTrigger style="margin: 8px 0; width: 250px">
                        <SelectValue :placeholder="t('dialog.group_member_moderation.filter_type')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="type in auditLogTypes" :key="type" :value="type">
                            {{ getAuditLogTypeName(type) }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Button variant="outline" @click="$emit('export')">{{
                    t('dialog.group_member_moderation.export_logs')
                }}</Button>
            </div>
        </div>
        <InputGroupField
            v-model="tableData.filters[0].value"
            clearable
            size="sm"
            :placeholder="t('dialog.group.members.search')"
            style="margin-top: 8px; margin-bottom: 8px" />
        <br />
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
        auditLogTypes: { type: Array, default: () => [] },
        pageSizes: { type: Array, required: true },
        columnContext: { type: Object, required: true }
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
        initialPagination: { pageIndex: 0, pageSize: props.tableData.pageSize ?? 15 }
    });

    const totalItems = computed(() => tanstackTable.getFilteredRowModel().rows.length);
</script>
