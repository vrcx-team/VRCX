<template>
    <div class="flex flex-col" style="min-height: 200px">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div style="display: flex; align-items: center">
                <Button
                    class="rounded-full"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="isLoading"
                    :title="t('dialog.user.activity.refresh_hint')"
                    @click="loadData">
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
        <div v-if="isLoading && !hasAnyData" class="flex flex-col items-center justify-center flex-1 mt-8 gap-2">
            <Spinner class="h-5 w-5" />
            <span class="text-sm text-muted-foreground">{{ t('dialog.user.activity.preparing_data') }}</span>
            <span class="text-xs text-muted-foreground">{{ t('dialog.user.activity.preparing_data_hint') }}</span>
        </div>
        <div v-else-if="!isLoading && !hasAnyData" class="flex items-center justify-center flex-1 mt-8">
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

        <!-- Online Overlap Section (friends only) -->
        <div v-if="hasAnyData && !isSelf" class="mt-4 border-t border-border pt-3">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ t('dialog.user.activity.overlap.header') }}</span>
                    <Spinner v-if="isOverlapLoading" class="h-3.5 w-3.5" />
                </div>
                <div v-if="hasOverlapData" class="flex items-center gap-1.5 shrink-0">
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

        <!-- Top Worlds Section (self only) -->
        <div v-if="isSelf && hasAnyData" class="mt-4 border-t border-border pt-3">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">{{ t('dialog.user.activity.most_visited_worlds.header') }}</span>
            </div>
            <div v-if="topWorlds.length === 0 && !isLoading" class="text-sm text-muted-foreground py-2">
                {{ t('dialog.user.activity.no_data_in_period') }}
            </div>
            <div v-else class="flex flex-col gap-0.5">
                <button
                    v-for="(world, index) in topWorlds"
                    :key="world.worldId"
                    type="button"
                    class="group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                    :class="index === 0 ? 'bg-primary/4' : ''"
                    @click="openWorldDialog(world.worldId)">
                    <span
                        class="mt-1 w-5 shrink-0 text-right font-mono text-xs font-bold"
                        :class="index === 0 ? 'text-primary' : 'text-muted-foreground'">
                        #{{ index + 1 }}
                    </span>
                    <Avatar class="rounded-sm size-8 mt-0.5 shrink-0">
                        <AvatarImage
                            v-if="getWorldThumbnail(world.worldId)"
                            :src="getWorldThumbnail(world.worldId)"
                            loading="lazy"
                            decoding="async"
                            class="rounded-sm object-cover" />
                        <AvatarFallback class="rounded-sm">
                            <ImageIcon class="size-3.5 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-baseline justify-between gap-2">
                            <span class="truncate text-sm font-medium">{{ world.worldName }}</span>
                            <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {{ formatWorldTime(world.totalTime) }}
                            </span>
                        </div>
                        <div
                            class="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                            :class="isDarkMode ? 'bg-white/8' : 'bg-black/6'">
                            <div
                                class="h-full rounded-full transition-all duration-500"
                                :class="isDarkMode ? 'bg-white/45' : 'bg-black/25'"
                                :style="{ width: getTopWorldBarWidth(world.totalTime) }" />
                        </div>
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Switch } from '@/components/ui/switch';
    import { Image as ImageIcon, RefreshCw, Tractor, Sprout } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import * as echarts from 'echarts';
    import dayjs from 'dayjs';

    import { database } from '../../../services/database';
    import configRepository from '../../../services/config';
    import { worldRequest } from '../../../api';
    import { useActivityStore, useAppearanceSettingsStore, useUserStore } from '../../../stores';
    import { useWorldStore } from '../../../stores/world';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import { timeToText } from '../../../shared/utils';
    import { useCurrentUserSessions } from '../../../composables/useCurrentUserSessions';
    import {
        buildSessionsFromGamelog,
        calculateOverlapGrid,
        filterSessionsByPeriod,
        findBestOverlapTime,
        aggregateSessionsToGrid
    } from '../../../shared/utils/overlapCalculator';

    const { t, locale } = useI18n();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const { isDarkMode, weekStartsOn } = storeToRefs(useAppearanceSettingsStore());
    const worldStore = useWorldStore();
    const sessionCache = useCurrentUserSessions();
    const activityStore = useActivityStore();

    const chartRef = ref(null);
    const isLoading = ref(false);
    const hasAnyData = ref(false);
    const peakDayText = ref('');
    const peakTimeText = ref('');
    const selectedPeriod = ref('all');
    const filteredEventCount = ref(0);

    const isSelf = computed(() => userDialog.value.id === currentUser.value.id);
    const topWorlds = ref([]);

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
    const pendingWorldThumbnailFetches = new Set();

    const dayLabels = computed(() => [
        t('dialog.user.activity.days.sun'),
        t('dialog.user.activity.days.mon'),
        t('dialog.user.activity.days.tue'),
        t('dialog.user.activity.days.wed'),
        t('dialog.user.activity.days.thu'),
        t('dialog.user.activity.days.fri'),
        t('dialog.user.activity.days.sat')
    ]);

    const displayDayLabels = computed(() => {
        const start = weekStartsOn.value;
        return Array.from({ length: 7 }, (_, i) => dayLabels.value[(start + i) % 7]);
    });

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
    watch(weekStartsOn, rebuildChart);
    watch(
        () => userDialog.value.id,
        () => {
            resetActivityState();
        }
    );
    watch(selectedPeriod, () => {
        if (cachedTargetSessions.length > 0 && echartsInstance) {
            initChart();
        }
        if (!isSelf.value) {
            updateOverlapChart();
        } else {
            loadTopWorlds();
        }
    });

    // Resize echarts when dialog becomes visible again (e.g. breadcrumb return)
    watch(
        () => userDialog.value.visible,
        (visible) => {
            if (visible) {
                nextTick(() => {
                    if (echartsInstance && chartRef.value) {
                        echartsInstance.resize();
                    }
                    if (overlapEchartsInstance && overlapChartRef.value) {
                        overlapEchartsInstance.resize();
                    }
                });
                if (userDialog.value.activeTab === 'Activity') {
                    loadOnlineFrequency(userDialog.value.id);
                }
            }
        }
    );

    watch(
        () => userDialog.value.activeTab,
        (activeTab) => {
            if (activeTab === 'Activity' && userDialog.value.visible) {
                loadOnlineFrequency(userDialog.value.id);
            }
        }
    );

    (async () => {
        excludeHoursEnabled.value = await configRepository.getBool('VRCX_overlapExcludeEnabled', false);
        excludeStartHour.value = await configRepository.getString('VRCX_overlapExcludeStart', '1');
        excludeEndHour.value = await configRepository.getString('VRCX_overlapExcludeEnd', '6');
    })();

    onMounted(() => {
        if (userDialog.value.visible && userDialog.value.activeTab === 'Activity') {
            loadOnlineFrequency(userDialog.value.id);
        }
    });

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
        filteredEventCount.value = getFilteredEventCount();

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
        const wso = weekStartsOn.value;
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const count = grid[day][hour];
                const displayDay = (day - wso + 7) % 7;
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
                inverse: true,
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
            if (isSelf.value) {
                const rows = await database.getCurrentUserOnlineSessions();
                if (requestId !== activeRequestId) return;
                if (userDialog.value.id !== userId) return;

                cachedTargetSessions = buildSessionsFromGamelog(rows);
                await finishLoadData(userId);
                return;
            }

            const entry = await activityStore.refreshActivityCache(userId);
            if (requestId !== activeRequestId) return;
            if (userDialog.value.id !== userId) return;
            hydrateFromCacheEntry(entry);
            await finishLoadData(userId);
        } catch (error) {
            console.error('Error loading online frequency data:', error);
        } finally {
            if (requestId === activeRequestId) {
                isLoading.value = false;
            }
        }
    }

    /**
     * Shared finalization after session data is loaded (both sync and async paths).
     * @param {string} userId
     */
    async function finishLoadData(userId) {
        hasAnyData.value = cachedTargetSessions.length > 0;
        lastLoadedUserId = userId;

        await nextTick();

        if (cachedTargetSessions.length > 0) {
            filteredEventCount.value = getFilteredEventCount();

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

        isLoading.value = false;

        if (hasAnyData.value && !isSelf.value) {
            loadOverlapData(userId);
        }
        if (hasAnyData.value && isSelf.value) {
            loadTopWorlds();
        }
    }

    function resetActivityState() {
        isLoading.value = false;
        hasAnyData.value = false;
        peakDayText.value = '';
        peakTimeText.value = '';
        selectedPeriod.value = 'all';
        filteredEventCount.value = 0;
        hasOverlapData.value = false;
        overlapPercent.value = 0;
        bestOverlapTime.value = '';
        isOverlapLoading.value = false;
        topWorlds.value = [];
        cachedTargetSessions = [];
        cachedCurrentSessions = [];
        lastLoadedUserId = '';
        activeRequestId++;
    }

    function hydrateFromCacheEntry(entry) {
        cachedTargetSessions = Array.isArray(entry?.sessions) ? entry.sessions : [];
    }

    async function loadCachedActivity(userId) {
        const entry = await activityStore.getCache(userId);
        if (!entry) {
            return null;
        }

        if (userDialog.value.id !== userId) {
            return null;
        }
        hydrateFromCacheEntry(entry);
        await finishLoadData(userId);
        return entry;
    }

    function getFilteredEventCount() {
        if (selectedPeriod.value === 'all') return cachedTargetSessions.length;
        const days = parseInt(selectedPeriod.value, 10);
        const cutoff = dayjs().subtract(days, 'day').valueOf();
        return cachedTargetSessions.filter((session) => session.start > cutoff).length;
    }

    /**
     * @param {string} userId
     */
    function loadOnlineFrequency(userId) {
        if (lastLoadedUserId !== userId) {
            resetActivityState();
        }
        if (!userId) {
            return;
        }
        if (lastLoadedUserId === userId && (hasAnyData.value || isLoading.value)) {
            return;
        }
        if (isSelf.value) {
            void loadData();
            return;
        }
        void (async () => {
            const cacheEntry = await loadCachedActivity(userId);
            if (cacheEntry || activityStore.isRefreshing(userId)) {
                if (!cacheEntry && !isLoading.value) {
                    void loadData();
                }
                return;
            }
            void loadData();
        })();
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
            if (!sessionCache.isReady()) {
                sessionCache.onReady(() => loadOverlapData(userId));
                sessionCache.triggerLoad();
                return;
            }

            const currentSessions = await sessionCache.getSessions();

            if (userDialog.value.id !== userId) return;

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
            const overlapSessions = computeOverlapSessions(currentSessions, targetSessions);
            const overlapMs = getIncludedSessionDurationMs(overlapSessions, start, end);
            const currentMs = getIncludedSessionDurationMs(currentSessions, start, end);
            const targetMs = getIncludedSessionDurationMs(targetSessions, start, end);
            const minOnlineMs = Math.min(currentMs, targetMs);
            result.overlapPercent = minOnlineMs > 0 ? Math.round((overlapMs / minOnlineMs) * 100) : 0;
            if (overlapMs === 0) {
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

    function computeOverlapSessions(sessionsA, sessionsB) {
        const overlapSessions = [];
        let i = 0;
        let j = 0;

        while (i < sessionsA.length && j < sessionsB.length) {
            const a = sessionsA[i];
            const b = sessionsB[j];
            const start = Math.max(a.start, b.start);
            const end = Math.min(a.end, b.end);
            if (start < end) {
                overlapSessions.push({ start, end });
            }
            if (a.end < b.end) {
                i++;
            } else {
                j++;
            }
        }

        return overlapSessions;
    }

    function getIncludedSessionDurationMs(sessions, startHour, endHour) {
        let total = 0;
        for (const session of sessions) {
            let cursor = session.start;
            while (cursor < session.end) {
                const segmentEnd = getNextHourBoundaryMs(cursor, session.end);
                if (!isHourExcluded(cursor, startHour, endHour)) {
                    total += segmentEnd - cursor;
                }
                cursor = segmentEnd;
            }
        }
        return total;
    }

    function getNextHourBoundaryMs(cursor, sessionEnd) {
        const nextHour = new Date(cursor);
        nextHour.setMinutes(0, 0, 0);
        nextHour.setHours(nextHour.getHours() + 1);
        return Math.min(nextHour.getTime(), sessionEnd);
    }

    function isHourExcluded(cursor, startHour, endHour) {
        const hour = new Date(cursor).getHours();
        if (startHour <= endHour) {
            return hour >= startHour && hour < endHour;
        }
        return hour >= startHour || hour < endHour;
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
        const wso = weekStartsOn.value;
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const count = result.grid[day][hour];
                const displayDay = (day - wso + 7) % 7;
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
                inverse: true,
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

    async function loadTopWorlds() {
        const days = selectedPeriod.value === 'all' ? 0 : parseInt(selectedPeriod.value, 10);
        try {
            topWorlds.value = await database.getMyTopWorlds(days, 5);
            void fetchMissingTopWorldThumbnails(topWorlds.value);
        } catch (error) {
            console.error('Error loading top worlds:', error);
            topWorlds.value = [];
        }
    }

    /**
     * @param {Array<{worldId: string}>} worlds
     */
    async function fetchMissingTopWorldThumbnails(worlds) {
        const missingWorldIds = worlds
            .map((world) => world.worldId)
            .filter((worldId) => {
                if (!worldId || pendingWorldThumbnailFetches.has(worldId)) {
                    return false;
                }
                return !worldStore.cachedWorlds.get(worldId)?.thumbnailImageUrl;
            });

        if (missingWorldIds.length === 0) {
            return;
        }

        const fetches = missingWorldIds.map(async (worldId) => {
            pendingWorldThumbnailFetches.add(worldId);
            try {
                await worldRequest.getWorld({ worldId });
            } catch (error) {
                console.error(`Error fetching missing top world thumbnail for ${worldId}:`, error);
            } finally {
                pendingWorldThumbnailFetches.delete(worldId);
            }
        });

        await Promise.allSettled(fetches);
        topWorlds.value = [...topWorlds.value];
    }

    /**
     * @param {string} worldId
     * @returns {string|null}
     */
    function getWorldThumbnail(worldId) {
        const cached = worldStore.cachedWorlds.get(worldId);
        if (!cached?.thumbnailImageUrl) return null;
        return cached.thumbnailImageUrl.replace('256', '128');
    }

    /**
     * @param {string} worldId
     */
    function openWorldDialog(worldId) {
        showWorldDialog(worldId);
    }

    /**
     * @param {number} ms
     * @returns {string}
     */
    function formatWorldTime(ms) {
        if (!ms || ms <= 0) return '0m';
        return timeToText(ms);
    }

    /**
     * @param {number} totalTime
     * @returns {string}
     */
    function getTopWorldBarWidth(totalTime) {
        if (topWorlds.value.length === 0) return '0%';
        const maxTime = topWorlds.value[0].totalTime;
        if (maxTime <= 0) return '0%';
        return `${Math.round((totalTime / maxTime) * 100)}%`;
    }

    defineExpose({ loadOnlineFrequency });
</script>
