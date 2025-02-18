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
                        data: this.activityDetailData.map((item) => item.display_name),
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

<style scoped>
    .location {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
