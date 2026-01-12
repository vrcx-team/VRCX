<template>
    <div class="x-friend-list" style="padding: 10px 5px">
        <div
            class="x-friend-group x-link"
            style="padding: 0 0 5px"
            @click="
                isFriendsGroupMe = !isFriendsGroupMe;
                saveFriendsGroupStates();
            ">
            <el-icon class="rotation-transition" :class="{ 'is-rotated': isFriendsGroupMe }"><ArrowRight /></el-icon>
            <span style="margin-left: 5px">{{ t('side_panel.me') }}</span>
        </div>
        <div v-show="isFriendsGroupMe">
            <div class="x-friend-item" @click="showUserDialog(currentUser.id)">
                <div class="avatar" :class="userStatusClass(currentUser)">
                    <img :src="userImage(currentUser)" loading="lazy" />
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
            <el-icon class="rotation-transition" :class="{ 'is-rotated': isVIPFriends }"><ArrowRight /></el-icon>
            <span style="margin-left: 5px">
                {{ t('side_panel.favorite') }} &horbar;
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
                            @confirm-delete-friend="confirmDeleteFriend"></friend-item>
                    </div>
                </div>
            </template>
            <template v-else>
                <friend-item
                    v-for="friend in vipFriendsByGroupStatus"
                    :key="friend.id"
                    :friend="friend"
                    @confirm-delete-friend="confirmDeleteFriend">
                </friend-item>
            </template>
        </div>

        <template v-if="isSidebarGroupByInstance && friendsInSameInstance.length">
            <div class="x-friend-group x-link" @click="toggleSwitchGroupByInstanceCollapsed">
                <el-icon class="rotation-transition" :class="{ 'is-rotated': !isSidebarGroupByInstanceCollapsed }"
                    ><ArrowRight
                /></el-icon>
                <span style="margin-left: 5px"
                    >{{ t('side_panel.same_instance') }} &horbar; {{ friendsInSameInstance.length }}</span
                >
            </div>

            <div v-show="!isSidebarGroupByInstanceCollapsed">
                <div v-for="friendArr in friendsInSameInstance" :key="friendArr[0].ref.$location.tag">
                    <div class="mb-1 flex items-center">
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
            <el-icon class="rotation-transition" :class="{ 'is-rotated': isOnlineFriends }"><ArrowRight /></el-icon>
            <span style="margin-left: 5px"
                >{{ t('side_panel.online') }} &horbar; {{ onlineFriendsByGroupStatus.length }}</span
            >
        </div>
        <div v-show="isOnlineFriends">
            <friend-item
                v-for="friend in onlineFriendsByGroupStatus"
                :key="friend.id"
                :friend="friend"
                @confirm-delete-friend="confirmDeleteFriend" />
        </div>
        <div
            v-show="activeFriends.length"
            class="x-friend-group x-link"
            @click="
                isActiveFriends = !isActiveFriends;
                saveFriendsGroupStates();
            ">
            <el-icon class="rotation-transition" :class="{ 'is-rotated': isActiveFriends }"><ArrowRight /></el-icon>
            <span style="margin-left: 5px">{{ t('side_panel.active') }} &horbar; {{ activeFriends.length }}</span>
        </div>
        <div v-if="isActiveFriends">
            <friend-item
                v-for="friend in activeFriends"
                :key="friend.id"
                :friend="friend"
                @confirm-delete-friend="confirmDeleteFriend"></friend-item>
        </div>
        <div
            v-show="offlineFriends.length"
            class="x-friend-group x-link"
            @click="
                isOfflineFriends = !isOfflineFriends;
                saveFriendsGroupStates();
            ">
            <el-icon class="rotation-transition" :class="{ 'is-rotated': isOfflineFriends }"><ArrowRight /></el-icon>
            <span style="margin-left: 5px">{{ t('side_panel.offline') }} &horbar; {{ offlineFriends.length }}</span>
        </div>
        <div v-if="isOfflineFriends">
            <friend-item
                v-for="friend in offlineFriends"
                :key="friend.id"
                :friend="friend"
                @confirm-delete-friend="confirmDeleteFriend"></friend-item>
        </div>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { ArrowRight } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

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
    import { watchState } from '../../../service/watchState';

    import FriendItem from './FriendItem.vue';
    import configRepository from '../../../service/config';

    const emit = defineEmits(['confirm-delete-friend']);
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
    const isActiveFriends = ref(false);
    const isOfflineFriends = ref(false);
    const isSidebarGroupByInstanceCollapsed = ref(false);

    watch(
        () => watchState.isFriendsLoaded,
        (isFriendsLoaded) => {
            if (isFriendsLoaded) {
                isOfflineFriends.value = offlineFriends.value.length < 10 ? true : false;
            }
        }
    );

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

    function saveFriendsGroupStates() {
        configRepository.setBool('VRCX_isFriendsGroupMe', isFriendsGroupMe.value);
        configRepository.setBool('VRCX_isFriendsGroupFavorites', isVIPFriends.value);
        configRepository.setBool('VRCX_isFriendsGroupOnline', isOnlineFriends.value);
        configRepository.setBool('VRCX_isFriendsGroupActive', isActiveFriends.value);
    }

    async function loadFriendsGroupStates() {
        isFriendsGroupMe.value = await configRepository.getBool('VRCX_isFriendsGroupMe', true);
        isVIPFriends.value = await configRepository.getBool('VRCX_isFriendsGroupFavorites', true);
        isOnlineFriends.value = await configRepository.getBool('VRCX_isFriendsGroupOnline', true);
        isActiveFriends.value = await configRepository.getBool('VRCX_isFriendsGroupActive', false);
        isSidebarGroupByInstanceCollapsed.value = await configRepository.getBool(
            'VRCX_sidebarGroupByInstanceCollapsed',
            false
        );
    }

    function toggleSwitchGroupByInstanceCollapsed() {
        isSidebarGroupByInstanceCollapsed.value = !isSidebarGroupByInstanceCollapsed.value;
        configRepository.setBool('VRCX_sidebarGroupByInstanceCollapsed', isSidebarGroupByInstanceCollapsed.value);
    }

    function confirmDeleteFriend(friend) {
        emit('confirm-delete-friend', friend);
    }
</script>

<style scoped>
    .x-link:hover {
        text-decoration: none;
    }
    /* .x-link:hover span {
        text-decoration: underline;
    } */
    .is-rotated {
        transform: rotate(90deg);
    }
    .rotation-transition {
        transition: transform 0.2s ease-in-out;
    }
</style>
