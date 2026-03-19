<template>
    <div class="flex flex-col" style="min-height: 200px">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div style="display: flex; align-items: center">
                <Button class="rounded-full" variant="ghost" size="icon-sm" :disabled="isLoading" @click="loadData">
                    <Spinner v-if="isLoading" />
                    <RefreshCw v-else />
                </Button>
                <span v-if="filteredEventCount > 0" class="text-accent-foreground ml-1">
                    {{ t('dialog.user.activity.total_events', { count: filteredEventCount }) }}
                </span>
            </div>
            <div v-if="hasAnyData" class="flex items-center gap-2">
                <span class="text-muted-foreground text-sm">{{ t('dialog.user.activity.period') }}</span>
                <Select v-model="selectedPeriod" :disabled="isLoading">
                    <SelectTrigger size="sm" class="w-40" @click.stop>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{{ t('dialog.user.activity.period_all') }}</SelectItem>
                        <SelectItem value="365">{{ t('dialog.user.activity.period_365') }}</SelectItem>
                        <SelectItem value="180">{{ t('dialog.user.activity.period_180') }}</SelectItem>
                        <SelectItem value="90">{{ t('dialog.user.activity.period_90') }}</SelectItem>
                        <SelectItem value="30">{{ t('dialog.user.activity.period_30') }}</SelectItem>
                    </SelectContent>
                </Select>
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
        <div v-if="!isLoading && !hasAnyData" class="flex items-center justify-center flex-1 mt-8">
            <DataTableEmpty type="nodata" />
        </div>
        <div
            v-if="!isLoading && hasAnyData && filteredEventCount === 0"
            class="flex items-center justify-center flex-1 mt-8">
            <span class="text-muted-foreground text-sm">{{ t('dialog.user.activity.no_data_in_period') }}</span>
        </div>
        <div
            v-show="filteredEventCount > 0"
            ref="chartRef"
            style="width: 100%; height: 240px"
            @contextmenu.prevent="onChartRightClick"></div>

        <!-- Online Overlap Section -->
        <div v-if="hasAnyData" class="mt-4 border-t border-border pt-3">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ t('dialog.user.activity.overlap.header') }}</span>
                    <Spinner v-if="isOverlapLoading" class="h-3.5 w-3.5" />
                </div>
                <div v-if="hasOverlapData" class="flex items-center gap-1.5 flex-shrink-0">
                    <Switch :model-value="excludeHoursEnabled" class="scale-75" @update:model-value="onExcludeToggle" />
                    <span class="text-sm text-muted-foreground whitespace-nowrap">{{
                        t('dialog.user.activity.overlap.exclude_hours')
                    }}</span>
                    <Select v-model="excludeStartHour" @update:model-value="onExcludeRangeChange">
                        <SelectTrigger size="sm" class="w-[78px] h-6 text-xs px-2" @click.stop>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="h in 24" :key="h - 1" :value="String(h - 1)">
                                {{ String(h - 1).padStart(2, '0') }}:00
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <span class="text-xs text-muted-foreground">–</span>
                    <Select v-model="excludeEndHour" @update:model-value="onExcludeRangeChange">
                        <SelectTrigger size="sm" class="w-[78px] h-6 text-xs px-2" @click.stop>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="h in 24" :key="h - 1" :value="String(h - 1)">
                                {{ String(h - 1).padStart(2, '0') }}:00
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div v-if="!isOverlapLoading && hasOverlapData" class="flex flex-col gap-1 mb-2">
                <div class="flex items-center gap-2">
                    <span
                        class="text-sm font-medium"
                        :class="overlapPercent > 0 ? 'text-accent-foreground' : 'text-muted-foreground'">
                        {{ overlapPercent }}%
                    </span>
                    <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            class="h-full rounded-full transition-all duration-500"
                            :style="{
                                width: `${overlapPercent}%`,
                                backgroundColor: isDarkMode ? 'hsl(260, 60%, 55%)' : 'hsl(260, 55%, 50%)'
                            }" />
                    </div>
                </div>
                <div v-if="bestOverlapTime" class="text-sm">
                    <span class="text-muted-foreground">{{ t('dialog.user.activity.overlap.peak_overlap') }}</span>
                    <span class="font-medium ml-1">{{ bestOverlapTime }}</span>
                </div>
            </div>

            <div
                v-if="hasOverlapData"
                ref="overlapChartRef"
                style="width: 100%; height: 240px"
                @contextmenu.prevent="onOverlapChartRightClick" />

            <div v-if="!isOverlapLoading && !hasOverlapData && hasAnyData" class="text-sm text-muted-foreground py-2">
                {{ t('dialog.user.activity.overlap.no_data') }}
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, h, nextTick, onBeforeUnmount, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Switch } from '@/components/ui/switch';
    import { RefreshCw, Tractor, Sprout } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import * as echarts from 'echarts';
    import dayjs from 'dayjs';

    import { database } from '../../../services/database';
    import configRepository from '../../../services/config';
    import { useAppearanceSettingsStore, useUserStore } from '../../../stores';
    import {
        buildSessionsFromEvents,
        buildSessionsFromGamelog,
        calculateOverlapGrid,
        filterSessionsByPeriod,
        findBestOverlapTime,
        aggregateSessionsToGrid
    } from '../../../shared/utils/overlapCalculator';

    const { t, locale } = useI18n();
    const { userDialog } = storeToRefs(useUserStore());
    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());

    const chartRef = ref(null);
    const isLoading = ref(false);
    const totalOnlineEvents = ref(0);
    const hasAnyData = ref(false);
    const peakDayText = ref('');
    const peakTimeText = ref('');
    const selectedPeriod = ref('all');
    const filteredEventCount = ref(0);

    const overlapChartRef = ref(null);
    const isOverlapLoading = ref(false);
    const hasOverlapData = ref(false);
    const overlapPercent = ref(0);
    const bestOverlapTime = ref('');

    const excludeHoursEnabled = ref(false);
    const excludeStartHour = ref('1');
    const excludeEndHour = ref('6');

    let echartsInstance = null;
    let resizeObserver = null;
    let lastLoadedUserId = '';

    let overlapEchartsInstance = null;
    let overlapResizeObserver = null;
    let cachedTargetSessions = [];
    let cachedCurrentSessions = [];

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
        dayLabels.value[0] // Sun
    ]);

    const hourLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    function rebuildChart() {
        if (echartsInstance) {
            echartsInstance.dispose();
            echartsInstance = null;
            if (hasAnyData.value && chartRef.value) {
                nextTick(() => {
                    echartsInstance = echarts.init(chartRef.value, isDarkMode.value ? 'dark' : null, { height: 240 });
                    initChart();
                });
            }
        }
        if (overlapEchartsInstance) {
            overlapEchartsInstance.dispose();
            overlapEchartsInstance = null;
            if (hasOverlapData.value && overlapChartRef.value) {
                nextTick(() => {
                    overlapEchartsInstance = echarts.init(overlapChartRef.value, isDarkMode.value ? 'dark' : null, {
                        height: 240
                    });
                    updateOverlapChart();
                });
            }
        }
    }

    watch(() => isDarkMode.value, rebuildChart);
    watch(locale, rebuildChart);
    watch(selectedPeriod, () => {
        if (cachedTargetSessions.length > 0 && echartsInstance) {
            initChart();
        }
        updateOverlapChart();
    });

    (async () => {
        excludeHoursEnabled.value = await configRepository.getBool('VRCX_overlapExcludeEnabled', false);
        excludeStartHour.value = await configRepository.getString('VRCX_overlapExcludeStart', '1');
        excludeEndHour.value = await configRepository.getString('VRCX_overlapExcludeEnd', '6');
    })();

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
        if (overlapResizeObserver) {
            overlapResizeObserver.disconnect();
            overlapResizeObserver = null;
        }
        if (overlapEchartsInstance) {
            overlapEchartsInstance.dispose();
            overlapEchartsInstance = null;
        }
    }

    function getFilteredSessions() {
        if (selectedPeriod.value === 'all') return cachedTargetSessions;
        const days = parseInt(selectedPeriod.value, 10);
        const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
        return filterSessionsByPeriod(cachedTargetSessions, cutoffMs);
    }

    /**
     * Compute peak day/time from a 7×24 grid
     * @param grid
     * @returns {{peakDay: string, peakTime: string}}
     */
    function computePeaks(grid) {
        // Peak day
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

        // Peak time range
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
                peakTimeResult = `${String(startHour).padStart(2, '0')}:00\u2013${String(endHour + 1).padStart(2, '0')}:00`;
            }
        }

        return { peakDayResult, peakTimeResult };
    }

    function initChart() {
        if (!chartRef.value || !echartsInstance) return;

        const filteredSessions = getFilteredSessions();
        // Use timestamps for event count display
        const filteredTs = getFilteredTimestamps();
        filteredEventCount.value = filteredTs.length;
        totalOnlineEvents.value = filteredTs.length;

        if (filteredSessions.length === 0) {
            peakDayText.value = '';
            peakTimeText.value = '';
            return;
        }

        const { grid, maxVal } = aggregateSessionsToGrid(filteredSessions);
        const { peakDayResult, peakTimeResult } = computePeaks(grid);
        peakDayText.value = peakDayResult;
        peakTimeText.value = peakTimeResult;

        const data = [];
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const count = grid[day][hour];
                const displayDay = day === 0 ? 6 : day - 1;
                data.push([hour, displayDay, count]);
            }
        }

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

        if (userId !== lastLoadedUserId) {
            selectedPeriod.value = 'all';
        }

        const requestId = ++activeRequestId;
        isLoading.value = true;
        try {
            const [timestamps, events] = await Promise.all([
                database.getOnlineFrequencyData(userId),
                database.getOnlineOfflineSessions(userId)
            ]);
            if (requestId !== activeRequestId) return;
            if (userDialog.value.id !== userId) return;

            cachedTimestamps = timestamps;
            cachedTargetSessions = buildSessionsFromEvents(events);
            hasAnyData.value = timestamps.length > 0;
            totalOnlineEvents.value = timestamps.length;
            lastLoadedUserId = userId;

            await nextTick();

            if (timestamps.length > 0) {
                const filteredTs = getFilteredTimestamps();
                filteredEventCount.value = filteredTs.length;

                await nextTick();

                if (!echartsInstance && chartRef.value) {
                    echartsInstance = echarts.init(chartRef.value, isDarkMode.value ? 'dark' : null, { height: 240 });
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
                hasAnyData.value = false;
                filteredEventCount.value = 0;
            }
        } catch (error) {
            console.error('Error loading online frequency data:', error);
        } finally {
            if (requestId === activeRequestId) {
                isLoading.value = false;
            }
        }

        // Load overlap data after main data (target sessions already cached)
        if (hasAnyData.value) {
            loadOverlapData(userId);
        }
    }

    function getFilteredTimestamps() {
        if (selectedPeriod.value === 'all') return cachedTimestamps;
        const days = parseInt(selectedPeriod.value, 10);
        const cutoff = dayjs().subtract(days, 'day');
        return cachedTimestamps.filter((ts) => dayjs(ts).isAfter(cutoff));
    }

    /**
     * @param {string} userId
     */
    function loadOnlineFrequency(userId) {
        if (lastLoadedUserId === userId && hasAnyData.value) {
            return;
        }
        loadData();
    }

    let easterEggTimer = null;

    function onChartRightClick() {
        toast(t('dialog.user.activity.easter_egg'), { position: 'bottom-center', icon: h(Tractor) });
        clearTimeout(easterEggTimer);
        easterEggTimer = setTimeout(() => {
            easterEggTimer = null;
        }, 5000);
    }

    function onOverlapChartRightClick() {
        if (easterEggTimer) {
            toast(t('dialog.user.activity.easter_egg_reply'), { position: 'bottom-center', icon: h(Sprout) });
        }
    }

    async function loadOverlapData(userId) {
        if (!userId) return;

        isOverlapLoading.value = true;
        hasOverlapData.value = false;
        try {
            // Target sessions already cached from loadData, only fetch current user
            const currentUserRows = await database.getCurrentUserOnlineSessions();

            if (userDialog.value.id !== userId) return;

            const currentSessions = buildSessionsFromGamelog(currentUserRows);

            if (cachedTargetSessions.length === 0 || currentSessions.length === 0) {
                hasOverlapData.value = false;
                return;
            }

            cachedCurrentSessions = currentSessions;
            hasOverlapData.value = true;

            await nextTick();

            if (!overlapEchartsInstance && overlapChartRef.value) {
                overlapEchartsInstance = echarts.init(overlapChartRef.value, isDarkMode.value ? 'dark' : null, {
                    height: 240
                });
                overlapResizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        if (overlapEchartsInstance) {
                            overlapEchartsInstance.resize({
                                width: entry.contentRect.width
                            });
                        }
                    }
                });
                overlapResizeObserver.observe(overlapChartRef.value);
            }

            updateOverlapChart();
        } catch (error) {
            console.error('Error loading overlap data:', error);
            hasOverlapData.value = false;
        } finally {
            isOverlapLoading.value = false;
        }
    }

    function updateOverlapChart() {
        if (cachedTargetSessions.length === 0 || cachedCurrentSessions.length === 0) return;

        let targetSessions = cachedTargetSessions;
        let currentSessions = cachedCurrentSessions;

        if (selectedPeriod.value !== 'all') {
            const days = parseInt(selectedPeriod.value, 10);
            const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
            targetSessions = filterSessionsByPeriod(targetSessions, cutoffMs);
            currentSessions = filterSessionsByPeriod(currentSessions, cutoffMs);
        }

        if (targetSessions.length === 0 || currentSessions.length === 0) {
            overlapPercent.value = 0;
            bestOverlapTime.value = '';
            return;
        }

        const result = calculateOverlapGrid(currentSessions, targetSessions);

        // Apply hour exclusion to the grid
        if (excludeHoursEnabled.value) {
            const start = parseInt(excludeStartHour.value, 10);
            const end = parseInt(excludeEndHour.value, 10);
            applyHourExclusion(result.grid, start, end);
            // Recalculate maxVal after exclusion
            result.maxVal = 0;
            for (let d = 0; d < 7; d++) {
                for (let h = 0; h < 24; h++) {
                    if (result.grid[d][h] > result.maxVal) result.maxVal = result.grid[d][h];
                }
            }
            // Recalculate overlap percent excluding those hours
            const totalGrid = result.grid.flat().reduce((a, b) => a + b, 0);
            if (totalGrid === 0) {
                overlapPercent.value = 0;
                bestOverlapTime.value = '';
                return;
            }
        }

        overlapPercent.value = result.overlapPercent;
        bestOverlapTime.value = findBestOverlapTime(result.grid, dayLabels.value);

        if (result.overlapPercent > 0 || result.maxVal > 0) {
            initOverlapChart(result);
        }
    }

    /**
     * Zero out hours in the grid that fall within the exclusion range.
     * Supports wrapping (e.g. 23 to 5 means 23,0,1,2,3,4).
     * @param grid
     * @param startHour
     * @param endHour
     * @returns {void}
     */
    function applyHourExclusion(grid, startHour, endHour) {
        for (let d = 0; d < 7; d++) {
            if (startHour <= endHour) {
                for (let h = startHour; h < endHour; h++) {
                    grid[d][h] = 0;
                }
            } else {
                for (let h = startHour; h < 24; h++) {
                    grid[d][h] = 0;
                }
                for (let h = 0; h < endHour; h++) {
                    grid[d][h] = 0;
                }
            }
        }
    }

    function onExcludeToggle(value) {
        excludeHoursEnabled.value = value;
        configRepository.setBool('VRCX_overlapExcludeEnabled', value);
        updateOverlapChart();
    }

    function onExcludeRangeChange() {
        configRepository.setString('VRCX_overlapExcludeStart', excludeStartHour.value);
        configRepository.setString('VRCX_overlapExcludeEnd', excludeEndHour.value);
        updateOverlapChart();
    }

    function initOverlapChart(result) {
        if (!overlapEchartsInstance) return;

        const data = [];
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const count = result.grid[day][hour];
                const displayDay = day === 0 ? 6 : day - 1;
                data.push([hour, displayDay, count]);
            }
        }

        const option = {
            tooltip: {
                position: 'top',
                formatter: (params) => {
                    const [hour, dayIdx, count] = params.data;
                    const dayName = displayDayLabels.value[dayIdx];
                    return `${dayName} ${hourLabels[hour]}<br/><b>${count}</b> ${t('dialog.user.activity.overlap.times_overlap')}`;
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
                max: Math.max(result.maxVal, 1),
                calculable: false,
                show: false,
                inRange: {
                    color: isDarkMode.value
                        ? [
                              'hsl(220, 15%, 12%)',
                              'hsl(260, 30%, 25%)',
                              'hsl(260, 50%, 42%)',
                              'hsl(260, 65%, 55%)',
                              'hsl(260, 70%, 65%)'
                          ]
                        : [
                              'hsl(210, 30%, 95%)',
                              'hsl(260, 35%, 82%)',
                              'hsl(260, 48%, 62%)',
                              'hsl(260, 55%, 48%)',
                              'hsl(260, 60%, 38%)'
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

        overlapEchartsInstance.setOption(option, { notMerge: true });
    }

    defineExpose({ loadOnlineFrequency });
</script>
