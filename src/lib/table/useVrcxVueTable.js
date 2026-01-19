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

function safeJsonParse(str) {
    if (!str) {
        return null;
    }
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}

function debounce(fn, wait) {
    let t = 0;
    return (...args) => {
        if (t) {
            clearTimeout(t);
        }
        t = setTimeout(() => fn(...args), wait);
    };
}

function filterSizingByColumns(sizing, columns) {
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

function getColumnId(col) {
    return col?.id ?? col?.accessorKey ?? null;
}

function findStretchColumnId(columns) {
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

function setRef(updaterOrValue, targetRef) {
    targetRef.value = isFunction(updaterOrValue)
        ? updaterOrValue(targetRef.value)
        : updaterOrValue;
}

function resolveMaybeGetter(func) {
    return typeof func === 'function' ? func() : unref(func);
}

function withSpacerColumn(columns, enabled, spacerId, stretchAfterId) {
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

        fillRemainingSpace = true,
        spacerColumnId = '__spacer',

        persistKey,
        persistColumnSizing = true,
        persistDebounceMs = 200,

        tableOptions = {}
    } = options ?? {};

    const hasData = options && 'data' in options;
    const hasColumns = options && 'columns' in options;
    if (!hasData) console.warn('useVrcxVueTable: `data` is required');
    if (!hasColumns) console.warn('useVrcxVueTable: `columns` is required');

    const sorting = ref(initialSorting ?? []);
    const expanded = ref(initialExpanded ?? {});
    const pagination = ref(initialPagination ?? { pageIndex: 0, pageSize: 50 });
    const columnPinning = ref(initialColumnPinning ?? { left: [], right: [] });
    const columnSizing = ref(initialColumnSizing ?? {});

    const storageKey = persistKey ? `vrcx:table:${persistKey}` : null;

    function readPersisted() {
        if (!storageKey) {
            return null;
        }
        return safeJsonParse(localStorage.getItem(storageKey));
    }

    function writePersisted(patch) {
        if (!storageKey) {
            return;
        }
        const cur = safeJsonParse(localStorage.getItem(storageKey)) ?? {};
        const next = { ...cur, ...patch, updatedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(next));
    }

    const persisted = readPersisted();
    if (persisted && persistColumnSizing && persisted.columnSizing) {
        columnSizing.value = persisted.columnSizing;
    }

    const state = {};
    const handlers = {};
    const rowModels = {};
    const extra = {};

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

    if (enableFiltering) {
        Object.assign(rowModels, {
            getFilteredRowModel: getFilteredRowModel()
        });
    }

    const dataSource = computed(() => resolveMaybeGetter(options.data));
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

    return {
        table,
        sorting,
        pagination,
        expanded,
        columnPinning,
        columnSizing
    };
}
