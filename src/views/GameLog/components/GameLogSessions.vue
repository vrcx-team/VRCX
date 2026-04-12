<template>
    <div class="flex h-full flex-col overflow-hidden">
        <div class="flex shrink-0 items-center gap-2 border-b border-border px-0 pb-4">
            <div class="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap">
                <slot name="leading" />

                <TooltipWrapper side="bottom" :content="t('view.feed.favorites_only_tooltip')">
                    <div class="shrink-0">
                        <Toggle
                            variant="outline"
                            size="sm"
                            :model-value="sessionsVipFilter"
                            @update:modelValue="gameLogStore.toggleSessionsVipFilter()">
                            <Star />
                        </Toggle>
                    </div>
                </TooltipWrapper>

                <Popover v-model:open="datePopoverOpen">
                    <PopoverTrigger as-child>
                        <Button
                            variant="outline"
                            size="sm"
                            class="h-8 shrink-0 gap-1.5"
                            :class="hasDateFilter && 'bg-accent text-accent-foreground'">
                            <CalendarRange class="size-4" />
                            <Badge
                                v-if="hasDateFilter"
                                variant="secondary"
                                class="ml-0.5 h-4.5 min-w-4.5 rounded-full px-1 text-xs">
                                1
                            </Badge>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto" side="bottom" align="start">
                        <RangeCalendar
                            v-model="dateRange"
                            :locale="locale"
                            :max-value="todayDate"
                            :maximum-days="sessionsDateRangeMaxDays"
                            :number-of-months="2"
                            :week-starts-on="weekStartsOn"
                            :is-date-unavailable="isDateUnavailable" />
                        <div class="mt-3 flex justify-end gap-2">
                            <Button variant="outline" size="sm" @click="handleClearDateRange">
                                {{ t('common.actions.clear') }}
                            </Button>
                            <Button size="sm" @click="handleApplyDateRange">
                                {{ t('common.actions.confirm') }}
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <ToggleGroup
                    type="multiple"
                    variant="outline"
                    size="sm"
                    :model-value="sessionsEventFilterSelection"
                    @update:model-value="gameLogStore.handleSessionsEventFilterChange"
                    class="shrink-0 justify-start">
                    <ToggleGroupItem value="All">
                        {{ t('view.search.avatar.all') }}
                    </ToggleGroupItem>
                    <ToggleGroupItem v-for="type in sessionsEventFilterTypes" :key="type" :value="type">
                        {{ t(`view.game_log.filters.${type}`) }}
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <InputGroupField
                :model-value="sessionsSearch"
                class="w-60 shrink-0"
                :placeholder="t('view.game_log.search_placeholder')"
                clearable
                @update:modelValue="handleSessionsSearchInput"
                @keyup.enter="gameLogStore.setSessionsSearch(sessionsSearch)"
                @change="gameLogStore.setSessionsSearch(sessionsSearch)" />
        </div>

        <div ref="scrollContainerRef" class="flex-1 overflow-y-auto">
            <div v-if="showInitialSkeleton" class="flex flex-col gap-4 p-4">
                <div v-for="i in 3" :key="i" class="space-y-2">
                    <Skeleton class="h-5 w-48" />
                    <Skeleton class="h-3 w-24" />
                    <div class="space-y-1.5 pl-2">
                        <Skeleton class="h-4 w-full" />
                        <Skeleton class="h-4 w-3/4" />
                        <Skeleton class="h-4 w-5/6" />
                    </div>
                </div>
            </div>

            <div v-else-if="segments.length === 0" class="m-4">
                <DataTableEmpty v-if="!sessionsLoading" type="nodata" />
            </div>

            <template v-else>
                <GameLogSessionsSegment
                    v-for="(segment, idx) in segments"
                    :key="segment.id"
                    :segment="segment"
                    :is-last="idx === segments.length - 1"
                    :is-latest="idx === 0" />

                <div
                    ref="sentinelRef"
                    class="flex items-center justify-center py-4 pb-6 text-[0.8125rem] text-muted-foreground">
                    <template v-if="sessionsLoading">
                        <Spinner class="mr-2" />
                        {{ t('common.load_more') }}...
                    </template>
                    <template v-else-if="!sessionsHasMore">
                        <span>{{ t('common.no_more') }}</span>
                    </template>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { useInfiniteScroll, useIntersectionObserver } from '@vueuse/core';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { fromDate, getLocalTimeZone, today } from '@internationalized/date';
    import dayjs from 'dayjs';
    import { CalendarRange, Star } from 'lucide-vue-next';

    import { Badge } from '../../../components/ui/badge';
    import { Button } from '../../../components/ui/button';
    import DataTableEmpty from '../../../components/ui/data-table/DataTableEmpty.vue';
    import { InputGroupField } from '../../../components/ui/input-group';
    import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
    import { RangeCalendar } from '../../../components/ui/range-calendar';
    import { Skeleton } from '../../../components/ui/skeleton';
    import { Spinner } from '../../../components/ui/spinner';
    import { Toggle } from '../../../components/ui/toggle';
    import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
    import { TooltipWrapper } from '../../../components/ui/tooltip';
    import { useAppearanceSettingsStore, useGameLogStore } from '../../../stores';
    import GameLogSessionsSegment from './GameLogSessionsSegment.vue';

    const { t, locale } = useI18n();

    const gameLogStore = useGameLogStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const {
        sessionsSegments,
        sessionsLoading,
        sessionsHasMore,
        sessionsVipFilter,
        sessionsSearch,
        sessionsDateFrom,
        sessionsDateTo,
        sessionsEventFilterSelection
    } = storeToRefs(gameLogStore);
    const { weekStartsOn } = storeToRefs(appearanceSettingsStore);
    const sessionsEventFilterTypes = gameLogStore.sessionsEventFilterTypes;
    const sessionsDateRangeMaxDays = gameLogStore.sessionsDateRangeMaxDays;

    const segments = computed(() => sessionsSegments.value);
    const hasDateFilter = computed(() => !!sessionsDateFrom.value || !!sessionsDateTo.value);
    const shouldAutoFillSearchResults = computed(
        () => !!String(sessionsSearch.value ?? '').trim() && !hasDateFilter.value
    );

    const scrollContainerRef = ref(null);
    const sentinelRef = ref(null);
    const datePopoverOpen = ref(false);
    const dateRange = ref(undefined);
    const calendarTimeZone = getLocalTimeZone();
    const todayDate = today(calendarTimeZone);
    const searchAutoFillAttempts = ref(0);
    const hasResolvedInitialLoad = ref(false);
    const showInitialSkeleton = computed(
        () => sessionsLoading.value && segments.value.length === 0 && !hasResolvedInitialLoad.value
    );

    function toNativeDate(dateValue) {
        if (!dateValue || typeof dateValue.toDate !== 'function') {
            throw new TypeError('Invalid date value');
        }
        return dateValue.toDate(calendarTimeZone);
    }

    function syncDateRangeFromStore() {
        if (!sessionsDateFrom.value && !sessionsDateTo.value) {
            dateRange.value = undefined;
            return;
        }

        dateRange.value = {
            start: sessionsDateFrom.value ? fromDate(new Date(sessionsDateFrom.value), calendarTimeZone) : null,
            end: sessionsDateTo.value ? fromDate(new Date(sessionsDateTo.value), calendarTimeZone) : null
        };
    }

    function isDateUnavailable(dateValue) {
        try {
            return toNativeDate(dateValue) > new Date();
        } catch {
            return true;
        }
    }

    async function handleApplyDateRange() {
        if (!dateRange.value?.start && !dateRange.value?.end) {
            await gameLogStore.clearSessionsDateRange();
            datePopoverOpen.value = false;
            return;
        }

        const startValue = dateRange.value.start ?? dateRange.value.end;
        const endValue = dateRange.value.end ?? dateRange.value.start;
        const start = toNativeDate(startValue);
        const end = toNativeDate(endValue);
        await gameLogStore.setSessionsDateRange(
            dayjs(start).startOf('day').toISOString(),
            dayjs(end).endOf('day').toISOString()
        );
        datePopoverOpen.value = false;
    }

    async function handleClearDateRange() {
        dateRange.value = undefined;
        await gameLogStore.clearSessionsDateRange();
        datePopoverOpen.value = false;
    }

    function handleSessionsSearchInput(value) {
        sessionsSearch.value = value;
        if (!String(value ?? '').trim()) {
            gameLogStore.setSessionsSearch('');
        }
    }

    watch([sessionsDateFrom, sessionsDateTo], () => {
        syncDateRangeFromStore();
    });

    watch([sessionsSearch, sessionsDateFrom, sessionsDateTo], () => {
        searchAutoFillAttempts.value = 0;
    });

    watch(
        sessionsLoading,
        (value) => {
            if (!value) {
                hasResolvedInitialLoad.value = true;
            }
        },
        { immediate: true }
    );

    syncDateRangeFromStore();

    useIntersectionObserver(
        sentinelRef,
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting && !sessionsLoading.value && sessionsHasMore.value) {
                    gameLogStore.loadMoreSessionsSegments();
                }
            }
        },
        { root: scrollContainerRef, rootMargin: '200px' }
    );

    useInfiniteScroll(
        scrollContainerRef,
        () => {
            if (!sessionsLoading.value && sessionsHasMore.value) {
                gameLogStore.loadMoreSessionsSegments();
            }
        },
        {
            distance: 320,
            canLoadMore: () => {
                const container = scrollContainerRef.value;
                if (!container) {
                    return false;
                }
                return (
                    !sessionsLoading.value &&
                    sessionsHasMore.value &&
                    container.scrollHeight > container.clientHeight + 16
                );
            }
        }
    );

    watch(
        [segments, sessionsLoading, sessionsHasMore, shouldAutoFillSearchResults],
        async () => {
            if (
                !shouldAutoFillSearchResults.value ||
                sessionsLoading.value ||
                !sessionsHasMore.value ||
                searchAutoFillAttempts.value >= 3
            ) {
                return;
            }

            await nextTick();
            const container = scrollContainerRef.value;
            if (!container) {
                return;
            }

            if (container.scrollHeight <= container.clientHeight) {
                searchAutoFillAttempts.value += 1;
                gameLogStore.loadMoreSessionsSegments();
            }
        },
        { flush: 'post' }
    );
</script>
