<template>
    <div>
        <div class="options-container instance-activity" style="margin-top: 0">
            <div>
                <span>{{ t('view.charts.instance_activity.header') }}</span>
                <el-popover placement="bottom-start" trigger="hover" :width="300">
                    <div class="tips-popover">
                        <div>{{ t('view.charts.instance_activity.tips.online_time') }}</div>
                        <div>{{ t('view.charts.instance_activity.tips.click_Y_axis') }}</div>
                        <div>{{ t('view.charts.instance_activity.tips.click_instance_name') }}</div>
                        <div>
                            <el-icon><WarningFilled /></el-icon
                            ><i>{{ t('view.charts.instance_activity.tips.accuracy_notice') }}</i>
                        </div>
                    </div>

                    <template #reference>
                        <el-icon style="margin-left: 5px; font-size: 12px; opacity: 0.7"><InfoFilled /></el-icon>
                    </template>
                </el-popover>
            </div>

            <div>
                <el-tooltip :content="t('view.charts.instance_activity.refresh')" placement="top"
                    ><el-button :icon="Refresh" circle style="margin-right: 5px" @click="reloadData"></el-button
                ></el-tooltip>

                <el-popover placement="bottom" trigger="click" :width="250">
                    <div class="settings">
                        <div>
                            <span>{{ t('view.charts.instance_activity.settings.bar_width') }}</span>
                            <div>
                                <el-slider
                                    v-model.lazy="barWidth"
                                    :max="50"
                                    :min="1"
                                    @change="
                                        (value) => changeBarWidth(value, () => handleEchartsRerender())
                                    "></el-slider>
                            </div>
                        </div>
                        <div>
                            <span>{{ t('view.charts.instance_activity.settings.show_detail') }}</span>
                            <el-switch
                                v-model="isDetailVisible"
                                @change="(value) => changeIsDetailInstanceVisible(value, () => handleSettingsChange())">
                            </el-switch>
                        </div>
                        <div v-if="isDetailVisible">
                            <span>{{ t('view.charts.instance_activity.settings.show_solo_instance') }}</span>
                            <el-switch
                                v-model="isSoloInstanceVisible"
                                @change="(value) => changeIsSoloInstanceVisible(value, () => handleSettingsChange())">
                            </el-switch>
                        </div>
                        <div v-if="isDetailVisible">
                            <span>{{ t('view.charts.instance_activity.settings.show_no_friend_instance') }}</span>
                            <el-switch
                                v-model="isNoFriendInstanceVisible"
                                @change="
                                    (value) => changeIsNoFriendInstanceVisible(value, () => handleSettingsChange())
                                ">
                            </el-switch>
                        </div>
                    </div>

                    <template #reference>
                        <div>
                            <el-tooltip :content="t('view.charts.instance_activity.settings.header')" placement="top">
                                <el-button :icon="Setting" style="margin-right: 5px" circle></el-button>
                            </el-tooltip>
                        </div>
                    </template>
                </el-popover>
                <el-button-group style="margin-right: 5px">
                    <el-tooltip :content="t('view.charts.instance_activity.previous_day')" placement="top">
                        <el-button
                            :icon="ArrowLeft"
                            :disabled="isPrevDayBtnDisabled"
                            @click="changeSelectedDateFromBtn(false)"></el-button>
                    </el-tooltip>
                    <el-tooltip :content="t('view.charts.instance_activity.next_day')" placement="top">
                        <el-button :disabled="isNextDayBtnDisabled" @click="changeSelectedDateFromBtn(true)"
                            ><el-icon class="el-icon--right"><ArrowRight /></el-icon
                        ></el-button>
                    </el-tooltip>
                </el-button-group>
                <el-date-picker
                    v-model="selectedDate"
                    type="date"
                    :clearable="false"
                    :default-value="dayjs().toDate()"
                    :disabled-date="getDatePickerDisabledDate"
                    @change="reloadData"></el-date-picker>
            </div>
        </div>
        <div class="status-online">
            <el-statistic
                :title="t('view.charts.instance_activity.online_time')"
                :formatter="(val) => timeToText(val, true)"
                :value="totalOnlineTime">
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
        <template v-if="isDetailVisible && activityData.length !== 0">
            <InstanceActivityDetail
                v-for="arr in filteredActivityDetailData"
                :key="arr[0].location + arr[0].created_at"
                ref="activityDetailChartRef"
                :activity-detail-data="arr"
                :bar-width="barWidth" />
        </template>
    </div>
</template>

<script setup>
    import { nextTick, onActivated, onBeforeMount, onDeactivated, onMounted, ref, watch } from 'vue';
    import { ArrowLeft, ArrowRight, InfoFilled, Refresh, Setting, WarningFilled } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { useAppearanceSettingsStore, useFriendStore, useUserStore } from '../../../stores';
    import { parseLocation, timeToText } from '../../../shared/utils';
    import { useActivityDataProcessor } from '../composables/useActivityDataProcessor';
    import { useChartHelpers } from '../composables/useChartHelpers';
    import { useDateNavigation } from '../composables/useDateNavigation';
    import { useInstanceActivityData } from '../composables/useInstanceActivityData';
    import { useInstanceActivitySettings } from '../composables/useInstanceActivitySettings';
    import { useIntersectionObserver } from '../composables/useIntersectionObserver';

    import InstanceActivityDetail from './InstanceActivityDetail.vue';

    import * as echarts from 'echarts';

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const { isDarkMode, dtHour12 } = storeToRefs(appearanceSettingsStore);
    const { localFavoriteFriends, friends } = storeToRefs(friendStore);
    const { currentUser } = storeToRefs(useUserStore());
    const { t } = useI18n();

    const {
        barWidth,
        isDetailVisible,
        isSoloInstanceVisible,
        isNoFriendInstanceVisible,
        initializeSettings,
        changeBarWidth,
        changeIsDetailInstanceVisible,
        changeIsSoloInstanceVisible,
        changeIsNoFriendInstanceVisible,
        handleChangeSettings
    } = useInstanceActivitySettings();

    const {
        activityData,
        activityDetailData,
        allDateOfActivity,
        worldNameArray,
        getAllDateOfActivity,
        getWorldNameData,
        getActivityData
    } = useInstanceActivityData();

    const echartsInstance = ref(null);
    const resizeObserver = ref(null);
    const { handleIntersectionObserver } = useIntersectionObserver();
    const isLoading = ref(true);

    let reloadData;
    const {
        selectedDate,
        isNextDayBtnDisabled,
        isPrevDayBtnDisabled,
        changeSelectedDateFromBtn,
        getDatePickerDisabledDate
    } = useDateNavigation(allDateOfActivity, () => reloadData());

    const activityChartRef = ref(null);
    const activityDetailChartRef = ref(null);

    const { totalOnlineTime, filteredActivityDetailData } = useActivityDataProcessor(
        activityData,
        activityDetailData,
        isDetailVisible,
        isSoloInstanceVisible,
        isNoFriendInstanceVisible
    );

    const { isDetailDataFiltered, findMatchingDetailData, generateYAxisLabel } = useChartHelpers();

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
        if (echartsInstance.value) {
            reloadData();
        }
    });

    onDeactivated(() => {
        // prevent resize animation when switch tab
        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
        }
    });

    onBeforeMount(() => {
        initializeSettings();
    });

    onMounted(async () => {
        try {
            getAllDateOfActivity();
            await getActivityData(selectedDate, currentUser, friends, localFavoriteFriends, () =>
                handleIntersectionObserver(activityDetailChartRef)
            );
            await getWorldNameData();
            initEcharts();
        } catch (error) {
            console.error('error in mounted', error);
            isLoading.value = false;
        }
    });

    reloadData = async function () {
        isLoading.value = true;
        try {
            await getActivityData(selectedDate, currentUser, friends, localFavoriteFriends, () =>
                handleIntersectionObserver(activityDetailChartRef)
            );
            await getWorldNameData();
            // possibility past 24:00
            getAllDateOfActivity();

            await nextTick();

            if (echartsInstance.value && activityData.value.length) {
                const chartsHeight = activityData.value.length * (barWidth.value + 10) + 200;
                echartsInstance.value.resize({
                    height: chartsHeight,
                    animation: {
                        duration: 300
                    }
                });
                echartsInstance.value.setOption(getNewOption(), { notMerge: true });
            } else if (echartsInstance.value) {
                echartsInstance.value.clear();
            }
        } catch (error) {
            console.error('Error in reloadData:', error);
        } finally {
            isLoading.value = false;
        }
    };

    function handleYAxisLabelClick(params) {
        const targetActivity = activityData.value[params?.dataIndex];
        if (!targetActivity) {
            console.error('handleClickYAxisLabel failed, no activity data found for index:', params?.dataIndex);
            return;
        }

        const detailDataIdx = filteredActivityDetailData.value.findIndex((arr) => {
            const sameLocation = arr[0]?.location === targetActivity.location;
            const sameJoinTime = arr
                .find((item) => item.user_id === currentUser.value.id)
                ?.joinTime.isSame(targetActivity.joinTime);
            return sameLocation && sameJoinTime;
        });

        if (detailDataIdx === -1) {
            console.error(
                "handleClickYAxisLabel failed, likely current user wasn't in this instance or chart is filtered out.",
                params
            );
            return;
        }

        if (activityDetailChartRef.value && activityDetailChartRef.value[detailDataIdx]) {
            activityDetailChartRef.value[detailDataIdx].$el.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            console.error('handleClickYAxisLabel failed, chart ref not found at index:', detailDataIdx);
        }
    }

    function getYAxisData() {
        return worldNameArray.value.map((worldName, index) => {
            const activityItem = activityData.value[index];
            if (!activityItem) return worldName;

            const detailData = findMatchingDetailData(activityItem, activityDetailData.value, currentUser.value);
            if (!detailData) return worldName;

            const shouldFilter =
                isDetailVisible.value &&
                isDetailDataFiltered(detailData, isSoloInstanceVisible.value, isNoFriendInstanceVisible.value);

            return generateYAxisLabel(worldName, shouldFilter);
        });
    }

    function initEcharts() {
        const chartsHeight = activityData.value.length * (barWidth.value + 10) + 200;
        const chartDom = activityChartRef.value;

        const afterInit = () => {
            if (!echartsInstance.value) {
                console.error('ECharts instance not initialized');
                return;
            }

            echartsInstance.value.resize({
                height: chartsHeight,
                animation: {
                    duration: 300
                }
            });

            const handleClickYAxisLabel = handleYAxisLabelClick;

            echartsInstance.value.off('click');

            if (activityData.value.length && worldNameArray.value.length) {
                const options = getNewOption();
                echartsInstance.value.clear();
                echartsInstance.value.setOption(options, { notMerge: true });
                echartsInstance.value.on('click', 'yAxis', handleClickYAxisLabel);
            } else {
                echartsInstance.value.clear();
            }
            isLoading.value = false;
        };

        const initEchartsInstance = () => {
            echartsInstance.value = echarts.init(chartDom, `${isDarkMode.value ? 'dark' : null}`, {
                height: chartsHeight
            });
            // resizeObserver.value = new ResizeObserver((entries) => {
            //     for (const entry of entries) {
            //         echartsInstance.value.resize({
            //             width: entry.contentRect.width,
            //             animation: {
            //                 duration: 300
            //             }
            //         });
            //     }
            // });
            // resizeObserver.value.observe(chartDom);
        };

        if (!echartsInstance.value) {
            initEchartsInstance();
        }
        afterInit();
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
                    rich: {
                        filtered: {
                            opacity: 0.4
                        },
                        normal: {
                            opacity: 1
                        }
                    }
                },
                inverse: true,
                data: getYAxisData(),
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
                        return item.joinTime - dayjs.tz(selectedDate.value).startOf('day').valueOf();
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
                                return item.leaveTime - dayjs.tz(midnight).valueOf();
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

    function handleEchartsRerender() {
        initEcharts();
        handleSettingsChange();
    }
    function handleSettingsChange() {
        handleChangeSettings(activityDetailChartRef);

        if (echartsInstance.value) {
            const newOptions = getNewOption();
            echartsInstance.value.setOption({
                yAxis: newOptions.yAxis
            });
        }

        nextTick(() => {
            handleIntersectionObserver(activityDetailChartRef);
        });
    }
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
                margin-left: 20px;
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

    .status-online {
        display: flex;
        justify-content: center;
        :deep(.el-statistic__head) {
            display: flex;
            justify-content: center;
        }
    }
</style>
