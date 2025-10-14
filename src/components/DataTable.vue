<template>
    <div class="data-table-wrapper">
        <el-table
            ref="tableRef"
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
                :current-page="internalCurrentPage"
                :page-size="internalPageSize"
                :total="filteredData.length"
                v-bind="mergedPaginationProps"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange" />
        </div>
    </div>
</template>

<script>
    import { computed, ref, toRefs, watch } from 'vue';

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
            'size-change',
            'current-change',
            'selection-change',
            'row-click',
            'filtered-data'
        ],
        setup(props, { emit }) {
            const { data, currentPage, pageSize, tableProps, paginationProps, filters } = toRefs(props);

            const internalCurrentPage = ref(currentPage.value);
            const internalPageSize = ref(pageSize.value);
            const sortData = ref({
                prop: props.tableProps.defaultSort?.prop || 'created_at',
                order: props.tableProps.defaultSort?.order || 'descending'
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
                pageSizes: [10, 15, 20, 25, 50, 100],
                small: true,
                ...paginationProps.value
            }));

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
                let result = [...data.value];

                if (filters.value && Array.isArray(filters.value) && filters.value.length > 0) {
                    filters.value.forEach((filter) => {
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

                if (sortData.value.prop && sortData.value.order) {
                    const { prop, order } = sortData.value;
                    result.sort((a, b) => {
                        const aVal = a[prop];
                        const bVal = b[prop];
                        let comparison = 0;

                        if (aVal == null && bVal == null) return 0;
                        if (aVal == null) return 1;
                        if (bVal == null) return -1;

                        if (typeof aVal === 'number' && typeof bVal === 'number') {
                            comparison = aVal - bVal;
                        } else if (aVal instanceof Date && bVal instanceof Date) {
                            comparison = aVal.getTime() - bVal.getTime();
                        } else {
                            const aStr = String(aVal).toLowerCase();
                            const bStr = String(bVal).toLowerCase();
                            if (aStr > bStr) comparison = 1;
                            else if (aStr < bStr) comparison = -1;
                        }

                        return order === 'descending' ? -comparison : comparison;
                    });
                }

                emit('filtered-data', result);
                return result;
            });

            const paginatedData = computed(() => {
                if (!showPagination.value) {
                    return filteredData.value;
                }

                const start = (internalCurrentPage.value - 1) * internalPageSize.value;
                const end = start + internalPageSize.value;
                return filteredData.value.slice(start, end);
            });

            const handleSortChange = ({ prop, order }) => {
                sortData.value = { prop, order };
            };

            const handleSelectionChange = (selection) => {
                emit('selection-change', selection);
            };

            const handleRowClick = (row, column, event) => {
                emit('row-click', row, column, event);
            };

            const handleSizeChange = (size) => {
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
                internalCurrentPage,
                internalPageSize,
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
        width: 100%;
    }

    .pagination-wrapper {
        margin-top: 16px;
        display: flex;
        justify-content: space-around;
    }
</style>
