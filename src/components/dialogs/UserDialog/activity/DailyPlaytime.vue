<template>
    <div v-if="hasData" class="mt-4 border-t border-border pt-3">
        <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium">
                {{ t('view.charts.playtime_trend.header') }}
            </span>
            <div v-if="dailySummary.length > 0" class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                    {{ t('view.charts.playtime_trend.daily_avg') }}:
                    <strong class="text-foreground">{{ formatHours(avgDailyMs) }}</strong>
                </span>
            </div>
        </div>
        <div ref="chartRef" style="width: 100%; height: 200px" />
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import * as echarts from 'echarts';

    import { useAppearanceSettingsStore } from '@/stores';

    const props = defineProps({
        sessions: { type: Array, default: () => [] },
        rangeDays: { type: Number, default: 30 }
    });

    const { t } = useI18n();
    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());

    const chartRef = ref(null);
    const dailySummary = ref([]);

    const hasData = computed(() => dailySummary.value.length > 0);

    const totalMs = computed(() => dailySummary.value.reduce((sum, d) => sum + d.totalMs, 0));

    const avgDailyMs = computed(() => {
        if (dailySummary.value.length === 0) return 0;
        return totalMs.value / dailySummary.value.length;
    });

    function formatHours(ms) {
        const hours = ms / 3600000;
        if (hours < 1) {
            return `${Math.round(ms / 60000)}m`;
        }
        return `${hours.toFixed(1)}h`;
    }

    let echartsInstance = null;
    let resizeObserver = null;

    onMounted(() => {
        buildSummary();
    });

    onBeforeUnmount(() => {
        disposeChart();
    });

    watch(
        () => [props.sessions, props.rangeDays],
        () => {
            buildSummary();
        }
    );

    watch(isDarkMode, () => {
        disposeChart();
        if (dailySummary.value.length > 0) {
            initChart();
        }
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

    function buildSummary() {
        disposeChart();
        const sessions = props.sessions;
        if (!sessions || sessions.length === 0) {
            dailySummary.value = [];
            return;
        }

        const now = Date.now();
        const rangeDays = props.rangeDays;
        const rangeStart = rangeDays > 0 ? now - rangeDays * 86400000 : sessions[0].start;

        const dayMap = new Map();
        const ONE_DAY_MS = 86400000;

        for (const session of sessions) {
            if (session.end <= rangeStart || session.start >= now) continue;
            const clippedStart = Math.max(session.start, rangeStart);
            const clippedEnd = Math.min(session.end, now);

            let cursor = clippedStart;
            while (cursor < clippedEnd) {
                const dayStart = new Date(cursor);
                dayStart.setHours(0, 0, 0, 0);
                const dayKey = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`;
                const nextDayStart = dayStart.getTime() + ONE_DAY_MS;
                const segmentEnd = Math.min(clippedEnd, nextDayStart);
                dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + (segmentEnd - cursor));
                cursor = nextDayStart;
            }
        }

        const result = [];
        for (const [date, totalMs] of dayMap) {
            result.push({ date, totalMs });
        }
        result.sort((a, b) => a.date.localeCompare(b.date));
        dailySummary.value = result;

        if (result.length > 0) {
            requestAnimationFrame(() => initChart());
        }
    }

    function initChart() {
        const chartDom = chartRef.value;
        if (!chartDom) return;

        if (!echartsInstance) {
            echartsInstance = echarts.init(chartDom, isDarkMode.value ? 'dark' : null);
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    echartsInstance?.resize({
                        width: entry.contentRect.width,
                        animation: { duration: 300 }
                    });
                }
            });
            resizeObserver.observe(chartDom);
        }

        const dates = dailySummary.value.map((d) => d.date);
        const hours = dailySummary.value.map((d) => +(d.totalMs / 3600000).toFixed(2));

        const option = {
            tooltip: {
                trigger: 'axis',
                formatter(params) {
                    const p = params[0];
                    const h = p.value;
                    const hrs = Math.floor(h);
                    const mins = Math.round((h - hrs) * 60);
                    return `<strong>${p.axisValue}</strong><br/>${hrs}h ${mins}m`;
                }
            },
            grid: {
                top: 20,
                left: 45,
                right: 15,
                bottom: dates.length > 60 ? 55 : 25
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLabel: {
                    rotate: 0,
                    hideOverlap: true,
                    fontSize: 10
                },
                boundaryGap: false
            },
            yAxis: {
                type: 'value',
                max: 24,
                interval: 6,
                axisLabel: {
                    formatter: (v) => `${v}h`,
                    fontSize: 10
                },
                splitLine: {
                    lineStyle: { type: 'dashed' }
                }
            },
            dataZoom:
                dates.length > 60
                    ? [
                          {
                              type: 'slider',
                              start: 0,
                              end: 100,
                              height: 20,
                              bottom: 5
                          },
                          {
                              type: 'inside',
                              start: 0,
                              end: 100
                          }
                      ]
                    : undefined,
            series: [
                {
                    name: 'Playtime',
                    type: 'line',
                    data: hours,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { width: 2 },
                    areaStyle: { opacity: 0.3 },
                    emphasis: { focus: 'series' }
                }
            ],
            backgroundColor: 'transparent'
        };

        echartsInstance.setOption(option, { notMerge: true });
    }
</script>
