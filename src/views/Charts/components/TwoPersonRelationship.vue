<template>
    <div id="chart" class="x-container">
        <div ref="twoPersonRef" class="pt-4">
            <BackToTop :target="twoPersonRef" :right="30" :bottom="30" :teleport="false" />

            <div class="options-container mt-0 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <span class="shrink-0">{{ t('view.charts.two_person_relationship.header') }}</span>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <VirtualCombobox
                        class="w-56"
                        :model-value="selectedFriendAId"
                        @update:modelValue="handleFriendASelect"
                        :groups="friendPickerGroupsA"
                        :placeholder="t('view.charts.two_person_relationship.select_friend_a')"
                        :search-placeholder="t('view.charts.two_person_relationship.search_friend')"
                        :close-on-select="true"
                        :deselect-on-reselect="true">
                        <template #item="{ item, selected }">
                            <div class="flex w-full items-center p-1.5 text-[13px]">
                                <template v-if="item.user">
                                    <div
                                        class="relative mr-2.5 inline-block size-9 flex-none"
                                        :class="userStatusClass(item.user)">
                                        <img
                                            class="size-full rounded-full object-cover"
                                            :src="userImage(item.user)"
                                            loading="lazy" />
                                    </div>
                                    <div class="flex-1 overflow-hidden">
                                        <span
                                            class="block truncate font-medium leading-[18px]"
                                            :style="{ color: item.user.$userColour }">
                                            {{ item.user.displayName }}
                                        </span>
                                    </div>
                                </template>
                                <template v-else>
                                    <span>{{ item.label }}</span>
                                </template>
                                <CheckIcon
                                    :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                            </div>
                        </template>
                    </VirtualCombobox>

                    <TooltipWrapper :content="t('view.charts.two_person_relationship.swap_friends')" side="top">
                        <Button
                            class="rounded-full"
                            size="icon"
                            variant="ghost"
                            :disabled="!selectedFriendAId && !selectedFriendBId"
                            @click="swapFriends">
                            <ArrowLeftRight class="size-4" />
                        </Button>
                    </TooltipWrapper>

                    <VirtualCombobox
                        class="w-56"
                        :model-value="selectedFriendBId"
                        @update:modelValue="handleFriendBSelect"
                        :groups="friendPickerGroupsB"
                        :placeholder="t('view.charts.two_person_relationship.select_friend_b')"
                        :search-placeholder="t('view.charts.two_person_relationship.search_friend')"
                        :close-on-select="true"
                        :deselect-on-reselect="true">
                        <template #item="{ item, selected }">
                            <div class="flex w-full items-center p-1.5 text-[13px]">
                                <template v-if="item.user">
                                    <div
                                        class="relative mr-2.5 inline-block size-9 flex-none"
                                        :class="userStatusClass(item.user)">
                                        <img
                                            class="size-full rounded-full object-cover"
                                            :src="userImage(item.user)"
                                            loading="lazy" />
                                    </div>
                                    <div class="flex-1 overflow-hidden">
                                        <span
                                            class="block truncate font-medium leading-[18px]"
                                            :style="{ color: item.user.$userColour }">
                                            {{ item.user.displayName }}
                                        </span>
                                    </div>
                                </template>
                                <template v-else>
                                    <span>{{ item.label }}</span>
                                </template>
                                <CheckIcon
                                    :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                            </div>
                        </template>
                    </VirtualCombobox>

                    <TooltipWrapper :content="t('view.charts.instance_activity.refresh')" side="top">
                        <Button
                            class="rounded-full"
                            size="icon"
                            variant="ghost"
                            :disabled="!selectedFriendAId || !selectedFriendBId || isLoading"
                            @click="loadData">
                            <RefreshCcw />
                        </Button>
                    </TooltipWrapper>

                    <Popover>
                        <PopoverTrigger as-child>
                            <div>
                                <TooltipWrapper
                                    :content="t('view.charts.two_person_relationship.settings')"
                                    side="top">
                                    <Button class="rounded-full" size="icon" variant="ghost">
                                        <Settings class="size-4" />
                                    </Button>
                                </TooltipWrapper>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent side="bottom" align="end" class="w-60">
                            <div class="flex items-center justify-between px-0.5 h-[30px]">
                                <span class="shrink-0 text-sm">
                                    {{ t('view.charts.two_person_relationship.show_self_presence') }}
                                </span>
                                <Switch v-model="showSelfPresence" />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div
                v-if="!selectedFriendAId || !selectedFriendBId"
                class="mt-[100px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Users class="size-8 opacity-40" />
                <span class="text-sm">{{ t('view.charts.two_person_relationship.no_friend_selected') }}</span>
            </div>

            <div v-else-if="isLoading" class="mt-[100px] flex items-center justify-center">
                <RefreshCcw class="size-6 animate-spin text-muted-foreground" />
            </div>

            <div
                v-else-if="sharedInstances.length === 0"
                class="mt-[100px] flex items-center justify-center">
                <DataTableEmpty type="nodata" />
            </div>

            <template v-else>
                <div class="mx-auto mt-3 flex max-w-[900px] items-center gap-3">
                    <div class="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <Clock class="size-3.5 text-muted-foreground" />
                        <span class="text-sm font-medium">{{ timeToText(totalCoexistenceTime, true) }}</span>
                        <span class="text-xs text-muted-foreground">
                            {{ t('view.charts.two_person_relationship.total_coexistence_time') }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <Hash class="size-3.5 text-muted-foreground" />
                        <span class="text-sm font-medium">{{ sharedInstances.length }}</span>
                        <span class="text-xs text-muted-foreground">
                            {{ t('view.charts.two_person_relationship.instance_count') }}
                        </span>
                    </div>
                </div>

                <div class="mx-auto mt-3 max-w-[900px]">
                    <button
                        v-for="(item, index) in sharedInstances"
                        :key="item.location + '_' + item.friendALeave"
                        type="button"
                        class="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent">
                        <span class="w-6 shrink-0 text-right font-mono text-sm font-bold text-muted-foreground">
                            #{{ index + 1 }}
                        </span>

                        <div class="w-32 shrink-0 text-xs text-muted-foreground tabular-nums">
                            {{ item.formattedDate }}
                        </div>

                        <div class="min-w-0 flex-1">
                            <Location :location="item.location" />
                            <div class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                <TooltipWrapper
                                    v-if="item.instanceCreatorName"
                                    :content="t('view.charts.two_person_relationship.instance_creator')"
                                    side="top">
                                    <span class="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Crown class="size-3 shrink-0" />
                                        <span class="truncate max-w-[120px]">{{ item.instanceCreatorName }}</span>
                                    </span>
                                </TooltipWrapper>
                                <TooltipWrapper
                                    v-if="item.maxPlayerCount != null"
                                    :content="t('view.charts.two_person_relationship.max_player_count')"
                                    side="top">
                                    <span class="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Users class="size-3 shrink-0" />
                                        <span class="tabular-nums">{{ item.maxPlayerCount }}</span>
                                    </span>
                                </TooltipWrapper>
                            </div>
                        </div>

                        <span
                            v-if="showSelfPresence"
                            :class="[
                                'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
                                item.selfPresent
                                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                    : 'bg-red-500/15 text-red-600 dark:text-red-400'
                            ]">
                            {{
                                item.selfPresent
                                    ? t('view.charts.two_person_relationship.self_present')
                                    : t('view.charts.two_person_relationship.self_not_present')
                            }}
                        </span>

                        <div class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Clock class="size-3 shrink-0" />
                            <span class="font-medium tabular-nums">{{ timeToText(item.coexistenceTime, true) }}</span>
                        </div>
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
    defineOptions({ name: 'ChartsTwoPerson' });

    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import {
        ArrowLeftRight,
        Check as CheckIcon,
        Clock,
        Crown,
        Hash,
        RefreshCcw,
        Settings,
        Users
    } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Switch } from '@/components/ui/switch';
    import { VirtualCombobox } from '@/components/ui/virtual-combobox';

    import dayjs from 'dayjs';

    import { database } from '../../../services/database';
    import { parseLocation } from '../../../shared/utils/locationParser';
    import { timeToText } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useFriendStore, useUserStore } from '../../../stores';
    import { useUserDisplay } from '../../../composables/useUserDisplay';

    const { t } = useI18n();

    const twoPersonRef = ref(null);
    const selectedFriendAId = ref(null);
    const selectedFriendBId = ref(null);
    const isLoading = ref(false);
    const rawResults = ref([]);
    const selfPresenceMap = ref(new Map());
    const maxPlayerCountMap = ref(new Map());
    const showSelfPresence = ref(false);

    const { dtHour12 } = storeToRefs(useAppearanceSettingsStore());
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const { friends } = storeToRefs(friendStore);
    const { currentUser } = storeToRefs(userStore);
    const cachedUsers = userStore.cachedUsers;

    const { userImage, userStatusClass } = useUserDisplay();

    const containerResizeObserver = new ResizeObserver(() => {
        setContainerHeight();
    });

    function setContainerHeight() {
        if (twoPersonRef.value) {
            const availableHeight = window.innerHeight - 110;
            twoPersonRef.value.style.height = `${availableHeight}px`;
            twoPersonRef.value.style.overflowY = 'auto';
        }
    }

    function buildFriendItems(excludeId) {
        return allFriendItems.value.filter((item) => item.value !== excludeId);
    }

    const allFriendItems = computed(() => {
        const items = [];
        for (const [friendId, friend] of friends.value.entries()) {
            if (friendId === currentUser.value?.id) continue;
            const cached = cachedUsers.get(friendId);
            const displayName = friend.displayName || cached?.displayName || friendId;
            items.push({
                value: friendId,
                label: displayName,
                search: displayName,
                user: cached || null
            });
        }
        items.sort((a, b) => a.label.localeCompare(b.label));
        return items;
    });

    const friendPickerGroupsA = computed(() => [
        {
            key: 'friends',
            label: t('side_panel.friends'),
            items: selectedFriendBId.value ? buildFriendItems(selectedFriendBId.value) : allFriendItems.value
        }
    ]);
    const friendPickerGroupsB = computed(() => [
        {
            key: 'friends',
            label: t('side_panel.friends'),
            items: selectedFriendAId.value ? buildFriendItems(selectedFriendAId.value) : allFriendItems.value
        }
    ]);

    /**
     * Resolve a user ID to a display name via the cached users map.
     * Falls back to the raw user ID if not found.
     */
    function resolveDisplayName(userId) {
        if (!userId) return null;
        const cached = cachedUsers.get(userId);
        return cached?.displayName || userId;
    }

    /**
     * Determine whether the current user was present during the A-B overlap window.
     * Checks all self-presence sessions for this location.
     */
    function computeSelfPresent(location, overlapStart, overlapEnd) {
        const sessions = selfPresenceMap.value.get(location);
        if (!sessions || sessions.length === 0) return false;
        for (const session of sessions) {
            const selfLeaveMs = dayjs(session.selfLeave).valueOf();
            const selfJoinMs = selfLeaveMs - Math.max(0, session.selfTime);
            // Overlap: self's session intersects with the A-B co-presence window
            if (selfJoinMs < overlapEnd && selfLeaveMs > overlapStart) {
                return true;
            }
        }
        return false;
    }

    const sharedInstances = computed(() => {
        const dateFormat = dtHour12.value ? 'YYYY-MM-DD hh:mm A' : 'YYYY-MM-DD HH:mm';
        return rawResults.value
            .map((row) => {
                const friendATime = Math.max(0, row.friendATime);
                const friendBTime = Math.max(0, row.friendBTime);
                const friendALeaveMs = dayjs(row.friendALeave).valueOf();
                const friendAJoin = friendALeaveMs - friendATime;
                const friendBLeaveMs = dayjs(row.friendBLeave).valueOf();
                const friendBJoin = friendBLeaveMs - friendBTime;
                const overlapStart = Math.max(friendAJoin, friendBJoin);
                const overlapEnd = Math.min(friendALeaveMs, friendBLeaveMs);
                const coexistenceTime = Math.max(0, overlapEnd - overlapStart);

                // Instance creator from location string
                const parsedLoc = parseLocation(row.location);
                const instanceCreatorId = parsedLoc.userId || null;
                const instanceCreatorName = resolveDisplayName(instanceCreatorId);

                // Max concurrent player count
                const maxPlayerCount = maxPlayerCountMap.value.get(row.location) ?? null;

                // Self presence during overlap
                const selfPresent = computeSelfPresent(row.location, overlapStart, overlapEnd);

                return {
                    location: row.location,
                    friendALeave: friendALeaveMs,
                    coexistenceTime,
                    formattedDate: dayjs(friendALeaveMs).format(dateFormat),
                    instanceCreatorName,
                    maxPlayerCount,
                    selfPresent
                };
            })
            .filter((item) => item.coexistenceTime > 0)
            .sort((a, b) => b.friendALeave - a.friendALeave);
    });

    const totalCoexistenceTime = computed(() => {
        return sharedInstances.value.reduce((acc, item) => acc + item.coexistenceTime, 0);
    });

    async function loadData() {
        if (!selectedFriendAId.value || !selectedFriendBId.value) return;
        isLoading.value = true;
        try {
            const results = await database.getCoInstanceHistoryBetweenFriends(
                selectedFriendAId.value,
                selectedFriendBId.value
            );
            rawResults.value = results;

            // Collect unique locations for auxiliary queries
            const locations = [...new Set(results.map((r) => r.location))];

            const [selfMap, maxMap] = await Promise.all([
                currentUser.value?.id
                    ? database.getSelfPresenceForLocations(currentUser.value.id, locations)
                    : Promise.resolve(new Map()),
                database.getMaxPlayerCountForLocations(locations)
            ]);

            selfPresenceMap.value = selfMap;
            maxPlayerCountMap.value = maxMap;
        } catch (error) {
            console.error('Error loading co-instance history:', error);
            rawResults.value = [];
            selfPresenceMap.value = new Map();
            maxPlayerCountMap.value = new Map();
        } finally {
            isLoading.value = false;
        }
    }

    function handleFriendASelect(friendId) {
        selectedFriendAId.value = friendId || null;
        rawResults.value = [];
        selfPresenceMap.value = new Map();
        maxPlayerCountMap.value = new Map();
        if (friendId && selectedFriendBId.value) {
            loadData();
        }
    }

    function handleFriendBSelect(friendId) {
        selectedFriendBId.value = friendId || null;
        rawResults.value = [];
        selfPresenceMap.value = new Map();
        maxPlayerCountMap.value = new Map();
        if (friendId && selectedFriendAId.value) {
            loadData();
        }
    }

    function swapFriends() {
        const tmp = selectedFriendAId.value;
        selectedFriendAId.value = selectedFriendBId.value;
        selectedFriendBId.value = tmp;
        rawResults.value = [];
        selfPresenceMap.value = new Map();
        maxPlayerCountMap.value = new Map();
        if (selectedFriendAId.value && selectedFriendBId.value) {
            loadData();
        }
    }

    onMounted(() => {
        if (twoPersonRef.value) {
            containerResizeObserver.observe(twoPersonRef.value);
        }
        setContainerHeight();
    });

    onBeforeUnmount(() => {
        containerResizeObserver.disconnect();
    });
</script>
