<template>
    <div class="flex flex-col px-2" style="min-height: 200px">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div style="display: flex; align-items: center">
                <Button
                    class="rounded-full"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="isLoading"
                    @click="loadData">
                    <Spinner v-if="isLoading" />
                    <RefreshCw v-else />
                </Button>
                <span v-if="totalOnlineEvents > 0" style="margin-left: 6px" class="text-muted-foreground text-xs">
                    {{ t('dialog.user.activity.total_events', { count: totalOnlineEvents }) }}
                </span>
            </div>
        </div>
        <div v-if="peakDayText || peakTimeText" class="mt-2 mb-1 text-sm flex gap-4">
            <div v-if="peakDayText">
                <span class="text-muted-foreground">{{ t('dialog.user.activity.most_active_day') }}</span>
                <span class="font-medium ml-1">{{ peakDayText }}</span>
            </div>
            <div v-if="peakTimeText">
                <span class="text-muted-foreground">{{ t('dialog.user.activity.most_active_time') }}</span>
                <span class="font-medium ml-1">{{ peakTimeText }}</span>
            </div>
        </div>
        <div v-if="!isLoading && totalOnlineEvents === 0" class="flex items-center justify-center flex-1 mt-8">
            <DataTableEmpty type="nodata" />
        </div>
        <div
            v-show="totalOnlineEvents > 0"
            ref="chartRef"
            style="width: 100%; height: 240px"
            @contextmenu.prevent="onChartRightClick">
        </div>
    </div>
</template>

<script setup>
    import { computed, h, nextTick, onBeforeUnmount, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { RefreshCw, Tractor } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import * as echarts from 'echarts';
    import dayjs from 'dayjs';

    import { database } from '../../../services/database';
    import { useAppearanceSettingsStore, useUserStore } from '../../../stores';

    const { t, locale } = useI18n();
    const { userDialog } = storeToRefs(useUserStore());
    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());

    const chartRef = ref(null);
    const isLoading = ref(false);
    const totalOnlineEvents = ref(0);
    const peakDayText = ref('');
    const peakTimeText = ref('');

    let echartsInstance = null;
    let resizeObserver = null;
    let lastLoadedUserId = '';

    const dayLabels = computed(() => [
        t('dialog.user.activity.days.sun'),
        t('dialog.user.activity.days.mon'),
        t('dialog.user.activity.days.tue'),
        t('dialog.user.activity.days.wed'),
        t('dialog.user.activity.days.thu'),
        t('dialog.user.activity.days.fri'),
        t('dialog.user.activity.days.sat')
    ]);

    // Reorder: Mon-Sun for display (row 0=Mon at top, row 6=Sun at bottom)
    const displayDayLabels = computed(() => [
        dayLabels.value[1], // Mon
        dayLabels.value[2], // Tue
        dayLabels.value[3], // Wed
        dayLabels.value[4], // Thu
        dayLabels.value[5], // Fri
        dayLabels.value[6], // Sat
        dayLabels.value[0]  // Sun
    ]);

    const hourLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    function rebuildChart() {
        if (echartsInstance) {
            echartsInstance.dispose();
            echartsInstance = null;
            if (totalOnlineEvents.value > 0 && chartRef.value) {
                nextTick(() => {
                    echartsInstance = echarts.init(
                        chartRef.value,
                        isDarkMode.value ? 'dark' : null,
                        { height: 240 }
                    );
                    initChart();
                });
            }
        }
    }

    watch(() => isDarkMode.value, rebuildChart);
    watch(locale, rebuildChart);

    onBeforeUnmount(() => {
        disposeChart();
    });

    function disposeChart() {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (echartsInstance) {
            echartsInstance.dispose();
            echartsInstance = null;
        }
    }

    /**
     * @param {string[]} timestamps
     * @returns {{ data: number[][], maxVal: number, peakText: string }}
     */
    function aggregateHeatmapData(timestamps) {
        const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));

        for (const ts of timestamps) {
            const d = dayjs(ts);
            const dayOfWeek = d.day(); // 0=Sun, 1=Mon, ..., 6=Sat
            const hour = d.hour();
            grid[dayOfWeek][hour]++;
        }

        const data = [];
        let maxVal = 0;
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const count = grid[day][hour];
                const displayDay = day === 0 ? 6 : day - 1;
                data.push([hour, displayDay, count]);
                if (count > maxVal) maxVal = count;
            }
        }

        // Peak day: sum each day across all hours
        let peakDayResult = '';
        const daySums = new Array(7).fill(0);
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                daySums[day] += grid[day][hour];
            }
        }
        let maxDaySum = 0;
        let maxDayIdx = 0;
        for (let day = 0; day < 7; day++) {
            if (daySums[day] > maxDaySum) {
                maxDaySum = daySums[day];
                maxDayIdx = day;
            }
        }
        if (maxDaySum > 0) {
            peakDayResult = dayLabels.value[maxDayIdx];
        }

        // Peak time: sum each hour across all days, find contiguous peak range
        let peakTimeResult = '';
        const hourSums = new Array(24).fill(0);
        for (let hour = 0; hour < 24; hour++) {
            for (let day = 0; day < 7; day++) {
                hourSums[hour] += grid[day][hour];
            }
        }
        let maxHourSum = 0;
        let maxHourIdx = 0;
        for (let hour = 0; hour < 24; hour++) {
            if (hourSums[hour] > maxHourSum) {
                maxHourSum = hourSums[hour];
                maxHourIdx = hour;
            }
        }
        if (maxHourSum > 0) {
            const threshold = maxHourSum * 0.7;
            let startHour = maxHourIdx;
            let endHour = maxHourIdx;
            while (startHour > 0 && hourSums[startHour - 1] >= threshold) {
                startHour--;
            }
            while (endHour < 23 && hourSums[endHour + 1] >= threshold) {
                endHour++;
            }
            if (startHour === endHour) {
                peakTimeResult = `${String(startHour).padStart(2, '0')}:00`;
            } else {
                peakTimeResult = `${String(startHour).padStart(2, '0')}:00–${String(endHour + 1).padStart(2, '0')}:00`;
            }
        }

        return { data, maxVal, peakDayResult, peakTimeResult };
    }

    function initChart() {
        if (!chartRef.value || !echartsInstance) return;

        const { data, maxVal, peakDayResult, peakTimeResult } = aggregateHeatmapData(cachedTimestamps);
        peakDayText.value = peakDayResult;
        peakTimeText.value = peakTimeResult;

        const option = {
            tooltip: {
                position: 'top',
                formatter: (params) => {
                    const [hour, dayIdx, count] = params.data;
                    const dayName = displayDayLabels.value[dayIdx];
                    return `${dayName} ${hourLabels[hour]}<br/><b>${count}</b> ${t('dialog.user.activity.times_online')}`;
                }
            },
            grid: {
                top: 6,
                left: 42,
                right: 16,
                bottom: 32
            },
            xAxis: {
                type: 'category',
                data: hourLabels,
                splitArea: { show: false },
                axisLabel: {
                    interval: 2,
                    fontSize: 10
                },
                axisTick: { show: false }
            },
            yAxis: {
                type: 'category',
                data: displayDayLabels.value,
                splitArea: { show: false },
                axisLabel: {
                    fontSize: 11
                },
                axisTick: { show: false }
            },
            visualMap: {
                min: 0,
                max: Math.max(maxVal, 1),
                calculable: false,
                show: false,
                inRange: {
                    color: isDarkMode.value
                        ? [
                              'hsl(220, 15%, 12%)',
                              'hsl(160, 40%, 20%)',
                              'hsl(142, 60%, 38%)',
                              'hsl(142, 72%, 52%)',
                              'hsl(142, 80%, 62%)'
                          ]
                        : [
                              'hsl(210, 30%, 95%)',
                              'hsl(160, 40%, 80%)',
                              'hsl(142, 55%, 55%)',
                              'hsl(142, 65%, 40%)',
                              'hsl(142, 76%, 30%)'
                          ]
                }
            },
            series: [
                {
                    type: 'heatmap',
                    data,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 6,
                            shadowColor: 'rgba(0, 0, 0, 0.3)'
                        }
                    },
                    itemStyle: {
                        borderWidth: 1.5,
                        borderColor: isDarkMode.value ? 'hsl(220, 15%, 8%)' : 'hsl(0, 0%, 100%)',
                        borderRadius: 2
                    }
                }
            ],
            backgroundColor: 'transparent'
        };

        echartsInstance.setOption(option, { notMerge: true });
    }

    let cachedTimestamps = [];
    let activeRequestId = 0;

    async function loadData() {
        const userId = userDialog.value.id;
        if (!userId) return;

        const requestId = ++activeRequestId;
        isLoading.value = true;
        try {
            const timestamps = await database.getOnlineFrequencyData(userId);
            if (requestId !== activeRequestId) return;
            if (userDialog.value.id !== userId) return;
            cachedTimestamps = timestamps;
            totalOnlineEvents.value = timestamps.length;
            lastLoadedUserId = userId;

            await nextTick();

            if (timestamps.length > 0) {
                if (!echartsInstance && chartRef.value) {
                    echartsInstance = echarts.init(
                        chartRef.value,
                        isDarkMode.value ? 'dark' : null,
                        { height: 240 }
                    );
                    resizeObserver = new ResizeObserver((entries) => {
                        for (const entry of entries) {
                            if (echartsInstance) {
                                echartsInstance.resize({
                                    width: entry.contentRect.width
                                });
                            }
                        }
                    });
                    resizeObserver.observe(chartRef.value);
                }
                initChart();
            } else {
                peakDayText.value = '';
                peakTimeText.value = '';
            }
        } catch (error) {
            console.error('Error loading online frequency data:', error);
        } finally {
            if (requestId === activeRequestId) {
                isLoading.value = false;
            }
        }
    }

    /**
     * @param {string} userId
     */
    function loadOnlineFrequency(userId) {
        if (lastLoadedUserId === userId && totalOnlineEvents.value > 0) {
            return;
        }
        loadData();
    }

    function onChartRightClick() {
        toast(t('dialog.user.activity.easter_egg'), { position: 'bottom-center', icon: h(Tractor) });
    }

    defineExpose({ loadOnlineFrequency });
</script>
