<template>
    <div class="relative h-full">
        <div ref="scrollViewportRef" class="h-full w-full overflow-auto">
            <div class="px-1.5 py-2.5">
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
                                    class="flex cursor-pointer items-center pt-4 pb-1.5 text-xs"
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
                                <ContextMenu>
                                    <ContextMenuTrigger as-child>
                                        <div
                                            class="friend-row box-border flex items-center p-1.5 text-[13px] cursor-pointer hover:bg-muted/50 hover:rounded-lg"
                                            @click="showUserDialog(currentUser.id)">
                                            <div
                                                class="relative inline-block flex-none size-9 mr-2.5"
                                                :class="userStatusClass(currentUser)">
                                                <Avatar class="size-full rounded-full">
                                                    <AvatarImage :src="userImage(currentUser)" class="object-cover" />
                                                    <AvatarFallback>
                                                        <User class="size-5 text-muted-foreground" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div class="flex-1 overflow-hidden h-9 flex flex-col justify-between">
                                                <span
                                                    class="block truncate font-medium leading-[18px]"
                                                    :style="{ color: currentUser.$userColour }"
                                                    >{{ currentUser.displayName }}</span
                                                >
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
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuSub>
                                            <ContextMenuSubTrigger>
                                                {{ t('dialog.user.actions.edit_status') }}
                                            </ContextMenuSubTrigger>
                                            <ContextMenuSubContent>
                                                <ContextMenuCheckboxItem
                                                    v-for="option in statusOptions"
                                                    :key="option.value"
                                                    :model-value="currentUser.status === option.value"
                                                    class="gap-2"
                                                    @click="changeStatus(option.value)">
                                                    <i class="x-user-status" :class="option.statusClass"></i>
                                                    {{ option.label }}
                                                </ContextMenuCheckboxItem>
                                            </ContextMenuSubContent>
                                        </ContextMenuSub>
                                        <ContextMenuSub>
                                            <ContextMenuSubTrigger>
                                                {{ t('dialog.social_status.history') }}
                                            </ContextMenuSubTrigger>
                                            <ContextMenuSubContent>
                                                <ContextMenuCheckboxItem
                                                    :model-value="!currentUser.statusDescription"
                                                    @click="setStatusFromHistory('')">
                                                    {{ t('dialog.gallery_select.none') }}
                                                </ContextMenuCheckboxItem>
                                                <ContextMenuSeparator v-if="recentStatuses.length" />
                                                <ContextMenuCheckboxItem
                                                    v-for="(item, idx) in recentStatuses"
                                                    :key="idx"
                                                    :model-value="currentUser.statusDescription === item"
                                                    @click="setStatusFromHistory(item)">
                                                    {{ item }}
                                                </ContextMenuCheckboxItem>
                                            </ContextMenuSubContent>
                                        </ContextMenuSub>
                                        <ContextMenuSub v-if="statusPresets.length">
                                            <ContextMenuSubTrigger>
                                                {{ t('dialog.social_status.presets') }}
                                            </ContextMenuSubTrigger>
                                            <ContextMenuSubContent>
                                                <ContextMenuItem
                                                    v-for="(preset, idx) in statusPresets"
                                                    :key="idx"
                                                    class="gap-2"
                                                    @click="applyStatusPreset(preset)">
                                                    <i class="x-user-status" :class="presetStatusClass(preset.status)"></i>
                                                    <span class="truncate max-w-[180px]">{{ getPresetDisplayText(preset) }}</span>
                                                </ContextMenuItem>
                                            </ContextMenuSubContent>
                                        </ContextMenuSub>
                                    </ContextMenuContent>
                                </ContextMenu>
                            </template>

                            <template v-else-if="item.row.type === 'instance-header'">
                                <div class="mb-1 flex items-center">
                                    <Location class="inline text-xs" :location="item.row.location" />
                                    <span class="text-xs ml-1.5">{{ `(${item.row.count})` }}</span>
                                </div>
                            </template>

                            <template v-else-if="item.row.type === 'friend-item'">
                                <ContextMenu>
                                    <ContextMenuTrigger as-child>
                                        <FriendItem
                                            :friend="item.row.friend"
                                            :style="item.row.itemStyle"
                                            :is-group-by-instance="item.row.isGroupByInstance" />
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem
                                            v-if="item.row.friend.state === 'online'"
                                            @click="friendRequestInvite(item.row.friend)">
                                            {{ t('dialog.user.actions.request_invite') }}
                                        </ContextMenuItem>
                                        <ContextMenuItem
                                            v-if="isGameRunning"
                                            :disabled="!canInviteToMyLocation"
                                            @click="friendInvite(item.row.friend)">
                                            {{ t('dialog.user.actions.invite') }}
                                        </ContextMenuItem>
                                        <ContextMenuItem
                                            :disabled="!currentUser.isBoopingEnabled"
                                            @click="friendSendBoop(item.row.friend)">
                                            {{ t('dialog.user.actions.send_boop') }}
                                        </ContextMenuItem>
                                        <ContextMenuSeparator
                                            v-if="
                                                item.row.friend.state === 'online' && hasFriendLocation(item.row.friend)
                                            " />
                                        <ContextMenuItem
                                            v-if="
                                                item.row.friend.state === 'online' && hasFriendLocation(item.row.friend)
                                            "
                                            :disabled="!canJoinFriend(item.row.friend)"
                                            @click="friendJoin(item.row.friend)">
                                            {{ t('dialog.user.info.launch_invite_tooltip') }}
                                        </ContextMenuItem>
                                        <ContextMenuItem
                                            v-if="
                                                item.row.friend.state === 'online' && hasFriendLocation(item.row.friend)
                                            "
                                            :disabled="!canJoinFriend(item.row.friend)"
                                            @click="friendInviteSelf(item.row.friend)">
                                            {{ t('dialog.user.info.self_invite_tooltip') }}
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
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
    import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
    import { ChevronDown, User } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { useVirtualizer } from '@tanstack/vue-virtual';

    import {
        ContextMenu,
        ContextMenuCheckboxItem,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuSub,
        ContextMenuSubContent,
        ContextMenuSubTrigger,
        ContextMenuTrigger
    } from '../../../components/ui/context-menu';
    import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useFavoriteStore,
        useFriendStore,
        useGameStore,
        useLaunchStore,
        useLocationStore,
        useUserStore
    } from '../../../stores';
    import { buildFriendRow, buildInstanceHeaderRow, buildToggleRow, estimateRowSize } from '../friendsSidebarUtils';
    import { getFriendsSortFunction, isRealInstance } from '../../../shared/utils';
    import { instanceRequest, notificationRequest, queryRequest, userRequest } from '../../../api';
    import { useInviteChecks } from '../../../composables/useInviteChecks';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { getFriendsLocations } from '../../../shared/utils/location.js';
    import { parseLocation } from '../../../shared/utils';

    import BackToTop from '../../../components/BackToTop.vue';
    import FriendItem from './FriendItem.vue';
    import Location from '../../../components/Location.vue';
    import configRepository from '../../../services/config';
    import { useStatusPresets } from '../../../components/dialogs/UserDialog/composables/useStatusPresets';

    import '@/styles/status-icon.css';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const { t } = useI18n();

    const friendStore = useFriendStore();
    const {
        allFavoriteOnlineFriends,
        allFavoriteFriendIds,
        onlineFriends,
        activeFriends,
        offlineFriends,
        friendsInSameInstance
    } = storeToRefs(friendStore);
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const {
        isSidebarGroupByInstance,
        isHideFriendsInSameInstance,
        isSameInstanceAboveFavorites,
        isSidebarDivideByFriendGroup,
        sidebarFavoriteGroups,
        sidebarFavoriteGroupOrder,
        sidebarSortMethods
    } = storeToRefs(appearanceSettingsStore);
    const { gameLogDisabled } = storeToRefs(useAdvancedSettingsStore());
    const { showSendBoopDialog } = useUserStore();
    const launchStore = useLaunchStore();
    const { favoriteFriendGroups, groupedByGroupKeyFavoriteFriends, localFriendFavorites } =
        storeToRefs(useFavoriteStore());
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { checkCanInvite, checkCanInviteSelf } = useInviteChecks();
    const { userImage, userStatusClass } = useUserDisplay();
    const { presets: statusPresets, getStatusClass: presetStatusClass } = useStatusPresets();

    const isFriendsGroupMe = ref(true);
    const isVIPFriends = ref(true);
    const isOnlineFriends = ref(true);
    const isActiveFriends = ref(true);
    const isOfflineFriends = ref(true);
    const isSidebarGroupByInstanceCollapsed = ref(false);
    const collapsedFavGroups = reactive(new Set());
    const scrollViewportRef = ref(null);

    loadFriendsGroupStates();

    const sameInstanceFriendId = computed(() => {
        const ids = new Set();
        for (const item of friendsInSameInstance.value) {
            for (const friend of item) {
                if (isRealInstance(friend.ref?.$location.tag) || lastLocation.value.friendList.has(friend.id)) {
                    ids.add(friend.id);
                }
            }
        }
        return ids;
    });

    const shouldHideSameInstance = computed(() => isSidebarGroupByInstance.value && isHideFriendsInSameInstance.value);

    const selectedFavoriteGroupKeys = computed(() => new Set(sidebarFavoriteGroups.value));

    const selectedFavoriteGroupIds = computed(() => {
        const selectedGroups = selectedFavoriteGroupKeys.value;
        const hasFilter = selectedGroups.size > 0;
        if (!hasFilter) {
            return allFavoriteFriendIds.value;
        }

        const ids = new Set();
        const remoteFriendsByGroup = groupedByGroupKeyFavoriteFriends.value;
        for (const key of selectedGroups) {
            if (key.startsWith('local:')) {
                const groupName = key.slice(6);
                const userIds = localFriendFavorites.value?.[groupName];
                if (userIds) {
                    for (const id of userIds) ids.add(id);
                }
            } else if (remoteFriendsByGroup[key]) {
                for (const friend of remoteFriendsByGroup[key]) ids.add(friend.id);
            }
        }
        return ids;
    });

    const visibleFavoriteOnlineFriends = computed(() => {
        const filtered = allFavoriteOnlineFriends.value.filter((friend) =>
            selectedFavoriteGroupIds.value.has(friend.id)
        );
        return excludeSameInstance(filtered);
    });

    /**
     *
     * @param list
     */
    function excludeSameInstance(list) {
        if (!shouldHideSameInstance.value) {
            return list;
        }
        return list.filter((item) => !sameInstanceFriendId.value.has(item.id));
    }

    const onlineFriendsByGroupStatus = computed(() => {
        const selectedGroups = sidebarFavoriteGroups.value;
        const hasFilter = selectedGroups.length > 0;
        if (!hasFilter) {
            return excludeSameInstance(onlineFriends.value.filter((f) => !allFavoriteFriendIds.value.has(f.id)));
        }
        // When group filter is active, friends in unselected groups should appear in the online list
        const selectedIds = selectedFavoriteGroupIds.value;
        const nonFavOnline = onlineFriends.value.filter((f) => !selectedIds.has(f.id));
        const existingIds = new Set(nonFavOnline.map((f) => f.id));
        const unselectedGroupFriends = allFavoriteOnlineFriends.value.filter(
            (f) => !selectedIds.has(f.id) && !existingIds.has(f.id)
        );
        return excludeSameInstance(
            [...nonFavOnline, ...unselectedGroupFriends].sort(getFriendsSortFunction(sidebarSortMethods.value))
        );
    });

    // VIP friends divide by group
    const vipFriendsDivideByGroup = computed(() => {
        const remoteFriendsByGroup = groupedByGroupKeyFavoriteFriends.value;
        const selectedGroups = selectedFavoriteGroupKeys.value;
        const hasFilter = selectedGroups.size > 0;

        // Build a normalized list of { key, groupName, memberIds }
        const groups = [];

        for (const key in remoteFriendsByGroup) {
            if (Object.hasOwn(remoteFriendsByGroup, key)) {
                if (hasFilter && !selectedGroups.has(key)) continue;
                const groupName = favoriteFriendGroups.value.find((g) => g.key === key)?.displayName || '';
                const memberIds = new Set(remoteFriendsByGroup[key].map((f) => f.id));
                groups.push({ key, groupName, memberIds });
            }
        }

        for (const groupName in localFriendFavorites.value) {
            const selectedKey = `local:${groupName}`;
            if (hasFilter && !selectedGroups.has(selectedKey)) continue;
            const userIds = localFriendFavorites.value[groupName];
            if (userIds?.length) {
                groups.push({ key: selectedKey, groupName, memberIds: new Set(userIds) });
            }
        }

        // Filter vipFriends per group, preserving vipFriends sort order
        const result = [];
        for (const { key, groupName, memberIds } of groups) {
            const filteredFriends = visibleFavoriteOnlineFriends.value.filter((friend) => memberIds.has(friend.id));
            if (filteredFriends.length > 0) {
                result.push(filteredFriends.map((item) => ({ groupName, key, ...item })));
            }
        }

        const order = sidebarFavoriteGroupOrder.value;
        return result.sort((a, b) => {
            const idxA = order.indexOf(a[0]?.key);
            const idxB = order.indexOf(b[0]?.key);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return (a[0]?.key ?? '').localeCompare(b[0]?.key ?? '');
        });
    });

    function buildFavoriteRows(rows) {
        const vipFriendCount = isSidebarDivideByFriendGroup.value
            ? vipFriendsDivideByGroup.value.reduce((sum, group) => sum + group.length, 0)
            : visibleFavoriteOnlineFriends.value.length;

        if (vipFriendCount) {
            rows.push(
                buildToggleRow({
                    key: 'vip-header',
                    label: t('side_panel.favorite'),
                    count: vipFriendCount,
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
                    const isExpanded = !collapsedFavGroups.has(groupKey);
                    if (groupName) {
                        rows.push(
                            buildToggleRow({
                                key: `vip-subheader:${groupKey}`,
                                label: groupName,
                                count: group.length,
                                expanded: isExpanded,
                                headerPadding: '4px 0 4px 4px',
                                onClick: () => {
                                    if (collapsedFavGroups.has(groupKey)) {
                                        collapsedFavGroups.delete(groupKey);
                                    } else {
                                        collapsedFavGroups.add(groupKey);
                                    }
                                }
                            })
                        );
                    }
                    if (isExpanded) {
                        group.forEach((friend, idx) => {
                            rows.push(
                                buildFriendRow(friend, `vip:${groupKey}:${friend?.id ?? idx}`, {
                                    paddingBottom: idx === group.length - 1 ? 10 : undefined
                                })
                            );
                        });
                    }
                });
            } else {
                visibleFavoriteOnlineFriends.value.forEach((friend, idx) => {
                    rows.push(buildFriendRow(friend, `vip:${friend?.id ?? idx}`));
                });
            }
        }
    }

    function buildSameInstanceRows(rows) {
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
                        buildInstanceHeaderRow(
                            getFriendsLocations(friendArr, lastLocation.value),
                            friendArr.length,
                            `instance:${groupKey}`
                        )
                    );
                    friendArr.forEach((friend, idx) => {
                        rows.push(
                            buildFriendRow(friend, `instance:${groupKey}:${friend?.id ?? idx}`, {
                                isGroupByInstance: true,
                                paddingBottom: idx === friendArr.length - 1 ? 5 : undefined,
                                itemStyle: idx === friendArr.length - 1 ? { marginBottom: '6px' } : undefined
                            })
                        );
                    });
                });
            }
        }
    }

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

        if (isSameInstanceAboveFavorites.value) {
            buildSameInstanceRows(rows);
            buildFavoriteRows(rows);
        } else {
            buildFavoriteRows(rows);
            buildSameInstanceRows(rows);
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

    /**
     *
     */
    function saveFriendsGroupStates() {
        configRepository.setBool('VRCX_isFriendsGroupMe', isFriendsGroupMe.value);
        configRepository.setBool('VRCX_isFriendsGroupFavorites', isVIPFriends.value);
        configRepository.setBool('VRCX_isFriendsGroupOnline', isOnlineFriends.value);
        configRepository.setBool('VRCX_isFriendsGroupActive', isActiveFriends.value);
        configRepository.setBool('VRCX_isFriendsGroupOffline', isOfflineFriends.value);
    }

    /**
     *
     */
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

    /**
     *
     */
    function toggleSwitchGroupByInstanceCollapsed() {
        isSidebarGroupByInstanceCollapsed.value = !isSidebarGroupByInstanceCollapsed.value;
        configRepository.setBool('VRCX_sidebarGroupByInstanceCollapsed', isSidebarGroupByInstanceCollapsed.value);
    }

    /**
     *
     */
    function toggleFriendsGroupMe() {
        isFriendsGroupMe.value = !isFriendsGroupMe.value;
        saveFriendsGroupStates();
    }

    /**
     *
     */
    function toggleVIPFriends() {
        isVIPFriends.value = !isVIPFriends.value;
        saveFriendsGroupStates();
    }

    /**
     *
     */
    function toggleOnlineFriends() {
        isOnlineFriends.value = !isOnlineFriends.value;
        saveFriendsGroupStates();
    }

    /**
     *
     */
    function toggleActiveFriends() {
        isActiveFriends.value = !isActiveFriends.value;
        saveFriendsGroupStates();
    }

    /**
     *
     */
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

    const statusOptions = computed(() => [
        {
            value: 'join me',
            statusClass: 'joinme',
            label: t('dialog.user.status.join_me')
        },
        {
            value: 'active',
            statusClass: 'online',
            label: t('dialog.user.status.online')
        },
        {
            value: 'ask me',
            statusClass: 'askme',
            label: t('dialog.user.status.ask_me')
        },
        {
            value: 'busy',
            statusClass: 'busy',
            label: t('dialog.user.status.busy')
        }
    ]);

    const recentStatuses = computed(() => {
        const history = currentUser.value?.statusHistory;
        if (!history || !history.length) return [];
        return history.slice(0, 10);
    });

    /**
     *
     * @param value
     */
    function changeStatus(value) {
        userRequest.saveCurrentUser({ status: value }).then(() => {
            toast.success('Status updated');
        });
    }

    /**
     *
     * @param status
     */
    function setStatusFromHistory(status) {
        userRequest.saveCurrentUser({ statusDescription: status }).then(() => {
            toast.success('Status updated');
        });
    }

    function getPresetDisplayText(preset) {
        if (preset.statusDescription) return preset.statusDescription;
        const option = statusOptions.value.find((o) => o.value === preset.status);
        return option?.label || preset.status;
    }

    function applyStatusPreset(preset) {
        userRequest
            .saveCurrentUser({
                status: preset.status,
                statusDescription: preset.statusDescription
            })
            .then(() => {
                toast.success('Status updated');
            });
    }

    const canInviteToMyLocation = computed(() => checkCanInvite(lastLocation.value.location));

    /**
     * @param {object} friend - friend item from friend list
     * @returns {boolean} whether the friend has a valid joinable location
     */
    function hasFriendLocation(friend) {
        const loc = friend.ref?.location;
        return !!loc && isRealInstance(loc);
    }

    /**
     * @param {object} friend - friend item from friend list
     * @returns {boolean} whether the current user can join friend's instance
     */
    function canJoinFriend(friend) {
        const loc = friend.ref?.location;
        if (!loc || !isRealInstance(loc)) return false;
        return checkCanInviteSelf(loc);
    }

    /**
     * @param {object} friend - friend item from friend list
     */
    function friendRequestInvite(friend) {
        notificationRequest.sendRequestInvite({ platform: 'standalonewindows' }, friend.id).then(() => {
            toast.success('Request invite sent');
        });
    }

    /**
     * @param {object} friend - friend item from friend list
     */
    function friendInvite(friend) {
        let currentLocation = lastLocation.value.location;
        if (currentLocation === 'traveling') {
            currentLocation = lastLocationDestination.value;
        }
        const L = parseLocation(currentLocation);
        queryRequest.fetch('world.location', { worldId: L.worldId }).then((args) => {
            notificationRequest
                .sendInvite(
                    {
                        instanceId: L.tag,
                        worldId: L.tag,
                        worldName: args.ref.name
                    },
                    friend.id
                )
                .then(() => {
                    toast.success(t('message.invite.sent'));
                });
        });
    }

    /**
     * @param {object} friend - friend item from friend list
     */
    function friendSendBoop(friend) {
        showSendBoopDialog(friend.id);
    }

    /**
     * Join friend's instance (launch dialog)
     * @param {object} friend - friend item from friend list
     */
    function friendJoin(friend) {
        const loc = friend.ref?.location;
        if (!loc) return;
        launchStore.showLaunchDialog(loc);
    }

    /**
     * @param {object} friend - friend item from friend list
     */
    function friendInviteSelf(friend) {
        const loc = friend.ref?.location;
        if (!loc) return;
        const L = parseLocation(loc);
        instanceRequest
            .selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId
            })
            .then(() => {
                toast.success(t('message.invite.self_sent'));
            });
    }
</script>
