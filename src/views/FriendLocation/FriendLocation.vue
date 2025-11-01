<template>
    <div class="friend-view x-container">
        <div class="friend-view__toolbar">
            <el-segmented v-model="activeSegment" class="friend-view__segmented" :options="segmentedOptions" />
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
                            <Location class="extra" :location="group.instanceId" style="display: inline" />
                            <span class="friend-view__instance-count">{{ group.friends.length }}</span>
                        </header>
                        <div
                            class="friend-view__grid"
                            :style="
                                gridStyle(group.friends.length, {
                                    preferredColumns: sameInstanceColumnTarget,
                                    forceStretch: true
                                })
                            ">
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
                <div v-if="visibleFriends.length" class="friend-view__grid" :style="gridStyle(visibleFriends.length)">
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
    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
    const gridWidth = ref(0);
    let resizeObserver;
    let cleanupResize;

    const updateGridWidth = () => {
        const wrap = scrollbarRef.value?.wrapRef;
        if (!wrap) {
            return;
        }

        gridWidth.value = wrap.clientWidth ?? 0;
    };

    const setupResizeHandling = () => {
        if (cleanupResize) {
            cleanupResize();
            cleanupResize = undefined;
        }

        const wrap = scrollbarRef.value?.wrapRef;
        if (!wrap) {
            return;
        }

        updateGridWidth();

        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver((entries) => {
                if (!entries || entries.length === 0) {
                    return;
                }
                const [entry] = entries;
                gridWidth.value = entry.contentRect?.width ?? wrap.clientWidth ?? 0;
            });
            resizeObserver.observe(wrap);
            cleanupResize = () => {
                resizeObserver?.disconnect();
                resizeObserver = undefined;
            };
            return;
        }

        if (typeof window !== 'undefined') {
            const handleResize = () => {
                updateGridWidth();
            };
            window.addEventListener('resize', handleResize, { passive: true });
            cleanupResize = () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    };

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
        if (!Array.isArray(source) || source.length === 0) return [];

        return source
            .map((group, index) => {
                if (!Array.isArray(group) || group.length === 0) return null;
                const friends = group;
                const instanceId = getFriendsLocations(friends) || `instance-${index + 1}`;
                return {
                    instanceId: String(instanceId),
                    friends
                };
            })
            .filter(Boolean);
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

    const sameInstanceColumnTarget = computed(() => {
        if (!isSameInstanceView.value) {
            return null;
        }

        let maxCount = 0;
        for (const group of visibleSameInstanceGroups.value) {
            const size = Array.isArray(group?.friends) ? group.friends.length : 0;
            if (size > maxCount) {
                maxCount = size;
            }
        }

        return maxCount > 0 ? maxCount : null;
    });

    const gridStyle = computed(() => {
        const baseWidth = 220;
        const baseGap = 14;
        const scale = cardScale.value;
        const minWidth = baseWidth * scale;
        const gap = baseGap + (scale - 1) * 10;

        return (count = 1, options = {}) => {
            const containerWidth = Math.max(gridWidth.value ?? 0, 0);
            const itemCount = Math.max(Number(count) || 0, 1);
            const maxColumns = Math.max(1, Math.floor((containerWidth + gap) / (minWidth + gap)) || 1);
            const preferredColumns = options?.preferredColumns;
            const targetColumns = preferredColumns
                ? Math.max(1, Math.min(Math.round(preferredColumns), maxColumns))
                : Math.min(itemCount, maxColumns);
            const columns = Math.max(1, targetColumns || 1);
            const forceStretch = Boolean(options?.forceStretch);
            const shouldStretch = forceStretch || itemCount >= maxColumns;

            let cardWidth = minWidth;

            if (shouldStretch && columns > 0) {
                const columnsWidth = containerWidth - gap * (columns - 1);
                const rawWidth = columnsWidth > 0 ? columnsWidth / columns : minWidth;

                if (Number.isFinite(rawWidth) && rawWidth > 0) {
                    cardWidth = Math.max(minWidth, rawWidth);
                }
            }

            return {
                '--friend-card-min-width': `${Math.round(minWidth)}px`,
                '--friend-card-gap': `${Math.round(gap)}px`,
                '--friend-card-target-width': `${Math.round(cardWidth)}px`,
                '--friend-grid-columns': `${columns}`
            };
        };
    });

    const handleScroll = () => {
        if (
            isLoadingMore.value ||
            filteredFriends.value.length === 0 ||
            itemsToShow.value >= filteredFriends.value.length
        ) {
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
        if (isLoadingMore.value || itemsToShow.value >= filteredFriends.value.length) {
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
        nextTick(() => {
            updateGridWidth();
            maybeFillViewport();
        });
    });

    watch(
        () => filteredFriends.value.length,
        (length) => {
            if (itemsToShow.value > length) {
                itemsToShow.value = length;
            }
            nextTick(() => {
                updateGridWidth();
                maybeFillViewport();
            });
        }
    );

    watch(cardScale, () => {
        nextTick(() => {
            scrollbarRef.value?.update?.();
            updateGridWidth();
            maybeFillViewport();
        });
    });

    onMounted(() => {
        nextTick(() => {
            setupResizeHandling();
            maybeFillViewport();
        });
    });

    onBeforeUnmount(() => {
        if (cleanupResize) {
            cleanupResize();
            cleanupResize = undefined;
        }
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
        padding: 6px 10px 0 2px;
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
        margin-right: 12px;
    }

    .friend-view__search {
        width: 240px;
    }

    .friend-view__scroll {
        padding: 2px 10px 2px 2px;
    }

    .friend-view__grid {
        display: grid;
        grid-template-columns: repeat(
            var(--friend-grid-columns, 1),
            minmax(var(--friend-card-min-width, 200px), var(--friend-card-target-width, 1fr))
        );
        gap: var(--friend-card-gap, 18px);
        justify-content: start;
        padding-right: 2px;
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
