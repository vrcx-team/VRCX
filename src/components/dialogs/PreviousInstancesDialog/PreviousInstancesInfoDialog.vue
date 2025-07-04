<template>
    <safe-dialog
        ref="dialog"
        :visible="previousInstancesInfoDialogVisible"
        :title="$t('dialog.previous_instances.info')"
        width="800px"
        :fullscreen="fullscreen"
        destroy-on-close
        @close="closeDialog">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <location :location="location.tag" style="font-size: 14px"></location>
            <el-input
                v-model="dataTable.filters[0].value"
                :placeholder="$t('dialog.previous_instances.search_placeholder')"
                style="width: 150px"
                clearable></el-input>
        </div>
        <data-tables v-loading="loading" v-bind="dataTable" style="margin-top: 10px">
            <el-table-column :label="$t('table.previous_instances.date')" prop="created_at" sortable width="110">
                <template slot-scope="scope">
                    <el-tooltip placement="left">
                        <template slot="content">
                            <span>{{ scope.row.created_at | formatDate('long') }}</span>
                        </template>
                        <span>{{ scope.row.created_at | formatDate('short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.gameLog.icon')" prop="isFriend" width="70" align="center">
                <template slot-scope="scope">
                    <template v-if="gameLogIsFriend(scope.row)">
                        <el-tooltip v-if="gameLogIsFavorite(scope.row)" placement="top" content="Favorite">
                            <span>⭐</span>
                        </el-tooltip>
                        <el-tooltip v-else placement="top" content="Friend">
                            <span>💚</span>
                        </el-tooltip>
                    </template>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.display_name')" prop="displayName" sortable>
                <template slot-scope="scope">
                    <span class="x-link" @click="lookupUser(scope.row)">{{ scope.row.displayName }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.time')" prop="time" width="100" sortable>
                <template slot-scope="scope">
                    <span>{{ scope.row.timer }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.count')" prop="count" width="100" sortable>
                <template slot-scope="scope">
                    <span>{{ scope.row.count }}</span>
                </template>
            </el-table-column>
        </data-tables>
    </safe-dialog>
</template>

<script>
    import dayjs from 'dayjs';
    import { storeToRefs } from 'pinia';
    import database from '../../../service/database';
    import { adjustDialogZ, compareByCreatedAt, parseLocation, timeToText } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useGameLogStore, useInstanceStore, useUserStore } from '../../../stores';

    export default {
        name: 'PreviousInstancesInfoDialog',
        setup() {
            const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());
            const { lookupUser } = useUserStore();
            const { previousInstancesInfoDialogVisible, previousInstancesInfoDialogInstanceId } =
                storeToRefs(useInstanceStore());
            const { gameLogIsFriend, gameLogIsFavorite } = useGameLogStore();
            return {
                isDarkMode,
                lookupUser,
                previousInstancesInfoDialogVisible,
                previousInstancesInfoDialogInstanceId,
                adjustDialogZ,
                gameLogIsFriend,
                gameLogIsFavorite
            };
        },
        data() {
            return {
                echarts: null,
                echartsInstance: null,
                loading: false,
                location: {},
                currentTab: 'table',
                dataTable: {
                    data: [],
                    filters: [
                        {
                            prop: 'displayName',
                            value: ''
                        }
                    ],
                    tableProps: {
                        stripe: true,
                        size: 'mini',
                        defaultSort: {
                            prop: 'created_at',
                            order: 'descending'
                        }
                    },
                    pageSize: 10,
                    paginationProps: {
                        small: true,
                        layout: 'sizes,prev,pager,next,total',
                        pageSizes: [10, 25, 50, 100]
                    }
                },
                fullscreen: false
            };
        },
        computed: {
            activityDetailData() {
                return this.dataTable.data.map((item) => ({
                    displayName: item.displayName,
                    joinTime: dayjs(item.created_at),
                    leaveTime: dayjs(item.created_at).add(item.time, 'ms'),
                    time: item.time,
                    timer: item.timer
                }));
            }
        },
        watch: {
            previousInstancesInfoDialogVisible(value) {
                if (value) {
                    this.$nextTick(() => {
                        this.init();
                        this.refreshPreviousInstancesInfoTable();
                    });
                    // loadEcharts().then((echarts) => {
                    //     this.echarts = echarts;
                    // });
                }
            }
        },
        methods: {
            init() {
                this.adjustDialogZ(this.$refs.dialog.$el);
                this.loading = true;
                this.location = parseLocation(this.previousInstancesInfoDialogInstanceId);
            },
            refreshPreviousInstancesInfoTable() {
                database.getPlayersFromInstance(this.location.tag).then((data) => {
                    const array = [];
                    for (const entry of Array.from(data.values())) {
                        entry.timer = timeToText(entry.time);
                        array.push(entry);
                    }
                    array.sort(compareByCreatedAt);
                    this.dataTable.data = array;
                    this.loading = false;
                });
            },
            closeDialog() {
                this.previousInstancesInfoDialogVisible = false;
            }
        }
    };
</script>
