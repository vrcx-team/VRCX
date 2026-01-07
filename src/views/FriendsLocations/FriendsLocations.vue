<template>
    <div class="friend-view x-container">
        <div v-if="settingsReady" class="friend-view__toolbar">
            <el-segmented v-model="activeSegment" :options="segmentedOptions" />
            <div class="friend-view__actions">
                <el-input
                    v-model="searchTerm"
                    class="friend-view__search"
                    :prefix-icon="Search"
                    clearable
                    placeholder="Search Friend"></el-input>
                <Popover>
                    <PopoverTrigger asChild>
                        <div>
                            <TooltipWrapper :content="t('view.charts.instance_activity.settings.header')" side="top">
                                <el-button style="margin-right: 5px" circle
                                    ><i class="ri-settings-3-line"></i
                                ></el-button>
                            </TooltipWrapper>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" class="w-87.5">
                        <div style="display: flex; justify-content: space-between; align-items: center">
                            <span class="friend-view__settings-label">{{
                                t('view.friends_locations.separate_same_instance_friends')
                            }}</span>
                            <Switch v-model="showSameInstance" />
                        </div>
                        <div class="friend-view__settings-row">
                            <span class="friend-view__settings-label">{{ t('view.friends_locations.scale') }}</span>
                            <div class="friend-view__scale-control">
                                <span class="friend-view__scale-value">{{ cardScalePercentLabel }}&nbsp;</span>
                                <Slider
                                    v-model="cardScaleValue"
                                    class="friend-view__slider"
                                    :min="0.5"
                                    :max="1.0"
                                    :step="0.01" />
                            </div>
                        </div>
                        <div class="friend-view__settings-row">
                            <span class="friend-view__settings-label">{{ t('view.friends_locations.spacing') }}</span>
                            <div class="friend-view__scale-control">
                                <span class="friend-view__scale-value">{{ cardSpacingPercentLabel }}&nbsp;</span>
                                <Slider
                                    v-model="cardSpacingValue"
                                    class="friend-view__slider"
                                    :min="0.25"
                                    :max="1.0"
                                    :step="0.05" />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
        <div v-else class="friend-view__toolbar friend-view__toolbar--loading">
            <span class="friend-view__loading-text">{{ t('view.friends_locations.loading_more') }}</span>
        </div>
        <el-scrollbar v-if="settingsReady" ref="scrollbarRef" class="friend-view__scroll" @scroll="handleScroll">
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
                                    disableAutoStretch: true,
                                    matchMaxColumnWidth: true
                                })
                            ">
                            <FriendLocationCard
                                v-for="friend in group.friends"
                                :key="friend.id ?? friend.userId ?? friend.displayName"
                                :friend="friend"
                                :card-scale="cardScale"
                                :card-spacing="cardSpacing" />
                        </div>
                    </section>
                </div>
                <div v-else class="friend-view__empty">{{ t('view.friends_locations.no_matching_friends') }}</div>
            </template>
            <template v-else-if="shouldMergeSameInstance">
                <div v-if="mergedSameInstanceGroups.length" class="friend-view__instances">
                    <section
                        v-for="group in mergedSameInstanceGroups"
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
                                    disableAutoStretch: true,
                                    matchMaxColumnWidth: true
                                })
                            ">
                            <FriendLocationCard
                                v-for="friend in group.friends"
                                :key="friend.id ?? friend.userId ?? friend.displayName"
                                :friend="friend"
                                :card-scale="cardScale"
                                :card-spacing="cardSpacing"
                                :display-instance-info="false" />
                        </div>
                    </section>
                </div>
                <div v-if="mergedSameInstanceGroups.length && mergedOnlineEntries.length" class="friend-view__divider">
                    <span class="friend-view__divider-text"></span>
                </div>
                <div
                    v-if="mergedOnlineEntries.length"
                    class="friend-view__grid"
                    :style="gridStyle(mergedOnlineEntries.length)">
                    <FriendLocationCard
                        v-for="entry in mergedOnlineEntries"
                        :key="entry.id ?? entry.friend.id ?? entry.friend.displayName"
                        :friend="entry.friend"
                        :card-scale="cardScale"
                        :card-spacing="cardSpacing" />
                </div>
                <div v-if="!mergedSameInstanceGroups.length && !mergedOnlineEntries.length" class="friend-view__empty">
                    {{ t('view.friends_locations.no_matching_friends') }}
                </div>
            </template>
            <template v-else>
                <div v-if="visibleFriends.length" class="friend-view__grid" :style="gridStyle(visibleFriends.length)">
                    <FriendLocationCard
                        v-for="entry in visibleFriends"
                        :key="entry.id ?? entry.friend.id ?? entry.friend.displayName"
                        :friend="entry.friend"
                        :card-scale="cardScale"
                        :card-spacing="cardSpacing" />
                </div>
                <div v-else class="friend-view__empty">{{ t('view.friends_locations.no_matching_friends') }}</div>
            </template>
            <div v-if="isLoadingMore" class="friend-view__loading">
                <el-icon class="friend-view__loading-icon" :size="18">
                    <Loading />
                </el-icon>
                <span>{{ t('view.friends_locations.loading_more') }}</span>
            </div>
        </el-scrollbar>
        <div v-else class="friend-view__initial-loading">
            <el-icon class="friend-view__loading-icon" :size="22">
                <Loading />
            </el-icon>
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { Loading, Search } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
    import { Slider } from '../../components/ui/slider';
    import { Switch } from '../../components/ui/switch';
    import { getFriendsLocations } from '../../shared/utils/location.js';
    import { useFriendStore } from '../../stores';

    import FriendLocationCard from './components/FriendsLocationsCard.vue';
    import configRepository from '../../service/config.js';

    const { t } = useI18n();

    const friendStore = useFriendStore();
    const { onlineFriends, vipFriends, activeFriends, offlineFriends, friendsInSameInstance } =
        storeToRefs(friendStore);

    const SEGMENTED_BASE_OPTIONS = [
        { label: t('side_panel.online'), value: 'online' },
        { label: t('side_panel.favorite'), value: 'favorite' },
        { label: t('side_panel.same_instance'), value: 'same-instance' },
        { label: t('side_panel.active'), value: 'active' },
        { label: t('side_panel.offline'), value: 'offline' }
    ];

    const segmentedOptions = computed(() =>
        showSameInstance.value
            ? SEGMENTED_BASE_OPTIONS
            : SEGMENTED_BASE_OPTIONS.filter((option) => option.value !== 'same-instance')
    );

    const cardScaleBase = ref(1);
    const cardSpacingBase = ref(1);

    const cardScale = computed({
        get: () => cardScaleBase.value,
        set: (value) => {
            cardScaleBase.value = value;
            configRepository.setString('VRCX_FriendLocationCardScale', value.toString());
        }
    });

    const cardSpacing = computed({
        get: () => cardSpacingBase.value,
        set: (value) => {
            cardSpacingBase.value = value;
            configRepository.setString('VRCX_FriendLocationCardSpacing', value.toString());
        }
    });

    const cardScalePercentLabel = computed(() => `${Math.round(cardScale.value * 100)}%`);
    const cardSpacingPercentLabel = computed(() => `${Math.round(cardSpacing.value * 100)}%`);
    const cardScaleValue = computed({
        get: () => [cardScale.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                cardScale.value = next;
            }
        }
    });
    const cardSpacingValue = computed({
        get: () => [cardSpacing.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                cardSpacing.value = next;
            }
        }
    });

    const showSameInstanceBase = ref(false);

    const showSameInstance = computed({
        get: () => showSameInstanceBase.value,
        set: (value) => {
            showSameInstanceBase.value = value;
            configRepository.setBool('VRCX_FriendLocationShowSameInstance', value);
        }
    });

    const settingsReady = ref(false);

    const PAGE_SIZE = 18;
    const VIEWPORT_BUFFER = 32;

    const activeSegment = ref('online');
    const searchTerm = ref('');

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
            case 'online': {
                if (!showSameInstance.value) {
                    const sameEntries = sameInstanceEntries.value.map((entry) => ({
                        ...entry,
                        section: 'same-instance'
                    }));

                    const seenIds = new Set(
                        sameEntries
                            .map((entry) => entry.id)
                            .filter((id) => typeof id === 'string' || typeof id === 'number')
                    );

                    const remainingOnline = toEntries(onlineFriends.value)
                        .filter((entry) => {
                            if (!entry?.id) {
                                return true;
                            }
                            return !seenIds.has(entry.id);
                        })
                        .map((entry) => ({
                            ...entry,
                            section: 'online'
                        }));

                    return [...sameEntries, ...remainingOnline];
                }

                return toEntries(onlineFriends.value);
            }
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

    const isSameInstanceView = computed(
        () => showSameInstance.value && activeSegment.value === 'same-instance' && !normalizedSearchTerm.value
    );

    const shouldMergeSameInstance = computed(
        () => !showSameInstance.value && activeSegment.value === 'online' && !normalizedSearchTerm.value
    );

    const buildSameInstanceGroups = (entries = []) => {
        if (!Array.isArray(entries) || entries.length === 0) {
            return [];
        }

        const grouped = new Map();

        for (const entry of entries) {
            const bucketId = entry.instanceId ?? entry.friend?.ref?.location ?? null;
            if (!bucketId) {
                continue;
            }
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
    };

    const visibleSameInstanceGroups = computed(() => {
        if (!isSameInstanceView.value) {
            return [];
        }

        return buildSameInstanceGroups(visibleFriends.value);
    });

    const mergedSameInstanceEntries = computed(() => {
        if (!shouldMergeSameInstance.value) {
            return [];
        }

        return visibleFriends.value.filter((entry) => entry.section === 'same-instance');
    });

    const mergedOnlineEntries = computed(() => {
        if (!shouldMergeSameInstance.value) {
            return [];
        }

        return visibleFriends.value.filter((entry) => entry.section !== 'same-instance');
    });

    const mergedSameInstanceGroups = computed(() => {
        if (!shouldMergeSameInstance.value) {
            return [];
        }

        return buildSameInstanceGroups(mergedSameInstanceEntries.value);
    });

    const sameInstanceColumnTarget = computed(() => {
        const groups = isSameInstanceView.value
            ? visibleSameInstanceGroups.value
            : shouldMergeSameInstance.value
              ? mergedSameInstanceGroups.value
              : [];

        let maxCount = 0;
        for (const group of groups) {
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
        const spacing = cardSpacing.value;
        const minWidth = baseWidth * scale;
        const gap = Math.max(6, (baseGap + (scale - 1) * 10) * spacing);

        return (count = 1, options = {}) => {
            const containerWidth = Math.max(gridWidth.value ?? 0, 0);
            const itemCount = Math.max(Number(count) || 0, 0);
            const safeCount = itemCount > 0 ? itemCount : 1;
            const maxColumns = Math.max(1, Math.floor((containerWidth + gap) / (minWidth + gap)) || 1);
            const preferredColumns = options?.preferredColumns;
            const requestedColumns = preferredColumns
                ? Math.max(1, Math.min(Math.round(preferredColumns), maxColumns))
                : maxColumns;
            const columns = Math.max(1, Math.min(safeCount, requestedColumns));
            const forceStretch = Boolean(options?.forceStretch);
            const disableAutoStretch = Boolean(options?.disableAutoStretch);
            const matchMaxColumnWidth = Boolean(options?.matchMaxColumnWidth);
            const shouldStretch = !disableAutoStretch && (forceStretch || itemCount >= maxColumns);

            let cardWidth = minWidth;
            const maxColumnWidth = maxColumns > 0 ? (containerWidth - gap * (maxColumns - 1)) / maxColumns : minWidth;

            if (shouldStretch && columns > 0) {
                const columnsWidth = containerWidth - gap * (columns - 1);
                const rawWidth = columnsWidth > 0 ? columnsWidth / columns : minWidth;

                if (Number.isFinite(rawWidth) && rawWidth > 0) {
                    cardWidth = Math.max(minWidth, rawWidth);
                }
            } else if (matchMaxColumnWidth && Number.isFinite(maxColumnWidth) && maxColumnWidth > 0) {
                cardWidth = Math.max(minWidth, maxColumnWidth);
            }

            return {
                '--friend-card-min-width': `${Math.round(minWidth)}px`,
                '--friend-card-gap': `${Math.round(gap)}px`,
                '--friend-card-target-width': `${Math.round(cardWidth)}px`,
                '--friend-grid-columns': `${columns}`,
                '--friend-card-spacing': `${spacing.toFixed(2)}`
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

    watch([cardScale, cardSpacing], () => {
        if (!settingsReady.value) {
            return;
        }
        nextTick(() => {
            scrollbarRef.value?.update?.();
            updateGridWidth();
            maybeFillViewport();
        });
    });

    watch(showSameInstance, (value) => {
        if (!settingsReady.value) {
            return;
        }
        if (!value && activeSegment.value === 'same-instance') {
            activeSegment.value = 'online';
        }

        itemsToShow.value = PAGE_SIZE;

        nextTick(() => {
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

    async function loadInitialSettings() {
        try {
            const [storedScale, storedSpacing, storedShowSameInstance] = await Promise.all([
                configRepository.getString('VRCX_FriendLocationCardScale', '1'),
                configRepository.getString('VRCX_FriendLocationCardSpacing', '1'),
                configRepository.getBool('VRCX_FriendLocationShowSameInstance', null)
            ]);

            const parsedScale = parseFloat(storedScale);
            if (!Number.isNaN(parsedScale) && parsedScale > 0) {
                cardScaleBase.value = parsedScale;
            }

            const parsedSpacing = parseFloat(storedSpacing);
            if (!Number.isNaN(parsedSpacing) && parsedSpacing > 0) {
                cardSpacingBase.value = parsedSpacing;
            }

            if (storedShowSameInstance !== null && storedShowSameInstance !== undefined) {
                showSameInstanceBase.value = Boolean(storedShowSameInstance);
            }
        } catch (error) {
            console.error('Failed to load Friend Location preferences', error);
        } finally {
            settingsReady.value = true;
            nextTick(() => {
                setupResizeHandling();
                scrollbarRef.value?.update?.();
                updateGridWidth();
                maybeFillViewport();
            });
        }
    }

    onBeforeMount(() => {
        loadInitialSettings();
    });
</script>

<style scoped>
    .friend-view {
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 16px;
    }

    .friend-view__toolbar {
        display: flex;
        gap: 20px;
        align-items: center;
        padding: 6px 2px 0 2px;
    }

    .friend-view__toolbar--loading {
        justify-content: flex-end;
        color: var(--el-text-color-secondary);
        font-size: 13px;
        font-weight: 500;
    }

    .friend-view__loading-text {
        padding-right: 12px;
    }

    .friend-view__actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        flex-wrap: wrap;
        justify-content: flex-end;
        color: var(--el-text-color-regular);
    }

    .friend-view__settings-label {
        font-size: 13px;
        font-weight: 500;
        margin-right: 8px;
    }

    .friend-view__settings-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .friend-view__scale-control {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 160px;
    }

    .friend-view__scale-value {
        font-size: 12px;
        font-weight: 600;
        color: var(--el-text-color-secondary);
        min-width: 42px;
        text-align: right;
    }

    .friend-view__slider {
        width: 160px;
        margin-right: 12px;
    }

    .friend-view__search {
        width: 240px;
        flex: 1;
    }

    .friend-view__scroll {
        padding: 2px;
    }

    .friend-view__initial-loading {
        display: grid;
        place-items: center;
        min-height: 240px;
        color: var(--el-text-color-secondary);
    }

    .friend-view__grid {
        display: grid;
        grid-template-columns: repeat(
            var(--friend-grid-columns, 1),
            minmax(var(--friend-card-min-width, 200px), var(--friend-card-target-width, 1fr))
        );
        gap: var(--friend-card-gap, 18px);
        justify-content: start;
        padding: 2px;
    }

    .friend-view__instances {
        display: grid;
        gap: 18px;
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
        margin: 5px 10px;
        font-weight: 600;
        font-size: 13px;
        color: var(--el-text-color-primary);
    }

    .friend-view__divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 16px 4px;
        color: var(--el-text-color-regular);
        font-size: 13px;
        font-weight: 600;
    }

    .friend-view__divider::before,
    .friend-view__divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--el-border-color);
    }

    .friend-view__divider-text {
        flex: none;
    }

    .friend-view__instance-count {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }

    .friend-view__empty {
        display: grid;
        place-items: center;
        min-height: 240px;
        color: var(--el-text-color-secondary);
        font-size: 15px;
        letter-spacing: 0.5px;
    }

    .friend-view__loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 18px 0 12px;
        color: var(--el-text-color-secondary);
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
