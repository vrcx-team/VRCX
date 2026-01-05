<template>
    <div class="flex flex-col">
        <div v-if="$slots.toolbar" class="mb-2">
            <slot name="toolbar"></slot>
        </div>

        <div class="rounded-md border">
            <div v-loading="loading" class="overflow-auto" :style="tableStyle">
                <Table class="table-fixed">
                    <TableHeader>
                        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                            <TableHead
                                v-for="header in headerGroup.headers"
                                :key="header.id"
                                :class="getHeaderClass(header)">
                                <FlexRender
                                    v-if="!header.isPlaceholder"
                                    :render="header.column.columnDef.header"
                                    :props="header.getContext()" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <template v-if="table.getRowModel().rows?.length">
                            <template v-for="row in table.getRowModel().rows" :key="row.id">
                                <TableRow>
                                    <TableCell
                                        v-for="cell in row.getVisibleCells()"
                                        :key="cell.id"
                                        :class="getCellClass(cell)">
                                        <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                                    </TableCell>
                                </TableRow>
                                <TableRow v-if="row.getIsExpanded() && (expandedRenderer || $slots.expanded)">
                                    <TableCell :colspan="row.getVisibleCells().length">
                                        <template v-if="$slots.expanded">
                                            <slot name="expanded" :row="row"></slot>
                                        </template>
                                        <template v-else>
                                            <FlexRender :render="expandedRenderer" :props="{ row }" />
                                        </template>
                                    </TableCell>
                                </TableRow>
                            </template>
                        </template>

                        <TableRow v-else>
                            <TableCell :colspan="visibleColumnCount" class="h-24 text-center">
                                <slot name="empty">
                                    {{ emptyText }}
                                </slot>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>

        <div class="mt-4 flex w-full items-center gap-3">
            <div v-if="pageSizes.length" class="inline-flex items-center flex-1 justify-end gap-2">
                <span class="text-xs text-muted-foreground">{{ t('table.pagination.rows_per_page') }}</span>
                <Select v-model="pageSizeValue">
                    <SelectTrigger size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="size in pageSizes" :key="size" :value="String(size)">
                            {{ size }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Pagination
                v-model:page="currentPage"
                :total="totalItems"
                :items-per-page="pageSizeProxy"
                :sibling-count="1"
                show-edges
                class="flex-none">
                <PaginationContent v-slot="{ items }">
                    <PaginationPrevious />
                    <template v-for="item in items" :key="item.key">
                        <PaginationItem
                            v-if="item.type === 'page'"
                            :value="item.value"
                            :is-active="item.value === currentPage">
                            {{ item.value }}
                        </PaginationItem>
                        <PaginationEllipsis v-else />
                    </template>
                    <PaginationNext />
                </PaginationContent>
            </Pagination>
            <div class="flex-1"></div>
        </div>
    </div>
</template>

<script setup>
    import { FlexRender } from '@tanstack/vue-table';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import {
        Pagination,
        PaginationContent,
        PaginationEllipsis,
        PaginationItem,
        PaginationNext,
        PaginationPrevious
    } from '../pagination';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';

    const props = defineProps({
        table: {
            type: Object,
            required: true
        },
        tableStyle: {
            type: Object,
            default: null
        },
        loading: {
            type: Boolean,
            default: false
        },
        totalItems: {
            type: Number,
            default: 0
        },
        pageSizes: {
            type: Array,
            default: () => []
        },
        emptyText: {
            type: String,
            default: 'No results.'
        },
        onPageSizeChange: {
            type: Function,
            default: null
        },
        onPageChange: {
            type: Function,
            default: null
        }
    });

    const { t } = useI18n();

    const visibleColumnCount = computed(() => {
        const count = props.table.getVisibleLeafColumns?.().length ?? 0;
        if (count > 0) {
            return count;
        }
        return props.table.getAllColumns?.().length ?? 1;
    });

    const expandedRenderer = computed(() => {
        const columns = props.table.getAllColumns?.() ?? [];
        for (const column of columns) {
            const meta = column.columnDef?.meta;
            if (meta?.expandedRow) {
                return meta.expandedRow;
            }
        }
        return null;
    });

    const joinClasses = (...values) =>
        values
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean)
            .join(' ');

    const resolveClassValue = (value, ctx) => {
        if (typeof value === 'function') {
            return value(ctx);
        }
        return value;
    };

    const getHeaderClass = (header) => {
        const columnDef = header?.column?.columnDef;
        const meta = columnDef?.meta ?? {};
        return joinClasses(
            'sticky top-0 z-10 bg-background',
            resolveClassValue(meta.class, header?.getContext?.()),
            resolveClassValue(meta.headerClass, header?.getContext?.()),
            resolveClassValue(meta.thClass, header?.getContext?.()),
            resolveClassValue(columnDef?.class, header?.getContext?.()),
            resolveClassValue(columnDef?.headerClass, header?.getContext?.())
        );
    };

    const getCellClass = (cell) => {
        const columnDef = cell?.column?.columnDef;
        const meta = columnDef?.meta ?? {};
        return joinClasses(
            resolveClassValue(meta.class, cell?.getContext?.()),
            resolveClassValue(meta.cellClass, cell?.getContext?.()),
            resolveClassValue(meta.tdClass, cell?.getContext?.()),
            resolveClassValue(columnDef?.class, cell?.getContext?.()),
            resolveClassValue(columnDef?.cellClass, cell?.getContext?.())
        );
    };

    const handlePageSizeChange = (size) => {
        if (props.onPageSizeChange) {
            props.onPageSizeChange(size);
        }
        props.table.setPageSize(size);
    };

    const pageSizeProxy = computed({
        get: () => props.table.getState().pagination.pageSize,
        set: (size) => handlePageSizeChange(size)
    });

    const pageSizeValue = computed({
        get: () => String(pageSizeProxy.value),
        set: (value) => handlePageSizeChange(Number(value))
    });

    const currentPage = computed({
        get: () => props.table.getState().pagination.pageIndex + 1,
        set: (page) => {
            props.table.setPageIndex(page - 1);
            if (props.onPageChange) {
                props.onPageChange(page);
            }
        }
    });
</script>
