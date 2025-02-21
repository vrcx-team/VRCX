<template>
    <el-dialog
        ref="dialog"
        :visible="visible"
        :title="$t('dialog.previous_instances.info')"
        width="800px"
        @close="$emit('update:visible', false)"
        :fullscreen="fullscreen"
    >
        <el-tabs type="card" v-model="currentTab" @tab-click="fullscreen = !fullscreen">
            <el-tab-pane label="Table" name="table">
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <location :location="location.tag" style="font-size: 14px"></location>
                    <el-input
                        v-model="dataTable.filters[0].value"
                        :placeholder="$t('dialog.previous_instances.search_placeholder')"
                        style="width: 150px"
                        clearable
                    ></el-input>
                </div>
                <data-tables v-loading="loading" v-bind="dataTable" style="margin-top: 10px">
                    <el-table-column
                        :label="$t('table.previous_instances.date')"
                        prop="created_at"
                        sortable
                        width="110"
                    >
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
            </el-tab-pane>
            <el-tab-pane label="Chart" name="chart">
                <location :location="location.tag" style="font-size: 14px"></location>
                <div ref="chart" style="width: 100%"></div>
            </el-tab-pane>
        </el-tabs>
    </el-dialog>
</template>

<script>
    import utils from '../../classes/utils';
    import database from '../../repository/database';
    import dayjs from 'dayjs';

    export default {
        name: 'PreviousInstanceInfo',
        inject: ['adjustDialogZ'],
        props: {
            visible: {
                type: Boolean,
                default: false
            },
            instanceId: { type: String, required: true },
            gameLogIsFriend: { type: Function, required: true },
            gameLogIsFavorite: { type: Function, required: true },
            lookupUser: { type: Function, required: true },
            isDarkMode: { type: Boolean, required: true }
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
        watch: {
            visible(value) {
                if (value) {
                    this.$nextTick(() => {
                        this.init();
                        this.refreshPreviousInstanceInfoTable();
                    });
                    utils.loadEcharts().then((echarts) => {
                        this.echarts = echarts;
                    });
                }
            }
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
            },
            startTimeStamp() {
                return dayjs(this.activityDetailData[this.activityDetailData.length - 1].created_at).valueOf();
            },
            endTimeStamp() {
                return this.activityDetailData
                    .findLast((item) => item.location === this.location.tag)
                    ?.leaveTime.valueOf();
            }
        },
        methods: {
            init() {
                this.adjustDialogZ(this.$refs.dialog.$el);
                this.loading = true;
                this.location = utils.parseLocation(this.instanceId);
            },
            refreshPreviousInstanceInfoTable() {
                database.getPlayersFromInstance(this.location.tag).then((data) => {
                    const array = [];
                    for (const entry of Array.from(data.values())) {
                        entry.timer = utils.timeToText(entry.time);
                        array.push(entry);
                    }
                    array.sort(utils.compareByCreatedAt);
                    this.dataTable.data = array;
                    this.loading = false;
                });
            },
            initEcharts() {
                if (!this.echartsInstance) {
                    this.echartsInstance = this.echarts.init(this.$refs.chart, `${this.isDarkMode ? 'dark' : null}`, {
                        height: this.activityDetailData.length * 40 + 200,
                        useDirtyRect: this.activityDetailData.length > 80
                    });
                }
                this.echartsInstance.on('click', 'yAxis', this.handleClickYAxisLabel);

                this.echartsInstance.setOption(this.getNewOption(), { lazyUpdate: true });
            },
            getNewOption() {
                const getTooltip = (params) => {
                    const activityDetailData = this.activityDetailData;
                    const param = params[1];

                    if (!activityDetailData || !activityDetailData[param.dataIndex]) {
                        return '';
                    }

                    const instanceData = activityDetailData[param.dataIndex];

                    const formattedLeftDateTime = dayjs(instanceData.leaveTime).format('HH:mm:ss');
                    const formattedJoinDateTime = dayjs(instanceData.joinTime).format('HH:mm:ss');

                    const timeString = utils.timeToText(instanceData.time, true);
                    const color = param.color;

                    return `
                        <div style="display: flex; align-items: center;">
                            <div style="width: 10px; height: 55px; background-color: ${color}; margin-right: 5px;"></div>
                            <div>
                                <div>${instanceData.display_name}</div>
                                <div>${formattedJoinDateTime} - ${formattedLeftDateTime}</div>
                                <div>${timeString}</div>
                            </div>
                        </div>
                    `;
                };

                const echartsOption = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow'
                        },
                        formatter: getTooltip
                    },
                    grid: {
                        top: 60,
                        left: 160,
                        right: 90
                    },
                    yAxis: {
                        type: 'category',
                        axisLabel: {
                            interval: 0,
                            formatter: (value) => (value.length > 20 ? `${value.slice(0, 20)}...` : value)
                        },
                        inverse: true,
                        data: this.activityDetailData.map((item) => item.displayName),
                        triggerEvent: true
                    },
                    xAxis: {
                        type: 'value',
                        min: 0,
                        max: this.endTimeStamp - this.startTimeStamp,
                        axisLine: { show: true },
                        axisLabel: {
                            formatter: (value) => dayjs(value + this.startTimeStamp).format('HH:mm')
                        },
                        splitLine: { lineStyle: { type: 'dashed' } }
                    },
                    series: [
                        {
                            name: 'Placeholder',
                            type: 'bar',
                            stack: 'Total',
                            itemStyle: {
                                borderColor: 'transparent',
                                color: 'transparent'
                            },
                            emphasis: {
                                itemStyle: {
                                    borderColor: 'transparent',
                                    color: 'transparent'
                                }
                            },
                            data: this.activityDetailData.map((item) => item.joinTime.valueOf() - this.startTimeStamp)
                        },
                        {
                            name: 'Time',
                            type: 'bar',
                            stack: 'Total',
                            colorBy: 'data',
                            barWidth: 30,
                            itemStyle: {
                                borderRadius: 2,
                                shadowBlur: 2,
                                shadowOffsetX: 0.7,
                                shadowOffsetY: 0.5
                            },
                            data: this.activityDetailData.map((item) => item.time)
                        }
                    ]
                };

                if (this.isDarkMode) {
                    echartsOption.backgroundColor = 'rgba(0, 0, 0, 0)';
                }
                return echartsOption;
            }
        }
    };
</script>
