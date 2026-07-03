<template>
    <div id="chart" class="x-container">
        <div ref="popularGroupsRef" class="pt-4">
            <BackToTop :target="popularGroupsRef" :right="30" :bottom="30" :teleport="false" />

            <div class="options-container mt-0 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2 mb-4">
                    <span class="shrink-0">{{ t('view.charts.popular_groups.header') }}</span>
                    <HoverCard>
                        <HoverCardTrigger as-child>
                            <Info class="ml-1 text-xs opacity-70" />
                        </HoverCardTrigger>
                        <HoverCardContent side="bottom" align="start" class="w-75">
                            <div class="text-xs">
                                {{ t('view.charts.popular_groups.tips.description') }}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>

                <div class="flex items-center gap-2 mb-4">
                    <Input
                        v-model="searchQuery"
                        class="h-8 w-48"
                        :placeholder="t('view.charts.popular_groups.search_placeholder')" />
                    <label class="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <Checkbox :model-value="hideJoined" @update:modelValue="(v) => (hideJoined = !!v)" />
                        {{ t('view.charts.popular_groups.hide_joined') }}
                    </label>

                    <TooltipWrapper
                        v-if="isFetching"
                        :content="t('view.charts.popular_groups.actions.stop_fetching')"
                        side="top">
                        <Button variant="destructive" size="sm" :disabled="status.cancelRequested" @click="cancelFetch">
                            <Spinner />
                            {{ t('view.charts.popular_groups.actions.stop') }}
                        </Button>
                    </TooltipWrapper>
                    <TooltipWrapper v-else :content="fetchButtonLabel" side="top">
                        <Button size="sm" :disabled="fetchButtonDisabled" @click="startFetch">
                            {{ fetchButtonLabel }}
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>

            <div
                v-if="isFetching"
                class="mx-auto mb-3 flex max-w-[1100px] items-center gap-3 rounded-lg border px-3 py-2">
                <span class="text-sm shrink-0">
                    {{ t('view.charts.popular_groups.progress.friends_processed') }}:
                    <strong>{{ fetchState.processedFriends }} / {{ totalFriends }}</strong>
                </span>
                <Progress :model-value="progressPercent" class="h-3 flex-1" />
            </div>

            <div
                v-if="status.needsRefetch"
                class="mx-auto mb-3 max-w-[1100px] rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs">
                {{ t('view.charts.popular_groups.notifications.friend_list_changed') }}
            </div>

            <div v-if="isLoading" class="mt-[100px] flex items-center justify-center">
                <RefreshCcw class="size-6 animate-spin text-muted-foreground" />
            </div>

            <Empty v-else-if="!status.hasFetched" class="mt-[60px]">
                <EmptyHeader>
                    <EmptyDescription>{{ t('view.charts.popular_groups.never_fetched') }}</EmptyDescription>
                </EmptyHeader>
            </Empty>

            <div v-else-if="filteredRanking.length === 0" class="mt-[100px] flex items-center justify-center">
                <DataTableEmpty type="nodata" />
            </div>

            <template v-else>
                <div class="mx-auto mt-1 flex max-w-[1100px] items-center gap-3">
                    <div class="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <Users class="size-3.5 text-muted-foreground" />
                        <span class="text-sm font-medium">{{ filteredRanking.length }}</span>
                        <span class="text-xs text-muted-foreground">{{
                            t('view.charts.popular_groups.stats.total_groups')
                        }}</span>
                    </div>
                    <div v-if="skippedFriendCount > 0" class="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <EyeOff class="size-3.5 text-muted-foreground" />
                        <span class="text-sm font-medium">{{ skippedFriendCount }}</span>
                        <span class="text-xs text-muted-foreground">{{
                            t('view.charts.popular_groups.stats.skipped_friends')
                        }}</span>
                    </div>
                    <span v-if="formattedLastFetched" class="ml-auto text-xs text-muted-foreground/50">
                        {{ t('view.charts.popular_groups.last_fetched', { time: formattedLastFetched }) }}
                    </span>
                </div>

                <div class="mx-auto mt-3 flex max-w-[1100px] gap-x-6">
                    <div v-for="(column, colIdx) in columns" :key="colIdx" class="min-w-0 flex-1">
                        <button
                            v-for="group in column"
                            :key="group.groupId"
                            type="button"
                            class="group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent cursor-pointer"
                            :class="group._rank === 1 ? 'bg-primary/[0.04]' : ''"
                            @click="openDetail(group)">
                            <span
                                class="mt-0.5 w-6 shrink-0 text-right font-mono text-sm font-bold"
                                :class="group._rank === 1 ? 'text-primary' : 'text-muted-foreground'">
                                #{{ group._rank }}
                            </span>

                            <div class="relative inline-block flex-none size-9 mt-0.5">
                                <Avatar class="size-9">
                                    <AvatarImage :src="group.info.iconUrl" class="object-cover" />
                                    <AvatarFallback>
                                        <Users class="size-4 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5">
                                    <span
                                        class="block max-w-[300px] truncate text-sm font-medium hover:underline cursor-pointer"
                                        @click.stop="showGroupDialog(group.groupId)">
                                        {{ group.info.name || group.groupId }}
                                    </span>
                                    <Badge v-if="group.isJoined" variant="secondary" class="shrink-0 text-[10px]">
                                        {{ t('view.charts.popular_groups.joined') }}
                                    </Badge>
                                </div>

                                <div class="mt-0.5 text-xs text-muted-foreground">
                                    {{
                                        t('view.charts.popular_groups.stats_line.friends', {
                                            count: group.friendCount
                                        })
                                    }}
                                    <span class="text-muted-foreground/50">
                                        ({{
                                            t('view.charts.popular_groups.stats_line.members', {
                                                count: group.info.memberCount || 0
                                            })
                                        }})
                                    </span>
                                </div>

                                <div
                                    class="mt-1.5 h-2 w-full overflow-hidden rounded-full"
                                    :class="isDarkMode ? 'bg-white/[0.08]' : 'bg-black/[0.06]'">
                                    <div
                                        class="h-full rounded-full transition-all duration-500"
                                        :class="isDarkMode ? 'bg-white/[0.45]' : 'bg-black/[0.25]'"
                                        :style="{ width: getBarWidth(group.friendCount) }"></div>
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
                        class="text-left text-base font-semibold hover:underline cursor-pointer"
                        @click="handleGroupClick">
                        {{ selectedGroup?.info?.name || selectedGroup?.groupId }}
                    </button>
                </SheetTitle>
            </SheetHeader>

            <div v-if="selectedGroup" class="flex flex-col gap-4 overflow-y-auto px-5">
                <div class="flex flex-wrap items-center gap-2">
                    <span
                        class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium">
                        <Users class="size-3" />
                        {{
                            t('view.charts.popular_groups.stats_line.friends', { count: selectedGroup.friendCount })
                        }}
                    </span>
                    <span
                        class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {{
                            t('view.charts.popular_groups.stats_line.members', {
                                count: selectedGroup.info.memberCount || 0
                            })
                        }}
                    </span>
                    <span
                        v-if="selectedGroup.isJoined"
                        class="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-500/70">
                        {{ t('view.charts.popular_groups.joined') }}
                    </span>
                </div>

                <Separator />

                <div>
                    <div class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                        {{ t('view.charts.popular_groups.sheet.friends_in_group') }}
                    </div>
                    <div v-if="selectedGroupFriends.length === 0" class="py-6 text-center text-xs text-muted-foreground">
                        {{ t('view.charts.popular_groups.no_friend_data') }}
                    </div>
                    <div v-else class="space-y-0.5">
                        <button
                            v-for="friend in selectedGroupFriends"
                            :key="friend.userId"
                            type="button"
                            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent cursor-pointer"
                            @click="openUserDialog(friend.userId)">
                            <span class="min-w-0 flex-1 truncate">{{ friend.displayName }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>

<script setup>
    defineOptions({ name: 'ChartsPopularGroups' });

    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { EyeOff, Info, RefreshCcw, Users } from 'lucide-vue-next';

    import BackToTop from '@/components/BackToTop.vue';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
    import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
    import { Input } from '@/components/ui/input';
    import { Progress } from '@/components/ui/progress';
    import { Separator } from '@/components/ui/separator';
    import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
    import { Spinner } from '@/components/ui/spinner';
    import TooltipWrapper from '@/components/ui/tooltip/TooltipWrapper.vue';

    import { showGroupDialog } from '@/coordinators/groupCoordinator';
    import { showUserDialog } from '@/coordinators/userCoordinator';
    import { useAppearanceSettingsStore, usePopularGroupsStore, useUserStore } from '@/stores';

    const { t } = useI18n();
    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());
    const userStore = useUserStore();
    const popularGroupsStore = usePopularGroupsStore();

    const cachedUsers = userStore.cachedUsers;

    const fetchState = popularGroupsStore.fetchState;
    const status = popularGroupsStore.status;

    const popularGroupsRef = ref(null);
    const isLoading = ref(true);
    const searchQuery = ref('');
    const hideJoined = ref(false);

    const isSheetOpen = ref(false);
    const selectedGroup = ref(null);

    const isFetching = computed(() => status.isFetching);
    const totalFriends = computed(() => popularGroupsStore.friendCount);
    const skippedFriendCount = computed(() => popularGroupsStore.skippedFriendCount);
    const lastFetchedAt = computed(() => popularGroupsStore.lastFetchedAt);

    const fetchButtonDisabled = computed(
        () => isFetching.value || totalFriends.value === 0 || isLoading.value
    );
    const fetchButtonLabel = computed(() =>
        status.hasFetched
            ? t('view.charts.popular_groups.actions.fetch_again')
            : t('view.charts.popular_groups.actions.start_fetch')
    );
    const progressPercent = computed(() =>
        totalFriends.value
            ? Math.min(100, Math.round((fetchState.processedFriends / totalFriends.value) * 100))
            : 0
    );
    const formattedLastFetched = computed(() =>
        lastFetchedAt.value ? new Date(lastFetchedAt.value).toLocaleString() : ''
    );

    const filteredRanking = computed(() => {
        const query = searchQuery.value.trim().toLowerCase();
        return popularGroupsStore.groupRanking.filter((group) => {
            if (hideJoined.value && group.isJoined) return false;
            if (!query) return true;
            return (group.info.name || '').toLowerCase().includes(query);
        });
    });

    const displayed = computed(() => filteredRanking.value.slice(0, 40));

    const columns = computed(() => {
        const items = displayed.value.map((group, i) => ({ ...group, _rank: i + 1 }));
        const mid = Math.ceil(items.length / 2);
        return [items.slice(0, mid), items.slice(mid)];
    });

    const maxFriendCount = computed(() => {
        if (displayed.value.length === 0) return 1;
        return displayed.value[0].friendCount || 1;
    });

    const selectedGroupFriends = computed(() => {
        if (!selectedGroup.value) return [];
        return selectedGroup.value.friendIds
            .map((userId) => ({
                userId,
                displayName: cachedUsers.get(userId)?.displayName || userId
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    });

    function getBarWidth(friendCount) {
        return `${Math.max(4, (friendCount / maxFriendCount.value) * 100)}%`;
    }

    function setContainerHeight() {
        if (popularGroupsRef.value) {
            const availableHeight = window.innerHeight - 110;
            popularGroupsRef.value.style.height = `${availableHeight}px`;
            popularGroupsRef.value.style.overflowY = 'auto';
        }
    }

    const containerResizeObserver = new ResizeObserver(() => {
        setContainerHeight();
    });

    async function startFetch() {
        await popularGroupsStore.fetchFriendGroups();
    }

    function cancelFetch() {
        popularGroupsStore.requestCancel();
    }

    function openDetail(group) {
        selectedGroup.value = group;
        isSheetOpen.value = true;
    }

    function handleSheetClose(open) {
        if (!open) {
            isSheetOpen.value = false;
            selectedGroup.value = null;
        }
    }

    function handleGroupClick() {
        if (selectedGroup.value?.groupId) {
            showGroupDialog(selectedGroup.value.groupId);
        }
    }

    function openUserDialog(userId) {
        showUserDialog(userId);
    }

    onMounted(async () => {
        if (popularGroupsRef.value) {
            containerResizeObserver.observe(popularGroupsRef.value);
        }
        setContainerHeight();
        isLoading.value = true;
        try {
            await popularGroupsStore.loadFromDatabase();
        } finally {
            isLoading.value = false;
        }
    });

    onBeforeUnmount(() => {
        if (popularGroupsRef.value) {
            containerResizeObserver.unobserve(popularGroupsRef.value);
        }
    });
</script>
