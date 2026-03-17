import {
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    isFunction,
    useVueTable
} from '@tanstack/vue-table';
import { computed, ref, unref, watch } from 'vue';

/**
 *
 * @param str
 */
export function safeJsonParse(str) {
    if (!str) {
        return null;
    }
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}

/**
 *
 * @param fn
 * @param wait
 */
function debounce(fn, wait) {
    let t = 0;
    return (...args) => {
        if (t) {
            clearTimeout(t);
        }
        t = setTimeout(() => fn(...args), wait);
    };
}

/**
 *
 * @param sizing
 * @param columns
 */
export function filterSizingByColumns(sizing, columns) {
    if (!sizing || typeof sizing !== 'object') {
        return {};
    }
    const ids = new Set((columns ?? []).map((c) => c?.id).filter(Boolean));
    const out = {};
    for (const [key, value] of Object.entries(sizing)) {
        if (ids.has(key)) {
            out[key] = value;
        }
    }
    return out;
}

/**
 *
 * @param sorting
 * @param columns
 */
export function filterSortingByColumns(sorting, columns) {
    if (!Array.isArray(sorting)) {
        return [];
    }
    const ids = new Set((columns ?? []).map((c) => c?.id).filter(Boolean));
    return sorting.filter((s) => s && ids.has(s.id));
}

/**
 *
 * @param order
 * @param columns
 */
export function filterOrderByColumns(order, columns) {
    if (!Array.isArray(order)) {
        return [];
    }
    const ids = new Set((columns ?? []).map((c) => c?.id).filter(Boolean));
    return order.filter((id) => ids.has(id));
}

/**
 *
 * @param visibility
 * @param columns
 */
export function filterVisibilityByColumns(visibility, columns) {
    if (!visibility || typeof visibility !== 'object') {
        return {};
    }
    const ids = new Set((columns ?? []).map((c) => c?.id).filter(Boolean));
    const out = {};
    for (const [key, value] of Object.entries(visibility)) {
        if (ids.has(key)) {
            out[key] = value;
        }
    }
    return out;
}

/**
 *
 * @param col
 */
export function getColumnId(col) {
    return col?.id ?? col?.accessorKey ?? null;
}

/**
 *
 * @param columns
 */
export function findStretchColumnId(columns) {
    if (!Array.isArray(columns)) {
        return null;
    }
    for (const col of columns) {
        if (col?.meta?.['stretch']) {
            return getColumnId(col);
        }
    }
    return null;
}

/**
 *
 * @param updaterOrValue
 * @param targetRef
 */
function setRef(updaterOrValue, targetRef) {
    targetRef.value = isFunction(updaterOrValue)
        ? updaterOrValue(targetRef.value)
        : updaterOrValue;
}

/**
 *
 * @param func
 */
function resolveMaybeGetter(func) {
    return typeof func === 'function' ? func() : unref(func);
}

/**
 *
 * @param columns
 * @param enabled
 * @param spacerId
 * @param stretchAfterId
 */
export function withSpacerColumn(columns, enabled, spacerId, stretchAfterId) {
    if (!enabled) {
        return columns;
    }
    if (!Array.isArray(columns)) {
        return columns;
    }

    const id = spacerId ?? '__spacer';

    if (columns.some((c) => getColumnId(c) === id)) {
        return columns;
    }

    const spacerColumn = {
        id,
        header: () => null,
        cell: () => null,
        enableSorting: false,
        size: 0,
        minSize: 0,
        meta: { thClass: 'p-0', tdClass: 'p-0' }
    };

    if (stretchAfterId) {
        const idx = columns.findIndex((c) => getColumnId(c) === stretchAfterId);
        if (idx !== -1) {
            return [
                ...columns.slice(0, idx + 1),
                spacerColumn,
                ...columns.slice(idx + 1)
            ];
        }
    }

    return [...columns, spacerColumn];
}

/**
 *
 * @param options
 */
export function useVrcxVueTable(options) {
    const {
        getRowId,
        getRowCanExpand,

        enablePagination = true,
        initialPagination,
        enableSorting = true,
        initialSorting,
        enableFiltering = true,

        enableExpanded = false,
        initialExpanded,

        enablePinning = false,
        initialColumnPinning,

        enableColumnResizing = true,
        columnResizeMode = 'onChange',
        initialColumnSizing,

        enableColumnReorder = true,
        initialColumnOrder,

        enableColumnVisibility = true,
        initialColumnVisibility,

        fillRemainingSpace = true,
        spacerColumnId = '__spacer',

        persistKey,
        persistColumnSizing = true,
        persistSorting = true,
        persistColumnOrder = true,
        persistColumnVisibility = true,
        persistPageSize = true,
        persistDebounceMs = 200,

        tableOptions = {}
    } = options ?? {};

    const hasData = options && 'data' in options;
    const hasColumns = options && 'columns' in options;
    if (!hasData) console.warn('useVrcxVueTable: `data` is required');
    if (!hasColumns) console.warn('useVrcxVueTable: `columns` is required');

    const expanded = ref(initialExpanded ?? {});
    const pagination = ref(initialPagination ?? { pageIndex: 0, pageSize: 50 });
    const columnPinning = ref(initialColumnPinning ?? { left: [], right: [] });
    const columnSizing = ref(initialColumnSizing ?? {});
    const columnOrder = ref(initialColumnOrder ?? []);
    const columnVisibility = ref(initialColumnVisibility ?? {});

    const storageKey = persistKey ? `vrcx:table:${persistKey}` : null;

    /**
     *
     */
    function readPersisted() {
        if (!storageKey) {
            return null;
        }
        return safeJsonParse(localStorage.getItem(storageKey));
    }

    /**
     *
     * @param patch
     */
    function writePersisted(patch) {
        if (!storageKey) {
            return;
        }
        const cur = safeJsonParse(localStorage.getItem(storageKey)) ?? {};
        const next = { ...cur, ...patch, updatedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(next));
    }

    /**
     * @param keys
     */
    function removePersisted(keys) {
        if (!storageKey) {
            return;
        }
        const cur = safeJsonParse(localStorage.getItem(storageKey)) ?? {};
        for (const key of keys) {
            delete cur[key];
        }
        cur.updatedAt = Date.now();
        localStorage.setItem(storageKey, JSON.stringify(cur));
    }

    const persisted = readPersisted();

    let resolvedSorting = initialSorting ?? [];
    if (persisted && persistSorting && Array.isArray(persisted.sorting)) {
        resolvedSorting = persisted.sorting;
    }
    const sorting = ref(resolvedSorting);

    if (persisted && persistColumnSizing && persisted.columnSizing) {
        columnSizing.value = persisted.columnSizing;
    }

    if (
        persisted &&
        persistColumnOrder &&
        Array.isArray(persisted.columnOrder)
    ) {
        columnOrder.value = persisted.columnOrder;
    }

    if (persisted && persistColumnVisibility && persisted.columnVisibility) {
        columnVisibility.value = persisted.columnVisibility;
    }

    if (
        persisted &&
        persistPageSize &&
        typeof persisted.pageSize === 'number' &&
        persisted.pageSize > 0
    ) {
        pagination.value = {
            ...pagination.value,
            pageSize: persisted.pageSize
        };
    }

    // Column order lock — persisted per-table
    const columnOrderLocked = ref(persisted?.columnOrderLocked === true);

    const state = {};
    const handlers = {};
    const rowModels = {};
    const extra = {};

    /**
     *
     * @param enabled
     * @param key
     * @param r
     * @param onChangeKey
     * @param rowModelPart
     * @param extraPart
     */
    function register(enabled, key, r, onChangeKey, rowModelPart, extraPart) {
        if (!enabled) {
            return;
        }

        Object.defineProperty(state, key, {
            enumerable: true,
            get: () => r.value
        });

        if (onChangeKey) handlers[onChangeKey] = (val) => setRef(val, r);
        if (rowModelPart) Object.assign(rowModels, rowModelPart);
        if (extraPart) Object.assign(extra, extraPart);
    }

    register(enableSorting, 'sorting', sorting, 'onSortingChange', {
        getSortedRowModel: getSortedRowModel()
    });

    register(enablePagination, 'pagination', pagination, 'onPaginationChange', {
        getPaginationRowModel: getPaginationRowModel()
    });

    register(
        enableExpanded,
        'expanded',
        expanded,
        'onExpandedChange',
        { getExpandedRowModel: getExpandedRowModel() },
        { getRowCanExpand }
    );

    register(
        enablePinning,
        'columnPinning',
        columnPinning,
        'onColumnPinningChange'
    );

    register(
        enableColumnResizing,
        'columnSizing',
        columnSizing,
        'onColumnSizingChange',
        null,
        { enableColumnResizing: true, columnResizeMode }
    );

    register(
        enableColumnReorder,
        'columnOrder',
        columnOrder,
        'onColumnOrderChange'
    );

    register(
        enableColumnVisibility,
        'columnVisibility',
        columnVisibility,
        'onColumnVisibilityChange'
    );

    if (enableFiltering) {
        Object.assign(rowModels, {
            getFilteredRowModel: getFilteredRowModel()
        });
    }

    const dataSource = computed(() => options.data);
    const columnsSource = computed(() => resolveMaybeGetter(options.columns));

    const table = useVueTable({
        data: dataSource,
        get columns() {
            const cols = columnsSource.value;

            const stretchAfterId = findStretchColumnId(cols);

            return withSpacerColumn(
                cols,
                fillRemainingSpace,
                spacerColumnId,
                stretchAfterId
            );
        },
        getRowId,

        getCoreRowModel: getCoreRowModel(),
        ...rowModels,
        ...handlers,
        ...extra,

        state,

        meta: {
            resetAll: storageKey ? resetAll : undefined,
            columnOrderLocked: storageKey ? columnOrderLocked : undefined
        },

        ...tableOptions
    });

    watch(
        columnsSource,
        (next) => {
            table.setOptions((prev) => ({
                ...prev,
                columns: withSpacerColumn(
                    next,
                    fillRemainingSpace,
                    spacerColumnId,
                    findStretchColumnId(next)
                )
            }));
            table.setState((prev) => ({ ...prev }));
        },
        { immediate: true }
    );

    const persistWrite = debounce(
        (payload) => writePersisted(payload),
        persistDebounceMs
    );

    if (storageKey && persistColumnSizing) {
        watch(
            columnSizing,
            (val) => {
                const cols = table.getAllLeafColumns?.() ?? [];
                persistWrite({
                    columnSizing: filterSizingByColumns(val, cols)
                });
            },
            { deep: true }
        );
    }

    if (storageKey && persistSorting) {
        watch(
            sorting,
            (val) => {
                const cols = table.getAllLeafColumns?.() ?? [];
                persistWrite({
                    sorting: filterSortingByColumns(val, cols)
                });
            },
            { deep: true }
        );
    }

    if (storageKey && persistColumnOrder) {
        watch(
            columnOrder,
            (val) => {
                const cols = table.getAllLeafColumns?.() ?? [];
                persistWrite({
                    columnOrder: filterOrderByColumns(val, cols)
                });
            },
            { deep: true }
        );
    }

    if (storageKey && persistColumnVisibility) {
        watch(
            columnVisibility,
            (val) => {
                const cols = table.getAllLeafColumns?.() ?? [];
                persistWrite({
                    columnVisibility: filterVisibilityByColumns(val, cols)
                });
            },
            { deep: true }
        );
    }

    if (storageKey && persistPageSize) {
        watch(
            () => pagination.value.pageSize,
            (val) => {
                if (typeof val === 'number' && val > 0) {
                    persistWrite({ pageSize: val });
                }
            }
        );
    }

    if (storageKey) {
        watch(columnOrderLocked, (val) => {
            writePersisted({ columnOrderLocked: val });
        });
    }

    /**
     */
    function resetAll() {
        columnSizing.value = {};
        columnOrder.value = [];

        const cols = columnsSource.value ?? [];
        const defaultHiddenVisibility = {};
        for (const col of cols) {
            const id = getColumnId(col);
            if (id && col?.meta?.defaultHidden) {
                defaultHiddenVisibility[id] = false;
            }
        }
        columnVisibility.value = defaultHiddenVisibility;

        removePersisted(['columnSizing', 'columnOrder', 'columnVisibility']);
    }

    return {
        table,
        sorting,
        pagination,
        expanded,
        columnPinning,
        columnSizing,
        columnOrder,
        columnVisibility,
        columnOrderLocked,
        resetAll
    };
}
