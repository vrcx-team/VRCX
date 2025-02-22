<template>
    <div>
        <div style="height: 25px; margin-top: 60px">
            <transition name="el-fade-in-linear">
                <location
                    v-show="!isLoading"
                    class="location"
                    :location="activityDetailData[0].location"
                    is-open-previous-instance-info-dialog
                    @open-previous-instance-info-dialog="$emit('open-previous-instance-info-dialog', $event)"
                ></location>
            </transition>
        </div>

        <div ref="activityDetailChart"></div>
    </div>
</template>

<script>
    import dayjs from 'dayjs';
    import utils from '../../classes/utils';

    let echarts = null;

    export default {
        name: 'InstanceActivityDetail',
        inject: ['API', 'showUserDialog'],
        props: {
            activityDetailData: {
                type: Array,
                required: true
            },
            activityData: {
                type: Array,
                required: true
            },
            isDarkMode: {
                type: Boolean,
                required: true
            }
        },
        data() {
            return {
                isLoading: true,
                echartsInstance: null,
                resizeObserver: null
            };
        },
        computed: {
            startTimeStamp() {
                return this.activityData
                    .find((item) => item.location === this.activityDetailData[0].location)
                    ?.joinTime.valueOf();
            },
            endTimeStamp() {
                return this.activityData
                    .findLast((item) => item.location === this.activityDetailData[0].location)
                    ?.leaveTime.valueOf();
            }
        },
        created() {
            this.resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    this.echartsInstance.resize({
                        width: entry.contentRect.width,
                        animation: {
                            duration: 300
                        }
                    });
                }
            });
        },
        deactivated() {
            // prevent switch tab play resize animation
            this.resizeObserver.disconnect();
        },

        methods: {
            async initEcharts() {
                // TODO: unnecessary import, import from individual js file
                await import('echarts').then((echartsModule) => {
                    echarts = echartsModule;
                });
                const chartDom = this.$refs.activityDetailChart;
                if (!this.echartsInstance) {
                    this.echartsInstance = echarts.init(chartDom, `${this.isDarkMode ? 'dark' : null}`, {
                        height: this.activityDetailData.length * 40 + 200,
                        useDirtyRect: this.activityDetailData.length > 30
                    });
                    this.resizeObserver.observe(chartDom);
                }

                this.echartsInstance.resize({
                    height: this.activityDetailData.length * 40 + 200,
                    animation: {
                        duration: 300
                    }
                });

                this.echartsInstance.setOption(this.getNewOption(), { lazyUpdate: true });
                this.echartsInstance.on('click', 'yAxis', this.handleClickYAxisLabel);

                setTimeout(() => {
                    this.isLoading = false;
                }, 200);
            },
            handleClickYAxisLabel(params) {
                const userData = this.activityDetailData[params.dataIndex];
                if (userData?.user_id) {
                    this.showUserDialog(userData.user_id);
                }
            },
            getNewOption() {
                // grouping player activity entries by user_id and calculate below:
                // 1. offset: the time from startTimeStamp or the previous entry's tail to the current entry's joinTime
                // 2. time: the time the user spent in the instance
                // 3. tail: the time from startTimeStamp to the current entry's leaveTime
                // 4. entry: the original activity detail entry
                const userGroupedEntries = new Map();
                // uniqueUserEntries has each user's first entry and used to keep the order of the users calculated in InstanceActivity.vue
                const uniqueUserEntries = [];
                for (const entry of this.activityDetailData) {
                    if (!userGroupedEntries.has(entry.user_id)) {
                        userGroupedEntries.set(entry.user_id, []);
                        uniqueUserEntries.push(entry);
                    }
                    const elements = userGroupedEntries.get(entry.user_id);
                    const offset = Math.max(0, elements.length === 0 ? entry.joinTime.valueOf() - this.startTimeStamp : entry.joinTime.valueOf() - this.startTimeStamp - elements[elements.length - 1].tail);
                    const tail = elements.length === 0 ? offset + entry.time : elements[elements.length - 1].tail + offset + entry.time;
                    const element = { offset: offset, time: entry.time, tail: tail, entry: entry };
                    elements.push(element);
                }

                const generateSeries = () => {
                    const maxEntryCount = Math.max(...Array.from(userGroupedEntries.values()).map((entries) => entries.length));
                    const placeholderSeries = (data) => {
                        return {
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
                            data: data,
                        };
                    };
                    const timeSeries = (data) => {
                        return {
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
                            data: data,
                        };
                    };

                    // generate series having placeholder and time series for each user
                    const series = Array(maxEntryCount).fill(0).flatMap((_, index) => {
                        return [
                            placeholderSeries(uniqueUserEntries.map((entry) => {
                                const element = userGroupedEntries.get(entry.user_id)[index];
                                return element ? element.offset : 0;
                            })),
                            timeSeries(uniqueUserEntries.map((entry) => {
                                const element = userGroupedEntries.get(entry.user_id)[index];
                                return element ? element.time : 0;
                            }))
                        ];
                    });

                    return series;
                };

                const getTooltip = (params) => {
                    const activityDetailData = this.activityDetailData;
                    const param = params;
                    const isTimeSeries = params.seriesIndex % 2 === 1;
                    if (!isTimeSeries) {
                        return '';
                    }
                    const targetEntryIndex = Math.floor(params.seriesIndex / 2);

                    if (!activityDetailData || !activityDetailData[param.dataIndex]) {
                        return '';
                    }

                    // first, find the user's entries, then get the focused entry
                    const instanceData = userGroupedEntries.get(activityDetailData[param.dataIndex].user_id)[targetEntryIndex].entry;

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
                        trigger: 'item',
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
                        data: uniqueUserEntries.map((item) => item.display_name),
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
                    series: generateSeries(),
                };

                if (this.isDarkMode) {
                    echartsOption.backgroundColor = 'rgba(0, 0, 0, 0)';
                }
                return echartsOption;
            }
        }
    };
</script>

<style scoped>
    .location {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
