<template>
    <div ref="scrollRootRef" class="relative h-full">
        <div ref="scrollViewportRef" class="h-full w-full overflow-auto">
            <div class="x-friend-list px-1.5 py-2.5">
                <div v-if="virtualRows.length" class="relative w-full box-border" :style="virtualContainerStyle">
                    <template v-for="item in virtualItems" :key="String(item.virtualItem.key)">
                        <div
                            v-if="item.row"
                            class="absolute left-0 top-0 w-full box-border"
                            :data-index="item.virtualItem.index"
                            :ref="virtualizer.measureElement"
                            :style="rowStyle(item)">
                            <template v-if="item.row.type === 'toggle-header'">
                                <div
                                    class="x-friend-group flex cursor-pointer items-center pt-4 pb-1.5 text-xs"
                                    :style="item.row.headerPadding ? { padding: item.row.headerPadding } : undefined"
                                    @click="item.row.onClick && item.row.onClick()">
                                    <ChevronDown
                                        class="transition-transform duration-200 ease-in-out"
                                        :class="{ '-rotate-90': !item.row.expanded }" />
                                    <span class="ml-1.5">
                                        {{ item.row.label }}
                                        <template v-if="item.row.count !== null && item.row.count !== undefined">
                                            &horbar; {{ item.row.count }}
                                        </template>
                                    </span>
                                </div>
                            </template>

                            <template v-else-if="item.row.type === 'me-item'">
                                <div class="x-friend-item" @click="showUserDialog(currentUser.id)">
                                    <div class="avatar" :class="userStatusClass(currentUser)">
                                        <img :src="userImage(currentUser)" loading="lazy" />
                                    </div>
                                    <div class="detail h-9 flex flex-col justify-between">
                                        <span class="name" :style="{ color: currentUser.$userColour }">{{
                                            currentUser.displayName
                                        }}</span>
                                        <Location
                                            v-if="isGameRunning && !gameLogDisabled"
                                            class="extra block truncate text-xs"
                                            :location="lastLocation.location"
                                            :traveling="lastLocationDestination"
                                            :link="false" />
                                        <Location
                                            v-else-if="
                                                isRealInstance(currentUser.$locationTag) ||
                                                isRealInstance(currentUser.$travelingToLocation)
                                            "
                                            class="extra block truncate text-xs"
                                            :location="currentUser.$locationTag"
                                            :traveling="currentUser.$travelingToLocation"
                                            :link="false" />

                                        <span v-else class="extra block truncate text-xs">{{
                                            currentUser.statusDescription
                                        }}</span>
                                    </div>
                                </div>
                            </template>

                            <template v-else-if="item.row.type === 'vip-subheader'">
                                <div>
                                    <span class="text-xs">{{ item.row.label }}</span>
                                    <span class="text-xs ml-1.5">{{ `(${item.row.count})` }}</span>
                                </div>
                            </template>

                            <template v-else-if="item.row.type === 'instance-header'">
                                <div class="mb-1 flex items-center">
                                    <Location class="inline text-xs" :location="item.row.location" />
                                    <span class="text-xs ml-1.5">{{ `(${item.row.count})` }}</span>
                                </div>
                            </template>

                            <template v-else-if="item.row.type === 'friend-item'">
                                <friend-item
                                    :friend="item.row.friend"
                                    :style="item.row.itemStyle"
                                    :is-group-by-instance="item.row.isGroupByInstance" />
                            </template>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <BackToTop :virtualizer="virtualizer" :target="scrollViewportRef" :tooltip="false" />
    </div>
</template>

<script setup>
    import { computed, nextTick, onMounted, ref, watch } from 'vue';
    import { ChevronDown } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useVirtualizer } from '@tanstack/vue-virtual';

    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useFavoriteStore,
        useFriendStore,
        useGameStore,
        useLocationStore,
        useUserStore
    } from '../../../stores';
    import { isRealInstance, userImage, userStatusClass } from '../../../shared/utils';
    import { getFriendsLocations } from '../../../shared/utils/location.js';

    import BackToTop from '../../../components/BackToTop.vue';
    import FriendItem from './FriendItem.vue';
    import Location from '../../../components/Location.vue';
    import configRepository from '../../../service/config';

    const { t } = useI18n();

    const friendStore = useFriendStore();
    const { vipFriends, onlineFriends, activeFriends, offlineFriends, friendsInSameInstance } =
        storeToRefs(friendStore);
    const { isSidebarGroupByInstance, isHideFriendsInSameInstance, isSidebarDivideByFriendGroup } =
        storeToRefs(useAppearanceSettingsStore());
    const { gameLogDisabled } = storeToRefs(useAdvancedSettingsStore());
    const { showUserDialog } = useUserStore();
    const { favoriteFriendGroups, groupedByGroupKeyFavoriteFriends } = storeToRefs(useFavoriteStore());
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { currentUser } = storeToRefs(useUserStore());

    const isFriendsGroupMe = ref(true);
    const isVIPFriends = ref(true);
    const isOnlineFriends = ref(true);
    const isActiveFriends = ref(true);
    const isOfflineFriends = ref(true);
    const isSidebarGroupByInstanceCollapsed = ref(false);
    const scrollViewportRef = ref(null);
    const scrollRootRef = ref(null);

    loadFriendsGroupStates();

    const sameInstanceFriendId = computed(() => {
        const sameInstanceFriendId = new Set();
        for (const item of friendsInSameInstance.value) {
            for (const friend of item) {
                if (isRealInstance(friend.ref?.$location.tag) || lastLocation.value.friendList.has(friend.id)) {
                    sameInstanceFriendId.add(friend.id);
                }
            }
        }
        return sameInstanceFriendId;
    });

    const onlineFriendsByGroupStatus = computed(() => {
        if (!isSidebarGroupByInstance.value || !isHideFriendsInSameInstance.value) {
            return onlineFriends.value;
        }

        return onlineFriends.value.filter((item) => !sameInstanceFriendId.value.has(item.id));
    });

    const vipFriendsByGroupStatus = computed(() => {
        if (!isSidebarGroupByInstance.value || !isHideFriendsInSameInstance.value) {
            return vipFriends.value;
        }

        return vipFriends.value.filter((item) => !sameInstanceFriendId.value.has(item.id));
    });

    // VIP friends divide by group
    const vipFriendsDivideByGroup = computed(() => {
        const vipFriendsByGroup = { ...groupedByGroupKeyFavoriteFriends.value };
        const result = [];

        for (const key in vipFriendsByGroup) {
            if (Object.hasOwn(vipFriendsByGroup, key)) {
                const groupFriends = vipFriendsByGroup[key];
                // sort groupFriends using the order of vipFriends
                // avoid unnecessary sorting
                const filteredFriends = vipFriends.value.filter((friend) =>
                    groupFriends.some((item) => {
                        if (isSidebarGroupByInstance.value && isHideFriendsInSameInstance.value) {
                            return item.id === friend.id && !sameInstanceFriendId.value.has(item.id);
                        }
                        return item.id === friend.id;
                    })
                );

                if (filteredFriends.length > 0) {
                    const groupName = favoriteFriendGroups.value.find((item) => item.key === key)?.displayName || '';
                    result.push(filteredFriends.map((item) => ({ groupName, key, ...item })));
                }
            }
        }

        return result.sort((a, b) => a[0].key.localeCompare(b[0].key));
    });

    const vipFriendsDisplayNumber = computed(() => {
        return isSidebarDivideByFriendGroup.value
            ? vipFriendsDivideByGroup.value.length
            : vipFriendsByGroupStatus.value.length;
    });

    const buildToggleRow = ({
        key,
        label,
        count = null,
        expanded = true,
        headerPadding = null,
        paddingBottom = null,
        onClick = null
    }) => ({
        type: 'toggle-header',
        key,
        label,
        count,
        expanded,
        headerPadding,
        paddingBottom,
        onClick
    });
    const buildFriendRow = (friend, key, options = {}) => ({
        type: 'friend-item',
        key,
        friend,
        isGroupByInstance: options.isGroupByInstance,
        paddingBottom: options.paddingBottom,
        itemStyle: options.itemStyle
    });
    const buildVipSubheaderRow = (label, count, key) => ({
        type: 'vip-subheader',
        key,
        label,
        count,
        paddingBottom: 4
    });
    const buildInstanceHeaderRow = (location, count, key) => ({
        type: 'instance-header',
        key,
        location,
        count,
        paddingBottom: 4
    });

    const virtualRows = computed(() => {
        const rows = [];

        rows.push(
            buildToggleRow({
                key: 'me-header',
                label: t('side_panel.me'),
                expanded: isFriendsGroupMe.value,
                headerPadding: '0 0 5px',
                onClick: toggleFriendsGroupMe
            })
        );

        if (isFriendsGroupMe.value) {
            rows.push({ type: 'me-item', key: `me:${currentUser.value?.id ?? 'me'}` });
        }

        if (vipFriendsDisplayNumber.value) {
            rows.push(
                buildToggleRow({
                    key: 'vip-header',
                    label: t('side_panel.favorite'),
                    count: vipFriendsDisplayNumber.value,
                    expanded: isVIPFriends.value,
                    onClick: toggleVIPFriends
                })
            );
        }

        if (isVIPFriends.value) {
            if (isSidebarDivideByFriendGroup.value) {
                vipFriendsDivideByGroup.value.forEach((group, groupIndex) => {
                    const groupName = group?.[0]?.groupName ?? '';
                    const groupKey = group?.[0]?.key ?? groupIndex;
                    if (groupName) {
                        rows.push(buildVipSubheaderRow(groupName, group.length, `vip-subheader:${groupKey}`));
                    }
                    group.forEach((friend, idx) => {
                        rows.push(
                            buildFriendRow(friend, `vip:${groupKey}:${friend?.id ?? idx}`, {
                                paddingBottom: idx === group.length - 1 ? 10 : undefined
                            })
                        );
                    });
                });
            } else {
                vipFriendsByGroupStatus.value.forEach((friend, idx) => {
                    rows.push(buildFriendRow(friend, `vip:${friend?.id ?? idx}`));
                });
            }
        }

        if (isSidebarGroupByInstance.value && friendsInSameInstance.value.length) {
            rows.push(
                buildToggleRow({
                    key: 'same-instance-header',
                    label: t('side_panel.same_instance'),
                    count: friendsInSameInstance.value.length,
                    expanded: !isSidebarGroupByInstanceCollapsed.value,
                    onClick: toggleSwitchGroupByInstanceCollapsed,
                    paddingBottom: 4
                })
            );

            if (!isSidebarGroupByInstanceCollapsed.value) {
                friendsInSameInstance.value.forEach((friendArr, groupIndex) => {
                    if (!friendArr || !friendArr.length) return;
                    const groupKey = friendArr?.[0]?.ref?.$location?.tag ?? `group-${groupIndex}`;
                    rows.push(
                        buildInstanceHeaderRow(getFriendsLocations(friendArr), friendArr.length, `instance:${groupKey}`)
                    );
                    friendArr.forEach((friend, idx) => {
                        rows.push(
                            buildFriendRow(friend, `instance:${groupKey}:${friend?.id ?? idx}`, {
                                isGroupByInstance: true,
                                paddingBottom: idx === friendArr.length - 1 ? 5 : undefined,
                                itemStyle: idx === friendArr.length - 1 ? { marginBottom: '5px' } : undefined
                            })
                        );
                    });
                });
            }
        }

        if (onlineFriendsByGroupStatus.value.length) {
            rows.push(
                buildToggleRow({
                    key: 'online-header',
                    label: t('side_panel.online'),
                    count: onlineFriendsByGroupStatus.value.length,
                    expanded: isOnlineFriends.value,
                    onClick: toggleOnlineFriends
                })
            );
        }

        if (isOnlineFriends.value) {
            onlineFriendsByGroupStatus.value.forEach((friend, idx) => {
                rows.push(buildFriendRow(friend, `online:${friend?.id ?? idx}`));
            });
        }

        if (activeFriends.value.length) {
            rows.push(
                buildToggleRow({
                    key: 'active-header',
                    label: t('side_panel.active'),
                    count: activeFriends.value.length,
                    expanded: isActiveFriends.value,
                    onClick: toggleActiveFriends
                })
            );
        }

        if (isActiveFriends.value) {
            activeFriends.value.forEach((friend, idx) => {
                rows.push(buildFriendRow(friend, `active:${friend?.id ?? idx}`));
            });
        }

        if (offlineFriends.value.length) {
            rows.push(
                buildToggleRow({
                    key: 'offline-header',
                    label: t('side_panel.offline'),
                    count: offlineFriends.value.length,
                    expanded: isOfflineFriends.value,
                    onClick: toggleOfflineFriends
                })
            );
        }

        if (isOfflineFriends.value) {
            offlineFriends.value.forEach((friend, idx) => {
                rows.push(buildFriendRow(friend, `offline:${friend?.id ?? idx}`));
            });
        }

        return rows;
    });

    const estimateRowSize = (row) => {
        if (!row) {
            return 44;
        }
        if (row.type === 'toggle-header') {
            return 28 + (row.paddingBottom || 0);
        }
        if (row.type === 'vip-subheader') {
            return 24 + (row.paddingBottom || 0);
        }
        if (row.type === 'instance-header') {
            return 26 + (row.paddingBottom || 0);
        }
        return 52 + (row.paddingBottom || 0);
    };

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: virtualRows.value.length,
            getScrollElement: () => scrollViewportRef.value,
            estimateSize: (index) => estimateRowSize(virtualRows.value[index]),
            getItemKey: (index) => virtualRows.value[index]?.key ?? index,
            overscan: 6
        }))
    );

    const virtualItems = computed(() => {
        const items = virtualizer.value?.getVirtualItems?.() ?? [];
        return items.map((virtualItem) => ({
            virtualItem,
            row: virtualRows.value[virtualItem.index]
        }));
    });

    const virtualContainerStyle = computed(() => ({
        height: `${virtualizer.value?.getTotalSize?.() ?? 0}px`,
        width: '100%'
    }));

    const rowStyle = (item) => {
        const paddingBottom = item?.row?.paddingBottom;
        return {
            transform: `translateY(${item.virtualItem.start}px)`,
            ...(paddingBottom ? { paddingBottom: `${paddingBottom}px` } : {})
        };
    };

    function saveFriendsGroupStates() {
        configRepository.setBool('VRCX_isFriendsGroupMe', isFriendsGroupMe.value);
        configRepository.setBool('VRCX_isFriendsGroupFavorites', isVIPFriends.value);
        configRepository.setBool('VRCX_isFriendsGroupOnline', isOnlineFriends.value);
        configRepository.setBool('VRCX_isFriendsGroupActive', isActiveFriends.value);
        configRepository.setBool('VRCX_isFriendsGroupOffline', isOfflineFriends.value);
    }

    async function loadFriendsGroupStates() {
        isFriendsGroupMe.value = await configRepository.getBool('VRCX_isFriendsGroupMe', true);
        isVIPFriends.value = await configRepository.getBool('VRCX_isFriendsGroupFavorites', true);
        isOnlineFriends.value = await configRepository.getBool('VRCX_isFriendsGroupOnline', true);
        isActiveFriends.value = await configRepository.getBool('VRCX_isFriendsGroupActive', false);
        isOfflineFriends.value = await configRepository.getBool('VRCX_isFriendsGroupOffline', true);
        isSidebarGroupByInstanceCollapsed.value = await configRepository.getBool(
            'VRCX_sidebarGroupByInstanceCollapsed',
            false
        );
    }

    function toggleSwitchGroupByInstanceCollapsed() {
        isSidebarGroupByInstanceCollapsed.value = !isSidebarGroupByInstanceCollapsed.value;
        configRepository.setBool('VRCX_sidebarGroupByInstanceCollapsed', isSidebarGroupByInstanceCollapsed.value);
    }

    function toggleFriendsGroupMe() {
        isFriendsGroupMe.value = !isFriendsGroupMe.value;
        saveFriendsGroupStates();
    }

    function toggleVIPFriends() {
        isVIPFriends.value = !isVIPFriends.value;
        saveFriendsGroupStates();
    }

    function toggleOnlineFriends() {
        isOnlineFriends.value = !isOnlineFriends.value;
        saveFriendsGroupStates();
    }

    function toggleActiveFriends() {
        isActiveFriends.value = !isActiveFriends.value;
        saveFriendsGroupStates();
    }

    function toggleOfflineFriends() {
        isOfflineFriends.value = !isOfflineFriends.value;
        saveFriendsGroupStates();
    }

    onMounted(() => {
        nextTick(() => {
            virtualizer.value?.measure?.();
        });
    });

    const virtualRowCount = computed(() => virtualRows.value.length);
    watch(virtualRowCount, () => {
        nextTick(() => {
            virtualizer.value?.measure?.();
        });
    });
</script>
