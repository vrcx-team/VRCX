<template>
    <div ref="chartContainerRef" class="w-full">
        <div v-if="hasChartData" ref="chartRef"></div>
        <div v-else class="flex items-center justify-center" style="min-height: 200px">
            <DataTableEmpty type="nodata" />
        </div>
    </div>
</template>

<script setup>
    defineOptions({ name: 'PreviousInstancesInfoChart' });

    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { storeToRefs } from 'pinia';

    import dayjs from 'dayjs';

    import { useAppearanceSettingsStore, useGameLogStore, useUserStore } from '../../../stores';
    import { timeToText } from '../../../shared/utils';

    import * as echarts from 'echarts';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const { isDarkMode, dtHour12 } = storeToRefs(useAppearanceSettingsStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { gameLogIsFriend, gameLogIsFavorite } = useGameLogStore();

    const BAR_WIDTH = 12;

    const props = defineProps({
        chartData: {
            type: Array,
            required: true
        }
    });

    const chartRef = ref(null);
    const chartContainerRef = ref(null);
    let echartsInstance = null;
    const usersFirstActivity = ref(null);
    const resizeObserver = ref(null);

    const processedData = computed(() => {
        if (!props.chartData || props.chartData.length === 0) return [];
        return props.chartData.map((item) => ({
            ...item,
            joinTime: dayjs(item.created_at).subtract(item.time, 'millisecond'),
            leaveTime: dayjs(item.created_at),
            time: item.time < 0 ? 0 : item.time,
            isFriend: item.user_id === currentUser.value.id ? null : gameLogIsFriend(item),
            isFavorite: item.user_id === currentUser.value.id ? null : gameLogIsFavorite(item)
        }));
    });

    const hasChartData = computed(() => processedData.value.length > 0);

    const startTimeStamp = computed(() => {
        if (processedData.value.length === 0) return null;
        let min = Infinity;
        for (const entry of processedData.value) {
            const val = entry.joinTime.valueOf();
            if (val < min) min = val;
        }
        return min;
    });

    const endTimeStamp = computed(() => {
        if (processedData.value.length === 0) return null;
        let max = -Infinity;
        for (const entry of processedData.value) {
            const val = entry.leaveTime.valueOf();
            if (val > max) max = val;
        }
        return max;
    });

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

    watch(
        () => props.chartData,
        () => {
            if (echartsInstance) {
                echartsInstance.dispose();
                echartsInstance = null;
            }
            nextTick(() => {
                initEcharts();
            });
        }
    );

    initResizeObserver();

    onMounted(async () => {
        await nextTick();
        initEcharts();
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

    function initResizeObserver() {
        resizeObserver.value = new ResizeObserver((entries) => {
            if (!echartsInstance) {
                return;
            }
            for (const entry of entries) {
                try {
                    echartsInstance.resize({
                        width: entry.contentRect.width,
                        animation: {
                            duration: 300
                        }
                    });
                } catch (error) {
                    console.warn('Error resizing chart:', error);
                }
            }
        });
    }

    async function initEcharts() {
        const data = processedData.value;
        if (!chartRef.value || data.length === 0) {
            return;
        }

        const uniqueUsers = new Map();
        for (const entry of data) {
            if (!uniqueUsers.has(entry.user_id)) {
                uniqueUsers.set(entry.user_id, entry);
            }
        }

        const chartsHeight = uniqueUsers.size * (BAR_WIDTH + 10) + 200;
        const chartDom = chartRef.value;

        const afterInit = () => {
            if (!echartsInstance) {
                console.error('ECharts instance not initialized');
                return;
            }

            try {
                echartsInstance.resize({
                    height: chartsHeight,
                    animation: {
                        duration: 300
                    }
                });

                echartsInstance.off('click');

                const options = getNewOption();
                if (options && options.series && options.series.length > 0) {
                    echartsInstance.clear();
                    echartsInstance.setOption(options, { notMerge: true });
                    echartsInstance.on('click', 'yAxis', handleClickYAxisLabel);
                } else {
                    echartsInstance.clear();
                }
            } catch (error) {
                console.error('Error in afterInit:', error);
            }
        };

        if (!echartsInstance) {
            echartsInstance = echarts.init(chartDom, `${isDarkMode.value ? 'dark' : null}`, {
                height: chartsHeight,
                useDirtyRect: data.length > 80
            });
            if (resizeObserver.value) {
                resizeObserver.value.observe(chartDom);
            }
        }

        setTimeout(afterInit, 50);
    }

    function handleClickYAxisLabel(params) {
        const userData = usersFirstActivity.value[params.dataIndex];
        if (userData?.user_id) {
            showUserDialog(userData.user_id);
        }
    }

    function getNewOption() {
        const data = processedData.value;
        if (data.length === 0) {
            return {
                title: {
                    text: 'No data',
                    left: 'center',
                    top: 'middle'
                }
            };
        }

        if (!startTimeStamp.value || !endTimeStamp.value) {
            return {
                title: {
                    text: 'Invalid timestamp data',
                    left: 'center',
                    top: 'middle'
                }
            };
        }

        const userGroupedEntries = new Map();
        const uniqueUserEntries = [];

        // sort by joinTime for consistent ordering
        const sortedData = [...data].sort((a, b) => {
            const timeDiff = Math.abs(a.joinTime.diff(b.joinTime, 'second'));
            return timeDiff < 3 ? a.leaveTime - b.leaveTime : a.joinTime - b.joinTime;
        });

        for (const entry of sortedData) {
            if (!userGroupedEntries.has(entry.user_id)) {
                userGroupedEntries.set(entry.user_id, []);
                uniqueUserEntries.push(entry);
            }
            const elements = userGroupedEntries.get(entry.user_id);
            const offset = Math.max(
                0,
                elements.length === 0
                    ? entry.joinTime.valueOf() - startTimeStamp.value
                    : entry.joinTime.valueOf() - startTimeStamp.value - elements[elements.length - 1].tail
            );
            const tail =
                elements.length === 0 ? offset + entry.time : elements[elements.length - 1].tail + offset + entry.time;
            const element = { offset, time: entry.time, tail, entry };
            elements.push(element);
        }
        usersFirstActivity.value = uniqueUserEntries;

        const generateSeries = () => {
            const maxEntryCount = Math.max(...Array.from(userGroupedEntries.values()).map((entries) => entries.length));
            const placeholderSeries = (seriesData) => {
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
                    data: seriesData
                };
            };
            const timeSeries = (seriesData) => {
                return {
                    name: 'Time',
                    type: 'bar',
                    stack: 'Total',
                    colorBy: 'data',
                    barWidth: BAR_WIDTH,
                    emphasis: {
                        focus: 'self'
                    },
                    itemStyle: {
                        borderRadius: 2,
                        shadowBlur: 2,
                        shadowOffsetX: 0.7,
                        shadowOffsetY: 0.5
                    },
                    data: seriesData
                };
            };

            const series = Array(maxEntryCount)
                .fill(0)
                .flatMap((_, index) => {
                    return [
                        placeholderSeries(
                            uniqueUserEntries.map((entry) => {
                                const element = userGroupedEntries.get(entry.user_id)[index];
                                return element ? element.offset : 0;
                            })
                        ),
                        timeSeries(
                            uniqueUserEntries.map((entry) => {
                                const element = userGroupedEntries.get(entry.user_id)[index];
                                return element ? element.time : 0;
                            })
                        )
                    ];
                });

            return series;
        };

        const friendOrFavIcon = (display_name) => {
            const foundItem = data.find((item) => item.display_name === display_name);

            if (!foundItem) {
                return '';
            }

            if (foundItem.isFavorite) {
                return '⭐';
            }
            if (foundItem.isFriend) {
                return '💚';
            }
            return '';
        };

        const getTooltip = (params) => {
            const param = params;
            const userData = uniqueUserEntries[param.dataIndex];
            const isTimeSeries = params.seriesIndex % 2 === 1;
            if (!isTimeSeries) {
                return '';
            }
            const targetEntryIndex = Math.floor(params.seriesIndex / 2);

            if (!userData) {
                return '';
            }

            const instanceData = userGroupedEntries.get(userData.user_id)[targetEntryIndex]?.entry;
            if (!instanceData) {
                return '';
            }

            const format = dtHour12.value ? 'hh:mm:ss A' : 'HH:mm:ss';
            const formattedLeftDateTime = dayjs(instanceData.leaveTime).format(format);
            const formattedJoinDateTime = dayjs(instanceData.joinTime).format(format);

            const timeString = timeToText(instanceData.time, true);
            const color = param.color;

            return `
                        <div style="display: flex; align-items: center;">
                            <div style="width: 10px; height: 55px; background-color: ${color}; margin-right: 6px;"></div>
                            <div>
                                <div>${instanceData.display_name} ${friendOrFavIcon(instanceData.display_name)}</div>
                                <div>${formattedJoinDateTime} - ${formattedLeftDateTime}</div>
                                <div>${timeString}</div>
                            </div>
                        </div>
                        `;
        };

        const format = dtHour12.value ? 'hh:mm A' : 'HH:mm';

        const echartsOption = {
            tooltip: {
                trigger: 'item',
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
                    formatter: (value) => {
                        const MAX_LENGTH = 20;
                        const len = value.length;
                        return `${friendOrFavIcon(value)} ${len > MAX_LENGTH ? `${value.substring(0, MAX_LENGTH)}...` : value}`;
                    }
                },
                inverse: true,
                data: uniqueUserEntries.map((item) => item.display_name),
                triggerEvent: true
            },
            xAxis: {
                type: 'value',
                min: 0,
                max: endTimeStamp.value - startTimeStamp.value,
                axisLine: { show: true },
                axisLabel: {
                    formatter: (value) => dayjs(value + startTimeStamp.value).format(format)
                },
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            series: generateSeries(),
            backgroundColor: 'transparent'
        };

        return echartsOption;
    }
</script>
