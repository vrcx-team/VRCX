<template>
    <div class="x-container x-container--auto-height">
        <div class="pt-4">
            <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="shrink-0 text-lg font-semibold">
                        {{ t('view.groups.title') }}
                    </span>
                    <span v-if="syncStore.isSyncing" class="text-xs text-muted-foreground">
                        {{ t('view.groups.syncing', { done: syncStore.done, total: syncStore.total }) }}
                    </span>
                    <span v-else-if="syncStore.lastSyncedAt" class="text-xs text-muted-foreground">
                        {{ t('view.groups.last_synced') }}: {{ formatTime(syncStore.lastSyncedAt) }}
                    </span>
                </div>
                <Button variant="outline" size="sm" :disabled="syncStore.isSyncing" @click="handleRefresh">
                    <RefreshCcw class="mr-1 size-4" :class="{ 'animate-spin': syncStore.isSyncing }" />
                    {{ t('view.groups.refresh') }}
                </Button>
            </div>

            <div v-if="isLoading" class="mt-24 flex items-center justify-center">
                <RefreshCcw class="size-6 animate-spin text-muted-foreground" />
            </div>

            <div
                v-else-if="cards.length === 0"
                class="mt-24 flex flex-col items-center justify-center text-muted-foreground">
                <Users class="mb-2 size-10 opacity-40" />
                <p class="text-sm">{{ t('view.groups.empty') }}</p>
            </div>

            <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <button
                    v-for="card in cards"
                    :key="card.groupId"
                    type="button"
                    class="group flex cursor-pointer flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    @click="showGroupDialog(card.groupId)">
                    <div class="flex items-start gap-3">
                        <img
                            v-if="card.iconUrl"
                            :src="card.iconUrl"
                            class="size-10 shrink-0 rounded-lg object-cover"
                            alt="" />
                        <div
                            v-else
                            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Users class="size-5" />
                        </div>
                        <div class="min-w-0">
                            <div class="truncate font-semibold">
                                {{ card.name }}
                            </div>
                            <div class="text-xs text-muted-foreground">
                                {{ card.shortCode }}.{{ card.discriminator }}
                            </div>
                        </div>
                    </div>

                    <p v-if="card.description" class="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {{ card.description }}
                    </p>

                    <div class="mt-3 flex items-center justify-between">
                        <span class="text-xs text-muted-foreground">
                            <span class="font-semibold text-foreground">
                                {{ card.friendCount }}
                            </span>
                            {{ t('view.groups.friends_joined') }}
                        </span>
                        <div class="flex items-center">
                            <div class="flex -space-x-1.5">
                                <template v-for="friend in card.friends" :key="friend.id">
                                    <img
                                        v-if="friend.avatarUrl"
                                        :src="friend.avatarUrl"
                                        class="size-6 rounded-full ring-2 ring-background"
                                        :title="friend.displayName"
                                        alt="" />
                                    <div
                                        v-else
                                        class="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background"
                                        :title="friend.displayName">
                                        {{ friend.displayName.charAt(0).toUpperCase() }}
                                    </div>
                                </template>
                            </div>
                            <span
                                v-if="card.extraCount > 0"
                                class="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                +{{ card.extraCount }}
                            </span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { RefreshCcw, Users } from 'lucide-vue-next';

    import { Button } from '@/components/ui/button';
    import { showGroupDialog } from '@/coordinators/groupCoordinator';
    import { syncFriendGroups } from '@/coordinators/friendGroupsCoordinator';
    import { usePopularFriendGroupIdsQuery, usePopularFriendGroupsQuery } from '@/queries/useEntityQueries';
    import { useFriendGroupsStore } from '@/stores/friendGroups';
    import { useUserStore } from '@/stores';

    const { t } = useI18n();
    const userStore = useUserStore();
    const syncStore = useFriendGroupsStore();

    const { data: popularGroups, isLoading } = usePopularFriendGroupsQuery();
    const { data: friendIdsMap } = usePopularFriendGroupIdsQuery();

    const cards = computed(() => {
        /** @type {Array<{groupId: string, name: string, shortCode: string, discriminator: string, description: string, iconUrl: string, bannerUrl: string, privacy: string, memberCount: number, friendCount: number}>} */
        const groups = /** @type {any} */ (popularGroups.value) || [];
        /** @type {Map<string, Array<string>>} */
        const idsMap = /** @type {any} */ (friendIdsMap.value) || new Map();
        return groups.map((group) => {
            // 不截断：溢出气泡需显示真实剩余好友数
            const friendIds = idsMap.get(group.groupId) || [];
            const friends = friendIds.map((friendId) => {
                const ref = userStore.cachedUsers.get(friendId);
                return {
                    id: friendId,
                    displayName: ref?.displayName || friendId,
                    avatarUrl: ref?.currentAvatarThumbnailImageUrl || ''
                };
            });
            const visibleFriends = friends.slice(0, 4);
            return {
                ...group,
                friends: visibleFriends,
                extraCount: friends.length - visibleFriends.length
            };
        });
    });

    function formatTime(iso) {
        return new Date(iso).toLocaleString();
    }

    async function handleRefresh() {
        await syncFriendGroups({ force: true });
    }
</script>
