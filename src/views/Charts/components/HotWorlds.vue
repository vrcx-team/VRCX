<template>
    <div id="chart" class="x-container">
        <div ref="hotWorldsRef" class="pt-4">
            <BackToTop :target="hotWorldsRef" :right="30" :bottom="30" :teleport="false" />
            <div class="options-container mt-0 flex items-center justify-between">
                <div class="flex items-center gap-2 mb-4">
                    <span class="shrink-0">{{ t('view.charts.hot_worlds.header') }}</span>
                    <HoverCard>
                        <HoverCardTrigger as-child>
                            <Info class="ml-1 text-xs opacity-70" />
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" align="start" class="w-75">
                            <div class="text-xs">
                                {{ t('view.charts.hot_worlds.tips.description') }}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>

                <div class="flex items-center gap-2">
                    <ToggleGroup
                    variant="outline"
                        type="single"
                        :model-value="String(selectedDays)"
                        @update:modelValue="handleDaysChange">
                        <ToggleGroupItem value="7">
                            {{ t('view.charts.hot_worlds.period.days_7') }}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="30">
                            {{ t('view.charts.hot_worlds.period.days_30') }}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="90">
                            {{ t('view.charts.hot_worlds.period.days_90') }}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            <div v-if="isLoading" class="mt-[100px] flex items-center justify-center">
                <RefreshCcw class="size-6 animate-spin text-muted-foreground" />
            </div>

            <div v-else-if="hotWorlds.length === 0" class="mt-[100px] flex items-center justify-center">
                <DataTableEmpty type="nodata" />
            </div>

            <template v-else>
                <div class="mx-auto mt-3 flex max-w-[1100px] items-center gap-3">

                    <div class="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <MapPin class="size-3.5 text-muted-foreground" />
                        <span class="text-sm font-medium">{{ totalVisits.toLocaleString() }}</span>
                        <span class="text-xs text-muted-foreground">{{ t('view.charts.hot_worlds.stats.total_visits') }}</span>
                    </div>
                    <div v-if="risingCount > 0" class="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <TrendingUp class="size-3.5 text-green-500/50" />
                        <span class="text-sm font-medium">{{ risingCount }}</span>
                        <span class="text-xs text-muted-foreground">{{ t('view.charts.hot_worlds.stats.rising') }}</span>
                    </div>
                    <div v-if="coolingCount > 0" class="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <TrendingDown class="size-3.5 text-blue-400/50" />
                        <span class="text-sm font-medium">{{ coolingCount }}</span>
                        <span class="text-xs text-muted-foreground">{{ t('view.charts.hot_worlds.stats.cooling') }}</span>
                    </div>
                    <span class="ml-auto text-xs text-muted-foreground/50">{{ t('view.charts.hot_worlds.sorted_by') }}</span>
                </div>

                <div class="mx-auto mt-3 flex max-w-[1100px] gap-x-6">
                <div
                    v-for="(column, colIdx) in columns"
                    :key="colIdx"
                    class="min-w-0 flex-1">
                    <button
                        v-for="world in column"
                        :key="world.worldId"
                        type="button"
                        class="group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                        :class="world._rank === 1 ? 'bg-primary/[0.04]' : ''"
                        @click="openDetail(world)">
                        <span
                            class="mt-0.5 w-6 shrink-0 text-right font-mono text-sm font-bold"
                            :class="world._rank === 1 ? 'text-primary' : 'text-muted-foreground'">
                            #{{ world._rank }}
                        </span>

                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5">
                                <span class="block max-w-[380px] truncate text-sm font-medium">
                                    {{ world.worldName }}
                                </span>
                                <template v-if="world.trend === 'rising'">
                                    <TrendingUp class="size-3 shrink-0 text-green-500/50" />
                                </template>
                                <template v-else-if="world.trend === 'cooling'">
                                    <TrendingDown class="size-3 shrink-0 text-blue-400/50" />
                                </template>
                            </div>

                            <div class="mt-0.5 text-xs text-muted-foreground">
                                {{ t('view.charts.hot_worlds.stats_line.friends', { count: world.uniqueFriends }) }}
                                <span class="text-muted-foreground/50">
                                    ({{ t('view.charts.hot_worlds.stats_line.visits', { count: world.visitCount }) }})
                                </span>
                            </div>

                            <div
                                class="mt-1.5 h-2 w-full overflow-hidden rounded-full"
                                :class="isDarkMode ? 'bg-white/[0.08]' : 'bg-black/[0.06]'">
                                <div
                                    class="h-full rounded-full transition-all duration-500"
                                    :class="isDarkMode ? 'bg-white/[0.45]' : 'bg-black/[0.25]'"
                                    :style="{ width: getBarWidth(world.uniqueFriends) }">
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
                </div>
            </template>
        </div>
    </div>

    <Sheet :open="isSheetOpen" @update:open="handleSheetClose">
        <SheetContent side="right" class="w-[340px] sm:max-w-[340px]">
            <SheetHeader class="px-5">
                <SheetTitle class="text-left">
                    <button
                        type="button"
                        class="text-left text-base font-semibold hover:underline"
                        @click="handleWorldClick">
                        {{ selectedWorld?.worldName }}
                    </button>
                </SheetTitle>
            </SheetHeader>

            <div v-if="selectedWorld" class="flex flex-col gap-4 overflow-y-auto px-5">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium">
                        <Users class="size-3" />
                        {{ t('view.charts.hot_worlds.stats_line.friends', { count: selectedWorld.uniqueFriends }) }}
                    </span>
                    <span class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        <MapPin class="size-3" />
                        {{ t('view.charts.hot_worlds.stats_line.visits', { count: selectedWorld.visitCount }) }}
                    </span>
                    <span
                        v-if="selectedWorld.trend === 'rising'"
                        class="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-500/70">
                        <TrendingUp class="size-3" />
                        {{ t('view.charts.hot_worlds.trend.rising') }}
                    </span>
                    <span
                        v-else-if="selectedWorld.trend === 'cooling'"
                        class="inline-flex items-center gap-1 rounded-full bg-blue-400/10 px-2.5 py-1 text-xs text-blue-400/70">
                        <TrendingDown class="size-3" />
                        {{ t('view.charts.hot_worlds.trend.cooling') }}
                    </span>
                </div>

                <Separator />

                <div>
                    <div class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                        {{ t('view.charts.hot_worlds.sheet.friends_who_visited') }}
                    </div>
                    <div v-if="isLoadingDetail" class="flex items-center justify-center py-8">
                        <RefreshCcw class="size-4 animate-spin text-muted-foreground" />
                    </div>
                    <div v-else-if="friendDetail.length === 0" class="py-6 text-center text-xs text-muted-foreground">
                        {{ t('view.charts.hot_worlds.no_friend_data') }}
                    </div>
                    <div v-else class="space-y-0.5">
                        <button
                            v-for="friend in friendDetail"
                            :key="friend.userId"
                            type="button"
                            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
                            @click="openUserDialog(friend.userId)">
                            <span class="min-w-0 flex-1 truncate">{{ friend.displayName }}</span>
                            <span class="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                                {{ friend.visitCount }}×
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>

<script setup>
    defineOptions({ name: 'ChartsHotWorlds' });

    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import { Info, MapPin, RefreshCcw, TrendingDown, TrendingUp } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';

    import { DataTableEmpty } from '@/components/ui/data-table';
    import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
    import { Separator } from '@/components/ui/separator';
    import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
    import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

    import { showUserDialog } from '@/coordinators/userCoordinator';
    import { showWorldDialog } from '@/coordinators/worldCoordinator';
    import { database } from '@/services/database';
    import { useAppearanceSettingsStore } from '@/stores';

    const { t } = useI18n();
    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());

    const hotWorldsRef = ref(null);
    const isLoading = ref(true);
    const isLoadingDetail = ref(false);
    const selectedDays = ref(30);
    const hotWorlds = ref([]);
    const friendDetail = ref([]);

    // Sheet state
    const isSheetOpen = ref(false);
    const selectedWorld = ref(null);

    const containerResizeObserver = new ResizeObserver(() => {
        setContainerHeight();
    });

    const displayed = computed(() => hotWorlds.value.slice(0, 20));

    const columns = computed(() => {
        const items = displayed.value.map((w, i) => ({ ...w, _rank: i + 1 }));
        const mid = Math.ceil(items.length / 2);
        return [items.slice(0, mid), items.slice(mid)];
    });

    const maxFriends = computed(() => {
        if (displayed.value.length === 0) return 1;
        return displayed.value[0].uniqueFriends || 1;
    });

    const risingCount = computed(() => {
        return displayed.value.filter((w) => w.trend === 'rising').length;
    });

    const coolingCount = computed(() => {
        return displayed.value.filter((w) => w.trend === 'cooling').length;
    });

    const totalVisits = computed(() => {
        return displayed.value.reduce((sum, w) => sum + (w.visitCount || 0), 0);
    });

    function getBarWidth(uniqueFriends) {
        return `${Math.max(4, (uniqueFriends / maxFriends.value) * 100)}%`;
    }

    function setContainerHeight() {
        if (hotWorldsRef.value) {
            const availableHeight = window.innerHeight - 110;
            hotWorldsRef.value.style.height = `${availableHeight}px`;
            hotWorldsRef.value.style.overflowY = 'auto';
        }
    }

    function handleDaysChange(value) {
        if (!value) return;
        selectedDays.value = parseInt(value, 10);
        handleSheetClose(false);
        loadData();
    }

    async function loadData() {
        isLoading.value = true;
        try {
            hotWorlds.value = await database.getHotWorlds(selectedDays.value);
        } catch (error) {
            console.error('Error loading hot worlds:', error);
            hotWorlds.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function openDetail(world) {
        selectedWorld.value = world;
        isSheetOpen.value = true;
        isLoadingDetail.value = true;
        try {
            friendDetail.value = await database.getHotWorldFriendDetail(world.worldId, selectedDays.value);
        } catch (error) {
            console.error('Error loading friend detail:', error);
            friendDetail.value = [];
        } finally {
            isLoadingDetail.value = false;
        }
    }

    function handleSheetClose(open) {
        if (!open) {
            isSheetOpen.value = false;
            selectedWorld.value = null;
            friendDetail.value = [];
        }
    }

    function handleWorldClick() {
        if (selectedWorld.value?.worldId) {
            showWorldDialog(selectedWorld.value.worldId);
        }
    }

    function openUserDialog(userId) {
        showUserDialog(userId);
    }

    onMounted(() => {
        if (hotWorldsRef.value) {
            containerResizeObserver.observe(hotWorldsRef.value);
        }
        setContainerHeight();
        loadData();
    });

    onBeforeUnmount(() => {
        if (hotWorldsRef.value) {
            containerResizeObserver.unobserve(hotWorldsRef.value);
        }
    });
</script>
