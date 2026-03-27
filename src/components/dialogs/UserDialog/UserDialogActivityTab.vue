<template>
    <div class="flex min-w-0 flex-col overflow-x-hidden" style="min-height: 200px">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div style="display: flex; align-items: center">
                <Button
                    class="rounded-full"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="isLoading"
                    :title="t('dialog.user.activity.refresh_hint')"
                    @click="refreshData({ forceRefresh: true })">
                    <Spinner v-if="isLoading" />
                    <RefreshCw v-else />
                </Button>
                <span v-if="filteredEventCount > 0" class="text-accent-foreground ml-1 text-sm">
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
                        <SelectItem value="90">{{ t('dialog.user.activity.period_90') }}</SelectItem>
                        <SelectItem value="30">{{ t('dialog.user.activity.period_30') }}</SelectItem>
                        <SelectItem value="7">{{ t('dialog.user.activity.period_7') }}</SelectItem>
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
            ref="activityChartRef"
            class="min-w-0 overflow-hidden"
            style="width: 100%; height: 240px"
            @contextmenu.prevent="onChartRightClick" />

        <div v-if="hasAnyData && !isSelf" class="mt-4 border-t border-border pt-3">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">{{ t('dialog.user.activity.overlap.header') }}</span>
                    <Spinner v-if="isOverlapLoadingVisible" class="h-3.5 w-3.5" />
                </div>
                <div v-if="hasOverlapData" class="flex items-center gap-1.5 shrink-0">
                    <Switch :model-value="excludeHoursEnabled" class="scale-75" @update:model-value="onExcludeToggle" />
                    <span class="text-sm text-muted-foreground whitespace-nowrap">
                        {{ t('dialog.user.activity.overlap.exclude_hours') }}
                    </span>
                    <Select v-model="excludeStartHour" @update:model-value="onExcludeRangeChange">
                        <SelectTrigger size="sm" class="w-[78px] h-6 text-sm px-2" @click.stop>
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
                        <SelectTrigger size="sm" class="w-[78px] h-6 text-sm px-2" @click.stop>
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

            <div v-if="!isOverlapLoadingVisible && hasOverlapData" class="flex flex-col gap-1 mb-2">
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
                v-show="hasOverlapData || isOverlapLoadingVisible"
                ref="overlapChartRef"
                class="min-w-0 overflow-hidden"
                style="width: 100%; height: 240px"
                @contextmenu.prevent="onOverlapChartRightClick" />

            <div v-if="!isOverlapLoading && !hasOverlapData && hasAnyData" class="text-sm text-muted-foreground py-2">
                {{ t('dialog.user.activity.overlap.no_data') }}
            </div>
        </div>

        <div v-if="isSelf && hasAnyData" class="mt-4 border-t border-border pt-3">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">
                        {{ t('dialog.user.activity.most_visited_worlds.header') }}
                    </span>
                    <Spinner v-if="topWorldsLoadingVisible" class="h-3.5 w-3.5" />
                </div>
                <div class="flex items-center gap-4">
                    <div
                        v-if="isSelf && currentHomeWorldId"
                        class="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Switch
                            :model-value="excludeHomeWorldEnabled"
                            class="scale-75"
                            @update:model-value="onExcludeHomeWorldToggle" />
                        <span class="whitespace-nowrap">
                            {{ t('dialog.user.activity.most_visited_worlds.exclude_home_world') }}
                        </span>
                    </div>
                    <div v-if="topWorlds.length > 0" class="flex items-center gap-2">
                        <span class="text-muted-foreground text-sm">{{ t('common.sort_by') }}</span>
                        <Select v-model="topWorldsSortBy" :disabled="topWorldsLoading">
                            <SelectTrigger size="sm" class="w-32" @click.stop>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="time">{{
                                    t('dialog.user.activity.most_visited_worlds.sort_by_time')
                                }}</SelectItem>
                                <SelectItem value="count">{{
                                    t('dialog.user.activity.most_visited_worlds.sort_by_count')
                                }}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <div
                v-if="topWorldsLoadingVisible && topWorlds.length === 0"
                class="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Spinner class="h-4 w-4" />
                <span>{{ t('dialog.user.activity.most_visited_worlds.loading') }}</span>
            </div>
            <div
                v-else-if="topWorlds.length === 0 && !isLoading && !topWorldsLoading"
                class="text-sm text-muted-foreground py-2">
                {{ t('dialog.user.activity.no_data_in_period') }}
            </div>
            <div v-else class="flex flex-col gap-0.5">
                <button
                    v-for="(world, index) in sortedTopWorlds"
                    :key="world.worldId"
                    type="button"
                    class="group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                    :class="index === 0 ? 'bg-primary/4' : ''"
                    @click="openWorld(world.worldId)">
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
                                {{
                                    topWorldsSortBy === 'time'
                                        ? formatWorldTime(world.totalTime)
                                        : t('dialog.user.activity.most_visited_worlds.visit_count_label', {
                                              count: world.visitCount
                                          })
                                }}
                            </span>
                        </div>
                        <div
                            class="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                            :class="isDarkMode ? 'bg-white/8' : 'bg-black/6'">
                            <div
                                class="h-full rounded-full transition-all duration-500"
                                :class="isDarkMode ? 'bg-white/45' : 'bg-black/25'"
                                :style="{
                                    width: getTopWorldBarWidth(
                                        topWorldsSortBy === 'time' ? world.totalTime : world.visitCount
                                    )
                                }" />
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
    import { Image as ImageIcon, RefreshCw, Sprout, Tractor } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import * as echarts from 'echarts';

    import configRepository from '../../../services/config';
    import { worldRequest } from '../../../api';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import { parseLocation, timeToText } from '../../../shared/utils';
    import { useActivityStore, useAppearanceSettingsStore, useUserStore } from '../../../stores';
    import { useWorldStore } from '../../../stores/world';
    import { buildHeatmapOption, toHeatmapSeriesData } from './activity/buildHeatmapOption';

    const { t, locale } = useI18n();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const { isDarkMode, weekStartsOn } = storeToRefs(useAppearanceSettingsStore());
    const activityStore = useActivityStore();
    const worldStore = useWorldStore();

    const isLoading = ref(false);
    const hasAnyData = ref(false);
    const selectedPeriod = ref('30');
    const filteredEventCount = ref(0);
    const peakDayText = ref('');
    const peakTimeText = ref('');
    const isOverlapLoading = ref(false);
    const isOverlapLoadingVisible = ref(false);
    const hasOverlapData = ref(false);
    const overlapPercent = ref(0);
    const bestOverlapTime = ref('');
    const topWorldsLoading = ref(false);
    const topWorldsLoadingVisible = ref(false);
    const topWorlds = ref([]);
    const topWorldsSortBy = ref('time');
    const excludeHomeWorldEnabled = ref(false);
    const excludeHoursEnabled = ref(false);
    const excludeStartHour = ref('1');
    const excludeEndHour = ref('6');
    const mainHeatmapView = ref({
        rawBuckets: [],
        normalizedBuckets: []
    });
    const overlapHeatmapView = ref({
        rawBuckets: [],
        normalizedBuckets: []
    });
    const isRestoringSettings = ref(false);

    let activeRequestId = 0;
    let activeOverlapRequestId = 0;
    let activeTopWorldsRequestId = 0;
    let lastLoadedUserId = '';
    let topWorldsLoadingTimer = null;
    let overlapLoadingTimer = null;
    let overlapRenderTimer = null;
    const pendingWorldThumbnailFetches = new Set();
    const TOP_WORLDS_LOADING_DELAY = 150;
    const OVERLAP_LOADING_DELAY = 120;
    const OVERLAP_RENDER_DELAY = 80;

    const isSelf = computed(() => userDialog.value.id === currentUser.value.id);
    const currentHomeWorldId = computed(() => {
        const homeLocation = currentUser.value.homeLocation;
        if (!homeLocation) {
            return '';
        }
        return parseLocation(homeLocation).worldId || homeLocation;
    });
    const sortedTopWorlds = computed(() => topWorlds.value);
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
        return Array.from({ length: 7 }, (_, index) => dayLabels.value[(start + index) % 7]);
    });
    const hourLabels = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`);
    const ACTIVITY_SELF_PERIOD_KEY = 'VRCX_activitySelfPeriodDays';
    const ACTIVITY_FRIEND_PERIOD_KEY = 'VRCX_activityFriendPeriodDays';
    const ACTIVITY_SELF_TOP_WORLDS_SORT_KEY = 'VRCX_activitySelfTopWorldsSortBy';
    const ACTIVITY_SELF_EXCLUDE_HOME_WORLD_KEY = 'VRCX_activitySelfExcludeHomeWorld';

    async function applySettingsForCurrentContext() {
        isRestoringSettings.value = true;
        const periodKey = isSelf.value ? ACTIVITY_SELF_PERIOD_KEY : ACTIVITY_FRIEND_PERIOD_KEY;
        const [period, sortBy, excludeHomeWorld, overlapExcludeEnabled, overlapExcludeStart, overlapExcludeEnd] =
            await Promise.all([
                configRepository.getString(periodKey, '30'),
                configRepository.getString(ACTIVITY_SELF_TOP_WORLDS_SORT_KEY, 'time'),
                configRepository.getBool(ACTIVITY_SELF_EXCLUDE_HOME_WORLD_KEY, false),
                configRepository.getBool('VRCX_overlapExcludeEnabled', false),
                configRepository.getString('VRCX_overlapExcludeStart', '1'),
                configRepository.getString('VRCX_overlapExcludeEnd', '6')
            ]);
        selectedPeriod.value = ['7', '30', '90'].includes(period) ? period : '30';
        topWorldsSortBy.value = ['time', 'count'].includes(sortBy) ? sortBy : 'time';
        excludeHomeWorldEnabled.value = excludeHomeWorld;
        excludeHoursEnabled.value = overlapExcludeEnabled;
        excludeStartHour.value = String(overlapExcludeStart);
        excludeEndHour.value = String(overlapExcludeEnd);
        await nextTick();
        isRestoringSettings.value = false;
    }

    function resetActivityState() {
        isLoading.value = false;
        hasAnyData.value = false;
        filteredEventCount.value = 0;
        peakDayText.value = '';
        peakTimeText.value = '';
        selectedPeriod.value = '30';
        hasOverlapData.value = false;
        overlapPercent.value = 0;
        bestOverlapTime.value = '';
        topWorldsLoading.value = false;
        topWorldsLoadingVisible.value = false;
        topWorlds.value = [];
        isOverlapLoading.value = false;
        isOverlapLoadingVisible.value = false;
        mainHeatmapView.value = { rawBuckets: [], normalizedBuckets: [] };
        overlapHeatmapView.value = { rawBuckets: [], normalizedBuckets: [] };
        clearOverlapLoadingTimer();
        clearOverlapRenderTimer();
        activeRequestId++;
        activeOverlapRequestId++;
        activeTopWorldsRequestId++;
        lastLoadedUserId = '';
        clearTimeout(topWorldsLoadingTimer);
        topWorldsLoadingTimer = null;
    }

    function clearOverlapLoadingTimer() {
        if (overlapLoadingTimer !== null) {
            clearTimeout(overlapLoadingTimer);
            overlapLoadingTimer = null;
        }
    }

    function clearOverlapRenderTimer() {
        if (overlapRenderTimer !== null) {
            clearTimeout(overlapRenderTimer);
            overlapRenderTimer = null;
        }
    }

    function beginOverlapLoading(requestId) {
        isOverlapLoading.value = true;
        isOverlapLoadingVisible.value = false;
        clearOverlapLoadingTimer();
        overlapLoadingTimer = setTimeout(() => {
            overlapLoadingTimer = null;
            if (requestId === activeOverlapRequestId && isOverlapLoading.value) {
                isOverlapLoadingVisible.value = true;
            }
        }, OVERLAP_LOADING_DELAY);
    }

    function finishOverlapLoading(requestId) {
        if (requestId !== activeOverlapRequestId) {
            return;
        }
        clearOverlapLoadingTimer();
        isOverlapLoading.value = false;
        isOverlapLoadingVisible.value = false;
    }

    function scheduleOverlapChartRender() {
        clearOverlapRenderTimer();
        overlapRenderTimer = setTimeout(() => {
            overlapRenderTimer = null;
            renderOverlapChart();
        }, OVERLAP_RENDER_DELAY);
    }

    function applyOverlapView(overlapView) {
        overlapHeatmapView.value = {
            rawBuckets: overlapView.rawBuckets,
            normalizedBuckets: overlapView.normalizedBuckets
        };
        hasOverlapData.value = overlapView.hasOverlapData;
        overlapPercent.value = overlapView.overlapPercent;
        bestOverlapTime.value = overlapView.bestOverlapTime;
    }

    function scheduleTopWorldsLoading(requestId) {
        clearTimeout(topWorldsLoadingTimer);
        topWorldsLoadingTimer = setTimeout(() => {
            topWorldsLoadingTimer = null;
            if (requestId === activeTopWorldsRequestId) {
                topWorldsLoadingVisible.value = true;
            }
        }, TOP_WORLDS_LOADING_DELAY);
    }

    function finishTopWorldsLoading(requestId) {
        if (requestId !== activeTopWorldsRequestId) {
            return;
        }
        clearTimeout(topWorldsLoadingTimer);
        topWorldsLoadingTimer = null;
        topWorldsLoadingVisible.value = false;
        topWorldsLoading.value = false;
    }

    async function loadTopWorldsSection({ userId, rangeDays, sortBy, period }) {
        const requestId = ++activeTopWorldsRequestId;
        topWorldsLoading.value = true;
        scheduleTopWorldsLoading(requestId);

        try {
            const result = await activityStore.loadTopWorldsView({
                userId,
                rangeDays,
                limit: 5,
                sortBy,
                excludeWorldId: excludeHomeWorldEnabled.value ? currentHomeWorldId.value : ''
            });
            if (
                requestId !== activeTopWorldsRequestId ||
                userDialog.value.id !== userId ||
                topWorldsSortBy.value !== sortBy ||
                selectedPeriod.value !== period
            ) {
                return;
            }

            topWorlds.value = result;
            void fetchMissingTopWorldThumbnails(topWorlds.value);
        } finally {
            finishTopWorldsLoading(requestId);
        }
    }

    async function refreshTopWorldsOnly() {
        const userId = userDialog.value.id;
        if (!isSelf.value || !hasAnyData.value || !userId) {
            return;
        }

        const rangeDays = parseInt(selectedPeriod.value, 10) || 30;
        await loadTopWorldsSection({
            userId,
            rangeDays,
            sortBy: topWorldsSortBy.value,
            period: selectedPeriod.value
        });
    }

    async function refreshData({ silent = false, forceRefresh = false } = {}) {
        const userId = userDialog.value.id;
        if (!userId) {
            return;
        }

        const requestId = ++activeRequestId;
        const overlapRequestId = ++activeOverlapRequestId;
        if (!silent) {
            isLoading.value = true;
        }

        try {
            const rangeDays = parseInt(selectedPeriod.value, 10) || 30;
            const activityView = await activityStore.loadActivityView({
                userId,
                isSelf: isSelf.value,
                rangeDays,
                dayLabels: dayLabels.value,
                forceRefresh
            });
            if (requestId !== activeRequestId || userDialog.value.id !== userId) {
                return;
            }

            hasAnyData.value = activityView.hasAnyData;
            filteredEventCount.value = activityView.filteredEventCount;
            peakDayText.value = activityView.peakDay;
            peakTimeText.value = activityView.peakTime;
            mainHeatmapView.value = {
                rawBuckets: activityView.rawBuckets,
                normalizedBuckets: activityView.normalizedBuckets
            };
            lastLoadedUserId = userId;

            if (!hasAnyData.value) {
                hasOverlapData.value = false;
                topWorlds.value = [];
                topWorldsLoading.value = false;
                return;
            }

            if (isSelf.value) {
                await loadTopWorldsSection({
                    userId,
                    rangeDays,
                    sortBy: topWorldsSortBy.value,
                    period: selectedPeriod.value
                });
                if (requestId !== activeRequestId || userDialog.value.id !== userId) {
                    return;
                }
                hasOverlapData.value = false;
                return;
            }

            beginOverlapLoading(overlapRequestId);
            const overlapView = await activityStore.loadOverlapView({
                currentUserId: currentUser.value.id,
                targetUserId: userId,
                rangeDays,
                dayLabels: dayLabels.value,
                forceRefresh,
                excludeHours: {
                    enabled: excludeHoursEnabled.value,
                    startHour: parseInt(excludeStartHour.value, 10),
                    endHour: parseInt(excludeEndHour.value, 10)
                }
            });
            if (requestId !== activeRequestId || userDialog.value.id !== userId) {
                return;
            }
            applyOverlapView(overlapView);
        } finally {
            if (requestId === activeRequestId) {
                isLoading.value = false;
            }
            finishOverlapLoading(overlapRequestId);
        }
    }

    async function loadForVisibleTab() {
        const userId = userDialog.value.id;
        if (!userId) {
            return;
        }
        if (userId !== lastLoadedUserId) {
            resetActivityState();
            lastLoadedUserId = userId;
        }
        if (hasAnyData.value || isLoading.value) {
            return;
        }
        await refreshData();
    }

    async function onPeriodChange() {
        await configRepository.setString(
            isSelf.value ? ACTIVITY_SELF_PERIOD_KEY : ACTIVITY_FRIEND_PERIOD_KEY,
            selectedPeriod.value
        );
        await refreshData();
    }

    async function refreshOverlapOnly() {
        const userId = userDialog.value.id;
        if (!userId || isSelf.value || !hasAnyData.value) {
            return;
        }

        const requestId = ++activeOverlapRequestId;
        beginOverlapLoading(requestId);

        try {
            const rangeDays = parseInt(selectedPeriod.value, 10) || 30;
            const overlapView = await activityStore.loadOverlapView({
                currentUserId: currentUser.value.id,
                targetUserId: userId,
                rangeDays,
                dayLabels: dayLabels.value,
                forceRefresh: false,
                excludeHours: {
                    enabled: excludeHoursEnabled.value,
                    startHour: parseInt(excludeStartHour.value, 10),
                    endHour: parseInt(excludeEndHour.value, 10)
                }
            });
            if (requestId !== activeOverlapRequestId || userDialog.value.id !== userId) {
                return;
            }
            applyOverlapView(overlapView);
        } finally {
            finishOverlapLoading(requestId);
        }
    }

    async function onExcludeToggle(value) {
        excludeHoursEnabled.value = value;
        await configRepository.setBool('VRCX_overlapExcludeEnabled', value);
        await refreshOverlapOnly();
    }

    async function onExcludeRangeChange() {
        await configRepository.setString('VRCX_overlapExcludeStart', excludeStartHour.value);
        await configRepository.setString('VRCX_overlapExcludeEnd', excludeEndHour.value);
        await refreshOverlapOnly();
    }

    async function onExcludeHomeWorldToggle(value) {
        excludeHomeWorldEnabled.value = value;
        await configRepository.setBool(ACTIVITY_SELF_EXCLUDE_HOME_WORLD_KEY, value);
        await refreshTopWorldsOnly();
    }

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
            } finally {
                pendingWorldThumbnailFetches.delete(worldId);
            }
        });

        await Promise.allSettled(fetches);
        topWorlds.value = [...topWorlds.value];
    }

    function getWorldThumbnail(worldId) {
        const cached = worldStore.cachedWorlds.get(worldId);
        if (!cached?.thumbnailImageUrl) {
            return null;
        }
        return cached.thumbnailImageUrl.replace('256', '128');
    }

    function openWorld(worldId) {
        showWorldDialog(worldId);
    }

    function formatWorldTime(ms) {
        if (!ms || ms <= 0) {
            return '0m';
        }
        return timeToText(ms);
    }

    function getTopWorldBarWidth(value) {
        if (sortedTopWorlds.value.length === 0) {
            return '0%';
        }
        const key = topWorldsSortBy.value === 'count' ? 'visitCount' : 'totalTime';
        const maxVal = Math.max(...sortedTopWorlds.value.map((world) => world[key] || 0), 0);
        if (maxVal <= 0) {
            return '0%';
        }
        return `${Math.max((value / maxVal) * 100, 8)}%`;
    }

    const activityChartRef = ref(null);
    const overlapChartRef = ref(null);
    let activityChart = null;
    let overlapChart = null;
    let activityResizeObserver = null;
    let overlapResizeObserver = null;
    let easterEggTimer = null;

    function ensureActivityChart() {
        if (!activityChart && activityChartRef.value) {
            activityChart = echarts.init(activityChartRef.value, isDarkMode.value ? 'dark' : null, { height: 240 });
            activityResizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    activityChart?.resize({ width: entry.contentRect.width });
                }
            });
            activityResizeObserver.observe(activityChartRef.value);
        }
    }

    function ensureOverlapChart() {
        if (!overlapChart && overlapChartRef.value) {
            overlapChart = echarts.init(overlapChartRef.value, isDarkMode.value ? 'dark' : null, { height: 240 });
            overlapResizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    overlapChart?.resize({ width: entry.contentRect.width });
                }
            });
            overlapResizeObserver.observe(overlapChartRef.value);
        }
    }

    function disposeCharts() {
        activityResizeObserver?.disconnect();
        overlapResizeObserver?.disconnect();
        activityResizeObserver = null;
        overlapResizeObserver = null;
        activityChart?.dispose();
        overlapChart?.dispose();
        activityChart = null;
        overlapChart = null;
    }

    function renderActivityChart() {
        if (mainHeatmapView.value.normalizedBuckets.length === 0 || filteredEventCount.value === 0) {
            activityChart?.clear();
            return;
        }
        ensureActivityChart();
        if (!activityChart) return;

        activityChart.setOption(
            buildHeatmapOption({
                data: toHeatmapSeriesData(mainHeatmapView.value.normalizedBuckets, weekStartsOn.value),
                rawBuckets: mainHeatmapView.value.rawBuckets,
                dayLabels: displayDayLabels.value,
                hourLabels,
                weekStartsOn: weekStartsOn.value,
                isDarkMode: isDarkMode.value,
                emptyColor: isDarkMode.value ? 'hsl(220, 15%, 12%)' : 'hsl(210, 30%, 95%)',
                scaleColors: isDarkMode.value
                    ? [
                          'hsl(160, 40%, 24%)',
                          'hsl(150, 48%, 32%)',
                          'hsl(142, 55%, 38%)',
                          'hsl(142, 65%, 46%)',
                          'hsl(142, 80%, 55%)'
                      ]
                    : [
                          'hsl(160, 40%, 82%)',
                          'hsl(155, 45%, 68%)',
                          'hsl(142, 55%, 55%)',
                          'hsl(142, 65%, 40%)',
                          'hsl(142, 76%, 30%)'
                      ],
                unitLabel: t('dialog.user.activity.minutes_online')
            }),
            { replaceMerge: ['series'] }
        );
    }

    function renderOverlapChart() {
        if (!hasOverlapData.value || overlapHeatmapView.value.normalizedBuckets.length === 0) {
            if (!isOverlapLoading.value) {
                overlapChart?.clear();
            }
            return;
        }
        ensureOverlapChart();
        if (!overlapChart) return;

        overlapChart.setOption(
            buildHeatmapOption({
                data: toHeatmapSeriesData(overlapHeatmapView.value.normalizedBuckets, weekStartsOn.value),
                rawBuckets: overlapHeatmapView.value.rawBuckets,
                dayLabels: displayDayLabels.value,
                hourLabels,
                weekStartsOn: weekStartsOn.value,
                isDarkMode: isDarkMode.value,
                emptyColor: isDarkMode.value ? 'hsl(220, 15%, 12%)' : 'hsl(210, 30%, 95%)',
                scaleColors: isDarkMode.value
                    ? [
                          'hsl(260, 30%, 26%)',
                          'hsl(260, 42%, 36%)',
                          'hsl(260, 50%, 45%)',
                          'hsl(260, 60%, 54%)',
                          'hsl(260, 70%, 62%)'
                      ]
                    : [
                          'hsl(260, 35%, 85%)',
                          'hsl(260, 42%, 70%)',
                          'hsl(260, 48%, 58%)',
                          'hsl(260, 55%, 48%)',
                          'hsl(260, 60%, 38%)'
                      ],
                unitLabel: t('dialog.user.activity.overlap.minutes_overlap')
            }),
            { replaceMerge: ['series'] }
        );
    }

    function rebuildCharts() {
        disposeCharts();
        clearOverlapRenderTimer();
        nextTick(() => {
            renderActivityChart();
            renderOverlapChart();
        });
    }

    function onChartRightClick() {
        toast(t('dialog.user.activity.chart_hint'), { position: 'bottom-center', icon: h(Tractor) });
        clearTimeout(easterEggTimer);
        easterEggTimer = setTimeout(() => {
            easterEggTimer = null;
        }, 5000);
    }

    function onOverlapChartRightClick() {
        if (easterEggTimer) {
            toast(t('dialog.user.activity.chart_hint_reply'), { position: 'bottom-center', icon: h(Sprout) });
        }
    }

    function loadOnlineFrequency(userId) {
        if (!userId || userDialog.value.id !== userId) {
            return;
        }
        void loadForVisibleTab();
    }

    watch(
        () => userDialog.value.id,
        async () => {
            resetActivityState();
            rebuildCharts();
            await applySettingsForCurrentContext();
            if (userDialog.value.visible && userDialog.value.activeTab === 'Activity') {
                void nextTick(() => loadForVisibleTab());
            }
        }
    );
    watch([locale, isDarkMode, weekStartsOn], rebuildCharts);
    watch(
        () => selectedPeriod.value,
        () => {
            if (isRestoringSettings.value) {
                return;
            }
            if (userDialog.value.visible && userDialog.value.activeTab === 'Activity') {
                void onPeriodChange();
            }
        }
    );
    watch(
        () => topWorldsSortBy.value,
        () => {
            if (isRestoringSettings.value) {
                return;
            }
            void configRepository.setString(ACTIVITY_SELF_TOP_WORLDS_SORT_KEY, topWorldsSortBy.value);
            void refreshTopWorldsOnly();
        }
    );
    watch(
        () => currentUser.value.homeLocation,
        () => {
            if (excludeHomeWorldEnabled.value) {
                void refreshTopWorldsOnly();
            }
        }
    );
    watch(
        () => mainHeatmapView.value,
        () => {
            nextTick(() => renderActivityChart());
        },
        { deep: true }
    );
    watch(
        () => overlapHeatmapView.value,
        () => {
            scheduleOverlapChartRender();
        },
        { deep: true }
    );
    watch(
        () => userDialog.value.visible,
        (visible) => {
            if (!visible) return;
            nextTick(() => {
                activityChart?.resize();
                overlapChart?.resize();
            });
            if (userDialog.value.activeTab === 'Activity') {
                void loadForVisibleTab();
            }
        }
    );
    watch(
        () => userDialog.value.activeTab,
        (activeTab) => {
            if (activeTab === 'Activity' && userDialog.value.visible) {
                void loadForVisibleTab();
            }
        }
    );

    onMounted(async () => {
        await applySettingsForCurrentContext();
        if (userDialog.value.visible && userDialog.value.activeTab === 'Activity') {
            await loadForVisibleTab();
        }
    });

    onBeforeUnmount(() => {
        clearTimeout(easterEggTimer);
        clearTimeout(topWorldsLoadingTimer);
        clearOverlapLoadingTimer();
        clearOverlapRenderTimer();
        disposeCharts();
    });

    defineExpose({
        loadOnlineFrequency
    });
</script>
