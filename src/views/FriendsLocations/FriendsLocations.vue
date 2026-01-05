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
                <el-popover placement="bottom" trigger="click" :width="350">
                    <template #reference>
                        <div>
                            <el-tooltip :content="t('view.charts.instance_activity.settings.header')" placement="top">
                                <el-button style="margin-right: 5px" circle
                                    ><i class="ri-settings-3-line"></i
                                ></el-button>
                            </el-tooltip>
                        </div>
                    </template>
                    <div class="friend-view__settings-row">
                        <span class="friend-view__settings-label">{{ t('view.friends_locations.scale') }}</span>
                        <div class="friend-view__scale-control">
                            <span class="friend-view__scale-value">{{ cardScalePercentLabel }}&nbsp;</span>
                            <el-slider
                                v-model="cardScale"
                                class="friend-view__slider"
                                :min="0.5"
                                :max="1.0"
                                :step="0.01"
                                :show-tooltip="false" />
                        </div>
                    </div>
                    <div class="friend-view__settings-row">
                        <span class="friend-view__settings-label">{{ t('view.friends_locations.spacing') }}</span>
                        <div class="friend-view__scale-control">
                            <span class="friend-view__scale-value">{{ cardSpacingPercentLabel }}&nbsp;</span>
                            <el-slider
                                v-model="cardSpacing"
                                class="friend-view__slider"
                                :min="0.25"
                                :max="1.0"
                                :step="0.05"
                                :show-tooltip="false" />
                        </div>
                    </div>
                </el-popover>
            </div>
        </div>
        <div v-else class="friend-view__toolbar friend-view__toolbar--loading">
            <span class="friend-view__loading-text">{{ t('view.friends_locations.loading_more') }}</span>
        </div>
        <el-scrollbar v-if="settingsReady" ref="scrollbarRef" class="friend-view__scroll" @scroll="handleScroll">
            <template v-if="activeSegment === 'online'">
                <div v-if="isLoadingRoomCards" class="friend-view__loading">
                    <div class="room-card" v-for="i in 3" :key="i">
                        <div class="room-card__skeleton">
                            <div class="room-card__skeleton-thumbnail skeleton"></div>
                            <div class="room-card__skeleton-content">
                                <div class="room-card__skeleton-title skeleton"></div>
                                <div class="room-card__skeleton-info skeleton"></div>
                                <div class="room-card__skeleton-friends">
                                    <div class="room-card__skeleton-avatar skeleton"></div>
                                    <div class="room-card__skeleton-avatar skeleton"></div>
                                    <div class="room-card__skeleton-avatar skeleton"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="filteredRoomCards.length" class="room-cards-grid" :style="roomCardsGridStyle">
                    <div
                        v-for="worldCard in filteredRoomCards"
                        :key="worldCard.worldId"
                        class="world-card"
                        :style="worldCardStyle">
                        <!-- World header with thumbnail and title only -->
                        <div
                            class="world-card__header"
                            :class="{ 'world-card__header--collapsed': isWorldCollapsed(worldCard.worldId) }"
                            @click="worldCard.instances.length > 1 && toggleWorldCollapse(worldCard.worldId)">
                            <div class="world-card__thumbnail">
                                <img
                                    v-if="worldCard.world"
                                    :src="worldCard.world.thumbnailImageUrl"
                                    class="world-card__image x-link"
                                    @click.stop="showWorldDialog(worldCard.worldId)"
                                    loading="lazy" />
                            </div>
                            <div class="world-card__info">
                                <div class="world-card__title">
                                    <span
                                        v-if="worldCard.world"
                                        class="world-card__name x-link"
                                        :title="worldCard.world.name"
                                        @click.stop="showWorldDialog(worldCard.worldId)"
                                        v-text="worldCard.world.name" />
                                </div>
                                <!-- Collapsed summary info -->
                                <div v-if="isWorldCollapsed(worldCard.worldId)" class="world-card__summary">
                                    <div class="world-card__summary-main">
                                        <span class="world-card__instance-count">🏠{{ worldCard.instances.length }}</span>
                                        <span class="world-card__friend-count">👥{{ worldCard.totalFriends }}</span>
                                    </div>
                                    <div class="world-card__privacy-summary">
                                        <span
                                            v-for="[privacy, count] in worldCard.instanceCountsByPrivacy"
                                            :key="privacy"
                                            class="privacy-badge"
                                            :class="getPrivacyColorClass(privacy)">
                                            {{ privacy }}{{ count }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div v-if="worldCard.instances.length > 1" class="world-card__collapse-toggle">
                                <el-icon :class="{ 'is-collapsed': isWorldCollapsed(worldCard.worldId) }">
                                    <i class="ri-arrow-down-s-line"></i>
                                </el-icon>
                            </div>
                        </div>
                        <!-- Instances list -->
                        <div v-show="!isWorldCollapsed(worldCard.worldId)" class="world-card__instances">
                            <div
                                v-for="instance in worldCard.instances"
                                :key="instance.location"
                                class="instance-section">
                                <!-- Instance info line with actions -->
                                <div class="instance-section__info">
                                    <span class="instance-section__number">#{{ instance.$location.instanceId?.split('~')[0] || '' }}</span>
                                    <el-tooltip
                                        v-if="instance.$location.groupId && instance.groupName"
                                        placement="top"
                                        :content="instance.groupName">
                                        <span
                                            class="instance-section__privacy privacy-badge has-group-info"
                                            :class="getPrivacyColorClass(getInstancePrivacy(instance.$location.instanceId))"
                                            @click="groupStore.showGroupDialog(instance.$location.groupId)">
                                            {{ getInstancePrivacy(instance.$location.instanceId) }}
                                        </span>
                                    </el-tooltip>
                                    <span
                                        v-else
                                        class="instance-section__privacy privacy-badge"
                                        :class="getPrivacyColorClass(getInstancePrivacy(instance.$location.instanceId))">
                                        {{ getInstancePrivacy(instance.$location.instanceId) }}
                                    </span>
                                    <span v-if="instance.$location.region" :class="['flags', instance.$location.region]"></span>
                                    <span
                                        class="instance-section__capacity"
                                        :class="{ 'instance-section__capacity--full': instance.instance?.capacity && (instance.instance.userCount || 0) >= instance.instance.capacity }">
                                        ({{ (instance.instance?.userCount || 0) }}/{{ (instance.instance?.capacity || worldCard.world?.capacity || 0) }})({{ instance.friendCount }})
                                    </span>
                                    <div class="instance-section__actions">
                                        <Launch :location="instance.location" />
                                        <InviteYourself
                                            :location="instance.location"
                                            :shortname="instance.instance?.shortName || instance.instance?.secureName" />
                                        <el-tooltip
                                            placement="top"
                                            :content="t('dialog.world.instances.refresh_instance_info')">
                                            <el-button
                                                size="small"
                                                :icon="Refresh"
                                                circle
                                                @click="refreshInstancePlayerCount(instance.location)" />
                                        </el-tooltip>
                                    </div>
                                </div>
                                <!-- Friends list for this instance -->
                                <div
                                    class="instance-section__friends"
                                    :style="getFriendGridStyle(instance)">
                                    <div
                                        v-if="instance.$location.userId && instance.$location.user"
                                        class="instance-friend"
                                        @click="userStore.showUserDialog(instance.$location.userId)">
                                        <div class="avatar" :class="userStatusClass(instance.$location.user)">
                                            <img :src="userImage(instance.$location.user, true)" loading="lazy" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                :style="{ color: instance.$location.user.$userColour }"
                                                v-text="instance.$location.user.displayName" />
                                            <span class="extra">
                                                <template v-if="instance.$location.user.location === 'traveling'">
                                                    <el-icon class="is-loading" style="margin-right: 3px">
                                                        <Loading />
                                                    </el-icon>
                                                    <span v-if="instance.$location.user.$travelingToTime">
                                                        {{ timeAgo(instance.$location.user.$travelingToTime) }}
                                                    </span>
                                                </template>
                                                <template v-else>
                                                    <span v-if="instance.$location.user.$location_at">
                                                        {{ timeAgo(instance.$location.user.$location_at) }}
                                                    </span>
                                                    <span v-else>{{ t('dialog.user.info.instance_creator') }}</span>
                                                </template>
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        v-for="user in instance.users"
                                        :key="user.id"
                                        class="instance-friend"
                                        @click="userStore.showUserDialog(user.id)">
                                        <div class="avatar" :class="userStatusClass(user)">
                                            <img :src="userImage(user, true)" loading="lazy" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                :style="{ color: user.$userColour }"
                                                v-text="user.displayName" />
                                            <span class="extra">
                                                <template v-if="user.location === 'traveling'">
                                                    <el-icon class="is-loading" style="margin-right: 3px">
                                                        <Loading />
                                                    </el-icon>
                                                    <span v-if="user.$travelingToTime">
                                                        {{ timeAgo(user.$travelingToTime) }}
                                                    </span>
                                                </template>
                                                <template v-else>
                                                    <span v-if="user.$location_at">
                                                        {{ timeAgo(user.$location_at) }}
                                                    </span>
                                                    <span v-else>-</span>
                                                </template>
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        v-for="travelingUser in instance.travelingUsers"
                                        :key="'traveling-' + travelingUser.id"
                                        class="instance-friend traveling-user"
                                        @click="userStore.showUserDialog(travelingUser.id)">
                                        <div class="avatar" :class="userStatusClass(travelingUser)">
                                            <img :src="userImage(travelingUser, true)" loading="lazy" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                :style="{ color: travelingUser.$userColour }"
                                                v-text="travelingUser.displayName" />
                                            <span class="extra">
                                                <el-icon class="is-loading" style="margin-right: 3px">
                                                    <Loading />
                                                </el-icon>
                                                <span v-if="travelingUser.$travelingToTime">
                                                    {{ timeAgo(travelingUser.$travelingToTime) }}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="friend-view__empty">{{ t('view.friends_locations.no_matching_friends') }}</div>
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
    import { Loading, Search, Refresh } from '@element-plus/icons-vue';
    import { ElMessage } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { parseLocation } from '../../shared/utils/location.js';
    import { userImage, userStatusClass, timeToText } from '../../shared/utils';
    import { refreshInstancePlayerCount } from '../../shared/utils/instance.js';
    import { useFriendStore, useUserStore, useWorldStore, useInstanceStore, useLaunchStore, useGroupStore } from '../../stores';
    import worldReq from '../../api/world.js';
    import instanceReq from '../../api/instance.js';

    import FriendLocationCard from './components/FriendsLocationsCard.vue';
    import Launch from '../../components/Launch.vue';
    import InviteYourself from '../../components/InviteYourself.vue';
    import configRepository from '../../service/config.js';

    const { t } = useI18n();

    // Layout configuration constants
    const LAYOUT_CONFIG = {
        PAGE_SIZE: 18,
        VIEWPORT_BUFFER: 32,
        SCROLL_THRESHOLD: 120,
        LOAD_MORE_DELAY: 350,
        CARD_BASE_WIDTH: 220,
        CARD_BASE_GAP: 14,
        CARD_MIN_GAP: 6,
        CARD_GAP_SCALE_FACTOR: 10,
        WORLD_CARD_BASE_MIN_WIDTH: 240,
        WORLD_CARD_BASE_GAP: 12,
        FRIEND_GRID_MIN_WIDTH: {
            MANY: 70,      // 8 or more friends
            SEVERAL: 80,   // 6-7 friends
            FEW: 90,       // 4-5 friends
            DEFAULT: 100   // 3 or fewer friends
        },
        FRIEND_COUNT_THRESHOLDS: {
            MANY: 8,
            SEVERAL: 6,
            FEW: 4
        }
    };

    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const { currentUser, cachedUsers } = storeToRefs(userStore);
    const worldStore = useWorldStore();
    const { showWorldDialog } = worldStore;
    const instanceStore = useInstanceStore();
    const launchStore = useLaunchStore();
    const groupStore = useGroupStore();
    const { onlineFriends, vipFriends, activeFriends, offlineFriends } = storeToRefs(friendStore);

    const segmentedOptions = [
        { label: t('side_panel.online'), value: 'online' },
        { label: t('side_panel.favorite'), value: 'favorite' },
        { label: t('side_panel.active'), value: 'active' },
        { label: t('side_panel.offline'), value: 'offline' }
    ];

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

    const settingsReady = ref(false);

    const activeSegment = ref('online');
    const searchTerm = ref('');

    const itemsToShow = ref(LAYOUT_CONFIG.PAGE_SIZE);
    const isLoadingMore = ref(false);
    const scrollbarRef = ref();
    const gridWidth = ref(0);
    let resizeObserver;
    let cleanupResize;
    let scrollThrottleTimer = null;

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

    const toEntries = (list = []) =>
        Array.isArray(list)
            ? list.map((friend) => ({
                  id: friend.id ?? friend.userId ?? friend.displayName,
                  friend
              }))
            : [];

    const filteredFriends = computed(() => {
        if (normalizedSearchTerm.value) {
            const pools = [
                ...toEntries(vipFriends.value),
                ...toEntries(onlineFriends.value),
                ...toEntries(activeFriends.value),
                ...toEntries(offlineFriends.value)
            ];

            const seen = new Set();
            return pools.filter((entry) => {
                const key = entry.id;
                if (key && seen.has(key)) {
                    return false;
                }
                if (key) {
                    seen.add(key);
                }
                
                const { friend } = entry;
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
            case 'active':
                return toEntries(activeFriends.value);
            case 'offline':
                return toEntries(offlineFriends.value);
            default:
                return [];
        }
    });

    const visibleFriends = computed(() => filteredFriends.value.slice(0, itemsToShow.value));

    // Helper function to calculate grid style
    const calculateGridStyle = (count = 1, options = {}) => {
        const scale = cardScale.value;
        const spacing = cardSpacing.value;
        const minWidth = LAYOUT_CONFIG.CARD_BASE_WIDTH * scale;
        const gap = Math.max(
            LAYOUT_CONFIG.CARD_MIN_GAP,
            (LAYOUT_CONFIG.CARD_BASE_GAP + (scale - 1) * LAYOUT_CONFIG.CARD_GAP_SCALE_FACTOR) * spacing
        );

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

    const gridStyle = (count, options) => calculateGridStyle(count, options);

    const roomCardsGridStyle = computed(() => {
        const scale = cardScale.value;
        const spacing = cardSpacing.value;
        
        return {
            '--world-card-min-width': `${Math.round(LAYOUT_CONFIG.WORLD_CARD_BASE_MIN_WIDTH * scale)}px`,
            '--world-card-gap': `${Math.round(LAYOUT_CONFIG.WORLD_CARD_BASE_GAP * spacing)}px`
        };
    });

    const worldCardStyle = computed(() => {
        const scale = cardScale.value;
        const spacing = cardSpacing.value;
        
        return {
            '--world-card-scale': scale.toFixed(2),
            '--world-card-spacing': spacing.toFixed(2)
        };
    });

    const handleScroll = () => {
        // Throttle scroll events to improve performance
        if (scrollThrottleTimer) {
            return;
        }

        scrollThrottleTimer = setTimeout(() => {
            scrollThrottleTimer = null;
        }, 100);

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

        if (scrollTop + clientHeight >= scrollHeight - LAYOUT_CONFIG.SCROLL_THRESHOLD) {
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
                itemsToShow.value = Math.min(itemsToShow.value + LAYOUT_CONFIG.PAGE_SIZE, filteredFriends.value.length);
            }
            isLoadingMore.value = false;
            maybeFillViewport();
        }, LAYOUT_CONFIG.LOAD_MORE_DELAY);
    }

    function maybeFillViewport() {
        nextTick(() => {
            const wrap = scrollbarRef.value?.wrapRef;
            if (!wrap) {
                return;
            }

            const { scrollHeight, clientHeight } = wrap;
            const hasSpace = scrollHeight <= clientHeight + LAYOUT_CONFIG.VIEWPORT_BUFFER;

            if (!hasSpace || isLoadingMore.value) {
                return;
            }

            if (filteredFriends.value.length > visibleFriends.value.length) {
                loadMoreFriends();
            }
        });
    }

    watch([searchTerm, activeSegment], () => {
        itemsToShow.value = LAYOUT_CONFIG.PAGE_SIZE;
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

    const roomCards = ref([]);
    const isLoadingRoomCards = ref(false);
    const collapsedWorldIds = ref(new Set());

    function toggleWorldCollapse(worldId) {
        if (collapsedWorldIds.value.has(worldId)) {
            collapsedWorldIds.value.delete(worldId);
        } else {
            collapsedWorldIds.value.add(worldId);
        }
        // Trigger reactivity
        collapsedWorldIds.value = new Set(collapsedWorldIds.value);
    }

    function isWorldCollapsed(worldId) {
        return collapsedWorldIds.value.has(worldId);
    }

    const isOnlineView = computed(() => activeSegment.value === 'online');

    const filteredRoomCards = computed(() => {
        if (!normalizedSearchTerm.value) {
            return roomCards.value;
        }

        const searchLower = normalizedSearchTerm.value;
        
        return roomCards.value
            .map(worldCard => {
                const worldMatches = worldCard.world?.name?.toLowerCase().includes(searchLower);
                
                const filteredInstances = worldCard.instances.filter(instance => {
                    const userMatches = instance.users.some(user =>
                        user.displayName?.toLowerCase().includes(searchLower)
                    );
                    
                    const creatorMatches = instance.$location.user?.displayName?.toLowerCase().includes(searchLower);
                    
                    const travelingMatches = instance.travelingUsers.some(user =>
                        user.displayName?.toLowerCase().includes(searchLower)
                    );
                    
                    return userMatches || creatorMatches || travelingMatches;
                });
                
                if (worldMatches || filteredInstances.length > 0) {
                    return {
                        ...worldCard,
                        instances: filteredInstances.length > 0 ? filteredInstances : worldCard.instances
                    };
                }
                
                return null;
            })
            .filter(Boolean);
    });

    async function loadRoomCards() {
        if (isLoadingRoomCards.value) return;
        
        isLoadingRoomCards.value = true;
        try {
            const allOnlineFriends = [...vipFriends.value, ...onlineFriends.value];
            
            // Group by location first
            const locationGroups = new Map();
            const travelingUsers = new Map();
            
            // Add current user's location if they are in a world
            if (currentUser.value) {
                const myLocation = currentUser.value.$locationTag;
                const myTravelingTo = currentUser.value.$travelingToLocation;
                
                if (myLocation && myLocation.startsWith('wrld_')) {
                    if (!locationGroups.has(myLocation)) {
                        locationGroups.set(myLocation, []);
                    }
                    locationGroups.get(myLocation).push(currentUser.value);
                }
                
                if (myTravelingTo && myTravelingTo.startsWith('wrld_')) {
                    if (!locationGroups.has(myTravelingTo)) {
                        locationGroups.set(myTravelingTo, []);
                    }
                    if (!travelingUsers.has(myTravelingTo)) {
                        travelingUsers.set(myTravelingTo, []);
                    }
                    travelingUsers.get(myTravelingTo).push(currentUser.value);
                }
            }
            
            for (const friend of allOnlineFriends) {
                const location = friend.ref?.location;
                const travelingTo = friend.ref?.travelingToLocation;
                
                if (location && location.startsWith('wrld_')) {
                    if (!locationGroups.has(location)) {
                        locationGroups.set(location, []);
                    }
                    locationGroups.get(location).push(friend.ref);
                }
                
                if (location === 'traveling' && travelingTo && travelingTo.startsWith('wrld_')) {
                    if (!locationGroups.has(travelingTo)) {
                        locationGroups.set(travelingTo, []);
                    }
                    if (!travelingUsers.has(travelingTo)) {
                        travelingUsers.set(travelingTo, []);
                    }
                    travelingUsers.get(travelingTo).push(friend.ref);
                }
            }

            // Group instances by world ID
            const worldGroups = new Map();
            
            for (const [location, users] of locationGroups) {
                const L = parseLocation(location);
                const worldId = L.worldId;
                
                // Ensure region is set
                if (!L.region && L.instanceId) {
                    L.region = 'us'; // Default to US if no region specified
                }
                
                if (!worldGroups.has(worldId)) {
                    worldGroups.set(worldId, {
                        worldId,
                        instances: [],
                        world: null,
                        totalFriends: 0
                    });
                }
                
                let isCreatorFriend = false;
                if (L.userId) {
                    const user = userStore.cachedUsers.get(L.userId);
                    if (user) {
                        isCreatorFriend = users.some(u => u.id === L.userId);
                        if (isCreatorFriend) {
                            L.user = user;
                        }
                    }
                }
                
                const filteredUsers = isCreatorFriend && L.user
                    ? users.filter(u => u.id !== L.userId)
                    : users;
                
                const friendCount = filteredUsers.length + (L.user ? 1 : 0);
                
                worldGroups.get(worldId).instances.push({
                    location,
                    $location: L,
                    users: filteredUsers,
                    travelingUsers: travelingUsers.get(location) || [],
                    friendCount,
                    instance: null,
                    groupName: null
                });
                
                worldGroups.get(worldId).totalFriends += friendCount;
            }

            const cards = Array.from(worldGroups.values());
            // Sort by: 1. Total friends, 2. Instance count, 3. Favorite friends count
            cards.sort((a, b) => {
                // Priority 1: Total friends
                if (a.totalFriends !== b.totalFriends) {
                    return b.totalFriends - a.totalFriends;
                }
                
                // Priority 2: Instance count (more rooms = more priority)
                const aInstanceCount = a.instances.length;
                const bInstanceCount = b.instances.length;
                if (aInstanceCount !== bInstanceCount) {
                    return bInstanceCount - aInstanceCount;
                }
                
                // Priority 3: Favorite friends count
                const aFavoriteCount = a.instances.reduce((sum, inst) => {
                    const users = inst.users || [];
                    const favCount = users.filter(u => friendStore.localFavoriteFriends.has(u.id)).length;
                    return sum + favCount + (inst.$location.user && friendStore.localFavoriteFriends.has(inst.$location.userId) ? 1 : 0);
                }, 0);
                const bFavoriteCount = b.instances.reduce((sum, inst) => {
                    const users = inst.users || [];
                    const favCount = users.filter(u => friendStore.localFavoriteFriends.has(u.id)).length;
                    return sum + favCount + (inst.$location.user && friendStore.localFavoriteFriends.has(inst.$location.userId) ? 1 : 0);
                }, 0);
                
                if (aFavoriteCount !== bFavoriteCount) {
                    return bFavoriteCount - aFavoriteCount;
                }
                
                // Priority 4: World ID (for stability)
                return a.worldId.localeCompare(b.worldId);
            });
            
            cards.forEach(card => {
                card.instanceCountsByPrivacy = Object.entries(
                    card.instances.reduce((counts, instance) => {
                        const privacy = getInstancePrivacy(instance.$location.instanceId);
                        counts[privacy] = (counts[privacy] || 0) + 1;
                        return counts;
                    }, {})
                ).sort((a, b) => {
                    const order = { 'P': 1, 'GP': 1, 'F': 2, 'F+': 2, 'G': 3, 'G+': 3, 'I': 4 };
                    const orderA = order[a[0]] || 99;
                    const orderB = order[b[0]] || 99;
                    if (orderA !== orderB) {
                        return orderA - orderB;
                    }
                    return b[1] - a[1];
                });
            });
            roomCards.value = cards;
            isLoadingRoomCards.value = false;

            // Load world and instance data in parallel
            await Promise.all(
                cards.map(async (card) => {
                    const worldData = await worldReq.getCachedWorld({
                        worldId: card.worldId
                    }).catch(err => {
                        console.error('Failed to load world:', err);
                        return null;
                    });
                    
                    if (worldData) {
                        card.world = worldData.ref;
                    }
                    
                    await Promise.all(
                        card.instances.map(async (inst) => {
                            const instanceData = await instanceReq.getCachedInstance({
                                worldId: inst.$location.worldId,
                                instanceId: inst.$location.instanceId
                            }).catch(err => {
                                console.error('Failed to load instance:', err);
                                return null;
                            });
                            
                            if (instanceData) {
                                inst.instance = instanceData.ref;
                            }
                            
                            // Load group name if groupId exists
                            if (inst.$location.groupId) {
                                const group = groupStore.cachedGroups.get(inst.$location.groupId);
                                if (group && group.name) {
                                    inst.groupName = group.name;
                                }
                            }
                        })
                    );
                })
            );
        } catch (error) {
            console.error('Failed to load room cards:', error);
            ElMessage.error(t('message.friend.load_failed'));
            roomCards.value = [];
            isLoadingRoomCards.value = false;
        }
    }

    function timeAgo(timestamp) {
        if (!timestamp) return '-';
        const now = Date.now();
        const diff = now - timestamp;
        return timeToText(diff);
    }

    // Helper function to get instance privacy type (without group name)
    function getInstancePrivacy(instanceId) {
        if (!instanceId) return 'P';
        
        const parts = instanceId.split('~');
        if (parts.length <= 1) return 'P';
        
        const privacyPart = parts[1];
        if (privacyPart.startsWith('hidden')) return 'F+';
        if (privacyPart.startsWith('friends')) return 'F';
        if (privacyPart.startsWith('private')) return 'I';
        if (privacyPart.startsWith('group')) {
            const groupMatch = privacyPart.match(/^group\(([^)]+)\)/);
            if (groupMatch) {
                const accessType = groupMatch[1];
                if (accessType === 'plus') return 'G+';
                if (accessType === 'members') return 'G';
                return 'GP';
            }
            return 'GP';
        }
        return 'P';
    }

    function getPrivacyColorClass(privacyType) {
        switch (privacyType) {
            case 'F':
            case 'F+':
                return 'privacy-friends';
            case 'P':
            case 'GP':
                return 'privacy-public';
            case 'G':
            case 'G+':
                return 'privacy-group';
            case 'I':
                return 'privacy-invite';
            default:
                return '';
        }
    }

    // Calculate dynamic grid style based on friend count
    function getFriendGridStyle(instance) {
        const totalFriends = (instance.users?.length || 0) +
                           (instance.travelingUsers?.length || 0) +
                           (instance.$location.user ? 1 : 0);
        
        let minWidth;
        if (totalFriends >= LAYOUT_CONFIG.FRIEND_COUNT_THRESHOLDS.MANY) {
            minWidth = LAYOUT_CONFIG.FRIEND_GRID_MIN_WIDTH.MANY;
        } else if (totalFriends >= LAYOUT_CONFIG.FRIEND_COUNT_THRESHOLDS.SEVERAL) {
            minWidth = LAYOUT_CONFIG.FRIEND_GRID_MIN_WIDTH.SEVERAL;
        } else if (totalFriends >= LAYOUT_CONFIG.FRIEND_COUNT_THRESHOLDS.FEW) {
            minWidth = LAYOUT_CONFIG.FRIEND_GRID_MIN_WIDTH.FEW;
        } else {
            minWidth = LAYOUT_CONFIG.FRIEND_GRID_MIN_WIDTH.DEFAULT;
        }
        
        return {
            '--friend-min-width': `calc(${minWidth}px * var(--world-card-scale))`
        };
    }

    watch(isOnlineView, (isOnline) => {
        if (isOnline) {
            nextTick(() => loadRoomCards());
        }
    }, { immediate: true });

    watch(
        [
            () => onlineFriends.value.length,
            () => vipFriends.value.length,
            () => currentUser.value?.$locationTag,
            () => onlineFriends.value.map(f => f.ref?.location).join(','),
            () => vipFriends.value.map(f => f.ref?.location).join(',')
        ],
        () => {
            if (!isOnlineView.value) return;
            
            const allOnlineFriends = [...vipFriends.value, ...onlineFriends.value];
            const locationGroups = new Map();
            const travelingUsers = new Map();
            
            // Add current user's location if they are in a world
            if (currentUser.value) {
                const myLocation = currentUser.value.$locationTag;
                const myTravelingTo = currentUser.value.$travelingToLocation;
                
                if (myLocation && myLocation.startsWith('wrld_')) {
                    if (!locationGroups.has(myLocation)) {
                        locationGroups.set(myLocation, []);
                    }
                    locationGroups.get(myLocation).push(currentUser.value);
                }
                
                if (myTravelingTo && myTravelingTo.startsWith('wrld_')) {
                    if (!locationGroups.has(myTravelingTo)) {
                        locationGroups.set(myTravelingTo, []);
                    }
                    if (!travelingUsers.has(myTravelingTo)) {
                        travelingUsers.set(myTravelingTo, []);
                    }
                    travelingUsers.get(myTravelingTo).push(currentUser.value);
                }
            }
            
            for (const friend of allOnlineFriends) {
                const location = friend.ref?.location;
                const travelingTo = friend.ref?.travelingToLocation;
                
                if (location && location.startsWith('wrld_')) {
                    if (!locationGroups.has(location)) {
                        locationGroups.set(location, []);
                    }
                    locationGroups.get(location).push(friend.ref);
                }
                
                if (location === 'traveling' && travelingTo && travelingTo.startsWith('wrld_')) {
                    if (!locationGroups.has(travelingTo)) {
                        locationGroups.set(travelingTo, []);
                    }
                    if (!travelingUsers.has(travelingTo)) {
                        travelingUsers.set(travelingTo, []);
                    }
                    travelingUsers.get(travelingTo).push(friend.ref);
                }
            }

            // Group instances by world ID
            const worldGroups = new Map();
            
            for (const [location, users] of locationGroups) {
                const L = parseLocation(location);
                const worldId = L.worldId;
                
                // Ensure region is set
                if (!L.region && L.instanceId) {
                    L.region = 'us'; // Default to US if no region specified
                }
                
                if (!worldGroups.has(worldId)) {
                    worldGroups.set(worldId, {
                        worldId,
                        instances: [],
                        world: null,
                        totalFriends: 0
                    });
                }
                
                let isCreatorFriend = false;
                if (L.userId) {
                    const user = userStore.cachedUsers.get(L.userId);
                    if (user) {
                        isCreatorFriend = users.some(u => u.id === L.userId);
                        if (isCreatorFriend) {
                            L.user = user;
                        }
                    }
                }
                
                const filteredUsers = isCreatorFriend && L.user
                    ? users.filter(u => u.id !== L.userId)
                    : users;
                
                const friendCount = filteredUsers.length + (L.user ? 1 : 0);
                
                const existingWorld = roomCards.value.find(w => w.worldId === worldId);
                const existingInstance = existingWorld?.instances.find(i => i.location === location);
                
                worldGroups.get(worldId).instances.push({
                    location,
                    $location: L,
                    users: filteredUsers,
                    travelingUsers: travelingUsers.get(location) || [],
                    friendCount,
                    instance: existingInstance?.instance || null,
                    groupName: existingInstance?.groupName || null
                });
                
                worldGroups.get(worldId).totalFriends += friendCount;
                if (existingWorld?.world) {
                    worldGroups.get(worldId).world = existingWorld.world;
                }
            }

            const cards = Array.from(worldGroups.values());
            // Sort by: 1. Total friends, 2. Instance count, 3. Favorite friends count
            cards.sort((a, b) => {
                // Priority 1: Total friends
                if (a.totalFriends !== b.totalFriends) {
                    return b.totalFriends - a.totalFriends;
                }
                
                // Priority 2: Instance count (more rooms = more priority)
                const aInstanceCount = a.instances.length;
                const bInstanceCount = b.instances.length;
                if (aInstanceCount !== bInstanceCount) {
                    return bInstanceCount - aInstanceCount;
                }
                
                // Priority 3: Favorite friends count
                const aFavoriteCount = a.instances.reduce((sum, inst) => {
                    const users = inst.users || [];
                    const favCount = users.filter(u => friendStore.localFavoriteFriends.has(u.id)).length;
                    return sum + favCount + (inst.$location.user && friendStore.localFavoriteFriends.has(inst.$location.userId) ? 1 : 0);
                }, 0);
                const bFavoriteCount = b.instances.reduce((sum, inst) => {
                    const users = inst.users || [];
                    const favCount = users.filter(u => friendStore.localFavoriteFriends.has(u.id)).length;
                    return sum + favCount + (inst.$location.user && friendStore.localFavoriteFriends.has(inst.$location.userId) ? 1 : 0);
                }, 0);
                
                if (aFavoriteCount !== bFavoriteCount) {
                    return bFavoriteCount - aFavoriteCount;
                }
                
                // Priority 4: World ID (for stability)
                return a.worldId.localeCompare(b.worldId);
            });
            
            cards.forEach(card => {
                card.instanceCountsByPrivacy = Object.entries(
                    card.instances.reduce((counts, instance) => {
                        const privacy = getInstancePrivacy(instance.$location.instanceId);
                        counts[privacy] = (counts[privacy] || 0) + 1;
                        return counts;
                    }, {})
                ).sort((a, b) => {
                    const order = { 'P': 1, 'GP': 1, 'F': 2, 'F+': 2, 'G': 3, 'G+': 3, 'I': 4 };
                    const orderA = order[a[0]] || 99;
                    const orderB = order[b[0]] || 99;
                    if (orderA !== orderB) {
                        return orderA - orderB;
                    }
                    return b[1] - a[1];
                });
            });
            roomCards.value = cards;
            
            // Load missing world and instance data
            cards.forEach(card => {
                if (!card.world) {
                    worldReq.getCachedWorld({ worldId: card.worldId }).then(data => {
                        card.world = data.ref;
                    }).catch(err => console.error('Failed to load world:', err));
                }
                
                card.instances.forEach((inst) => {
                    if (!inst.instance) {
                        instanceReq.getCachedInstance({
                            worldId: inst.$location.worldId,
                            instanceId: inst.$location.instanceId
                        }).then(data => {
                            inst.instance = data.ref;
                        }).catch(err => console.error('Failed to load instance:', err));
                    }
                    
                    // Load group name if needed
                    if (inst.$location.groupId && !inst.groupName) {
                        const group = groupStore.cachedGroups.get(inst.$location.groupId);
                        if (group && group.name) {
                            inst.groupName = group.name;
                        }
                    }
                });
            });
        }
    );

    async function loadInitialSettings() {
        try {
            const [storedScale, storedSpacing] = await Promise.all([
                configRepository.getString('VRCX_FriendLocationCardScale', '1'),
                configRepository.getString('VRCX_FriendLocationCardSpacing', '1')
            ]);

            const parsedScale = parseFloat(storedScale);
            if (!Number.isNaN(parsedScale) && parsedScale > 0) {
                cardScaleBase.value = parsedScale;
            }

            const parsedSpacing = parseFloat(storedSpacing);
            if (!Number.isNaN(parsedSpacing) && parsedSpacing > 0) {
                cardSpacingBase.value = parsedSpacing;
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
        /* Element Plus provides .is-loading animation, no custom animation needed */
    }

    .flex-align-center {
        display: flex;
        align-items: center;
    }

    /* World cards grid - Masonry layout */
    .room-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(var(--world-card-min-width, 240px), 1fr));
        gap: var(--world-card-gap, 12px);
        padding: 2px;
        align-items: start;
    }

    /* World card container */
    .world-card {
        --world-card-scale: 1;
        --world-card-spacing: 1;
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-light);
        border-radius: calc(10px * var(--world-card-scale));
        overflow: hidden;
        transition: all 0.2s ease;
    }

    .world-card:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 calc(4px * var(--world-card-scale)) calc(12px * var(--world-card-scale)) rgba(102, 177, 255, 0.15);
        transform: translateY(calc(-2px * var(--world-card-scale)));
    }

    .world-card:has(.world-card__header--collapsed) {
        height: auto;
    }

    /* World card header */
    .world-card__header {
        display: flex;
        gap: calc(12px * var(--world-card-spacing));
        padding: calc(12px * var(--world-card-scale) * var(--world-card-spacing));
        border-bottom: 1px solid var(--el-border-color-lighter);
        cursor: pointer;
        position: relative;
        transition: all 0.3s ease;
    }

    .world-card__header--collapsed {
        border-bottom: none;
        padding-bottom: calc(12px * var(--world-card-scale) * var(--world-card-spacing));
    }

    .world-card__header:hover .world-card__collapse-toggle {
        opacity: 1;
    }

    .world-card__collapse-toggle {
        margin-left: auto;
        display: flex;
        align-items: center;
        opacity: 0.5;
        transition: all 0.3s ease;
        flex-shrink: 0;
    }

    .world-card__collapse-toggle .el-icon {
        font-size: calc(20px * var(--world-card-scale));
        transition: transform 0.3s ease;
    }

    .world-card__collapse-toggle .el-icon.is-collapsed {
        transform: rotate(-90deg);
    }

    .world-card__summary {
        display: flex;
        flex-direction: column;
        gap: calc(6px * var(--world-card-spacing));
        margin-top: calc(6px * var(--world-card-spacing));
        font-size: calc(12px * var(--world-card-scale));
        color: var(--el-text-color-secondary);
        line-height: 1.2;
    }

    .world-card__summary-main {
        display: flex;
        align-items: center;
        gap: calc(8px * var(--world-card-spacing));
    }

    .world-card__instance-count,
    .world-card__friend-count {
        display: inline-flex;
        align-items: center;
        font-weight: 600;
        white-space: nowrap;
    }

    .world-card__privacy-summary {
        display: flex;
        flex-wrap: wrap;
        gap: calc(4px * var(--world-card-spacing));
    }

    .privacy-badge {
        font-size: calc(10px * var(--world-card-scale));
        font-weight: 700;
        padding: calc(1px * var(--world-card-scale)) calc(4px * var(--world-card-scale));
        border-radius: calc(4px * var(--world-card-scale));
        color: #fff;
        background-color: var(--el-color-info-light-3);
    }

    .privacy-badge.privacy-public {
        background-color: #67c23a;
    }
    .privacy-badge.privacy-friends {
        background-color: #ff9500;
    }
    .privacy-badge.privacy-group {
        background-color: #a367ff;
    }
    .privacy-badge.privacy-invite {
        background-color: #909399;
    }

    .world-card__thumbnail {
        flex: none;
        width: calc(72px * var(--world-card-scale));
        height: calc(48px * var(--world-card-scale));
        border-radius: calc(6px * var(--world-card-scale));
        overflow: hidden;
    }

    .world-card__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.2s ease;
        cursor: pointer;
    }

    .world-card__image:hover {
        transform: scale(1.05);
    }

    .world-card__info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .world-card__title {
        font-weight: 600;
        font-size: calc(15px * var(--world-card-scale));
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .world-card__name {
        cursor: pointer;
        color: var(--el-text-color-primary);
    }

    .world-card__name:hover {
        text-decoration: underline;
        color: var(--el-color-primary);
    }

    /* Instances section */
    .world-card__instances {
        padding: calc(8px * var(--world-card-scale)) calc(12px * var(--world-card-scale)) calc(12px * var(--world-card-scale));
        display: flex;
        flex-direction: column;
        gap: calc(12px * var(--world-card-spacing));
    }

    .instance-section {
        display: flex;
        flex-direction: column;
        gap: calc(6px * var(--world-card-spacing));
    }

    .instance-section__info {
        display: flex;
        align-items: center;
        gap: calc(6px * var(--world-card-spacing));
        font-size: calc(13px * var(--world-card-scale));
        font-weight: 500;
        padding: calc(6px * var(--world-card-spacing)) 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .instance-section__number {
        color: var(--el-text-color-primary);
        font-size: calc(12px * var(--world-card-scale));
        flex-shrink: 0;
    }

    .instance-section__privacy {
        font-size: calc(11px * var(--world-card-scale));
        flex-shrink: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
        transform: scale(0.75);
    }

    .instance-section__privacy.has-group-info {
        cursor: pointer;
        transition: filter 0.2s ease;
    }

    .instance-section__privacy.has-group-info:hover {
        filter: brightness(1.15);
    }

    .instance-section__capacity {
        color: var(--el-text-color-secondary);
    }

    .instance-section__capacity--full {
        color: var(--el-color-danger);
        font-weight: 600;
    }

    .instance-section__actions {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: calc(4px * var(--world-card-spacing));
    }

    .instance-section__info .flags {
        transform: scale(calc(0.75 * var(--world-card-scale)));
        display: inline-block;
        flex-shrink: 0;
        margin-left: calc(-2px * var(--world-card-scale));
    }


    /* Instance friends list */
    .instance-section__friends {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(var(--friend-min-width, calc(100px * var(--world-card-scale))), 1fr));
        gap: calc(6px * var(--world-card-spacing));
    }

    .instance-friend {
        display: flex;
        align-items: center;
        gap: calc(6px * var(--world-card-spacing));
        padding: calc(4px * var(--world-card-scale));
        background: var(--el-fill-color-light);
        border-radius: calc(6px * var(--world-card-scale));
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 0;
    }

    .instance-friend:hover {
        background: var(--el-fill-color);
        transform: translateX(calc(2px * var(--world-card-scale)));
    }

    .instance-friend .avatar {
        width: calc(28px * var(--world-card-scale));
        height: calc(28px * var(--world-card-scale));
        border-radius: 50%;
        flex-shrink: 0;
        overflow: visible;
        position: relative;
    }

    .instance-friend .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    }

    .instance-friend .avatar.active::after,
    .instance-friend .avatar.online::after,
    .instance-friend .avatar.joinme::after,
    .instance-friend .avatar.askme::after,
    .instance-friend .avatar.busy::after,
    .instance-friend .avatar.offline::after {
        position: absolute;
        right: calc(-2px * var(--world-card-scale));
        bottom: calc(-2px * var(--world-card-scale));
        width: calc(10px * var(--world-card-scale));
        height: calc(10px * var(--world-card-scale));
        content: '';
        background: #909399;
        border-radius: 50%;
        border: calc(2px * var(--world-card-scale)) solid var(--el-fill-color-light);
        box-sizing: border-box;
    }

    .instance-friend .avatar.active::after {
        background: #f4e05e;
    }

    .instance-friend .avatar.online::after {
        background: #67c23a;
    }

    .instance-friend .avatar.joinme::after {
        background: #409eff;
        mask-image: url(/images/masks/joinme.svg);
    }

    .instance-friend .avatar.askme::after {
        background: #ff9500;
        mask-image: url(/images/masks/askme.svg);
    }

    .instance-friend .avatar.busy::after {
        background: #ff2c2c;
        mask-image: url(/images/masks/busy.svg);
    }

    .instance-friend .avatar.offline::after {
        background: #909399;
    }

    .instance-friend .avatar.online.mobile::after,
    .instance-friend .avatar.joinme.mobile::after,
    .instance-friend .avatar.askme.mobile::after,
    .instance-friend .avatar.busy.mobile::after {
        position: absolute;
        right: calc(-2px * var(--world-card-scale));
        bottom: calc(-2px * var(--world-card-scale));
        width: calc(11px * var(--world-card-scale));
        height: calc(11px * var(--world-card-scale));
        content: '';
        border-radius: 0px;
        mask-image: url(/images/masks/phone.svg);
        border: calc(2px * var(--world-card-scale)) solid var(--el-fill-color-light);
        box-sizing: border-box;
    }

    .instance-friend .detail {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: calc(2px * var(--world-card-spacing));
    }

    .instance-friend .name {
        font-size: calc(12px * var(--world-card-scale));
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .instance-friend .extra {
        font-size: calc(10px * var(--world-card-scale));
        color: var(--el-text-color-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
    }

    /* Loading skeleton */
    @keyframes shimmer {
        0% {
            background-position: -468px 0;
        }
        100% {
            background-position: 468px 0;
        }
    }

    .skeleton {
        animation: shimmer 1.2s ease-in-out infinite;
        background: linear-gradient(
            to right,
            var(--el-fill-color-light) 8%,
            var(--el-fill-color-lighter) 18%,
            var(--el-fill-color-light) 33%
        );
        background-size: 800px 104px;
    }

    .room-card__skeleton {
        display: flex;
        gap: 12px;
        padding: 12px;
    }

    .room-card__skeleton-thumbnail {
        width: 120px;
        height: 90px;
        border-radius: 8px;
    }

    .room-card__skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .room-card__skeleton-title {
        height: 20px;
        width: 60%;
        border-radius: 4px;
    }

    .room-card__skeleton-info {
        height: 16px;
        width: 40%;
        border-radius: 4px;
    }

    .room-card__skeleton-friends {
        display: flex;
        gap: 8px;
        margin-top: 8px;
    }

    .room-card__skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
    }

    /* Traveling user styles */
    .traveling-user {
        opacity: 0.7;
    }

    .traveling-user .avatar {
        position: relative;
    }

    .traveling-user .avatar::after {
        content: '';
        position: absolute;
        right: calc(-2px * var(--world-card-scale));
        bottom: calc(-2px * var(--world-card-scale));
        width: calc(10px * var(--world-card-scale));
        height: calc(10px * var(--world-card-scale));
        background: var(--el-color-warning);
        border-radius: 50%;
        border: calc(2px * var(--world-card-scale)) solid var(--el-fill-color-light);
        box-sizing: border-box;
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.5;
            transform: scale(1.1);
        }
    }
</style>
