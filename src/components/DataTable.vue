<template>
    <div class="data-table-wrapper">
        <el-table
            ref="tableRef"
            v-loading="loading"
            :data="paginatedData"
            v-bind="mergedTableProps"
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
    import { computed, ref, watch, toRefs } from 'vue';

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
            'sort-change',
            'selection-change',
            'row-click',
            'filtered-data'
        ],
        setup(props, { emit }) {
            const { data, currentPage, pageSize, tableProps, paginationProps, filters } = toRefs(props);

            const internalCurrentPage = ref(currentPage.value);
            const internalPageSize = ref(pageSize.value);
            const sortData = ref({});

            const showPagination = computed(() => {
                return props.layout.includes('pagination');
            });

            const mergedTableProps = computed(() => ({
                stripe: true,
                ...tableProps.value
            }));

            const mergedPaginationProps = computed(() => ({
                layout: 'sizes, prev, pager, next, total',
                pageSizes: [20, 50, 100, 200],
                small: true,
                ...paginationProps.value
            }));

            const filteredData = computed(() => {
                let result = [...data.value];

                if (filters.value && Array.isArray(filters.value) && filters.value.length > 0) {
                    filters.value.forEach((filter) => {
                        if (
                            filter.value !== undefined &&
                            filter.value !== '' &&
                            (!Array.isArray(filter.value) || filter.value.length > 0)
                        ) {
                            result = result.filter((row) => {
                                const cellValue = row[filter.prop];
                                if (cellValue === undefined || cellValue === null) return false;

                                if (Array.isArray(filter.value)) {
                                    return filter.value.some((val) =>
                                        String(cellValue).toLowerCase().includes(String(val).toLowerCase())
                                    );
                                } else {
                                    return String(cellValue).toLowerCase().includes(String(filter.value).toLowerCase());
                                }
                            });
                        }
                    });
                }

                if (sortData.value.prop && sortData.value.order) {
                    const { prop, order } = sortData.value;
                    result.sort((a, b) => {
                        const aVal = a[prop];
                        const bVal = b[prop];
                        let comparison = 0;

                        if (aVal > bVal) comparison = 1;
                        else if (aVal < bVal) comparison = -1;

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
                emit('sort-change', { prop, order });
            };

            const handleSelectionChange = (selection) => {
                emit('selection-change', selection);
            };

            const handleRowClick = (row, column, event) => {
                emit('row-click', row, column, event);
            };

            const handleSizeChange = (size) => {
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
        justify-content: flex-end;
    }
</style>
