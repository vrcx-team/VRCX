<template>
    <div class="friend-view x-container">
        <div class="friend-view__toolbar">
            <el-segmented
                v-model="activeSegment"
                class="friend-view__segmented"
                :options="segmentedOptions"
                size="small" />
            <div class="friend-view__actions">
                <span class="friend-view__slider-label">Card Scale</span>
                <el-slider
                    v-model="cardScale"
                    class="friend-view__slider"
                    :min="0.6"
                    :max="1.0"
                    :step="0.01"
                    :show-tooltip="false" />
                <el-input
                    v-model="searchTerm"
                    class="friend-view__search"
                    :prefix-icon="Search"
                    clearable
                    placeholder="Search Friend"></el-input>
            </div>
        </div>
        <el-scrollbar ref="scrollbarRef" class="friend-view__scroll" @scroll="handleScroll">
            <template v-if="isSameInstanceView">
                <div v-if="visibleSameInstanceGroups.length" class="friend-view__instances">
                    <section
                        v-for="group in visibleSameInstanceGroups"
                        :key="group.instanceId"
                        class="friend-view__instance">
                        <header class="friend-view__instance-header">
                            <span class="friend-view__instance-id" :title="group.instanceId">{{
                                group.instanceId
                            }}</span>
                            <span class="friend-view__instance-count">{{ group.friends.length }}</span>
                        </header>
                        <div class="friend-view__grid" :style="gridStyle">
                            <FriendLocationCard
                                v-for="friend in group.friends"
                                :key="friend.id ?? friend.userId ?? friend.displayName"
                                :friend="friend"
                                :card-scale="cardScale" />
                        </div>
                    </section>
                </div>
                <div v-else class="friend-view__empty">No matching friends</div>
            </template>
            <template v-else>
                <div v-if="visibleFriends.length" class="friend-view__grid" :style="gridStyle">
                    <FriendLocationCard
                        v-for="entry in visibleFriends"
                        :key="entry.id ?? entry.friend.id ?? entry.friend.displayName"
                        :friend="entry.friend"
                        :card-scale="cardScale" />
                </div>
                <div v-else class="friend-view__empty">No matching friends</div>
            </template>
            <div v-if="isLoadingMore" class="friend-view__loading">
                <el-icon class="friend-view__loading-icon" :size="18">
                    <Loading />
                </el-icon>
                <span>Loading more...</span>
            </div>
        </el-scrollbar>
    </div>
</template>

<script setup>
    import { computed, nextTick, onMounted, ref, watch } from 'vue';
    import { Loading, Search } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';

    import { getFriendsLocations } from '../../shared/utils/location.js';
    import { useFriendStore } from '../../stores';

    import FriendLocationCard from './components/FriendLocationCard.vue';

    const friendStore = useFriendStore();
    const { onlineFriends, vipFriends, activeFriends, offlineFriends, friendsInSameInstance } =
        storeToRefs(friendStore);

    const segmentedOptions = [
        { label: 'Online', value: 'online' },
        { label: 'Favorite', value: 'favorite' },
        { label: 'Same Instance', value: 'same-instance' },
        { label: 'Active', value: 'active' },
        { label: 'Offline', value: 'offline' }
    ];

    const PAGE_SIZE = 18;
    const VIEWPORT_BUFFER = 32;

    const activeSegment = ref('online');
    const searchTerm = ref('');
    const cardScale = ref(1);
    const itemsToShow = ref(PAGE_SIZE);
    const isLoadingMore = ref(false);
    const scrollbarRef = ref();

    const normalizedSearchTerm = computed(() => searchTerm.value.trim().toLowerCase());

    const toEntries = (list = [], instanceId) =>
        Array.isArray(list)
            ? list.map((friend) => ({
                  id: friend.id ?? friend.userId ?? friend.displayName,
                  friend,
                  instanceId
              }))
            : [];

    const sameInstanceGroups = computed(() => {
        const source = friendsInSameInstance?.value;

        if (!Array.isArray(source) || source.length === 0) {
            return [];
        }

        return source.map((group, index) => {
            if (!Array.isArray(group) || group.length === 0) {
                return null;
            }

            const friends = group;

            const instanceId = getFriendsLocations(friends) || `instance-${index + 1}`;
            return {
                instanceId: String(instanceId),
                friends
            };
        });
    });

    const sameInstanceEntries = computed(() =>
        sameInstanceGroups.value.flatMap((group) => toEntries(group.friends, group.instanceId))
    );

    const uniqueEntries = (entries = []) => {
        const seen = new Set();
        return entries.filter((entry) => {
            const key = entry.id;
            if (!key) {
                return true;
            }
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    };

    const filteredFriends = computed(() => {
        if (normalizedSearchTerm.value) {
            const pools = [
                ...toEntries(vipFriends.value),
                ...toEntries(onlineFriends.value),
                ...toEntries(activeFriends.value),
                ...toEntries(offlineFriends.value)
            ];

            return uniqueEntries(pools).filter(({ friend }) => {
                const haystack =
                    `${friend.displayName ?? friend.name ?? ''} ${friend.signature ?? ''} ${friend.worldName ?? ''}`.toLowerCase();
                return haystack.includes(normalizedSearchTerm.value);
            });
        }

        switch (activeSegment.value) {
            case 'online':
                return toEntries(onlineFriends.value);
            case 'favorite':
                return toEntries(vipFriends.value);
            case 'same-instance':
                return sameInstanceEntries.value;
            case 'active':
                return toEntries(activeFriends.value);
            case 'offline':
                return toEntries(offlineFriends.value);
            default:
                return [];
        }
    });

    const visibleFriends = computed(() => filteredFriends.value.slice(0, itemsToShow.value));

    const isSameInstanceView = computed(() => activeSegment.value === 'same-instance' && !normalizedSearchTerm.value);

    const visibleSameInstanceGroups = computed(() => {
        if (!isSameInstanceView.value) {
            return [];
        }

        const grouped = new Map();

        for (const entry of visibleFriends.value) {
            const bucketId = entry.instanceId ?? 'instance';
            if (!grouped.has(bucketId)) {
                grouped.set(bucketId, []);
            }
            grouped.get(bucketId).push(entry.friend);
        }

        return sameInstanceGroups.value
            .filter((group) => grouped.has(group.instanceId))
            .map((group) => ({
                instanceId: group.instanceId,
                friends: grouped.get(group.instanceId) ?? []
            }));
    });

    const gridStyle = computed(() => {
        const baseWidth = 220;
        const baseGap = 14;
        const cardWidth = baseWidth * cardScale.value;
        const gap = baseGap + (cardScale.value - 1) * 10;
        return {
            '--friend-card-min-width': `${Math.round(cardWidth)}px`,
            '--friend-card-gap': `${gap.toFixed(0)}px`
        };
    });

    const handleScroll = () => {
        if (isLoadingMore.value || filteredFriends.value.length === 0) {
            return;
        }

        const wrap = scrollbarRef.value?.wrapRef;

        if (!wrap) {
            return;
        }

        const { scrollHeight, scrollTop, clientHeight } = wrap;

        if (scrollTop + clientHeight >= scrollHeight - 120) {
            loadMoreFriends();
        }
    };

    function loadMoreFriends() {
        if (isLoadingMore.value) {
            return;
        }

        isLoadingMore.value = true;

        window.setTimeout(() => {
            if (itemsToShow.value < filteredFriends.value.length) {
                itemsToShow.value = Math.min(itemsToShow.value + PAGE_SIZE, filteredFriends.value.length);
            }
            isLoadingMore.value = false;
            maybeFillViewport();
        }, 350);
    }

    function maybeFillViewport() {
        nextTick(() => {
            const wrap = scrollbarRef.value?.wrapRef;
            if (!wrap) {
                return;
            }

            const { scrollHeight, clientHeight } = wrap;
            const hasSpace = scrollHeight <= clientHeight + VIEWPORT_BUFFER;

            if (!hasSpace || isLoadingMore.value) {
                return;
            }

            if (filteredFriends.value.length > visibleFriends.value.length) {
                loadMoreFriends();
            }
        });
    }

    watch([searchTerm, activeSegment], () => {
        itemsToShow.value = PAGE_SIZE;
        maybeFillViewport();
    });

    watch(
        () => filteredFriends.value.length,
        (length) => {
            if (itemsToShow.value > length) {
                itemsToShow.value = length;
            }
            maybeFillViewport();
        }
    );

    watch(cardScale, () => {
        nextTick(() => {
            scrollbarRef.value?.update?.();
            maybeFillViewport();
        });
    });

    onMounted(() => {
        maybeFillViewport();
    });
</script>

<style scoped lang="scss">
    .friend-view {
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 16px;
    }

    .friend-view__toolbar {
        display: flex;
        gap: 20px;
        align-items: center;
        justify-content: space-between;
        padding: 6px 2px 0 2px;
    }

    .friend-view__segmented :deep(.el-segmented) {
        background: #fff;
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    }

    .friend-view__segmented :deep(.el-segmented__item) {
        padding: 10px 16px;
        font-weight: 600;
    }

    .friend-view__actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: none;
        flex-wrap: wrap;
        justify-content: flex-end;
        color: rgba(15, 23, 42, 0.65);
    }

    .friend-view__slider-label {
        font-size: 13px;
        font-weight: 500;
    }

    .friend-view__slider {
        width: 160px;
    }

    .friend-view__search {
        width: 240px;
    }

    .friend-view__scroll {
        padding: 2px;
    }

    .friend-view__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--friend-card-min-width, 200px), max-content));
        gap: var(--friend-card-gap, 18px);
        justify-content: start;
    }

    .friend-view__instances {
        display: grid;
        gap: 18px;
        padding: 6px;
        box-sizing: border-box;
    }

    .friend-view__instance {
        display: grid;
        gap: 10px;
    }

    .friend-view__instance-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 2px;
        font-weight: 600;
        font-size: 13px;
        color: rgba(15, 23, 42, 0.75);
    }

    .friend-view__instance-id {
        max-width: 75%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .friend-view__instance-count {
        font-size: 12px;
        color: rgba(15, 23, 42, 0.45);
    }

    .friend-view__empty {
        display: grid;
        place-items: center;
        min-height: 240px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 15px;
        letter-spacing: 0.5px;
    }

    .friend-view__loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 18px 0 12px;
        color: rgba(0, 0, 0, 0.55);
        font-size: 14px;
    }

    .friend-view__loading-icon {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
