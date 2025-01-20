<template>
    <div class="x-container">
        <data-tables
            :data="tableData.data"
            :pageSize="tableData.pageSize"
            :filters="filters"
            :tableProps="tableProps"
            :paginationProps="paginationProps"
            v-loading="Api.isPlayerModerationsLoading"
        >
            <template slot="tool">
                <div class="tool-slot">
                    <el-select
                        v-model="filters[0].value"
                        @change="saveTableFilters()"
                        multiple
                        clearable
                        style="flex: 1"
                        :placeholder="$t('view.moderation.filter_placeholder')"
                    >
                        <el-option
                            v-for="item in moderationTypes"
                            :key="item"
                            :label="$t('view.moderation.filters.' + item)"
                            :value="item"
                        />
                    </el-select>
                    <el-input
                        v-model="filters[1].value"
                        :placeholder="$t('view.moderation.search_placeholder')"
                        class="filter-input"
                    />
                    <el-tooltip
                        placement="bottom"
                        :content="$t('view.moderation.refresh_tooltip')"
                        :disabled="hideTooltips"
                    >
                        <el-button
                            type="default"
                            :loading="Api.isPlayerModerationsLoading"
                            @click="Api.refreshPlayerModerations()"
                            icon="el-icon-refresh"
                            circle
                        />
                    </el-tooltip>
                </div>
            </template>
            <el-table-column
                :label="$t('table.moderation.date')"
                prop="created"
                sortable="custom"
                width="120"
            >
                <template slot-scope="scope">
                    <el-tooltip placement="right">
                        <template slot="content">
                            <span>{{
                                scope.row.created | formatDate('long')
                            }}</span>
                        </template>
                        <span>{{
                            scope.row.created | formatDate('short')
                        }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column
                :label="$t('table.moderation.type')"
                prop="type"
                width="100"
            >
                <template slot-scope="scope">
                    <span
                        v-text="$t('view.moderation.filters.' + scope.row.type)"
                    ></span>
                </template>
            </el-table-column>
            <el-table-column
                :label="$t('table.moderation.source')"
                prop="sourceDisplayName"
            >
                <template slot-scope="scope">
                    <span
                        class="x-link"
                        v-text="scope.row.sourceDisplayName"
                        @click="showUserDialog(scope.row.sourceUserId)"
                    ></span>
                </template>
            </el-table-column>
            <el-table-column
                :label="$t('table.moderation.target')"
                prop="targetDisplayName"
            >
                <template slot-scope="scope">
                    <span
                        class="x-link"
                        v-text="scope.row.targetDisplayName"
                        @click="showUserDialog(scope.row.targetUserId)"
                    ></span>
                </template>
            </el-table-column>
            <el-table-column
                :label="$t('table.moderation.action')"
                width="80"
                align="right"
            >
                <template slot-scope="scope">
                    <template
                        v-if="scope.row.sourceUserId === Api.currentUser.id"
                    >
                        <el-button
                            v-if="shiftHeld"
                            style="color: #f56c6c"
                            type="text"
                            icon="el-icon-close"
                            size="mini"
                            @click="deletePlayerModeration(scope.row)"
                        ></el-button>
                        <el-button
                            v-else
                            type="text"
                            icon="el-icon-close"
                            size="mini"
                            @click="deletePlayerModerationPrompt(scope.row)"
                        ></el-button>
                    </template>
                </template>
            </el-table-column>
        </data-tables>
    </div>
</template>

<script>
    import configRepository from '../../repository/config.js';

    export default {
        name: 'ModerationTab',
        props: {
            Api: Object,
            tableData: Object,
            showUserDialog: Function,
            shiftHeld: Boolean
        },
        created: async function () {
            this.filters[0].value = JSON.parse(
                await configRepository.getString(
                    'VRCX_playerModerationTableFilters',
                    '[]'
                )
            );
        },
        data() {
            return {
                filters: [
                    {
                        prop: 'type',
                        value: [],
                        filterFn: (row, filter) =>
                            filter.value.some((v) => v === row.type)
                    },
                    {
                        prop: ['sourceDisplayName', 'targetDisplayName'],
                        value: ''
                    }
                ],
                // CONSTANTS
                moderationTypes: [
                    'block',
                    'unblock',
                    'mute',
                    'unmute',
                    'interactOn',
                    'interactOff',
                    'muteChat',
                    'unmuteChat'
                ],
                tableProps: {
                    stripe: true,
                    size: 'mini',
                    defaultSort: {
                        prop: 'created',
                        order: 'descending'
                    }
                },
                paginationProps: {
                    small: true,
                    layout: 'sizes,prev,pager,next,total',
                    pageSizes: [10, 15, 25, 50, 100]
                }
            };
        },
        methods: {
            saveTableFilters() {
                configRepository.setString(
                    'VRCX_playerModerationTableFilters',
                    JSON.stringify(this.filters[0].value)
                );
            },
            deletePlayerModeration(row) {
                this.Api.deletePlayerModeration({
                    moderated: row.targetUserId,
                    type: row.type
                });
            },
            deletePlayerModerationPrompt(row) {
                this.$confirm(
                    `Continue? Delete Moderation ${row.type}`,
                    'Confirm',
                    {
                        confirmButtonText: 'Confirm',
                        cancelButtonText: 'Cancel',
                        type: 'info',
                        callback: (action) => {
                            if (action === 'confirm') {
                                this.deletePlayerModeration(row);
                            }
                        }
                    }
                );
            }
        }
    };
</script>

<style scoped>
    .tool-slot {
        margin: 0 0 10px;
        display: flex;
        align-items: center;
    }
    .filter-input {
        width: 150px;
        margin: 0 10px;
    }
</style>
