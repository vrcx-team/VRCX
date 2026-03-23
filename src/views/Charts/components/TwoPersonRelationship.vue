<template>
    <div id="chart" class="x-container">
        <div ref="twoPersonRef" class="pt-4">
            <BackToTop :target="twoPersonRef" :right="30" :bottom="30" :teleport="false" />

            <div class="options-container mt-0 flex items-center justify-between">
                <div class="flex items-center gap-2 mb-4">
                    <span class="shrink-0">{{ t('view.charts.two_person_relationship.header') }}</span>
                </div>

                <div class="flex items-center gap-2">
                    <VirtualCombobox
                        class="w-64"
                        :model-value="selectedFriendId"
                        @update:modelValue="handleFriendSelect"
                        :groups="friendPickerGroups"
                        :placeholder="t('view.charts.two_person_relationship.select_friend')"
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
                            :disabled="!selectedFriendId || isLoading"
                            @click="loadData">
                            <RefreshCcw />
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>

            <div
                v-if="!selectedFriendId"
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
                        :key="item.location + '_' + item.userLeave"
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
                        </div>

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
    import { Check as CheckIcon, Clock, Hash, RefreshCcw, Users } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { VirtualCombobox } from '@/components/ui/virtual-combobox';

    import dayjs from 'dayjs';

    import { database } from '../../../services/database';
    import { timeToText } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useFriendStore, useUserStore } from '../../../stores';
    import { useUserDisplay } from '../../../composables/useUserDisplay';

    const { t } = useI18n();

    const twoPersonRef = ref(null);
    const selectedFriendId = ref(null);
    const isLoading = ref(false);
    const rawResults = ref([]);

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

    const friendPickerGroups = computed(() => {
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
        return [{ key: 'friends', label: t('side_panel.friends'), items }];
    });

    const sharedInstances = computed(() => {
        const dateFormat = dtHour12.value ? 'YYYY-MM-DD hh:mm A' : 'YYYY-MM-DD HH:mm';
        return rawResults.value
            .map((row) => {
                const userTime = Math.max(0, row.userTime);
                const friendTime = Math.max(0, row.friendTime);
                const userLeaveMs = dayjs(row.userLeave).valueOf();
                const userJoin = userLeaveMs - userTime;
                const friendLeaveMs = dayjs(row.friendLeave).valueOf();
                const friendJoin = friendLeaveMs - friendTime;
                const overlapStart = Math.max(userJoin, friendJoin);
                const overlapEnd = Math.min(userLeaveMs, friendLeaveMs);
                const coexistenceTime = Math.max(0, overlapEnd - overlapStart);
                return {
                    location: row.location,
                    userLeave: userLeaveMs,
                    coexistenceTime,
                    formattedDate: dayjs(userLeaveMs).format(dateFormat)
                };
            })
            .filter((item) => item.coexistenceTime > 0)
            .sort((a, b) => b.userLeave - a.userLeave);
    });

    const totalCoexistenceTime = computed(() => {
        return sharedInstances.value.reduce((acc, item) => acc + item.coexistenceTime, 0);
    });

    async function loadData() {
        if (!selectedFriendId.value) return;
        isLoading.value = true;
        try {
            rawResults.value = await database.getCoInstanceHistory(selectedFriendId.value);
        } catch (error) {
            console.error('Error loading co-instance history:', error);
            rawResults.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    function handleFriendSelect(friendId) {
        selectedFriendId.value = friendId || null;
        rawResults.value = [];
        if (friendId) {
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
