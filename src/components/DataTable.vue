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

<script>
    import { computed, onBeforeUnmount, ref, toRefs, watch, watchEffect } from 'vue';

    import { useAppearanceSettingsStore, useVrcxStore } from '../stores';

    export default {
        name: 'DataTable',
        props: {
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
                type: [Array, Object],
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
        },
        emits: [
            'update:currentPage',
            'update:pageSize',
            'update:tableProps',
            'size-change',
            'current-change',
            'selection-change',
            'row-click',
            'filtered-data',
            'sort-change'
        ],
        setup(props, { emit }) {
            const appearanceSettingsStore = useAppearanceSettingsStore();
            const vrcxStore = useVrcxStore();
            const { data, currentPage, pageSize, tableProps, paginationProps, filters } = toRefs(props);

            const internalCurrentPage = ref(currentPage.value);
            const internalPageSize = ref(pageSize.value);
            const sortData = ref({
                prop: props.tableProps.defaultSort?.prop || 'created_at',
                order: props.tableProps.defaultSort?.order || 'descending'
            });

            const throttledData = ref(Array.isArray(data.value) ? data.value.slice() : []);
            const throttledFilters = ref(filters.value);
            const throttledSortData = ref({ ...sortData.value });

            let throttleTimerId = null;

            const syncThrottledInputs = () => {
                throttleTimerId = null;
                throttledData.value = Array.isArray(data.value) ? data.value.slice() : [];
                throttledFilters.value = Array.isArray(filters.value) ? filters.value.slice() : filters.value;
                throttledSortData.value = { ...sortData.value };
            };

            const scheduleThrottledSync = () => {
                if (throttleTimerId !== null) {
                    return;
                }
                throttleTimerId = setTimeout(syncThrottledInputs, 500);
            };

            watch(data, scheduleThrottledSync);
            watch(() => (Array.isArray(data.value) ? data.value.length : 0), scheduleThrottledSync);

            watch(filters, scheduleThrottledSync, { deep: true });
            watch(sortData, scheduleThrottledSync, { deep: true });

            onBeforeUnmount(() => {
                if (throttleTimerId !== null) {
                    clearTimeout(throttleTimerId);
                    throttleTimerId = null;
                }
            });

            const showPagination = computed(() => {
                return props.layout.includes('pagination');
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

            const effectivePageSize = computed(() => {
                return props.pageSizeLinked ? appearanceSettingsStore.tablePageSize : internalPageSize.value;
            });

            const applyFilter = function (row, filter) {
                if (Array.isArray(filter.prop)) {
                    return filter.prop.some((propItem) => applyFilter(row, { prop: propItem, value: filter.value }));
                }

                const cellValue = row[filter.prop];
                if (cellValue === undefined || cellValue === null) return false;

                if (Array.isArray(filter.value)) {
                    // assume filter dropdown multi select
                    return filter.value.some((val) => String(cellValue).toLowerCase() === String(val).toLowerCase());
                } else {
                    return String(cellValue).toLowerCase().includes(String(filter.value).toLowerCase());
                }
            };

            const filteredData = computed(() => {
                let result = throttledData.value;
                const activeFilters = throttledFilters.value;
                const activeSort = throttledSortData.value;

                if (activeFilters && Array.isArray(activeFilters) && activeFilters.length > 0) {
                    activeFilters.forEach((filter) => {
                        if (!filter.value) {
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
                    const { prop, order } = activeSort;
                    const sortKeyByRow = new Map();

                    const getSortKey = (row) => {
                        if (sortKeyByRow.has(row)) {
                            return sortKeyByRow.get(row);
                        }

                        const value = row[prop];
                        let key;
                        if (value == null) {
                            key = null;
                        } else if (typeof value === 'number') {
                            key = value;
                        } else if (value instanceof Date) {
                            key = value.getTime();
                        } else {
                            key = String(value).toLowerCase();
                        }

                        sortKeyByRow.set(row, key);
                        return key;
                    };

                    result.sort((a, b) => {
                        const aVal = getSortKey(a);
                        const bVal = getSortKey(b);
                        let comparison = 0;

                        if (aVal == null && bVal == null) return 0;
                        if (aVal == null) return 1;
                        if (bVal == null) return -1;

                        if (typeof aVal === 'number' && typeof bVal === 'number') {
                            comparison = aVal - bVal;
                        } else {
                            const aStr = typeof aVal === 'string' ? aVal : String(aVal);
                            const bStr = typeof bVal === 'string' ? bVal : String(bVal);
                            if (aStr > bStr) comparison = 1;
                            else if (aStr < bStr) comparison = -1;
                        }

                        return order === 'descending' ? -comparison : comparison;
                    });
                }

                return result;
            });

            watchEffect(
                () => {
                    emit('filtered-data', filteredData.value);
                },
                { flush: 'post' }
            );

            const paginatedData = computed(() => {
                if (!showPagination.value) {
                    return filteredData.value;
                }

                const start = (internalCurrentPage.value - 1) * effectivePageSize.value;
                const end = start + effectivePageSize.value;
                return filteredData.value.slice(start, end);
            });

            // Frictionless user experience when bigger than maxTableSize
            const totalItems = computed(() => {
                const length = filteredData.value.length;
                const max = vrcxStore.maxTableSize;
                return length > max && length < max + 51 ? max : length;
            });

            const handleSortChange = ({ prop, order }) => {
                if (props.tableProps.defaultSort) {
                    const { tableProps } = props;
                    tableProps.defaultSort.prop = prop;
                    tableProps.defaultSort.order = order;
                    emit('update:tableProps', tableProps);
                }
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

            return {
                totalItems,
                internalCurrentPage,
                internalPageSize,
                effectivePageSize,
                showPagination,
                mergedTableProps,
                mergedPaginationProps,
                filteredData,
                paginatedData,
                handleSortChange,
                handleSelectionChange,
                handleRowClick,
                handleSizeChange,
                handleCurrentChange
            };
        }
    };
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
