<template>
    <div class="friend-view x-container">
        <div v-if="settingsReady" class="friend-view__toolbar">
            <Tabs v-model="activeSegment" class="friend-view__tabs">
                <TabsList>
                    <TabsTrigger v-for="option in segmentedOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <div class="friend-view__actions">
                <InputGroupSearch v-model="searchTerm" class="friend-view__search" placeholder="Search Friend" />
                <Popover>
                    <PopoverTrigger asChild>
                        <div>
                            <TooltipWrapper :content="t('view.charts.instance_activity.settings.header')" side="top">
                                <Button class="rounded-full mr-2" size="icon" variant="outline">
                                    <Settings />
                                </Button>
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
        <ScrollArea v-if="settingsReady" ref="scrollbarRef" class="friend-view__scroll">
            <div v-if="virtualRows.length" class="friend-view__virtual" :style="virtualListStyle">
                <div class="friend-view__virtual-spacer" :style="virtualSpacerStyle">
                    <div
                        v-for="vRow in virtualItems"
                        :key="String(virtualRows[vRow.index]?.key ?? vRow.key)"
                        class="friend-view__virtual-row"
                        :data-index="vRow.index"
                        :ref="(el) => onVirtualRowRef(el)"
                        :style="virtualRowStyle(vRow.start)">
                        <template v-if="virtualRows[vRow.index]?.type === 'header'">
                            <header class="friend-view__instance-header">
                                <Location
                                    class="extra"
                                    :location="virtualRows[vRow.index].instanceId"
                                    style="display: inline" />
                                <span class="friend-view__instance-count">{{ virtualRows[vRow.index].count }}</span>
                            </header>
                        </template>

                        <template v-else-if="virtualRows[vRow.index]?.type === 'divider'">
                            <div class="friend-view__divider"><span class="friend-view__divider-text"></span></div>
                        </template>

                        <template v-else>
                            <div class="friend-view__row">
                                <FriendLocationCard
                                    v-for="item in virtualRows[vRow.index]?.items ?? []"
                                    :key="item.key"
                                    :friend="item.friend"
                                    :card-scale="cardScale"
                                    :card-spacing="cardSpacing"
                                    :display-instance-info="item.displayInstanceInfo" />
                            </div>
                        </template>
                    </div>
                </div>
            </div>
            <div v-else class="friend-view__empty">{{ t('view.friends_locations.no_matching_friends') }}</div>
        </ScrollArea>
        <div v-else class="friend-view__initial-loading">
            <Loader2 class="friend-view__loading-icon" :size="22" />
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
    import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Loader2, Settings } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { InputGroupSearch } from '@/components/ui/input-group';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useVirtualizer } from '@tanstack/vue-virtual';

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

    const activeSegment = ref('online');
    const searchTerm = ref('');

    const scrollbarRef = ref();
    const scrollViewportRef = shallowRef(null);
    const gridWidth = ref(0);
    let resizeObserver;
    let cleanupResize;

    const updateGridWidth = () => {
        const wrap = scrollViewportRef.value;
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

        const wrap = scrollViewportRef.value;
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

    const sameInstanceGroupsForVirtual = computed(() => {
        if (!isSameInstanceView.value) {
            return [];
        }
        return buildSameInstanceGroups(filteredFriends.value);
    });

    const mergedSameInstanceEntries = computed(() => {
        if (!shouldMergeSameInstance.value) {
            return [];
        }
        return filteredFriends.value.filter((entry) => entry.section === 'same-instance');
    });

    const mergedOnlineEntries = computed(() => {
        if (!shouldMergeSameInstance.value) {
            return [];
        }
        return filteredFriends.value.filter((entry) => entry.section !== 'same-instance');
    });

    const mergedSameInstanceGroups = computed(() => {
        if (!shouldMergeSameInstance.value) {
            return [];
        }
        return buildSameInstanceGroups(mergedSameInstanceEntries.value);
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

    function resolveScrollViewport() {
        const rootEl = scrollbarRef.value?.$el ?? null;
        if (!rootEl) {
            scrollViewportRef.value = null;
            return;
        }
        scrollViewportRef.value = rootEl.querySelector('[data-slot="scroll-area-viewport"]');
    }

    const maxColumns = computed(() => {
        const styleFn = gridStyle.value;
        if (typeof styleFn !== 'function') {
            return 1;
        }

        const containerWidth = Math.max(gridWidth.value ?? 0, 0);

        const baseWidth = 220;
        const baseGap = 14;
        const scale = cardScale.value;
        const spacing = cardSpacing.value;
        const minWidth = baseWidth * scale;
        const gap = Math.max(6, (baseGap + (scale - 1) * 10) * spacing);

        return Math.max(1, Math.floor((containerWidth + gap) / (minWidth + gap)) || 1);
    });

    const chunk = (items = [], size = 1) => {
        const out = [];
        const n = Math.max(1, Math.floor(size) || 1);
        for (let i = 0; i < items.length; i += n) {
            out.push(items.slice(i, i + n));
        }
        return out;
    };

    const virtualRows = computed(() => {
        const rows = [];
        const columns = maxColumns.value;

        if (isSameInstanceView.value) {
            for (const group of sameInstanceGroupsForVirtual.value) {
                rows.push({
                    type: 'header',
                    key: `h:${group.instanceId}`,
                    instanceId: group.instanceId,
                    count: Array.isArray(group.friends) ? group.friends.length : 0
                });

                const friends = Array.isArray(group.friends) ? group.friends : [];
                for (const rowFriends of chunk(friends, Math.min(columns, friends.length || 1))) {
                    rows.push({
                        type: 'cards',
                        key: `g:${group.instanceId}:${rowFriends
                            .map((f) => f?.id ?? f?.userId ?? f?.displayName ?? '')
                            .join('|')}`,
                        items: rowFriends.map((friend) => ({
                            key: `f:${friend?.id ?? friend?.userId ?? friend?.displayName ?? Math.random()}`,
                            friend,
                            displayInstanceInfo: true
                        }))
                    });
                }
            }

            return rows;
        }

        if (shouldMergeSameInstance.value) {
            for (const group of mergedSameInstanceGroups.value) {
                rows.push({
                    type: 'header',
                    key: `h:${group.instanceId}`,
                    instanceId: group.instanceId,
                    count: Array.isArray(group.friends) ? group.friends.length : 0
                });

                const friends = Array.isArray(group.friends) ? group.friends : [];
                for (const rowFriends of chunk(friends, Math.min(columns, friends.length || 1))) {
                    rows.push({
                        type: 'cards',
                        key: `mg:${group.instanceId}:${rowFriends
                            .map((f) => f?.id ?? f?.userId ?? f?.displayName ?? '')
                            .join('|')}`,
                        items: rowFriends.map((friend) => ({
                            key: `f:${friend?.id ?? friend?.userId ?? friend?.displayName ?? Math.random()}`,
                            friend,
                            displayInstanceInfo: false
                        }))
                    });
                }
            }

            if (mergedSameInstanceGroups.value.length && mergedOnlineEntries.value.length) {
                rows.push({ type: 'divider', key: 'divider:merged' });
            }

            const online = mergedOnlineEntries.value;
            for (const rowEntries of chunk(online, Math.min(columns, online.length || 1))) {
                rows.push({
                    type: 'cards',
                    key: `o:${rowEntries.map((e) => e?.id ?? '').join('|')}`,
                    items: rowEntries.map((entry) => ({
                        key: `e:${entry?.id ?? entry?.friend?.id ?? entry?.friend?.displayName ?? Math.random()}`,
                        friend: entry.friend,
                        displayInstanceInfo: true
                    }))
                });
            }

            return rows;
        }

        const entries = filteredFriends.value;
        for (const rowEntries of chunk(entries, Math.min(columns, entries.length || 1))) {
            rows.push({
                type: 'cards',
                key: `r:${rowEntries.map((e) => e?.id ?? '').join('|')}`,
                items: rowEntries.map((entry) => ({
                    key: `e:${entry?.id ?? entry?.friend?.id ?? entry?.friend?.displayName ?? Math.random()}`,
                    friend: entry.friend,
                    displayInstanceInfo: true
                }))
            });
        }
        return rows;
    });

    const estimatedRowHeight = computed(() => {
        const base = 148;
        return Math.max(64, Math.round(base * cardScale.value * cardSpacing.value));
    });

    const virtualizerRef = useVirtualizer(
        computed(() => ({
            count: virtualRows.value.length,
            getScrollElement: () => scrollViewportRef.value,
            estimateSize: (index) => {
                const row = virtualRows.value[index];
                if (row?.type === 'header') return 34;
                if (row?.type === 'divider') return 18;
                return estimatedRowHeight.value;
            },
            overscan: 10
        }))
    );

    const virtualizer = computed(() => virtualizerRef.value);
    const virtualItems = computed(() => virtualizer.value?.getVirtualItems?.() ?? []);

    const virtualSpacerStyle = computed(() => {
        const height = `${virtualizer.value?.getTotalSize?.() ?? 0}px`;
        return `height:${height};position:relative;width:100%;`;
    });

    function virtualRowStyle(start) {
        const y = Number(start) || 0;
        return `transform:translateY(${y}px);position:absolute;top:0;left:0;width:100%;`;
    }

    function onVirtualRowRef(el) {
        const target = el?.$el ?? el;
        if (!target) {
            return;
        }
        virtualizer.value?.measureElement?.(/** @type {Element} */ (target));
    }

    const virtualListStyle = computed(() => {
        const styleFn = gridStyle.value;
        const total = filteredFriends.value.length;

        // Use matchMaxColumnWidth so rows don't collapse to minWidth on short rows.
        const vars = typeof styleFn === 'function' ? styleFn(total, { matchMaxColumnWidth: true }) : {};
        return {
            ...vars
        };
    });

    watch([searchTerm, activeSegment], () => {
        virtualizer.value?.scrollToOffset?.(0);
        nextTick(() => {
            resolveScrollViewport();
            updateGridWidth();
            virtualizer.value?.measure?.();
        });
    });

    watch(showSameInstance, (value) => {
        if (!settingsReady.value) {
            return;
        }
        if (!value && activeSegment.value === 'same-instance') {
            activeSegment.value = 'online';
        }

        virtualizer.value?.scrollToOffset?.(0);
        nextTick(() => {
            resolveScrollViewport();
            updateGridWidth();
            virtualizer.value?.measure?.();
        });
    });

    watch(
        () => filteredFriends.value.length,
        () => {
            nextTick(() => {
                resolveScrollViewport();
                updateGridWidth();
                virtualizer.value?.measure?.();
            });
        }
    );

    watch([cardScale, cardSpacing], () => {
        if (!settingsReady.value) {
            return;
        }
        nextTick(() => {
            updateGridWidth();
            virtualizer.value?.measure?.();
        });
    });

    onMounted(() => {
        nextTick(() => {
            resolveScrollViewport();
            setupResizeHandling();
            updateGridWidth();
            virtualizer.value?.measure?.();
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
                resolveScrollViewport();
                setupResizeHandling();
                updateGridWidth();
                virtualizer.value?.measure?.();
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

    .friend-view__tabs {
        gap: 0;
    }

    .friend-view__toolbar--loading {
        justify-content: flex-end;
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
    }

    .friend-view__virtual {
        width: 100%;
        padding: 2px;
        box-sizing: border-box;
    }

    .friend-view__virtual-spacer {
        width: 100%;
    }

    .friend-view__virtual-row {
        width: 100%;
        box-sizing: border-box;
    }

    .friend-view__row {
        display: flex;
        flex-wrap: nowrap;
        gap: var(--friend-card-gap, 14px);
        align-items: stretch;
        padding: 2px;
        box-sizing: border-box;
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
    }

    .friend-view__divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 16px 4px;
        font-size: 13px;
        font-weight: 600;
    }

    .friend-view__divider::before,
    .friend-view__divider::after {
        content: '';
        flex: 1;
        height: 1px;
    }

    .friend-view__divider-text {
        flex: none;
    }

    .friend-view__instance-count {
        font-size: 12px;
    }

    .friend-view__empty {
        display: grid;
        place-items: center;
        min-height: 240px;
        font-size: 15px;
        letter-spacing: 0.5px;
    }

    .friend-view__loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 18px 0 12px;
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
