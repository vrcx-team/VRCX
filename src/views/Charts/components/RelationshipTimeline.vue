<template>
    <div id="chart" class="x-container">
        <div ref="containerRef" class="pt-4">
            <BackToTop :target="containerRef" :right="30" :bottom="30" :teleport="false" />

            <!-- Header bar -->
            <div class="options-container mt-0 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <span class="shrink-0">{{ t('view.charts.relationship_timeline.header') }}</span>
                    <HoverCard>
                        <HoverCardTrigger as-child>
                            <Info class="ml-1 size-4 cursor-pointer opacity-60 hover:opacity-100" />
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" align="start" class="w-80">
                            <div class="text-xs">
                                {{ t('view.charts.relationship_timeline.tips.description') }}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>

                <!-- Controls: friend count + refresh -->
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-muted-foreground">
                            {{ t('view.charts.relationship_timeline.top_n_friends', { n: friendCount }) }}
                        </span>
                        <input
                            type="range"
                            v-model.number="friendCount"
                            min="1"
                            max="10"
                            step="1"
                            class="w-24 accent-primary"
                            @change="rebuildChart" />
                    </div>
                    <TooltipWrapper :content="t('view.charts.relationship_timeline.refresh')" side="top">
                        <Button
                            size="icon"
                            variant="ghost"
                            :disabled="isLoading"
                            @click="loadData">
                            <RefreshCcw :class="['size-4', isLoading ? 'animate-spin' : '']" />
                        </Button>
                    </TooltipWrapper>
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

                <!-- Bottom-right scale control (non-linear granularity) -->
                <div class="flex items-center justify-end gap-2 px-4 py-1">
                    <ZoomOut class="size-3.5 shrink-0 text-muted-foreground" />
                    <input
                        type="range"
                        v-model.number="scaleSlider"
                        min="0"
                        max="100"
                        step="1"
                        class="w-28 accent-primary"
                        @input="handleScaleChange" />
                    <ZoomIn class="size-3.5 shrink-0 text-muted-foreground" />
                    <span class="w-20 text-right text-xs text-muted-foreground">
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

    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { Info, RefreshCcw, ZoomIn, ZoomOut } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import * as echarts from 'echarts';

    import BackToTop from '@/components/BackToTop.vue';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
    import TooltipWrapper from '@/components/ui/tooltip/TooltipWrapper.vue';

    import { database } from '../../../services/database';
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

    // ─── Bucket helpers ────────────────────────────────────────────────────────

    /**
     * Convert a YYYY-MM-DD string to epoch days (integer).
     */
    function dateToDays(dateStr) {
        return Math.floor(new Date(dateStr + 'T00:00:00Z').getTime() / 86400000);
    }

    /**
     * Snap an epoch-day value to a bucket number (0-based from the first data day).
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
     * Build ECharts series data from rawRows with the current settings.
     *
     * Algorithm:
     *  1. Group rows into time buckets of `bucketDays` days.
     *  2. Per bucket, sum scores per friend.
     *  3. Compute global total score per friend across all buckets.
     *  4. Take top-N friends; remaining → "Others".
     *  5. Sort top-N by total score (descending) for a stable, non-crossing order.
     *  6. Compute per-bucket percentage share for each slot (100% stacked area).
     */
    function buildChartData() {
        const rows = rawRows.value;
        if (!rows.length) return null;

        // Find the range of days
        const days = rows.map((r) => dateToDays(r.day));
        const firstDay = Math.min(...days);
        const lastDay = Math.max(...days);
        const bDays = bucketDays.value;
        const bucketCount = dayToBucket(lastDay, firstDay, bDays) + 1;

        // Map<userId, Map<bucketIdx, {totalTime, joinCount}>>
        const perFriendBuckets = new Map();
        for (const row of rows) {
            const d = dateToDays(row.day);
            const b = dayToBucket(d, firstDay, bDays);
            if (!perFriendBuckets.has(row.userId)) {
                perFriendBuckets.set(row.userId, { displayName: row.displayName, buckets: new Map() });
            }
            const entry = perFriendBuckets.get(row.userId);
            const prev = entry.buckets.get(b) || { totalTime: 0, joinCount: 0 };
            entry.buckets.set(b, {
                totalTime: prev.totalTime + row.totalTime,
                joinCount: prev.joinCount + row.joinCount
            });
        }

        // Compute global score per friend
        const friendScores = [];
        for (const [userId, entry] of perFriendBuckets.entries()) {
            let total = 0;
            for (const v of entry.buckets.values()) {
                total += relationshipScore(v.totalTime, v.joinCount);
            }
            friendScores.push({ userId, displayName: entry.displayName, totalScore: total });
        }

        // Sort descending by total score
        friendScores.sort((a, b) => b.totalScore - a.totalScore);

        const n = Math.min(friendCount.value, friendScores.length);
        const topFriends = friendScores.slice(0, n);
        const otherFriends = friendScores.slice(n);

        // Build bucket arrays for each slot
        const xLabels = Array.from({ length: bucketCount }, (_, i) =>
            bucketLabel(i, firstDay, bDays)
        );

        // Compute per-bucket score for each top friend + others aggregate
        const slotsData = topFriends.map(({ userId }) => {
            const entry = perFriendBuckets.get(userId);
            return Array.from({ length: bucketCount }, (_, b) => {
                const v = entry?.buckets.get(b);
                return v ? relationshipScore(v.totalTime, v.joinCount) : 0;
            });
        });

        // Others: sum of all other friends' scores per bucket
        const othersData = Array.from({ length: bucketCount }, (_, b) => {
            let sum = 0;
            for (const { userId } of otherFriends) {
                const v = perFriendBuckets.get(userId)?.buckets.get(b);
                if (v) sum += relationshipScore(v.totalTime, v.joinCount);
            }
            return sum;
        });

        const showOthers = otherFriends.length > 0;

        // Normalize to percentages per bucket (100% stacked)
        const totalsPerBucket = Array.from({ length: bucketCount }, (_, b) => {
            let total = 0;
            for (const slot of slotsData) total += slot[b];
            if (showOthers) total += othersData[b];
            return total;
        });

        const toPercent = (val, b) => {
            const total = totalsPerBucket[b];
            if (!total) return 0;
            return parseFloat(((val / total) * 100).toFixed(2));
        };

        const percentSlotsData = slotsData.map((slot) => slot.map((v, b) => toPercent(v, b)));
        const percentOthersData = othersData.map((v, b) => toPercent(v, b));

        // Build series - stable order: others at bottom, then friends (lowest score first = bottom)
        // reversed so highest score friend is on top visually
        const series = [];

        // Others (at the very bottom of the stack)
        if (showOthers) {
            series.push({
                name: t('view.charts.relationship_timeline.others'),
                type: 'line',
                stack: 'total',
                areaStyle: { opacity: 0.85 },
                lineStyle: { width: 0 },
                smooth: true,
                symbol: 'none',
                color: '#aaaaaa',
                emphasis: { focus: 'series' },
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
                areaStyle: { opacity: 0.85 },
                lineStyle: { width: 0 },
                smooth: true,
                symbol: 'none',
                color: COLOR_PALETTE[colorIdx],
                emphasis: { focus: 'series' },
                data: percentSlotsData[i]
            });
        }

        return { xLabels, series, bucketCount };
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
                axisPointer: { type: 'cross' },
                formatter(params) {
                    const header = `<div style="margin-bottom:4px;font-weight:600">${params[0]?.axisValue}</div>`;
                    const rows = params
                        .filter((p) => p.value > 0)
                        .sort((a, b) => b.value - a.value)
                        .map(
                            (p) =>
                                `<div style="display:flex;align-items:center;gap:6px">
                                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
                                    <span>${p.seriesName}</span>
                                    <span style="margin-left:auto;font-weight:600">${p.value.toFixed(1)}%</span>
                                </div>`
                        )
                        .join('');
                    return header + rows;
                }
            },
            legend: {
                top: 0,
                type: 'scroll',
                textStyle: { color: isDark ? '#ccc' : '#333' }
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
                }
            },
            yAxis: {
                type: 'value',
                max: 100,
                axisLabel: {
                    formatter: '{value}%',
                    color: isDark ? '#bbb' : '#555'
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
        try {
            rawRows.value = await database.getRelationshipTimelineData();
        } catch (err) {
            console.error('[RelationshipTimeline] Failed to load data', err);
            rawRows.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    // ─── Scale change handler ─────────────────────────────────────────────────
    function handleScaleChange() {
        rebuildChart();
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
            // Wait for DOM update then init chart
            setTimeout(initChart, 0);
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
