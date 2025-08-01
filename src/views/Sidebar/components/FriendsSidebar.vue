<template>
    <div class="x-friend-list" style="padding: 10px 5px">
        <div
            class="x-friend-group x-link"
            style="padding: 0 0 5px"
            @click="
                isFriendsGroupMe = !isFriendsGroupMe;
                saveFriendsGroupStates();
            ">
            <i class="el-icon-arrow-right" :class="{ rotate: isFriendsGroupMe }"></i>
            <span style="margin-left: 5px">{{ $t('side_panel.me') }}</span>
        </div>
        <div v-show="isFriendsGroupMe">
            <div class="x-friend-item" @click="showUserDialog(currentUser.id)">
                <div class="avatar" :class="userStatusClass(currentUser)">
                    <img v-lazy="userImage(currentUser)" />
                </div>
                <div class="detail">
                    <span class="name" :style="{ color: currentUser.$userColour }">{{ currentUser.displayName }}</span>
                    <Location
                        v-if="isGameRunning && !gameLogDisabled"
                        class="extra"
                        :location="lastLocation.location"
                        :traveling="lastLocationDestination"
                        :link="false" />
                    <Location
                        v-else-if="
                            isRealInstance(currentUser.$locationTag) || isRealInstance(currentUser.$travelingToLocation)
                        "
                        class="extra"
                        :location="currentUser.$locationTag"
                        :traveling="currentUser.$travelingToLocation"
                        :link="false" />

                    <span v-else class="extra">{{ currentUser.statusDescription }}</span>
                </div>
            </div>
        </div>
        <div
            v-show="vipFriendsDisplayNumber"
            class="x-friend-group x-link"
            @click="
                isVIPFriends = !isVIPFriends;
                saveFriendsGroupStates();
            ">
            <i class="el-icon-arrow-right" :class="{ rotate: isVIPFriends }"></i>
            <span style="margin-left: 5px">
                {{ $t('side_panel.favorite') }} &horbar;
                {{ vipFriendsDisplayNumber }}
            </span>
        </div>
        <div v-show="isVIPFriends">
            <template v-if="isSidebarDivideByFriendGroup">
                <div v-for="group in vipFriendsDivideByGroup" :key="group[0].key">
                    <transition name="el-fade-in-linear">
                        <div v-show="group[0].groupName !== ''" style="margin-bottom: 3px">
                            <span class="extra">{{ group[0].groupName }}</span>
                            <span class="extra" style="margin-left: 5px">{{ `(${group.length})` }}</span>
                        </div>
                    </transition>
                    <div v-if="group.length" style="margin-bottom: 10px">
                        <friend-item
                            v-for="friend in group"
                            :key="friend.id"
                            :friend="friend"
                            @click="showUserDialog(friend.id)"
                            @confirm-delete-friend="confirmDeleteFriend"></friend-item>
                    </div>
                </div>
            </template>
            <template v-else>
                <friend-item
                    v-for="friend in vipFriendsByGroupStatus"
                    :key="friend.id"
                    :friend="friend"
                    @click="showUserDialog(friend.id)"
                    @confirm-delete-friend="confirmDeleteFriend">
                </friend-item>
            </template>
        </div>

        <template v-if="isSidebarGroupByInstance && friendsInSameInstance.length">
            <div class="x-friend-group x-link" @click="toggleSwitchGroupByInstanceCollapsed">
                <i class="el-icon-arrow-right" :class="{ rotate: !isSidebarGroupByInstanceCollapsed }"></i>
                <span style="margin-left: 5px"
                    >{{ $t('side_panel.same_instance') }} &horbar; {{ friendsInSameInstance.length }}</span
                >
            </div>

            <div v-show="!isSidebarGroupByInstanceCollapsed">
                <div v-for="friendArr in friendsInSameInstance" :key="friendArr[0].ref.$location.tag">
                    <div style="margin-bottom: 3px">
                        <Location class="extra" :location="getFriendsLocations(friendArr)" style="display: inline" />
                        <span class="extra" style="margin-left: 5px">{{ `(${friendArr.length})` }}</span>
                    </div>
                    <div v-if="friendArr && friendArr.length">
                        <friend-item
                            v-for="(friend, idx) in friendArr"
                            :key="friend.id"
                            :friend="friend"
                            is-group-by-instance
                            :style="{ 'margin-bottom': idx === friendArr.length - 1 ? '5px' : undefined }"
                            @click="showUserDialog(friend.id)"
                            @confirm-delete-friend="confirmDeleteFriend">
                        </friend-item>
                    </div>
                </div>
            </div>
        </template>
        <div
            v-show="onlineFriendsByGroupStatus.length"
            class="x-friend-group x-link"
            @click="
                isOnlineFriends = !isOnlineFriends;
                saveFriendsGroupStates();
            ">
            <i class="el-icon-arrow-right" :class="{ rotate: isOnlineFriends }"></i>
            <span style="margin-left: 5px"
                >{{ $t('side_panel.online') }} &horbar; {{ onlineFriendsByGroupStatus.length }}</span
            >
        </div>
        <div v-show="isOnlineFriends">
            <friend-item
                v-for="friend in onlineFriendsByGroupStatus"
                :key="friend.id"
                :friend="friend"
                @click="showUserDialog(friend.id)"
                @confirm-delete-friend="confirmDeleteFriend" />
        </div>
        <div
            v-show="activeFriends.length"
            class="x-friend-group x-link"
            @click="
                isActiveFriends = !isActiveFriends;
                saveFriendsGroupStates();
            ">
            <i class="el-icon-arrow-right" :class="{ rotate: isActiveFriends }"></i>
            <span style="margin-left: 5px">{{ $t('side_panel.active') }} &horbar; {{ activeFriends.length }}</span>
        </div>
        <div v-show="isActiveFriends">
            <friend-item
                v-for="friend in activeFriends"
                :key="friend.id"
                :friend="friend"
                @click="showUserDialog(friend.id)"
                @confirm-delete-friend="confirmDeleteFriend"></friend-item>
        </div>
        <div
            v-show="offlineFriends.length"
            class="x-friend-group x-link"
            @click="
                isOfflineFriends = !isOfflineFriends;
                saveFriendsGroupStates();
            ">
            <i class="el-icon-arrow-right" :class="{ rotate: isOfflineFriends }"></i>
            <span style="margin-left: 5px">{{ $t('side_panel.offline') }} &horbar; {{ offlineFriends.length }}</span>
        </div>
        <div v-show="isOfflineFriends">
            <friend-item
                v-for="friend in offlineFriends"
                :key="friend.id"
                :friend="friend"
                @click="showUserDialog(friend.id)"
                @confirm-delete-friend="confirmDeleteFriend"></friend-item>
        </div>
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import FriendItem from '../../../components/FriendItem.vue';
    import configRepository from '../../../service/config';
    import { isRealInstance, userImage, userStatusClass } from '../../../shared/utils';
    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useFavoriteStore,
        useFriendStore,
        useGameStore,
        useLocationStore,
        useUserStore
    } from '../../../stores';
    const emit = defineEmits(['confirm-delete-friend']);

    const { vipFriends, onlineFriends, activeFriends, offlineFriends } = storeToRefs(useFriendStore());
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
    const isActiveFriends = ref(false);
    const isOfflineFriends = ref(false);
    const isSidebarGroupByInstanceCollapsed = ref(false);

    loadFriendsGroupStates();

    const friendsInSameInstance = computed(() => {
        const friendsList = {};

        const allFriends = [...vipFriends.value, ...onlineFriends.value];
        allFriends.forEach((friend) => {
            if (!friend.ref?.$location) {
                return;
            }

            let locationTag = friend.ref.$location.tag;
            if (!friend.ref.$location.isRealInstance && lastLocation.value.friendList.has(friend.id)) {
                locationTag = lastLocation.value.location;
            }
            const isReal = isRealInstance(locationTag);
            if (!isReal) {
                return;
            }

            if (!friendsList[locationTag]) {
                friendsList[locationTag] = [];
            }
            friendsList[locationTag].push(friend);
        });

        const sortedFriendsList = [];
        for (const group of Object.values(friendsList)) {
            if (group.length > 1) {
                sortedFriendsList.push(group.sort((a, b) => a.ref?.$location_at - b.ref?.$location_at));
            }
        }

        return sortedFriendsList.sort((a, b) => b.length - a.length);
    });

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
        isOfflineFriends.value = await configRepository.getBool('VRCX_isFriendsGroupOffline', false);
        isSidebarGroupByInstanceCollapsed.value = await configRepository.getBool(
            'VRCX_sidebarGroupByInstanceCollapsed',
            false
        );
    }

    function toggleSwitchGroupByInstanceCollapsed() {
        isSidebarGroupByInstanceCollapsed.value = !isSidebarGroupByInstanceCollapsed.value;
        configRepository.setBool('VRCX_sidebarGroupByInstanceCollapsed', isSidebarGroupByInstanceCollapsed.value);
    }

    function getFriendsLocations(friendsArr) {
        // prevent the instance title display as "Traveling".
        if (!friendsArr?.length) {
            return '';
        }
        for (const friend of friendsArr) {
            if (isRealInstance(friend.ref?.location)) {
                return friend.ref.location;
            }
        }
        for (const friend of friendsArr) {
            if (isRealInstance(friend.ref?.travelingToLocation)) {
                return friend.ref.travelingToLocation;
            }
        }
        for (const friend of friendsArr) {
            if (lastLocation.value.friendList.has(friend.id)) {
                return lastLocation.value.location;
            }
        }
        return friendsArr[0].ref?.location;
    }

    function confirmDeleteFriend(friend) {
        emit('confirm-delete-friend', friend);
    }
</script>

<style scoped>
    .x-link:hover {
        text-decoration: none;
    }
    .x-link:hover span {
        text-decoration: underline;
    }
</style>
