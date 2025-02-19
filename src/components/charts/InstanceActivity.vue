<template>
    <div>
        <div class="options-container flex-between" style="margin-top: 0">
            <span style="margin-top: 10px">Instance Activity</span>
            <el-date-picker
                v-model="selectedDate"
                type="date"
                :clearable="false"
                align="right"
                :picker-options="{
                    disabledDate: (time) => getDatePickerDisabledDate(time)
                }"
                @change="handleSelectDate"
            ></el-date-picker>
        </div>
        <div style="position: relative">
            <el-statistic title="Total Online Time">
                <template #formatter>
                    <span :style="isDarkMode ? 'color:rgb(120,120,120)' : ''">{{ totalOnlineTime }}</span>
                </template>
            </el-statistic>
        </div>

        <div ref="activityChartRef" style="width: 100%"></div>
        <div v-if="!isLoading && activityData.length === 0" class="nodata">
            <span>No data here, try another day</span>
        </div>

        <transition name="el-fade-in-linear">
            <div v-show="!isLoading && activityData.length !== 0" class="divider"><el-divider>·</el-divider></div>
        </transition>
        <instance-activity-detail
            v-for="arr in activityDetailData"
            :key="arr[0].location + arr[0].created_at"
            ref="activityDetailChartRef"
            :activity-detail-data="arr"
            :is-dark-mode="isDarkMode"
            :dt-hour12="dtHour12"
            @open-previous-instance-info-dialog="$emit('open-previous-instance-info-dialog', $event)"
        />
    </div>
</template>

<script>
    import dayjs from 'dayjs';
    import database from '../../repository/database';
    import utils from '../../classes/utils';
    import InstanceActivityDetail from './InstanceActivityDetail.vue';

    let echarts = null;

    export default {
        name: 'InstanceActivity',
        components: {
            InstanceActivityDetail
        },
        inject: ['API'],
        props: {
            getWorldName: Function,
            isDarkMode: Boolean,
            dtHour12: Boolean
        },
        data() {
            return {
                echartsInstance: null,
                resizeObserver: null,
                intersectionObservers: [],
                selectedDate: dayjs().add(-1, 'day'),
                activityData: [],
                activityDetailData: [],
                allDateOfActivity: null,
                firstDateOfActivity: null,
                worldNameArray: [],
                isLoading: true
            };
        },
        computed: {
            totalOnlineTime() {
                return utils.timeToText(
                    this.activityData.reduce((acc, item) => acc + item.time, 0),
                    true
                );
            }
        },
        watch: {
            isDarkMode() {
                if (this.echartsInstance) {
                    this.echartsInstance.dispose();
                    this.echartsInstance = null;
                    this.initEcharts();
                }
            },
            dtHour12() {
                if (this.echartsInstance) {
                    this.echartsInstance.dispose();
                    this.echartsInstance = null;
                    this.initEcharts();
                }
            }
        },
        activated() {
            // first time also call activated
            if (this.echartsInstance) {
                this.handleSelectDate();
            }
        },
        deactivated() {
            // prevent resize animation when switch tab
            this.resizeObserver.disconnect();
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
        async mounted() {
            try {
                const [echartsModule] = await Promise.all([
                    // lazy load echarts
                    // reduce the VRCX initial screen load times
                    // TODO: export lazy load func to a single file
                    import('echarts').catch((error) => {
                        console.error('lazy load echarts failed', error);
                        return null;
                    }),
                    this.getActivityData()
                ]);
                if (echartsModule) {
                    echarts = echartsModule;
                }
                if (this.activityData.length && echarts) {
                    // activity data is ready, but world name data isn't ready
                    // so init echarts with empty data, reduce the render time of init screen
                    this.initEcharts(true);
                    this.getAllDateOfActivity();
                    this.getWorldNameData();
                } else {
                    this.isLoading = false;
                }
            } catch (error) {
                console.error('error in mounted', error);
            }
        },
        methods: {
            // reload data
            async handleSelectDate() {
                this.isLoading = true;
                await this.getActivityData();
                this.getWorldNameData();
            },
            initEcharts(isFirstTime = false) {
                const chartsHeight = this.activityData.length * 40 + 200;
                const chartDom = this.$refs.activityChartRef;
                if (!this.echartsInstance) {
                    this.echartsInstance = echarts.init(chartDom, `${this.isDarkMode ? 'dark' : null}`, {
                        height: chartsHeight
                    });
                    this.resizeObserver.observe(chartDom);
                }

                this.echartsInstance.resize({
                    height: chartsHeight,
                    animation: {
                        duration: 300
                    }
                });

                requestAnimationFrame(() => {
                    this.echartsInstance.setOption(this.getNewOption(isFirstTime), { lazyUpdate: true });
                    this.echartsInstance.on('click', 'yAxis', this.handleClickYAxisLabel);
                    this.isLoading = false;
                });
            },
            handleClickYAxisLabel(params) {
                const detailDataIdx = this.activityDetailData.findIndex((arr) => {
                    const sameLocation = arr[0]?.location === this.activityData[params?.dataIndex]?.location;
                    const sameJoinTime = arr
                        .find((item) => item.user_id === this.API.currentUser.id)
                        .joinTime.isSame(this.activityData[params?.dataIndex].joinTime);
                    return sameLocation && sameJoinTime;
                });
                if (detailDataIdx !== -1) {
                    this.$refs.activityDetailChartRef[detailDataIdx].$el.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            },
            getDatePickerDisabledDate(time) {
                if (time > Date.now() || time < this.firstDateOfActivity || !this.allDateOfActivity) {
                    return true;
                }
                return !this.allDateOfActivity.has(dayjs(time).format('YYYY-MM-DD'));
            },
            async getAllDateOfActivity() {
                const utcDateStrings = await database.getDateOfInstanceActivity();
                const uniqueDates = new Set();
                this.firstDateOfActivity = dayjs.utc(utcDateStrings[0]).startOf('day');

                for (const utcString of utcDateStrings) {
                    const formattedDate = dayjs.utc(utcString).tz().format('YYYY-MM-DD');
                    uniqueDates.add(formattedDate);
                }

                this.allDateOfActivity = uniqueDates;
            },
            async getActivityData() {
                const localStartDate = dayjs.tz(this.selectedDate).startOf('day').toISOString();
                const localEndDate = dayjs.tz(this.selectedDate).endOf('day').toISOString();
                const dbData = await database.getInstanceActivity(localStartDate, localEndDate);

                const transformData = (item) => ({
                    ...item,
                    joinTime: dayjs(item.created_at).subtract(item.time, 'millisecond'),
                    leaveTime: dayjs(item.created_at),
                    time: item.time < 0 ? 0 : item.time
                });

                this.activityData = dbData.currentUserData.map(transformData);

                const transformAndSort = (arr) => {
                    return arr.map(transformData).sort((a, b) => {
                        const timeDiff = Math.abs(a.joinTime.diff(b.joinTime, 'second'));
                        // recording delay, under 3s is considered the same time entry, beautify the chart
                        return timeDiff < 3 ? a.leaveTime - b.leaveTime : a.joinTime - b.joinTime;
                    });
                };

                const filterByLocation = (innerArray, locationSet) => {
                    return innerArray.every((innerObject) => locationSet.has(innerObject.location));
                };
                const locationSet = new Set(this.activityData.map((item) => item.location));

                const preSplitActivityDetailData = Array.from(dbData.detailData.values())
                    .map(transformAndSort)
                    .filter((innerArray) => filterByLocation(innerArray, locationSet));

                this.activityDetailData = this.handleSplitActivityDetailData(
                    preSplitActivityDetailData,
                    this.API.currentUser.id
                );

                this.$nextTick(() => {
                    this.handleIntersectionObserver();
                });
            },
            handleSplitActivityDetailData(activityDetailData, currentUserId) {
                function countTargetIdOccurrences(innerArray, targetId) {
                    let count = 0;
                    for (const obj of innerArray) {
                        if (obj.user_id === targetId) {
                            count++;
                        }
                    }
                    return count;
                }

                function areIntervalsOverlapping(objA, objB) {
                    const isObj1EndTimeBeforeObj2StartTime = objA.leaveTime.isBefore(objB.joinTime, 'second');
                    const isObj2EndTimeBeforeObj1StartTime = objB.leaveTime.isBefore(objA.joinTime, 'second');
                    return !(isObj1EndTimeBeforeObj2StartTime || isObj2EndTimeBeforeObj1StartTime);
                }

                function buildOverlapGraph(innerArray) {
                    const numObjects = innerArray.length;
                    const adjacencyList = Array.from({ length: numObjects }, () => []);

                    for (let i = 0; i < numObjects; i++) {
                        for (let j = i + 1; j < numObjects; j++) {
                            if (areIntervalsOverlapping(innerArray[i], innerArray[j])) {
                                adjacencyList[i].push(j);
                                adjacencyList[j].push(i);
                            }
                        }
                    }
                    return adjacencyList;
                }

                function depthFirstSearch(nodeIndex, visited, graph, component) {
                    visited[nodeIndex] = true;
                    component.push(nodeIndex);
                    for (const neighborIndex of graph[nodeIndex]) {
                        if (!visited[neighborIndex]) {
                            depthFirstSearch(neighborIndex, visited, graph, component);
                        }
                    }
                }

                function findConnectedComponents(graph, numNodes) {
                    const visited = new Array(numNodes).fill(false);
                    const components = [];

                    for (let i = 0; i < numNodes; i++) {
                        if (!visited[i]) {
                            const component = [];
                            depthFirstSearch(i, visited, graph, component);
                            components.push(component);
                        }
                    }
                    return components;
                }

                function processOuterArrayWithTargetId(outerArray, targetId) {
                    let i = 0;
                    while (i < outerArray.length) {
                        let currentInnerArray = outerArray[i];
                        let targetIdCount = countTargetIdOccurrences(currentInnerArray, targetId);
                        if (targetIdCount > 1) {
                            let graph = buildOverlapGraph(currentInnerArray);
                            let connectedComponents = findConnectedComponents(graph, currentInnerArray.length);
                            let newInnerArrays = connectedComponents.map((componentIndices) => {
                                return componentIndices.map((index) => currentInnerArray[index]);
                            });
                            outerArray.splice(i, 1, ...newInnerArrays);
                            i += newInnerArrays.length;
                        } else {
                            i += 1;
                        }
                    }
                    return outerArray.sort((a, b) => a[0].joinTime - b[0].joinTime);
                }

                return processOuterArrayWithTargetId(activityDetailData, currentUserId);
            },
            handleIntersectionObserver() {
                this.$refs.activityDetailChartRef.forEach((child, index) => {
                    const observer = new IntersectionObserver(this.handleIntersection.bind(this, index));
                    observer.observe(child.$el);
                    this.intersectionObservers[index] = observer;
                });
            },
            handleIntersection(index, entries) {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.$refs.activityDetailChartRef[index].initEcharts();
                        this.intersectionObservers[index].unobserve(entry.target);
                    }
                });
            },
            async getWorldNameData() {
                this.worldNameArray = await Promise.all(
                    this.activityData.map(async (item) => {
                        try {
                            return await this.getWorldName(item.location);
                        } catch {
                            // TODO: no notification
                            console.error('getWorldName failed location', item.location);
                            return 'Unknown world';
                        }
                    })
                );
                if (this.worldNameArray && this.echartsInstance) {
                    this.initEcharts();
                }
            },
            getNewOption(isFirstTime) {
                const getTooltip = (params) => {
                    const activityData = this.activityData;
                    const param = params[1];

                    if (!activityData || !activityData[param.dataIndex]) {
                        return '';
                    }

                    const instanceData = activityData[param.dataIndex];

                    const format = this.dtHour12 ? 'hh:mm:ss A' : 'HH:mm:ss';

                    const formattedLeftDateTime = dayjs(instanceData.leaveTime).format(format);
                    const formattedJoinDateTime = dayjs(instanceData.joinTime).format(format);

                    const timeString = utils.timeToText(param.data, true);
                    const color = param.color;
                    const name = param.name;
                    const location = utils.parseLocation(instanceData.location);

                    return `
                        <div style="display: flex; align-items: center;">
                            <div style="width: 10px; height: 55px; background-color: ${color}; margin-right: 5px;"></div>
                            <div>
                                <div>${name} #${location.instanceName} ${location.accessTypeName}</div>
                                <div>${formattedJoinDateTime} - ${formattedLeftDateTime}</div>
                                <div>${timeString}</div>
                            </div>
                        </div>
                    `;
                };

                const format = this.dtHour12 ? 'hh:mm A' : 'HH:mm';

                const echartsOption = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow'
                        },
                        formatter: getTooltip
                    },
                    grid: {
                        top: 50,
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
                        data: this.worldNameArray,
                        triggerEvent: true
                    },
                    xAxis: {
                        type: 'value',
                        min: 0,
                        // axisLabel max 24:00
                        max: 24 * 60 * 60 * 1000,
                        // axisLabel interval 3hr
                        interval: 3 * 60 * 60 * 1000,
                        axisLine: { show: true },
                        axisLabel: {
                            formatter: (value) => dayjs(value).utc().format(format)
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
                            data: isFirstTime
                                ? []
                                : this.activityData.map((item, idx) => {
                                      if (idx === 0) {
                                          const midnight = dayjs.tz(this.selectedDate).startOf('day');
                                          if (midnight.isAfter(item.joinTime)) {
                                              return 0;
                                          }
                                      }
                                      return item.joinTime - dayjs.tz(this.selectedDate).startOf('day');
                                  })
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
                            data: isFirstTime
                                ? []
                                : this.activityData.map((item, idx) => {
                                      // If the joinTime of the first data is on the previous day,
                                      // and the data traverses midnight, the duration starts at midnight
                                      if (idx === 0) {
                                          const midnight = dayjs.tz(this.selectedDate).startOf('day');
                                          if (midnight.isAfter(item.joinTime)) {
                                              return item.leaveTime - dayjs.tz(midnight);
                                          }
                                      }
                                      return item.time;
                                  })
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
    .flex-between {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .nodata {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 200px;
        color: #5c5c5c;
    }
    .divider {
        padding: 0 400px;
        transition: top 0.3s ease;
    }

    .el-date-editor.el-input,
    .el-date-editor.el-input__inner {
        width: 200px;
    }
    .el-divider__text {
        padding-left: 10px;
        padding-right: 10px;
    }
</style>
