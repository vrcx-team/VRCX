<template>
    <div id="chart" class="x-container">
        <div ref="twoPersonRef" class="pt-4">
            <BackToTop :target="twoPersonRef" :right="30" :bottom="30" :teleport="false" />

            <div class="options-container mt-0 flex items-center justify-between">
                <span class="shrink-0">{{ t('view.charts.two_person_relationship.header') }}</span>

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
                <div class="mt-4 flex justify-center text-center">
                    <div class="flex items-center gap-8">
                        <div class="text-center">
                            <div class="text-sm text-muted-foreground">
                                {{ t('view.charts.two_person_relationship.total_coexistence_time') }}
                            </div>
                            <div class="text-2xl font-semibold">
                                {{ timeToText(totalCoexistenceTime, true) }}
                            </div>
                        </div>
                        <div class="text-center">
                            <div class="text-sm text-muted-foreground">
                                {{ t('view.charts.two_person_relationship.instance_count') }}
                            </div>
                            <div class="text-2xl font-semibold">
                                {{ sharedInstances.length }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mx-auto mt-4 max-w-[900px]">
                    <div
                        v-for="(item, index) in sharedInstances"
                        :key="index"
                        class="mb-2 flex items-center gap-3 rounded-lg border px-4 py-3">
                        <div class="w-36 shrink-0 text-xs text-muted-foreground">
                            {{ dayjs(item.userLeave).format('YYYY-MM-DD HH:mm') }}
                        </div>

                        <div class="min-w-0 flex-1">
                            <Location :location="item.location" />
                        </div>

                        <div class="shrink-0 text-sm font-medium">
                            {{ timeToText(item.coexistenceTime, true) }}
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
    defineOptions({ name: 'ChartsTwoPerson' });

    import { computed, onMounted, ref } from 'vue';
    import { Check as CheckIcon, RefreshCcw, Users } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { VirtualCombobox } from '@/components/ui/virtual-combobox';

    import dayjs from 'dayjs';

    import { database } from '../../../services/database';
    import { timeToText } from '../../../shared/utils';
    import { useFriendStore, useUserStore } from '../../../stores';
    import { useUserDisplay } from '../../../composables/useUserDisplay';

    const { t } = useI18n();

    const twoPersonRef = ref(null);
    const selectedFriendId = ref(null);
    const isLoading = ref(false);
    const rawResults = ref([]);

    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const { friends } = storeToRefs(friendStore);
    const { currentUser } = storeToRefs(userStore);
    const cachedUsers = userStore.cachedUsers;

    const { userImage, userStatusClass } = useUserDisplay();

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
        return rawResults.value
            .map((row) => {
                const userTime = Math.max(0, row.userTime);
                const friendTime = Math.max(0, row.friendTime);
                const userLeave = dayjs(row.userLeave).valueOf();
                const userJoin = userLeave - userTime;
                const friendLeave = dayjs(row.friendLeave).valueOf();
                const friendJoin = friendLeave - friendTime;
                const overlapStart = Math.max(userJoin, friendJoin);
                const overlapEnd = Math.min(userLeave, friendLeave);
                const coexistenceTime = Math.max(0, overlapEnd - overlapStart);
                return { ...row, userLeave, coexistenceTime };
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
</script>
