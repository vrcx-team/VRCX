<template>
    <div id="chart" class="x-container">
        <div ref="containerRef" class="pt-4">
            <BackToTop :target="containerRef" :right="30" :bottom="30" :teleport="false" />

            <!-- Header bar (consistent with InstanceActivity) -->
            <div class="options-container mt-0 flex items-center justify-between">
                <div class="flex items-center gap-2 mb-4">
                    <span class="shrink-0">{{ t('view.charts.relationship_timeline.header') }}</span>
                    <HoverCard>
                        <HoverCardTrigger as-child>
                            <Info class="ml-1 text-xs opacity-70" />
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" align="start" class="w-80">
                            <div class="text-xs">
                                {{ t('view.charts.relationship_timeline.tips.description') }}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>

                <div class="flex items-center gap-2">
                    <!-- Refresh button -->
                    <TooltipWrapper :content="t('view.charts.relationship_timeline.refresh')" side="top">
                        <Button
                            class="rounded-full mr-1.5"
                            size="icon"
                            variant="ghost"
                            :disabled="isLoading"
                            @click="loadData">
                            <RefreshCcw :class="['size-4', isLoading ? 'animate-spin' : '']" />
                        </Button>
                    </TooltipWrapper>

                    <!-- Settings popover -->
                    <Popover>
                        <PopoverTrigger as-child>
                            <div>
                                <TooltipWrapper
                                    :content="t('view.charts.relationship_timeline.settings.header')"
                                    side="top">
                                    <Button class="rounded-full mr-1.5" size="icon" variant="ghost">
                                        <Settings />
                                    </Button>
                                </TooltipWrapper>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="end" class="w-64">
                            <div class="flex flex-col gap-1">
                                <!-- Top-N friends slider -->
                                <div class="flex items-center justify-between px-0.5 h-[30px]">
                                    <span class="shrink-0 text-sm">
                                        {{ t('view.charts.relationship_timeline.settings.top_friends') }}
                                    </span>
                                    <div class="flex items-center gap-2 ml-3">
                                        <Slider
                                            v-model="friendCountModel"
                                            :max="10"
                                            :min="1"
                                            :step="1"
                                            class="w-24"
                                            @valueCommit="debouncedRebuildChart" />
                                        <span class="w-4 text-right text-xs tabular-nums text-muted-foreground">
                                            {{ friendCount }}
                                        </span>
                                    </div>
                                </div>
                                <!-- Show others toggle -->
                                <div class="flex items-center justify-between px-0.5 h-[30px]">
                                    <span class="shrink-0 text-sm">
                                        {{ t('view.charts.relationship_timeline.settings.show_others') }}
                                    </span>
                                    <Switch
                                        v-model="showOthers"
                                        @update:modelValue="debouncedRebuildChart" />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="mt-[100px] flex items-center justify-center">
                <RefreshCcw class="size-6 animate-spin text-muted-foreground" />
            </div>

            <!-- No data -->
            <div
                v-else-if="!hasData"
                class="mt-[100px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <DataTableEmpty type="nodata" />
            </div>

            <!-- Chart area -->
            <div v-else class="relative mt-2">
                <!-- ECharts canvas -->
                <div ref="chartDomRef" class="w-full" :style="{ height: chartHeight + 'px' }"></div>

                <!-- Bottom-right: non-linear granularity scale control -->
                <div class="flex items-center justify-end gap-2 px-4 py-1">
                    <ZoomOut class="size-3.5 shrink-0 text-muted-foreground" />
                    <input
                        type="range"
                        v-model.number="scaleSlider"
                        min="0"
                        max="100"
                        step="1"
                        class="w-28 accent-primary"
                        @change="debouncedRebuildChart" />
                    <ZoomIn class="size-3.5 shrink-0 text-muted-foreground" />
                    <span class="w-20 text-right text-xs tabular-nums text-muted-foreground">
                        {{ bucketDays }}
                        {{ t('view.charts.relationship_timeline.days_per_unit') }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    defineOptions({ name: 'ChartsRelationshipTimeline' });

    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { Info, RefreshCcw, Settings, ZoomIn, ZoomOut } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import * as echarts from 'echarts';

    import BackToTop from '@/components/BackToTop.vue';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Slider } from '@/components/ui/slider';
    import { Switch } from '@/components/ui/switch';
    import TooltipWrapper from '@/components/ui/tooltip/TooltipWrapper.vue';

    import { database } from '../../../services/database';
    import { debounce } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useFriendStore } from '../../../stores';

    // ─── i18n ──────────────────────────────────────────────────────────────────
    const { t } = useI18n();

    // ─── Stores ────────────────────────────────────────────────────────────────
    const appearanceStore = useAppearanceSettingsStore();
    const { isDarkMode } = storeToRefs(appearanceStore);
    const friendStore = useFriendStore();
    const { friends } = storeToRefs(friendStore);

    // ─── Refs ──────────────────────────────────────────────────────────────────
    const containerRef = ref(null);
    const chartDomRef = ref(null);
    const isLoading = ref(false);
    /** Raw per-friend per-day rows from the database */
    const rawRows = ref([]);

    // ─── Settings ──────────────────────────────────────────────────────────────
    /** Number of top friends to show (rest go into "Others") */
    const friendCount = ref(5);
    /** Slider model: Reka UI Slider uses an array */
    const friendCountModel = computed({
        get: () => [friendCount.value],
        set: (v) => { friendCount.value = v[0]; }
    });
    /** Whether to include the "Others" band in the chart */
    const showOthers = ref(true);
    /**
     * Non-linear scale slider (0-100).
     * Mapped to bucketDays = round(90 ^ (slider/100)).
     * - 0  →  1 day/bucket
     * - 50 →  ~9 days/bucket
     * - 100 → 90 days/bucket
     */
    const scaleSlider = ref(0);
    const bucketDays = computed(() =>
        Math.max(1, Math.round(Math.pow(90, scaleSlider.value / 100)))
    );

    // ─── Derived ───────────────────────────────────────────────────────────────
    const hasData = computed(() => rawRows.value.length > 0);
    const chartHeight = computed(() => Math.max(320, (window.innerHeight || 768) - 220));

    // ─── Color palette (consistent with MutualFriends) ─────────────────────────
    const COLOR_PALETTE = [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc',
        '#17c0ac'
    ];

    // ─── Friend display-name lookup ────────────────────────────────────────────
    function getFriendDisplayName(userId, fallbackName) {
        const friend = friends.value?.get(userId);
        return friend?.displayName || fallbackName || userId;
    }

    // ─── Performance: pre-process rawRows into per-friend per-day structure ────
    /**
     * Map<userId, { displayName: string, days: Map<epochDay, { totalTime: number, joinCount: number }> }>
     * Re-computed only when rawRows changes (not on every slider move).
     */
    const perFriendDays = ref(new Map());

    watch(
        rawRows,
        (rows) => {
            const map = new Map();
            for (const row of rows) {
                // Parse date string to epoch day (integer) once here, not on every rebuild
                const epochDay = Math.floor(
                    new Date(row.day + 'T00:00:00Z').getTime() / 86400000
                );
                let entry = map.get(row.userId);
                if (!entry) {
                    entry = { displayName: row.displayName, days: new Map() };
                    map.set(row.userId, entry);
                }
                const prev = entry.days.get(epochDay) || { totalTime: 0, joinCount: 0 };
                entry.days.set(epochDay, {
                    totalTime: prev.totalTime + row.totalTime,
                    joinCount: prev.joinCount + row.joinCount
                });
            }
            perFriendDays.value = map;
        },
        { immediate: true }
    );

    // ─── Bucket helpers ────────────────────────────────────────────────────────

    /**
     * Snap an epoch-day value to a bucket index (0-based from firstDay).
     */
    function dayToBucket(day, firstDay, bDays) {
        return Math.floor((day - firstDay) / bDays);
    }

    /**
     * Convert a bucket index back to a human-readable label.
     */
    function bucketLabel(bucketIdx, firstDay, bDays) {
        const startDay = firstDay + bucketIdx * bDays;
        const endDay = startDay + bDays - 1;
        const start = new Date(startDay * 86400000).toISOString().slice(0, 10);
        if (bDays === 1) return start;
        const end = new Date(endDay * 86400000).toISOString().slice(0, 10);
        return `${start}~${end}`;
    }

    // ─── Chart data computation ────────────────────────────────────────────────

    /**
     * Compute relationship score for a single friend in one bucket.
     * Score = totalTime (ms) + joinCount × 60 000 ms bonus.
     * The 60 000 ms bonus treats each unique shared instance as equivalent to
     * one extra minute of co-presence time, rewarding frequency of encounters
     * alongside raw time spent together.
     */
    function relationshipScore(totalTime, joinCount) {
        return totalTime + joinCount * 60000;
    }

    /**
     * Build ECharts series data from the pre-processed perFriendDays cache.
     *
     * Algorithm:
     *  1. Aggregate per-day data into time buckets of `bucketDays` days.
     *  2. Compute global total score per friend across all buckets.
     *  3. Take top-N friends; remaining → "Others" (if showOthers is true).
     *  4. Sort top-N by total score (descending) for a stable, non-crossing order.
     *  5. Compute per-bucket percentage share for each slot (100% stacked area).
     */
    function buildChartData() {
        const friendDaysMap = perFriendDays.value;
        if (!friendDaysMap.size) return null;

        const bDays = bucketDays.value;

        // Collect all epoch days to find the data range
        let firstDay = Infinity;
        let lastDay = -Infinity;
        for (const entry of friendDaysMap.values()) {
            for (const d of entry.days.keys()) {
                if (d < firstDay) firstDay = d;
                if (d > lastDay) lastDay = d;
            }
        }
        if (!isFinite(firstDay)) return null;

        const bucketCount = dayToBucket(lastDay, firstDay, bDays) + 1;

        // Aggregate per-friend per-day data into buckets
        // Map<userId, { displayName, buckets: Map<bucketIdx, {totalTime, joinCount}> }>
        const perFriendBuckets = new Map();
        for (const [userId, entry] of friendDaysMap.entries()) {
            const bucketMap = new Map();
            for (const [d, val] of entry.days.entries()) {
                const b = dayToBucket(d, firstDay, bDays);
                const prev = bucketMap.get(b) || { totalTime: 0, joinCount: 0 };
                bucketMap.set(b, {
                    totalTime: prev.totalTime + val.totalTime,
                    joinCount: prev.joinCount + val.joinCount
                });
            }
            perFriendBuckets.set(userId, { displayName: entry.displayName, buckets: bucketMap });
        }

        // Compute global score per friend (sum across all buckets)
        const friendScores = [];
        for (const [userId, entry] of perFriendBuckets.entries()) {
            let total = 0;
            for (const v of entry.buckets.values()) {
                total += relationshipScore(v.totalTime, v.joinCount);
            }
            friendScores.push({ userId, displayName: entry.displayName, totalScore: total });
        }

        // Sort descending by total score (stable ordering = minimize crossings)
        friendScores.sort((a, b) => b.totalScore - a.totalScore);

        const n = Math.min(friendCount.value, friendScores.length);
        const topFriends = friendScores.slice(0, n);
        const otherFriends = friendScores.slice(n);

        // x-axis labels
        const xLabels = Array.from({ length: bucketCount }, (_, i) =>
            bucketLabel(i, firstDay, bDays)
        );

        // Per-bucket score arrays for top friends
        const slotsData = topFriends.map(({ userId }) => {
            const entry = perFriendBuckets.get(userId);
            return Array.from({ length: bucketCount }, (_, b) => {
                const v = entry?.buckets.get(b);
                return v ? relationshipScore(v.totalTime, v.joinCount) : 0;
            });
        });

        // Others: sum of all remaining friends' scores per bucket
        const othersData = Array.from({ length: bucketCount }, (_, b) => {
            let sum = 0;
            for (const { userId } of otherFriends) {
                const v = perFriendBuckets.get(userId)?.buckets.get(b);
                if (v) sum += relationshipScore(v.totalTime, v.joinCount);
            }
            return sum;
        });

        const includeOthers = showOthers.value && otherFriends.length > 0;

        // Normalize to percentages per bucket
        const totalsPerBucket = Array.from({ length: bucketCount }, (_, b) => {
            let total = 0;
            for (const slot of slotsData) total += slot[b];
            if (includeOthers) total += othersData[b];
            return total;
        });

        const toPercent = (val, b) => {
            const total = totalsPerBucket[b];
            if (!total) return 0;
            return parseFloat(((val / total) * 100).toFixed(2));
        };

        const percentSlotsData = slotsData.map((slot) => slot.map((v, b) => toPercent(v, b)));
        const percentOthersData = othersData.map((v, b) => toPercent(v, b));

        // Build series — stable order: others at bottom, friends ordered lowest→highest score
        // (reversed so the highest-ranked friend ends up on top visually)
        const series = [];

        // Others band at the very bottom
        if (includeOthers) {
            series.push({
                name: t('view.charts.relationship_timeline.others'),
                type: 'line',
                stack: 'total',
                areaStyle: { opacity: 0.7 },
                lineStyle: { width: 0 },
                smooth: true,
                symbol: 'none',
                color: '#aaaaaa',
                emphasis: {
                    focus: 'series',
                    areaStyle: { opacity: 0.95 }
                },
                blur: { areaStyle: { opacity: 0.3 } },
                data: percentOthersData
            });
        }

        // Friends from lowest to highest score (stack bottom to top)
        for (let i = topFriends.length - 1; i >= 0; i--) {
            const friend = topFriends[i];
            const colorIdx = i % COLOR_PALETTE.length;
            const displayName = getFriendDisplayName(friend.userId, friend.displayName);
            series.push({
                name: displayName,
                type: 'line',
                stack: 'total',
                areaStyle: { opacity: 0.7 },
                lineStyle: { width: 0 },
                smooth: true,
                symbol: 'none',
                color: COLOR_PALETTE[colorIdx],
                emphasis: {
                    focus: 'series',
                    areaStyle: { opacity: 0.95 }
                },
                blur: { areaStyle: { opacity: 0.3 } },
                data: percentSlotsData[i]
            });
        }

        return { xLabels, series };
    }

    // ─── ECharts instance management ──────────────────────────────────────────
    let echartsInstance = null;
    let resizeObserver = null;

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

    function buildEChartsOption(chartData) {
        const { xLabels, series } = chartData;
        const isDark = isDarkMode.value;

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'line',
                    lineStyle: { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }
                },
                formatter(params) {
                    const header = `<div style="margin-bottom:6px;font-weight:600;font-size:12px">${params[0]?.axisValue}</div>`;
                    // Sort descending by value, skip zero entries
                    const items = params
                        .filter((p) => p.value > 0)
                        .sort((a, b) => b.value - a.value);
                    if (!items.length) return '';
                    const rows = items
                        .map(
                            (p) =>
                                `<div style="display:flex;align-items:center;gap:6px;padding:1px 0">` +
                                `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};flex-shrink:0"></span>` +
                                `<span style="flex:1;font-size:12px">${p.seriesName}</span>` +
                                `<span style="font-size:12px;font-weight:600;tabular-nums">${p.value.toFixed(1)}%</span>` +
                                `</div>`
                        )
                        .join('');
                    return header + rows;
                }
            },
            legend: {
                top: 0,
                type: 'scroll',
                textStyle: { color: isDark ? '#ccc' : '#333', fontSize: 11 }
            },
            grid: {
                left: '3%',
                right: '2%',
                top: 40,
                bottom: 80,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: xLabels,
                boundaryGap: false,
                axisLabel: {
                    rotate: 30,
                    fontSize: 10,
                    color: isDark ? '#bbb' : '#555'
                },
                axisLine: { lineStyle: { color: isDark ? '#444' : '#ddd' } }
            },
            yAxis: {
                type: 'value',
                max: 100,
                axisLabel: {
                    formatter: '{value}%',
                    color: isDark ? '#bbb' : '#555',
                    fontSize: 11
                },
                splitLine: {
                    lineStyle: { color: isDark ? '#333' : '#eee' }
                }
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    bottom: 5,
                    height: 20,
                    borderColor: 'transparent',
                    fillerColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    handleStyle: { color: isDark ? '#888' : '#aaa' }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0]
                }
            ],
            series
        };
    }

    function rebuildChart() {
        if (!echartsInstance || !hasData.value) return;
        const chartData = buildChartData();
        if (!chartData) return;
        echartsInstance.setOption(buildEChartsOption(chartData), { notMerge: true });
    }

    /**
     * Debounced version of rebuildChart — waits 1 second after the last
     * settings change before performing the potentially expensive rebuild.
     */
    const debouncedRebuildChart = debounce(rebuildChart, 1000);

    function initChart() {
        if (!chartDomRef.value) return;
        disposeChart();

        echartsInstance = echarts.init(
            chartDomRef.value,
            isDarkMode.value ? 'dark' : null,
            { renderer: 'canvas' }
        );

        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                echartsInstance?.resize({ width: entry.contentRect.width });
            }
        });
        resizeObserver.observe(chartDomRef.value);

        const chartData = buildChartData();
        if (chartData) {
            echartsInstance.setOption(buildEChartsOption(chartData), { notMerge: true });
        }
    }

    // ─── Data loading ─────────────────────────────────────────────────────────
    async function loadData() {
        isLoading.value = true;
        rawRows.value = [];
        try {
            rawRows.value = await database.getRelationshipTimelineData();
        } catch (err) {
            console.error('[RelationshipTimeline] Failed to load data', err);
        } finally {
            isLoading.value = false;
        }
    }

    // ─── Watchers ─────────────────────────────────────────────────────────────
    watch(isDarkMode, () => {
        if (echartsInstance) {
            disposeChart();
            initChart();
        }
    });

    watch(hasData, (val) => {
        if (val) {
            // Use nextTick so Vue renders the chart DOM before initializing
            nextTick(() => initChart());
        }
    });

    // ─── Lifecycle ────────────────────────────────────────────────────────────
    onMounted(() => {
        loadData();
    });

    onBeforeUnmount(() => {
        disposeChart();
    });
</script>
