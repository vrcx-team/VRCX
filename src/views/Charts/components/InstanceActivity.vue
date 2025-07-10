<template>
    <div>
        <div class="options-container instance-activity" style="margin-top: 0">
            <div>
                <span>{{ t('view.charts.instance_activity.header') }}</span>
                <el-popover placement="bottom-start" trigger="hover" width="300">
                    <div class="tips-popover">
                        <div>{{ t('view.charts.instance_activity.tips.online_time') }}</div>
                        <div>{{ t('view.charts.instance_activity.tips.click_Y_axis') }}</div>
                        <div>{{ t('view.charts.instance_activity.tips.click_instance_name') }}</div>
                        <div>
                            <i class="el-icon-warning-outline"></i
                            ><i>{{ t('view.charts.instance_activity.tips.accuracy_notice') }}</i>
                        </div>
                    </div>

                    <i
                        slot="reference"
                        class="el-icon-info"
                        style="margin-left: 5px; font-size: 12px; opacity: 0.7"></i>
                </el-popover>
            </div>

            <div>
                <el-tooltip :content="t('view.charts.instance_activity.refresh')" placement="top"
                    ><el-button icon="el-icon-refresh" circle style="margin-right: 9px" @click="reloadData"></el-button
                ></el-tooltip>
                <el-tooltip :content="t('view.charts.instance_activity.settings.header')" placement="top">
                    <el-popover placement="bottom" trigger="click" style="margin-right: 9px">
                        <div class="settings">
                            <div>
                                <span>{{ t('view.charts.instance_activity.settings.bar_width') }}</span>
                                <div>
                                    <el-slider
                                        v-model.lazy="barWidth"
                                        :max="50"
                                        :min="1"
                                        @change="changeBarWidth"></el-slider>
                                </div>
                            </div>
                            <div>
                                <span>{{ t('view.charts.instance_activity.settings.show_detail') }}</span>
                                <el-switch v-model="isDetailVisible" @change="changeIsDetailInstanceVisible">
                                </el-switch>
                            </div>
                            <div v-if="isDetailVisible">
                                <span>{{ t('view.charts.instance_activity.settings.show_solo_instance') }}</span>
                                <el-switch v-model="isSoloInstanceVisible" @change="changeIsSoloInstanceVisible">
                                </el-switch>
                            </div>
                            <div v-if="isDetailVisible">
                                <span>{{ t('view.charts.instance_activity.settings.show_no_friend_instance') }}</span>
                                <el-switch
                                    v-model="isNoFriendInstanceVisible"
                                    @change="changeIsNoFriendInstanceVisible">
                                </el-switch>
                            </div>
                        </div>

                        <el-button slot="reference" icon="el-icon-setting" circle></el-button>
                    </el-popover>
                </el-tooltip>
                <el-button-group style="margin-right: 10px">
                    <el-tooltip :content="t('view.charts.instance_activity.previous_day')" placement="top">
                        <el-button
                            icon="el-icon-arrow-left"
                            :disabled="isPrevDayBtnDisabled"
                            @click="changeSelectedDateFromBtn(false)"></el-button>
                    </el-tooltip>
                    <el-tooltip :content="t('view.charts.instance_activity.next_day')" placement="top">
                        <el-button :disabled="isNextDayBtnDisabled" @click="changeSelectedDateFromBtn(true)"
                            ><i class="el-icon-arrow-right el-icon--right"></i
                        ></el-button>
                    </el-tooltip>
                </el-button-group>
                <el-date-picker
                    v-model="selectedDate"
                    type="date"
                    :clearable="false"
                    align="right"
                    :picker-options="{
                        disabledDate: (time) => getDatePickerDisabledDate(time)
                    }"
                    @change="reloadData"></el-date-picker>
            </div>
        </div>
        <div style="position: relative">
            <el-statistic :title="t('view.charts.instance_activity.online_time')">
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
            <div v-show="isDetailVisible && !isLoading && activityData.length !== 0" class="divider">
                <el-divider>·</el-divider>
            </div>
        </transition>
        <InstanceActivityDetail
            v-for="arr in filteredActivityDetailData"
            :key="arr[0].location + arr[0].created_at"
            ref="activityDetailChartRef"
            :activity-detail-data="arr"
            :bar-width="barWidth" />
    </div>
</template>

<script setup>
    import { ref, onActivated, onDeactivated, watch, computed, onMounted, nextTick, onBeforeMount } from 'vue';
    import dayjs from 'dayjs';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
    import configRepository from '../../../service/config';
    import { database } from '../../../service/database';
    import { getWorldName, loadEcharts, parseLocation, timeToText } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useFriendStore, useUserStore } from '../../../stores';
    import InstanceActivityDetail from './InstanceActivityDetail.vue';

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const { isDarkMode, dtHour12 } = storeToRefs(appearanceSettingsStore);
    const { localFavoriteFriends, friends } = storeToRefs(friendStore);
    const { currentUser } = storeToRefs(useUserStore());
    const { t } = useI18n();

    // echarts and observer
    const echarts = ref(null);
    const echartsInstance = ref(null);
    const resizeObserver = ref(null);
    const intersectionObservers = ref([]);
    const selectedDate = ref(dayjs());
    // data
    const activityData = ref([]);
    const activityDetailData = ref([]);
    const allDateOfActivity = ref(new Set());
    const worldNameArray = ref([]);
    const isLoading = ref(true);
    // settings
    const barWidth = ref(25);
    const isDetailVisible = ref(true);
    const isSoloInstanceVisible = ref(true);
    const isNoFriendInstanceVisible = ref(true);

    const activityChartRef = ref(null);
    const activityDetailChartRef = ref(null);

    const totalOnlineTime = computed(() => {
        return timeToText(
            activityData.value?.reduce((acc, item) => acc + item.time, 0),
            true
        );
    });

    const allDateOfActivityArray = computed(() => {
        return allDateOfActivity.value
            ? Array.from(allDateOfActivity.value)
                  .map((item) => dayjs(item))
                  .sort((a, b) => b.valueOf() - a.valueOf())
            : [];
    });

    const isNextDayBtnDisabled = computed(() => {
        return dayjs(selectedDate.value).isSameOrAfter(allDateOfActivityArray.value[0], 'day');
    });

    const isPrevDayBtnDisabled = computed(() => {
        return dayjs(selectedDate.value).isSame(
            allDateOfActivityArray.value[allDateOfActivityArray.value.length - 1],
            'day'
        );
    });

    const filteredActivityDetailData = computed(() => {
        if (!isDetailVisible.value) {
            return [];
        }
        let result = [...activityDetailData.value];
        if (!isSoloInstanceVisible.value) {
            result = result.filter((arr) => arr.length > 1);
        }
        if (!isNoFriendInstanceVisible.value) {
            result = result.filter((arr) => {
                // solo instance
                if (arr.length === 1) {
                    return true;
                }
                return arr.some((item) => item.isFriend);
            });
        }
        return result;
    });

    watch(
        () => isDarkMode.value,
        () => {
            if (echartsInstance.value) {
                echartsInstance.value.dispose();
                echartsInstance.value = null;
                initEcharts();
            }
        }
    );

    watch(
        () => dtHour12.value,
        () => {
            if (echartsInstance.value) {
                initEcharts();
            }
        }
    );

    onActivated(() => {
        // first time also call activated
        if (!echartsInstance.value) {
            reloadData();
        }
    });

    onDeactivated(() => {
        // prevent resize animation when switch tab
        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
        }
    });

    function created() {
        resizeObserver.value = new ResizeObserver((entries) => {
            for (const entry of entries) {
                echartsInstance.value.resize({
                    width: entry.contentRect.width,
                    animation: {
                        duration: 300
                    }
                });
            }
        });
        configRepository.getInt('VRCX_InstanceActivityBarWidth', 25).then((value) => {
            barWidth.value = value;
        });
        configRepository.getBool('VRCX_InstanceActivityDetailVisible', true).then((value) => {
            isDetailVisible.value = value;
        });
        configRepository.getBool('VRCX_InstanceActivitySoloInstanceVisible', true).then((value) => {
            isSoloInstanceVisible.value = value;
        });
        configRepository.getBool('VRCX_InstanceActivityNoFriendInstanceVisible', true).then((value) => {
            isNoFriendInstanceVisible.value = value;
        });
    }

    onBeforeMount(() => {
        // ensure created is called before mounted
        created();
    });

    onMounted(async () => {
        try {
            getAllDateOfActivity();
            const [echartsModule] = await Promise.all([
                // lazy load echarts
                loadEcharts().catch((error) => {
                    console.error('lazy load echarts failed', error);
                    return null;
                }),
                getActivityData()
            ]);
            if (echartsModule) {
                echarts.value = echartsModule;
            }
            if (echartsModule) {
                initEcharts();
                getWorldNameData();
            } else {
                isLoading.value = false;
            }
        } catch (error) {
            console.error('error in mounted', error);
        }
    });

    async function reloadData() {
        isLoading.value = true;
        await getActivityData();
        getWorldNameData();
        // possibility past 24:00
        getAllDateOfActivity();
    }

    // echarts - start
    function initEcharts() {
        const chartsHeight = activityData.value.length * (barWidth.value + 10) + 200;
        const chartDom = activityChartRef.value;

        const afterInit = () => {
            echartsInstance.value.resize({
                height: chartsHeight,
                animation: {
                    duration: 300
                }
            });

            const handleClickYAxisLabel = (params) => {
                const detailDataIdx = filteredActivityDetailData.value.findIndex((arr) => {
                    const sameLocation = arr[0]?.location === activityData.value[params?.dataIndex]?.location;
                    const sameJoinTime = arr
                        .find((item) => item.user_id === currentUser.value.id)
                        ?.joinTime.isSame(activityData.value[params?.dataIndex].joinTime);
                    return sameLocation && sameJoinTime;
                });
                if (detailDataIdx === -1) {
                    // no detail chart down below, it's hidden, so can't find instance data index
                    console.error("handleClickYAxisLabel failed, likely current user wasn't in this instance.", params);
                } else {
                    activityDetailChartRef.value[detailDataIdx].$el.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            };

            const options = activityData.value.length ? getNewOption() : {};

            echartsInstance.value.setOption(options, { lazyUpdate: true });
            echartsInstance.value.on('click', 'yAxis', handleClickYAxisLabel);
            isLoading.value = false;
        };

        const initEchartsInstance = () => {
            echartsInstance.value = echarts.value.init(chartDom, `${isDarkMode.value ? 'dark' : null}`, {
                height: chartsHeight
            });
            resizeObserver.value.observe(chartDom);
        };

        const loadEchartsWithTimeout = () => {
            const timeout = 5000;
            let time = 0;
            const timer = setInterval(() => {
                if (echarts.value) {
                    initEchartsInstance();
                    afterInit();
                    clearInterval(timer);
                    return;
                }
                time += 100;
                if (time >= timeout) {
                    clearInterval(timer);
                    console.error('echarts init timeout');
                }
            }, 100);
        };

        if (!echartsInstance.value) {
            if (!echarts.value) {
                loadEchartsWithTimeout();
            } else {
                initEchartsInstance();
                afterInit();
            }
        } else {
            afterInit();
        }
    }
    function getNewOption() {
        const getTooltip = (params) => {
            const activityDataArray = activityData.value;
            const param = params[1];

            if (!activityDataArray || !activityDataArray[param.dataIndex]) {
                return '';
            }

            const instanceData = activityDataArray[param.dataIndex];

            const format = dtHour12.value ? 'hh:mm:ss A' : 'HH:mm:ss';

            const formattedLeftDateTime = dayjs(instanceData.leaveTime).format(format);
            const formattedJoinDateTime = dayjs(instanceData.joinTime).format(format);

            const timeString = timeToText(param.data, true);
            const color = param.color;
            const name = param.name;
            const location = parseLocation(instanceData.location);

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

        const format = dtHour12.value ? 'hh:mm A' : 'HH:mm';

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
                data: worldNameArray.value,
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
                    data: activityData.value.map((item, idx) => {
                        if (idx === 0) {
                            const midnight = dayjs.tz(selectedDate.value).startOf('day');
                            if (midnight.isAfter(item.joinTime)) {
                                return 0;
                            }
                        }
                        return item.joinTime - dayjs.tz(selectedDate.value).startOf('day');
                    })
                },
                {
                    name: 'Time',
                    type: 'bar',
                    stack: 'Total',
                    colorBy: 'data',
                    barWidth: barWidth.value,
                    emphasis: {
                        focus: 'self'
                    },
                    itemStyle: {
                        borderRadius: 2,
                        shadowBlur: 2,
                        shadowOffsetX: 0.7,
                        shadowOffsetY: 0.5
                    },
                    data: activityData.value.map((item, idx) => {
                        // If the joinTime of the first data is on the previous day,
                        // and the data traverses midnight, the duration starts at midnight
                        if (idx === 0) {
                            const midnight = dayjs.tz(selectedDate.value).startOf('day');
                            if (midnight.isAfter(item.joinTime)) {
                                return item.leaveTime - dayjs.tz(midnight);
                            }
                        }
                        return item.time;
                    })
                }
            ],
            backgroundColor: 'transparent'
        };

        return echartsOption;
    }
    // echarts - end

    // settings - start
    function changeBarWidth(value) {
        barWidth.value = value;
        initEcharts();
        configRepository.setInt('VRCX_InstanceActivityBarWidth', value).finally(() => {
            handleChangeSettings();
        });
    }
    function changeIsDetailInstanceVisible(value) {
        isDetailVisible.value = value;
        configRepository.setBool('VRCX_InstanceActivityDetailVisible', value).finally(() => {
            handleChangeSettings();
        });
    }
    function changeIsSoloInstanceVisible(value) {
        isSoloInstanceVisible.value = value;
        configRepository.setBool('VRCX_InstanceActivitySoloInstanceVisible', value).finally(() => {
            handleChangeSettings();
        });
    }
    function changeIsNoFriendInstanceVisible(value) {
        isNoFriendInstanceVisible.value = value;
        configRepository.setBool('VRCX_InstanceActivityNoFriendInstanceVisible', value).finally(() => {
            handleChangeSettings();
        });
    }
    function handleChangeSettings() {
        nextTick(() => {
            if (activityDetailChartRef.value) {
                activityDetailChartRef.value.forEach((child) => {
                    requestAnimationFrame(() => {
                        if (child.echartsInstance) {
                            child.initEcharts();
                        }
                    });
                });
            }
        });
        //rerender detail chart
    }
    // settings - end

    // options - start
    function changeSelectedDateFromBtn(isNext = false) {
        if (!allDateOfActivityArray.value || allDateOfActivityArray.value.length === 0) {
            return;
        }

        const idx = allDateOfActivityArray.value.findIndex((date) => date.isSame(selectedDate.value, 'day'));
        if (idx !== -1) {
            const newIdx = isNext ? idx - 1 : idx + 1;

            if (newIdx >= 0 && newIdx < allDateOfActivityArray.value.length) {
                selectedDate.value = allDateOfActivityArray.value[newIdx];
                reloadData();
                return;
            }
        }
        selectedDate.value = isNext
            ? allDateOfActivityArray.value[0]
            : allDateOfActivityArray.value[allDateOfActivityArray.value.length - 1];
        reloadData();
    }
    function getDatePickerDisabledDate(time) {
        if (
            time > Date.now() ||
            allDateOfActivityArray.value[allDateOfActivityArray.value.length - 1]
                ?.add(-1, 'day')
                .isAfter(time, 'day') ||
            !allDateOfActivity.value
        ) {
            return true;
        }
        return !allDateOfActivity.value.has(dayjs(time).format('YYYY-MM-DD'));
    }
    // options - end

    // data - start
    async function getWorldNameData() {
        worldNameArray.value = await Promise.all(
            activityData.value.map(async (item) => {
                try {
                    return await getWorldName(item.location);
                } catch {
                    console.error('getWorldName failed location', item.location);
                    return 'Unknown world';
                }
            })
        );

        if (worldNameArray.value) {
            initEcharts();
        }
    }
    async function getAllDateOfActivity() {
        const utcDateStrings = (await database.getDateOfInstanceActivity()) || [];
        const uniqueDates = new Set();

        for (const utcString of utcDateStrings) {
            const formattedDate = dayjs.utc(utcString).tz().format('YYYY-MM-DD');
            uniqueDates.add(formattedDate);
        }

        allDateOfActivity.value = uniqueDates;
    }
    async function getActivityData() {
        const localStartDate = dayjs.tz(selectedDate.value).startOf('day').toISOString();
        const localEndDate = dayjs.tz(selectedDate.value).endOf('day').toISOString();
        const dbData = await database.getInstanceActivity(localStartDate, localEndDate);

        const transformData = (item) => ({
            ...item,
            joinTime: dayjs(item.created_at).subtract(item.time, 'millisecond'),
            leaveTime: dayjs(item.created_at),
            time: item.time < 0 ? 0 : item.time,
            isFriend: item.user_id === currentUser.value.id ? null : friends.value.has(item.user_id),
            isFavorite: item.user_id === currentUser.value.id ? null : localFavoriteFriends.value.has(item.user_id)
        });

        activityData.value = dbData.currentUserData.map(transformData);

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
        const locationSet = new Set(activityData.value.map((item) => item.location));

        const preSplitActivityDetailData = Array.from(dbData.detailData.values())
            .map(transformAndSort)
            .filter((innerArray) => filterByLocation(innerArray, locationSet));

        activityDetailData.value = handleSplitActivityDetailData(preSplitActivityDetailData, currentUser.value.id);

        if (activityDetailData.value.length) {
            nextTick(() => {
                handleIntersectionObserver();
            });
        }
    }
    function handleSplitActivityDetailData(activityDetailData, currentUserId) {
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
    }
    // data - end

    // intersection observer - start
    function handleIntersectionObserver() {
        activityDetailChartRef.value?.forEach((child, index) => {
            const observer = new IntersectionObserver((entries) => handleIntersection(index, entries));
            observer.observe(child.$el);
            intersectionObservers.value[index] = observer;
        });
    }
    function handleIntersection(index, entries) {
        if (!entries) {
            console.error('handleIntersection failed');
            return;
        }
        entries.forEach((entry) => {
            if (entry.isIntersecting && activityDetailChartRef.value[index]) {
                activityDetailChartRef.value[index].initEcharts();
                intersectionObservers.value[index].unobserve(entry.target);
            }
        });
    }
    // intersection observer - end
</script>

<style lang="scss" scoped>
    %flex {
        display: flex;
        align-items: center;
    }
    %flex-between {
        justify-content: space-between;
    }
    .instance-activity {
        @extend %flex;
        @extend %flex-between;
        & > div:first-child {
            @extend %flex-between;
        }
        & > div {
            @extend %flex;
            > span {
                flex-shrink: 0;
            }
        }
    }
    .tips-popover {
        & > div {
            margin-bottom: 5px;
            font-size: 12px;
        }
        & > div:last-child {
            @extend %flex;
            margin-top: 10px;
            i {
                margin-right: 3px;
            }
        }
        & .el-icon-warning-outline {
            font-size: 12px;
        }
    }
    .settings {
        & > div {
            @extend %flex;
            @extend %flex-between;
            padding: 0 2px;
            height: 30px;
            > span {
                flex-shrink: 0;
            }
        }
        & > div:first-child {
            > div {
                width: 160px;
                padding-left: 20px;
            }
        }
    }

    .nodata {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 100px;
        color: #5c5c5c;
    }
    .divider {
        padding: 0 400px;
        transition: top 0.3s ease;
    }

    // override el-ui
    .el-date-editor.el-input,
    .el-date-editor.el-input__inner {
        width: 200px;
    }
    .el-divider__text {
        padding-left: 10px;
        padding-right: 10px;
    }
</style>
