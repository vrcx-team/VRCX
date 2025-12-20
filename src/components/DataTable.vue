<template>
    <div class="data-table-wrapper">
        <el-table
            v-loading="loading"
            :data="paginatedData"
            v-bind="mergedTableProps"
            default-sort-prop="created_at"
            default-sort-order="descending"
            lazy
            @sort-change="handleSortChange"
            @selection-change="handleSelectionChange"
            @row-click="handleRowClick">
            <slot></slot>
        </el-table>

        <div v-if="showPagination" class="pagination-wrapper">
            <el-pagination
                size="small"
                :current-page="internalCurrentPage"
                :page-size="effectivePageSize"
                :total="totalItems"
                v-bind="mergedPaginationProps"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange" />
        </div>
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, ref, toRaw, toRefs, watch } from 'vue';

    import { useAppearanceSettingsStore, useVrcxStore } from '../stores';

    const props = defineProps({
        data: {
            type: Array,
            default: () => []
        },
        tableProps: {
            type: Object,
            default: () => ({})
        },
        paginationProps: {
            type: Object,
            default: () => ({})
        },
        currentPage: {
            type: Number,
            default: 1
        },
        pageSize: {
            type: Number,
            default: 20
        },
        pageSizeLinked: {
            type: Boolean,
            default: false
        },
        filters: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        layout: {
            type: String,
            default: 'table, pagination'
        }
    });

    const emit = defineEmits([
        'update:currentPage',
        'update:pageSize',
        'size-change',
        'current-change',
        'selection-change',
        'row-click',
        'sort-change'
    ]);

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();

    const { data, currentPage, pageSize, tableProps, paginationProps, filters } = toRefs(props);

    const internalCurrentPage = ref(currentPage.value);
    const internalPageSize = ref(pageSize.value);
    const sortData = ref({
        prop: props.tableProps.defaultSort?.prop || 'created_at',
        order: props.tableProps.defaultSort?.order || 'descending'
    });

    const asRawArray = (value) => (Array.isArray(value) ? toRaw(value) : []);
    const isEmptyFilterValue = (value) => (Array.isArray(value) ? value.length === 0 : !value);
    const hasActiveFilters = (activeFilters) => {
        if (!Array.isArray(activeFilters) || activeFilters.length === 0) return false;
        return activeFilters.some((filter) => !isEmptyFilterValue(filter?.value));
    };

    const showPagination = computed(() => {
        return props.layout.includes('pagination');
    });

    const effectivePageSize = computed(() => {
        return props.pageSizeLinked ? appearanceSettingsStore.tablePageSize : internalPageSize.value;
    });

    const looksSortedByCreatedAtDesc = (src) => {
        if (!Array.isArray(src) || src.length <= 2) return true;
        const start = Math.max(1, src.length - effectivePageSize.value - 1);
        for (let i = start; i < src.length; i++) {
            const a = src[i - 1]?.created_at;
            const b = src[i]?.created_at;
            if (typeof a === 'string' && typeof b === 'string' && a > b) {
                return false;
            }
        }
        return true;
    };

    const throttledData = ref(asRawArray(data.value));
    const throttledFilters = ref(filters.value);
    const throttledSortData = ref({ ...sortData.value });
    const throttledLooksSortedByCreatedAt = ref(true);

    let throttleTimerId = null;
    const syncThrottledInputs = () => {
        throttleTimerId = null;
        throttledData.value = asRawArray(data.value);
        throttledFilters.value = Array.isArray(filters.value) ? filters.value.slice() : filters.value;
        throttledSortData.value = { ...sortData.value };

        const sort = throttledSortData.value;
        const shouldCheckFastPath =
            showPagination.value &&
            !hasActiveFilters(throttledFilters.value) &&
            sort?.prop === 'created_at' &&
            sort?.order === 'descending';
        throttledLooksSortedByCreatedAt.value = shouldCheckFastPath
            ? looksSortedByCreatedAtDesc(throttledData.value)
            : false;
    };

    const scheduleThrottledSync = () => {
        if (throttleTimerId !== null) return;
        throttleTimerId = setTimeout(syncThrottledInputs, 500);
    };

    watch(data, scheduleThrottledSync);
    watch(() => (Array.isArray(data.value) ? data.value.length : 0), scheduleThrottledSync);
    watch(filters, scheduleThrottledSync, { deep: true });
    watch(sortData, scheduleThrottledSync, { deep: true });
    watch(effectivePageSize, scheduleThrottledSync);

    onBeforeUnmount(() => {
        if (throttleTimerId !== null) {
            clearTimeout(throttleTimerId);
            throttleTimerId = null;
        }
    });

    const canUseFastCreatedAtDescPagination = computed(() => {
        if (!showPagination.value) return false;
        if (!throttledLooksSortedByCreatedAt.value) return false;

        const activeFilters = throttledFilters.value;
        if (hasActiveFilters(activeFilters)) return false;

        const sort = throttledSortData.value;
        return sort?.prop === 'created_at' && sort?.order === 'descending';
    });

    const mergedTableProps = computed(() => ({
        stripe: true,
        ...tableProps.value
    }));

    const mergedPaginationProps = computed(() => ({
        layout: 'sizes, prev, pager, next, total',
        ...paginationProps.value,
        pageSizes: paginationProps.value?.pageSizes ?? appearanceSettingsStore.tablePageSizes
    }));

    const applyFilter = function (row, filter) {
        if (Array.isArray(filter.prop)) {
            return filter.prop.some((propItem) => applyFilter(row, { prop: propItem, value: filter.value }));
        }

        const cellValue = row[filter.prop];
        if (cellValue === undefined || cellValue === null) return false;

        if (Array.isArray(filter.value)) {
            return filter.value.some((val) => String(cellValue).toLowerCase() === String(val).toLowerCase());
        } else {
            return String(cellValue).toLowerCase().includes(String(filter.value).toLowerCase());
        }
    };

    const toSortKey = (value) => {
        if (value == null) return null;
        if (typeof value === 'number') return value;
        if (value instanceof Date) return value.getTime();
        return String(value).toLowerCase();
    };

    const compareSortKeys = (aKey, bKey) => {
        if (aKey == null && bKey == null) return 0;
        if (aKey == null) return 1;
        if (bKey == null) return -1;

        if (typeof aKey === 'number' && typeof bKey === 'number') {
            if (aKey > bKey) return 1;
            if (aKey < bKey) return -1;
            return 0;
        }

        const aStr = typeof aKey === 'string' ? aKey : String(aKey);
        const bStr = typeof bKey === 'string' ? bKey : String(bKey);
        if (aStr > bStr) return 1;
        if (aStr < bStr) return -1;
        return 0;
    };

    const createRowSortKeyGetter = (prop) => {
        const sortKeyByRow = new Map();
        return (row) => {
            if (sortKeyByRow.has(row)) {
                return sortKeyByRow.get(row);
            }
            const key = toSortKey(row?.[prop]);
            sortKeyByRow.set(row, key);
            return key;
        };
    };

    const sortRows = (rows, { prop, order }) => {
        const getKey = createRowSortKeyGetter(prop);
        rows.sort((a, b) => {
            const comparison = compareSortKeys(getKey(a), getKey(b));
            return order === 'descending' ? -comparison : comparison;
        });
    };

    const filteredData = computed(() => {
        let result = throttledData.value;
        const activeFilters = throttledFilters.value;
        const activeSort = throttledSortData.value;

        if (activeFilters && Array.isArray(activeFilters) && activeFilters.length > 0) {
            activeFilters.forEach((filter) => {
                if (isEmptyFilterValue(filter?.value)) {
                    return;
                }
                if (filter.filterFn) {
                    result = result.filter((row) => filter.filterFn(row, filter));
                } else if (!Array.isArray(filter.value) || filter.value.length > 0) {
                    result = result.filter((row) => applyFilter(row, filter));
                }
            });
        }

        if (activeSort?.prop && activeSort?.order) {
            if (result === throttledData.value) {
                result = [...result];
            }
            sortRows(result, activeSort);
        }

        return result;
    });

    const paginatedData = computed(() => {
        if (!showPagination.value) {
            return filteredData.value;
        }

        if (canUseFastCreatedAtDescPagination.value) {
            const src = throttledData.value;
            const page = [];
            if (!Array.isArray(src) || src.length === 0) {
                return page;
            }
            const startOffset = (internalCurrentPage.value - 1) * effectivePageSize.value;
            const endOffset = startOffset + effectivePageSize.value;
            for (let offset = startOffset; offset < endOffset; offset++) {
                const idx = src.length - 1 - offset;
                if (idx < 0) break;
                page.push(src[idx]);
            }
            return page;
        }

        const start = (internalCurrentPage.value - 1) * effectivePageSize.value;
        const end = start + effectivePageSize.value;
        return filteredData.value.slice(start, end);
    });

    const totalItems = computed(() => {
        const length = canUseFastCreatedAtDescPagination.value
            ? Array.isArray(throttledData.value)
                ? throttledData.value.length
                : 0
            : filteredData.value.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handleSortChange = ({ prop, order }) => {
        sortData.value = { prop, order };
        emit('sort-change', sortData.value);
    };

    const handleSelectionChange = (selection) => {
        emit('selection-change', selection);
    };

    const handleRowClick = (row, column, event) => {
        emit('row-click', row, column, event);
    };

    const handleSizeChange = (size) => {
        if (props.pageSizeLinked) {
            appearanceSettingsStore.setTablePageSize(size);
            emit('update:pageSize', size);
            emit('size-change', size);
            return;
        }
        internalPageSize.value = size;
        emit('update:pageSize', size);
        emit('size-change', size);
    };

    const handleCurrentChange = (page) => {
        internalCurrentPage.value = page;
        emit('update:currentPage', page);
        emit('current-change', page);
    };

    watch(currentPage, (newVal) => {
        internalCurrentPage.value = newVal;
    });

    watch(pageSize, (newVal) => {
        internalPageSize.value = newVal;
    });

    watch(
        () => props.tableProps.defaultSort,
        (newSort) => {
            if (newSort) {
                sortData.value = {
                    prop: newSort.prop,
                    order: newSort.order
                };
            }
        },
        { immediate: true }
    );
</script>

<style scoped>
    .data-table-wrapper {
        margin: 0 3px;
    }

    .pagination-wrapper {
        margin-top: 16px;
        display: flex;
        justify-content: space-around;
    }
</style>
