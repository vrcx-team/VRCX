<template>
    <div ref="instanceActivityRef" class="pt-12">
        <BackToTop :target="instanceActivityRef" :right="30" :bottom="30" :teleport="false" />
        <div class="options-container instance-activity" style="margin-top: 0">
            <div>
                <span>{{ t('view.charts.instance_activity.header') }}</span>
                <HoverCard>
                    <HoverCardTrigger as-child>
                        <Info style="margin-left: 5px; font-size: 12px; opacity: 0.7" />
                    </HoverCardTrigger>
                    <HoverCardContent side="bottom" align="start" class="w-75">
                        <div class="tips-popover">
                            <div>{{ t('view.charts.instance_activity.tips.online_time') }}</div>
                            <div>{{ t('view.charts.instance_activity.tips.click_Y_axis') }}</div>
                            <div>{{ t('view.charts.instance_activity.tips.click_instance_name') }}</div>
                        </div>
                    </HoverCardContent>
                </HoverCard>
            </div>

            <div>
                <TooltipWrapper :content="t('view.charts.instance_activity.refresh')" side="top">
                    <Button
                        class="rounded-full"
                        size="icon"
                        variant="outline"
                        style="margin-right: 5px"
                        @click="reloadData">
                        <RefreshCcw />
                    </Button>
                </TooltipWrapper>

                <Popover>
                    <PopoverTrigger asChild>
                        <div>
                            <TooltipWrapper :content="t('view.charts.instance_activity.settings.header')" side="top">
                                <Button class="rounded-full" size="icon" variant="outline" style="margin-right: 5px">
                                    <Settings />
                                </Button>
                            </TooltipWrapper>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" class="w-62.5">
                        <div class="settings">
                            <div>
                                <span>{{ t('view.charts.instance_activity.settings.bar_width') }}</span>
                                <div>
                                    <Slider
                                        v-model="barWidthDraftValue"
                                        :max="50"
                                        :min="1"
                                        @valueCommit="handleBarWidthCommit"></Slider>
                                </div>
                            </div>
                            <div>
                                <span>{{ t('view.charts.instance_activity.settings.show_detail') }}</span>
                                <Switch
                                    v-model="isDetailVisible"
                                    @update:modelValue="
                                        (value) => changeIsDetailInstanceVisible(value, () => handleSettingsChange())
                                    " />
                            </div>
                            <div v-if="isDetailVisible">
                                <span>{{ t('view.charts.instance_activity.settings.show_solo_instance') }}</span>
                                <Switch
                                    v-model="isSoloInstanceVisible"
                                    @update:modelValue="
                                        (value) => changeIsSoloInstanceVisible(value, () => handleSettingsChange())
                                    " />
                            </div>
                            <div v-if="isDetailVisible">
                                <span>{{ t('view.charts.instance_activity.settings.show_no_friend_instance') }}</span>
                                <Switch
                                    v-model="isNoFriendInstanceVisible"
                                    @update:modelValue="
                                        (value) => changeIsNoFriendInstanceVisible(value, () => handleSettingsChange())
                                    " />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                <ButtonGroup style="margin-right: 5px">
                    <TooltipWrapper :content="t('view.charts.instance_activity.previous_day')" side="top">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            :disabled="isPrevDayBtnDisabled"
                            @click="changeSelectedDateFromBtn(false)">
                            <ArrowLeft />
                        </Button>
                    </TooltipWrapper>
                    <TooltipWrapper :content="t('view.charts.instance_activity.next_day')" side="top">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            :disabled="isNextDayBtnDisabled"
                            @click="changeSelectedDateFromBtn(true)">
                            <ArrowRight />
                        </Button>
                    </TooltipWrapper>
                </ButtonGroup>
                <Popover v-model:open="isDatePickerOpen">
                    <PopoverTrigger asChild>
                        <div>
                            <Button
                                variant="outline"
                                class="w-50 justify-start text-left font-normal"
                                :disabled="isLoading">
                                <CalendarIcon class="mr-2 h-4 w-4" />
                                {{ dayjs(selectedDate).format('YYYY-MM-DD') }}
                            </Button>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="end">
                        <Calendar
                            :model-value="calendarModelValue"
                            :default-placeholder="defaultCalendarPlaceholder"
                            :is-date-disabled="isCalendarDateDisabled"
                            :prevent-deselect="true"
                            initial-focus
                            @update:modelValue="handleCalendarModelUpdate" />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
        <div class="status-online">
            <div class="text-center">
                <div class="text-sm text-muted-foreground">
                    {{ t('view.charts.instance_activity.online_time') }}
                </div>
                <div class="text-2xl font-semibold">
                    {{ timeToText(totalOnlineTime, true) }}
                </div>
            </div>
        </div>

        <div ref="activityChartRef" style="width: 100%"></div>
        <div v-if="!isLoading && activityData.length === 0" class="nodata">
            <span>No data here, try another day</span>
        </div>

        <transition name="el-fade-in-linear">
            <div v-show="isDetailVisible && !isLoading && activityData.length !== 0" class="divider">
                <div class="flex items-center">
                    <Separator class="flex-1" />
                    <span class="px-2 text-muted-foreground">·</span>
                    <Separator class="flex-1" />
                </div>
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
    import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Info, RefreshCcw, Settings } from 'lucide-vue-next';
    import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
    import { fromDate, getLocalTimeZone, today } from '@internationalized/date';
    import { Button } from '@/components/ui/button';
    import { ButtonGroup } from '@/components/ui/button-group';
    import { Calendar } from '@/components/ui/calendar';
    import { Separator } from '@/components/ui/separator';
    import { storeToRefs } from 'pinia';
    import { toDate } from 'reka-ui/date';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';
    import dayjs from 'dayjs';

    import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
    import { useAppearanceSettingsStore, useFriendStore, useUserStore } from '../../../stores';
    import { parseLocation, timeToText } from '../../../shared/utils';
    import { Slider } from '../../../components/ui/slider';
    import { Switch } from '../../../components/ui/switch';
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

    const instanceActivityRef = ref(null);

    const instanceActivityResizeObserver = new ResizeObserver(() => {
        setInstanceActivityHeight();
    });

    function setInstanceActivityHeight() {
        if (instanceActivityRef.value) {
            const availableHeight = window.innerHeight - 110;
            instanceActivityRef.value.style.height = `${availableHeight}px`;
            instanceActivityRef.value.style.overflowY = 'auto';
        }
    }

    onMounted(() => {
        if (instanceActivityRef.value) {
            instanceActivityResizeObserver.observe(instanceActivityRef.value);
        }
        setInstanceActivityHeight();
    });

    onBeforeUnmount(() => {
        if (instanceActivityRef.value) {
            instanceActivityResizeObserver.unobserve(instanceActivityRef.value);
        }
    });

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
    const barWidthDraft = ref(barWidth.value);
    const barWidthDraftValue = computed({
        get: () => [barWidthDraft.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                barWidthDraft.value = next;
            }
        }
    });

    function handleBarWidthCommit(value) {
        changeBarWidth(value?.[0] ?? barWidthDraft.value, () => handleEchartsRerender());
    }

    watch(
        () => barWidth.value,
        (value) => {
            barWidthDraft.value = value;
        }
    );

    const {
        activityData,
        activityDetailData,
        allDateOfActivity,
        worldNameArray,
        getAllDateOfActivity,
        getWorldNameData,
        getActivityData
    } = useInstanceActivityData();

    let echartsInstance = null;
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

    const isDatePickerOpen = ref(false);
    const calendarTimeZone = getLocalTimeZone();
    const defaultCalendarPlaceholder = today(calendarTimeZone);

    const calendarModelValue = computed(() => {
        // Keep the rest of the feature using JS Date; adapt to Calendar's DateValue model.
        return fromDate(selectedDate.value ?? new Date(), calendarTimeZone);
    });

    function isCalendarDateDisabled(dateValue) {
        try {
            return getDatePickerDisabledDate(toDate(dateValue, calendarTimeZone));
        } catch {
            return true;
        }
    }

    function handleCalendarModelUpdate(dateValue) {
        if (!dateValue) return;
        selectedDate.value = toDate(dateValue, calendarTimeZone);
        isDatePickerOpen.value = false;
        reloadData();
    }

    const activityChartRef = ref(null);
    const activityDetailChartRef = ref(null);

    const { totalOnlineTime, filteredActivityDetailData } = useActivityDataProcessor(
        activityData,
        activityDetailData,
        isDetailVisible,
        isSoloInstanceVisible,
        isNoFriendInstanceVisible,
        selectedDate
    );

    const { isDetailDataFiltered, findMatchingDetailData, generateYAxisLabel } = useChartHelpers();

    watch(
        () => isDarkMode.value,
        () => {
            if (echartsInstance) {
                echartsInstance.dispose();
                echartsInstance = null;
                initEcharts();
            }
        }
    );

    watch(
        () => dtHour12.value,
        () => {
            if (echartsInstance) {
                initEcharts();
            }
        }
    );

    // onActivated(() => {
    //     // first time also call activated
    //     if (echartsInstance) {
    //         reloadData();
    //     }
    // });

    // onDeactivated(() => {
    //     // prevent resize animation when switch tab
    //     if (resizeObserver.value) {
    //         resizeObserver.value.disconnect();
    //     }
    // });

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

    onBeforeUnmount(() => {
        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
            resizeObserver.value = null;
        }
        if (echartsInstance) {
            echartsInstance.dispose();
            echartsInstance = null;
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

            echartsInstance.off('click');

            if (echartsInstance && activityData.value.length) {
                const chartsHeight = activityData.value.length * (barWidth.value + 10) + 200;
                echartsInstance.resize({
                    height: chartsHeight,
                    animation: {
                        duration: 300
                    }
                });
                echartsInstance.setOption(getNewOption(), { notMerge: true });
                const handleClickYAxisLabel = handleYAxisLabelClick;
                echartsInstance.on('click', 'yAxis', handleClickYAxisLabel);
            } else if (echartsInstance) {
                echartsInstance.clear();
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
            if (!echartsInstance) {
                console.error('ECharts instance not initialized');
                return;
            }

            echartsInstance.resize({
                height: chartsHeight,
                animation: {
                    duration: 300
                }
            });

            const handleClickYAxisLabel = handleYAxisLabelClick;

            echartsInstance.off('click');

            if (activityData.value.length && worldNameArray.value.length) {
                const options = getNewOption();
                echartsInstance.clear();
                echartsInstance.setOption(options, { notMerge: true });
                echartsInstance.on('click', 'yAxis', handleClickYAxisLabel);
            } else {
                echartsInstance.clear();
            }
            isLoading.value = false;
        };

        const initEchartsInstance = () => {
            echartsInstance = echarts.init(chartDom, `${isDarkMode.value ? 'dark' : null}`, {
                height: chartsHeight
            });
            resizeObserver.value = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    echartsInstance.resize({
                        width: entry.contentRect.width,
                        animation: {
                            duration: 300
                        }
                    });
                }
            });
            resizeObserver.value.observe(chartDom);
        };

        if (!echartsInstance) {
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
            let name = param.name;
            // jank: remove axis label rich text formatting
            name = name.endsWith('}') ? name.slice(0, -1) : name;
            name = name.replaceAll('{filtered|', '').replaceAll('{normal|', '');

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

        if (echartsInstance) {
            const newOptions = getNewOption();
            echartsInstance.setOption({
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
    }
    .divider {
        padding: 0 400px;
        transition: top 0.3s ease;
    }

    .status-online {
        display: flex;
        justify-content: center;
        text-align: center;
    }
</style>
