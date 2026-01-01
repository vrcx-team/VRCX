<template>
    <div class="data-table-wrapper">
        <el-table
            v-loading="loading"
            :data="paginatedData"
            v-bind="mergedTableProps"
            :default-sort="resolvedDefaultSort"
            lazy
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

    const emit = defineEmits(['row-click']);

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();

    const { data, currentPage, pageSize, tableProps, paginationProps, filters } = toRefs(props);

    const internalCurrentPage = ref(currentPage.value);
    const internalPageSize = ref(pageSize.value);

    const asRawArray = (value) => (Array.isArray(value) ? toRaw(value) : []);
    const isEmptyFilterValue = (value) => (Array.isArray(value) ? value.length === 0 : !value);

    const showPagination = computed(() => {
        return props.layout.includes('pagination');
    });

    const effectivePageSize = computed(() => {
        return props.pageSizeLinked ? appearanceSettingsStore.tablePageSize : internalPageSize.value;
    });

    const throttledData = ref(asRawArray(data.value));
    const throttledFilters = ref(filters.value);

    let throttleTimerId = null;
    const syncThrottledInputs = () => {
        throttleTimerId = null;
        throttledData.value = asRawArray(data.value);
        throttledFilters.value = Array.isArray(filters.value) ? filters.value.slice() : filters.value;
    };

    const scheduleThrottledSync = () => {
        if (throttleTimerId !== null) return;
        throttleTimerId = setTimeout(syncThrottledInputs, 500);
    };

    watch(data, scheduleThrottledSync);
    watch(() => (Array.isArray(data.value) ? data.value.length : 0), scheduleThrottledSync);
    watch(filters, scheduleThrottledSync, { deep: true });
    watch(effectivePageSize, scheduleThrottledSync);

    onBeforeUnmount(() => {
        if (throttleTimerId !== null) {
            clearTimeout(throttleTimerId);
            throttleTimerId = null;
        }
    });

    const resolvedDefaultSort = computed(() => {
        if (props.tableProps?.defaultSort === null) {
            return undefined;
        }
        return (
            props.tableProps?.defaultSort ?? {
                prop: 'created_at',
                order: 'descending'
            }
        );
    });

    const mergedTableProps = computed(() => {
        const src = tableProps.value || {};
        const rest = { ...src };
        if ('defaultSort' in rest) {
            delete rest.defaultSort;
        }
        return {
            stripe: true,
            ...rest
        };
    });

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

    const filteredData = computed(() => {
        let result = throttledData.value.slice();
        const activeFilters = throttledFilters.value;

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

        return result;
    });

    const paginatedData = computed(() => {
        if (!showPagination.value) {
            return filteredData.value;
        }

        const start = (internalCurrentPage.value - 1) * effectivePageSize.value;
        const end = start + effectivePageSize.value;
        return filteredData.value.slice(start, end);
    });

    const totalItems = computed(() => {
        const length = filteredData.value.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handleRowClick = (row, column, event) => {
        emit('row-click', row, column, event);
    };

    const handleSizeChange = (size) => {
        if (props.pageSizeLinked) {
            appearanceSettingsStore.setTablePageSize(size);
            return;
        }
        internalPageSize.value = size;
    };

    const handleCurrentChange = (page) => {
        internalCurrentPage.value = page;
    };

    watch(currentPage, (newVal) => {
        internalCurrentPage.value = newVal;
    });

    watch(pageSize, (newVal) => {
        internalPageSize.value = newVal;
    });
</script>

<style scoped>
    .data-table-wrapper {
        margin: 0 3px;
        font-feature-settings:
            'tnum' 1,
            'lnum' 1;
    }

    .pagination-wrapper {
        margin-top: 16px;
        display: flex;
        justify-content: space-around;
    }
</style>
