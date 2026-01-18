<template>
    <div class="flex flex-col data-table">
        <div v-if="$slots.toolbar" class="mb-2">
            <slot name="toolbar"></slot>
        </div>

        <div class="rounded-md border">
            <div class="max-w-full overflow-auto" :style="tableStyle">
                <Table :class="tableClassValue" :style="tableElementStyle">
                    <colgroup>
                        <col v-for="col in table.getVisibleLeafColumns()" :key="col.id" :style="getColStyle(col)" />
                    </colgroup>
                    <TableHeader>
                        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                            <TableHead
                                v-for="header in headerGroup.headers"
                                :key="header.id"
                                :class="getHeaderClass(header)"
                                :style="getPinnedStyle(header.column)">
                                <template v-if="!header.isPlaceholder">
                                    <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                                    <div
                                        v-if="header.column.getCanResize?.()"
                                        class="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none opacity-0 transition-opacity group-hover:opacity-100"
                                        @mousedown.stop="header.getResizeHandler?.()($event)"
                                        @touchstart.stop="header.getResizeHandler?.()($event)">
                                        <div
                                            class="absolute right-0 top-0 h-full w-px bg-border dark:bg-border dark:brightness-[2]" />
                                    </div>
                                </template>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <template v-if="table.getRowModel().rows?.length">
                            <template v-for="row in table.getRowModel().rows" :key="row.id">
                                <TableRow @click="handleRowClick(row)">
                                    <TableCell
                                        v-for="cell in row.getVisibleCells()"
                                        :key="cell.id"
                                        :class="getCellClass(cell)"
                                        :style="getPinnedStyle(cell.column)">
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
                            <TableCell class="h-24 text-center">
                                <slot name="empty">
                                    {{ emptyText }}
                                </slot>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>

        <div v-if="showPagination" class="mt-4 flex w-full items-center gap-3">
            <div v-if="pageSizes.length" class="inline-flex items-center flex-1 justify-end gap-2">
                <span class="text-xs text-muted-foreground truncate">{{ t('table.pagination.rows_per_page') }}</span>
                <Select v-model="pageSizeValue">
                    <SelectTrigger size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="size in pageSizes" :key="String(size)" :value="String(size)">
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
                    <template
                        v-for="(item, index) in items"
                        :key="item.type === 'page' ? `page-${item.value}` : `ellipsis-${index}`">
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
        tableClass: {
            type: [String, Array],
            default: null
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
        showPagination: {
            type: Boolean,
            default: true
        },
        onPageSizeChange: {
            type: Function,
            default: null
        },
        onPageChange: {
            type: Function,
            default: null
        },
        onRowClick: {
            type: Function,
            default: null
        }
    });

    const { t } = useI18n();

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

    const tableClassValue = computed(() => joinClasses('table-fixed w-full', props.tableClass));

    const tableElementStyle = computed(() => {
        const size = props.table?.getTotalSize?.();
        if (!Number.isFinite(size) || size <= 0) return undefined;
        return { minWidth: `${size}px` };
    });

    const resolveClassValue = (value, ctx) => {
        if (typeof value === 'function') {
            return value(ctx);
        }
        return value;
    };

    const getPinnedState = (col) => {
        try {
            return col?.getIsPinned?.() ?? false;
        } catch {
            return false;
        }
    };

    const getPinnedStyle = (col) => {
        const pinned = getPinnedState(col);
        if (!pinned) return null;

        if (pinned === 'left') {
            const left = col?.getStart?.('left') ?? 0;
            return { left: `${left}px` };
        }

        if (pinned === 'right') {
            const right = col?.getAfter?.('right') ?? 0;
            return { right: `${right}px` };
        }

        return null;
    };

    const isSpacer = (col) => col?.id === '__spacer';

    const isStretch = (col) => {
        return !!col?.columnDef?.meta?.stretch;
    };

    const getColStyle = (col) => {
        if (isSpacer(col)) return { width: '0px' };

        if (isStretch(col)) {
            return null;
        }

        const size = col?.getSize?.();
        if (!Number.isFinite(size)) return null;
        return { width: `${size}px` };
    };

    const getHeaderClass = (header) => {
        const columnDef = header?.column?.columnDef;
        const meta = columnDef?.meta ?? {};
        const pinned = getPinnedState(header?.column);
        return joinClasses(
            'sticky top-0 bg-background dark:bg-sidebar border-b border-border group',
            pinned ? 'z-30' : 'z-10',
            isSpacer(header.column) && 'p-0',
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
        const pinned = getPinnedState(cell?.column);
        return joinClasses(
            pinned && 'sticky bg-background z-20',
            isSpacer(cell.column) && 'p-0',
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
        get: () => props.table.getState?.().pagination?.pageSize ?? 0,
        set: (size) => handlePageSizeChange(size)
    });

    const pageSizeValue = computed({
        get: () => String(pageSizeProxy.value),
        set: (value) => handlePageSizeChange(Number(value))
    });

    const currentPage = computed({
        get: () => (props.table.getState?.().pagination?.pageIndex ?? 0) + 1,
        set: (page) => {
            props.table.setPageIndex(page - 1);
            if (props.onPageChange) {
                props.onPageChange(page);
            }
        }
    });

    const handleRowClick = (row) => {
        if (!props.onRowClick) return;
        props.onRowClick(row);
    };
</script>
