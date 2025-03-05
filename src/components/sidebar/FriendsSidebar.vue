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
            <div class="x-friend-item" @click="showUserDialog(API.currentUser.id)">
                <div class="avatar" :class="userStatusClass(API.currentUser)">
                    <img v-lazy="userImage(API.currentUser)" />
                </div>
                <div class="detail">
                    <span class="name" :style="{ color: API.currentUser.$userColour }">{{
                        API.currentUser.displayName
                    }}</span>
                    <location
                        v-if="isGameRunning && !gameLogDisabled"
                        class="extra"
                        :location="lastLocation.location"
                        :traveling="lastLocationDestination"
                        :link="false"></location>
                    <location
                        v-else-if="
                            isRealInstance(API.currentUser.$locationTag) ||
                            isRealInstance(API.currentUser.$travelingToLocation)
                        "
                        class="extra"
                        :location="API.currentUser.$locationTag"
                        :traveling="API.currentUser.$travelingToLocation"
                        :link="false">
                    </location>
                    <span v-else class="extra">{{ API.currentUser.statusDescription }}</span>
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
                            :hide-nicknames="hideNicknames"
                            @click="showUserDialog(friend.id)"
                            @confirm-delete-friend="$emit('confirm-delete-friend', $event)"></friend-item>
                    </div>
                </div>
            </template>
            <friend-item
                v-for="friend in vipFriendsByGroupStatus"
                v-else
                :key="friend.id"
                :friend="friend"
                :hide-nicknames="hideNicknames"
                @click="showUserDialog(friend.id)"
                @confirm-delete-friend="$emit('confirm-delete-friend', $event)">
            </friend-item>
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
                        <location
                            class="extra"
                            :location="getFriendsLocations(friendArr)"
                            style="display: inline"></location>
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
                            @confirm-delete-friend="$emit('confirm-delete-friend', $event)">
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
                :hide-nicknames="hideNicknames"
                @click="showUserDialog(friend.id)"
                @confirm-delete-friend="$emit('confirm-delete-friend', $event)" />
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
                :hide-nicknames="hideNicknames"
                @click="showUserDialog(friend.id)"
                @confirm-delete-friend="$emit('confirm-delete-friend', $event)"></friend-item>
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
                :hide-nicknames="hideNicknames"
                @click="showUserDialog(friend.id)"
                @confirm-delete-friend="$emit('confirm-delete-friend', $event)"></friend-item>
        </div>
    </div>
</template>

<script>
    import FriendItem from './FriendItem.vue';
    import Location from '../common/Location.vue';
    import configRepository from '../../repository/config';
    import utils from '../../classes/utils';

    export default {
        name: 'FriendsSidebar',
        components: {
            FriendItem,
            Location
        },
        inject: ['API', 'showUserDialog', 'userImage', 'userStatusClass'],
        props: {
            // settings
            isGameRunning: Boolean,

            isSidebarDivideByFriendGroup: Boolean,
            isSidebarGroupByInstance: Boolean,
            gameLogDisabled: Boolean,
            hideNicknames: Boolean,
            isHideFriendsInSameInstance: Boolean,

            lastLocation: Object,
            lastLocationDestination: String,

            activeFriends: Array,
            offlineFriends: Array,

            vipFriends: Array,
            onlineFriends: Array,

            groupedByGroupKeyFavoriteFriends: Object
        },
        data() {
            return {
                isFriendsGroupMe: true,
                isVIPFriends: true,
                isOnlineFriends: true,
                isActiveFriends: true,
                isOfflineFriends: true,
                isSidebarGroupByInstanceCollapsed: false
            };
        },
        computed: {
            friendsInSameInstance() {
                const friendsList = {};

                const allFriends = [...this.vipFriends, ...this.onlineFriends];
                allFriends.forEach((friend) => {
                    let locationTag;

                    if (friend.ref?.$location.isRealInstance) {
                        locationTag = friend.ref.$location.tag;
                    } else if (this.lastLocation.friendList.has(friend.id)) {
                        let $location = utils.parseLocation(this.lastLocation.location);
                        if ($location.isRealInstance) {
                            if ($location.tag === 'private') {
                                locationTag = this.lastLocation.name;
                            } else {
                                locationTag = $location.tag;
                            }
                        }
                    }
                    if (!locationTag) {
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
            },
            onlineFriendsByGroupStatus() {
                if (
                    !this.isSidebarGroupByInstance ||
                    (this.isSidebarGroupByInstance && !this.isHideFriendsInSameInstance)
                ) {
                    return this.onlineFriends;
                }

                const sameInstanceTag = new Set(
                    this.friendsInSameInstance.flatMap((item) => item.map((friend) => friend.ref?.$location.tag))
                );

                return this.onlineFriends.filter((item) => !sameInstanceTag.has(item.ref?.$location.tag));
            },
            vipFriendsByGroupStatus() {
                if (
                    !this.isSidebarGroupByInstance ||
                    (this.isSidebarGroupByInstance && !this.isHideFriendsInSameInstance)
                ) {
                    return this.vipFriends;
                }

                const sameInstanceTag = new Set(
                    this.friendsInSameInstance.flatMap((item) => item.map((friend) => friend.ref?.$location.tag))
                );

                return this.vipFriends.filter((item) => !sameInstanceTag.has(item.ref?.$location.tag));
            },
            // VIP friends divide by group
            vipFriendsDivideByGroup() {
                const vipFriendsByGroup = { ...this.groupedByGroupKeyFavoriteFriends };
                const result = [];

                for (const key in vipFriendsByGroup) {
                    if (Object.prototype.hasOwnProperty.call(vipFriendsByGroup, key)) {
                        const groupFriends = vipFriendsByGroup[key];
                        // sort groupFriends using the order of vipFriends
                        // avoid unnecessary sorting
                        let filteredFriends = this.vipFriends.filter((friend) =>
                            groupFriends.some((item) => item.id === friend.id)
                        );

                        if (filteredFriends.length > 0) {
                            const groupName =
                                this.API.favoriteFriendGroups.find((item) => item.key === key)?.displayName || '';
                            result.push(filteredFriends.map((item) => ({ groupName, key, ...item })));
                        }
                    }
                }

                return result.sort((a, b) => a[0].key.localeCompare(b[0].key));
            },
            vipFriendsDisplayNumber() {
                return this.isSidebarDivideByFriendGroup
                    ? this.vipFriendsDivideByGroup.length
                    : this.vipFriendsByGroupStatus.length;
            }
        },
        created() {
            this.loadFriendsGroupStates();
        },
        methods: {
            saveFriendsGroupStates() {
                configRepository.setBool('VRCX_isFriendsGroupMe', this.isFriendsGroupMe);
                configRepository.setBool('VRCX_isFriendsGroupFavorites', this.isVIPFriends);
                configRepository.setBool('VRCX_isFriendsGroupOnline', this.isOnlineFriends);
                configRepository.setBool('VRCX_isFriendsGroupActive', this.isActiveFriends);
                configRepository.setBool('VRCX_isFriendsGroupOffline', this.isOfflineFriends);
            },
            async loadFriendsGroupStates() {
                this.isFriendsGroupMe = await configRepository.getBool('VRCX_isFriendsGroupMe', true);
                this.isVIPFriends = await configRepository.getBool('VRCX_isFriendsGroupFavorites', true);
                this.isOnlineFriends = await configRepository.getBool('VRCX_isFriendsGroupOnline', true);
                this.isActiveFriends = await configRepository.getBool('VRCX_isFriendsGroupActive', false);
                this.isOfflineFriends = await configRepository.getBool('VRCX_isFriendsGroupOffline', false);
                this.isSidebarGroupByInstanceCollapsed = await configRepository.getBool(
                    'VRCX_sidebarGroupByInstanceCollapsed',
                    false
                );
            },
            isRealInstance(locationTag) {
                return utils.isRealInstance(locationTag);
            },
            toggleSwitchGroupByInstanceCollapsed() {
                this.isSidebarGroupByInstanceCollapsed = !this.isSidebarGroupByInstanceCollapsed;
                configRepository.setBool(
                    'VRCX_sidebarGroupByInstanceCollapsed',
                    this.isSidebarGroupByInstanceCollapsed
                );
            },
            getFriendsLocations(friendsArr) {
                // prevent the instance title display as "Traveling".
                if (!friendsArr?.length) {
                    return '';
                }
                for (const friend of friendsArr) {
                    if (friend.ref?.location !== 'traveling') {
                        return friend.ref.location;
                    }
                    if (utils.isRealInstance(friend.ref?.travelingToLocation)) {
                        return friend.ref.travelingToLocation;
                    }
                    if (this.lastLocation.friendList.has(friend.id)) {
                        return this.lastLocation.name;
                    }
                }
                return friendsArr[0].ref?.location;
            }
        }
    };
</script>

<style scoped>
    .x-link:hover {
        text-decoration: none;
    }
    .x-link:hover span {
        text-decoration: underline;
    }
</style>
