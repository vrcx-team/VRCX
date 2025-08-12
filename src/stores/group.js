import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import * as workerTimers from 'worker-timers';
import {
    groupRequest,
    instanceRequest,
    userRequest,
    worldRequest
} from '../api';
import { $app } from '../app';
import configRepository from '../service/config';
import { watchState } from '../service/watchState';
import { groupDialogFilterOptions } from '../shared/constants/';
import { replaceBioSymbols, convertFileUrlToImageUrl } from '../shared/utils';
import { useGameStore } from './game';
import { useInstanceStore } from './instance';
import { useUserStore } from './user';
import { useNotificationStore } from './notification';

export const useGroupStore = defineStore('Group', () => {
    const instanceStore = useInstanceStore();
    const gameStore = useGameStore();
    const userStore = useUserStore();
    const notificationStore = useNotificationStore();

    const state = reactive({
        groupDialog: {
            visible: false,
            loading: false,
            isGetGroupDialogGroupLoading: false,
            treeData: [],
            id: '',
            inGroup: false,
            ownerDisplayName: '',
            ref: {},
            announcement: {},
            posts: [],
            postsFiltered: [],
            members: [],
            memberSearch: '',
            memberSearchResults: [],
            instances: [],
            memberRoles: [],
            memberFilter: {
                name: 'dialog.group.members.filters.everyone',
                id: null
            },
            memberSortOrder: {
                name: 'dialog.group.members.sorting.joined_at_desc',
                value: 'joinedAt:desc'
            },
            postsSearch: '',
            galleries: {}
        },
        currentUserGroups: new Map(),
        inviteGroupDialog: {
            visible: false,
            loading: false,
            groupId: '',
            groupName: '',
            userId: '',
            userIds: [],
            userObject: {}
        },
        cachedGroups: new Map(),
        inGameGroupOrder: [],
        groupInstances: [],
        currentUserGroupsInit: false
    });

    const groupDialog = computed({
        get: () => state.groupDialog,
        set: (value) => {
            state.groupDialog = value;
        }
    });

    const currentUserGroups = computed({
        get: () => state.currentUserGroups,
        set: (value) => {
            state.currentUserGroups = value;
        }
    });

    const inviteGroupDialog = computed({
        get: () => state.inviteGroupDialog,
        set: (value) => {
            state.inviteGroupDialog = value;
        }
    });

    const cachedGroups = computed({
        get: () => state.cachedGroups,
        set: (value) => {
            state.cachedGroups = value;
        }
    });

    const inGameGroupOrder = computed({
        get: () => state.inGameGroupOrder,
        set: (value) => {
            state.inGameGroupOrder = value;
        }
    });

    const groupInstances = computed({
        get: () => state.groupInstances,
        set: (value) => {
            state.groupInstances = value;
        }
    });

    const currentUserGroupsInit = computed({
        get: () => state.currentUserGroupsInit,
        set: (value) => {
            state.currentUserGroupsInit = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            state.groupDialog.visible = false;
            state.inviteGroupDialog.visible = false;
            state.currentUserGroupsInit = false;
            state.cachedGroups.clear();
            state.currentUserGroups.clear();
            if (isLoggedIn) {
                initUserGroups();
            }
        },
        { flush: 'sync' }
    );

    function showGroupDialog(groupId) {
        if (!groupId) {
            return;
        }
        const D = state.groupDialog;
        D.visible = true;
        D.loading = true;
        D.id = groupId;
        D.inGroup = false;
        D.ownerDisplayName = '';
        D.treeData = [];
        D.announcement = {};
        D.posts = [];
        D.postsFiltered = [];
        D.instances = [];
        D.memberRoles = [];
        D.memberSearch = '';
        D.memberSearchResults = [];
        D.galleries = {};
        D.members = [];
        D.memberFilter = groupDialogFilterOptions.everyone;
        groupRequest
            .getCachedGroup({
                groupId
            })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                $app.$message({
                    message: 'Failed to load group',
                    type: 'error'
                });
                throw err;
            })
            .then((args) => {
                if (groupId === args.ref.id) {
                    D.loading = false;
                    D.ref = args.ref;
                    D.inGroup = args.ref.membershipStatus === 'member';
                    D.ownerDisplayName = args.ref.ownerId;
                    userRequest
                        .getCachedUser({
                            userId: args.ref.ownerId
                        })
                        .then((args1) => {
                            D.ownerDisplayName = args1.ref.displayName;
                            return args1;
                        });
                    instanceStore.applyGroupDialogInstances();
                    getGroupDialogGroup(groupId);
                }
            });
    }

    /**
     *
     * @param {object }ref
     * @param {string} oldUserId
     * @param {string} newUserId
     * @returns {Promise<void>}
     */
    async function groupOwnerChange(ref, oldUserId, newUserId) {
        const oldUser = await userRequest.getCachedUser({
            userId: oldUserId
        });
        const newUser = await userRequest.getCachedUser({
            userId: newUserId
        });
        const oldDisplayName = oldUser?.ref?.displayName;
        const newDisplayName = newUser?.ref?.displayName;

        groupChange(
            ref,
            `Owner changed from ${oldDisplayName} to ${newDisplayName}`
        );
    }

    function groupChange(ref, message) {
        if (!state.currentUserGroupsInit) {
            return;
        }
        // oh the level of cursed for compibility
        const json = {
            id: Math.random().toString(36),
            type: 'groupChange',
            senderUserId: ref.id,
            senderUsername: ref.name,
            imageUrl: ref.iconUrl,
            details: {
                imageUrl: ref.iconUrl
            },
            message,
            created_at: new Date().toJSON()
        };
        notificationStore.handleNotification({
            json,
            params: {
                notificationId: json.id
            }
        });

        // delay to wait for json to be assigned to ref
        workerTimers.setTimeout(saveCurrentUserGroups, 100);
    }

    function saveCurrentUserGroups() {
        if (!state.currentUserGroupsInit) {
            return;
        }
        const groups = [];
        for (const ref of state.currentUserGroups.values()) {
            groups.push({
                id: ref.id,
                name: ref.name,
                ownerId: ref.ownerId,
                iconUrl: ref.iconUrl,
                roles: ref.roles,
                roleIds: ref.myMember?.roleIds
            });
        }
        configRepository.setString(
            `VRCX_currentUserGroups_${userStore.currentUser.id}`,
            JSON.stringify(groups)
        );
    }

    /**
     *
     * @param {object} ref
     * @param {array} oldRoles
     * @param {array} newRoles
     * @param {array} oldRoleIds
     * @param {array} newRoleIds
     */
    function groupRoleChange(ref, oldRoles, newRoles, oldRoleIds, newRoleIds) {
        // check for removed/added roleIds
        for (const roleId of oldRoleIds) {
            if (!newRoleIds.includes(roleId)) {
                let roleName = '';
                const role = oldRoles.find(
                    (fineRole) => fineRole.id === roleId
                );
                if (role) {
                    roleName = role.name;
                }
                groupChange(ref, `Role ${roleName} removed`);
            }
        }
        for (const roleId of newRoleIds) {
            if (!oldRoleIds.includes(roleId)) {
                let roleName = '';
                const role = newRoles.find(
                    (fineRole) => fineRole.id === roleId
                );
                if (role) {
                    roleName = role.name;
                }
                groupChange(ref, `Role ${roleName} added`);
            }
        }
    }

    /**
     *
     * @param {object} ref
     */
    function applyPresenceGroups(ref) {
        if (!state.currentUserGroupsInit) {
            // wait for init before diffing
            return;
        }
        const groups = ref.presence?.groups;
        if (!groups) {
            console.error('applyPresenceGroups: invalid groups', ref);
            return;
        }
        if (groups.length === 0) {
            // as it turns out, this is not the most trust worthly source of info
            return;
        }

        // update group list
        for (const groupId of groups) {
            if (!state.currentUserGroups.has(groupId)) {
                onGroupJoined(groupId);
            }
        }
        for (const groupId of state.currentUserGroups.keys()) {
            if (!groups.includes(groupId)) {
                onGroupLeft(groupId);
            }
        }
    }

    /**
     *
     * @param {string} groupId
     */
    function onGroupJoined(groupId) {
        if (!state.currentUserGroups.has(groupId)) {
            state.currentUserGroups.set(groupId, {
                id: groupId,
                name: '',
                iconUrl: ''
            });
            groupRequest
                .getGroup({ groupId, includeRoles: true })
                .then((args) => {
                    applyGroup(args.json);
                    saveCurrentUserGroups();
                    return args;
                });
        }
    }

    /**
     *
     * @param {string} groupId
     */
    function onGroupLeft(groupId) {
        if (state.groupDialog.visible && state.groupDialog.id === groupId) {
            showGroupDialog(groupId);
        }
        if (state.currentUserGroups.has(groupId)) {
            state.currentUserGroups.delete(groupId);
            groupRequest.getCachedGroup({ groupId }).then((args) => {
                groupChange(args.ref, 'Left group');
            });
        }
    }

    /**
     *
     * @param {{ groupId: string }} params
     * @return { Promise<{posts: any, params}> }
     */
    async function getAllGroupPosts(params) {
        const n = 100;
        let posts = [];
        let offset = 0;
        let total = 0;
        const args = await groupRequest.getGroupPosts({
            groupId: params.groupId,
            n,
            offset
        });
        do {
            posts = posts.concat(args.json.posts);
            total = args.json.total;
            offset += n;
        } while (offset < total);
        const returnArgs = {
            posts,
            params
        };
        const D = state.groupDialog;
        if (D.id === args.params.groupId) {
            for (const post of args.json.posts) {
                post.title = replaceBioSymbols(post.title);
                post.text = replaceBioSymbols(post.text);
            }
            if (args.json.posts.length > 0) {
                D.announcement = args.json.posts[0];
            }
            D.posts = args.json.posts;
            updateGroupPostSearch();
        }

        return returnArgs;
    }

    function getGroupDialogGroup(groupId) {
        const D = state.groupDialog;
        D.isGetGroupDialogGroupLoading = false;
        return groupRequest
            .getGroup({ groupId, includeRoles: true })
            .catch((err) => {
                throw err;
            })
            .then((args) => {
                const ref = applyGroup(args.json);
                if (D.id === ref.id) {
                    D.ref = ref;
                    D.inGroup = ref.membershipStatus === 'member';
                    for (const role of ref.roles) {
                        if (
                            D.ref &&
                            D.ref.myMember &&
                            Array.isArray(D.ref.myMember.roleIds) &&
                            D.ref.myMember.roleIds.includes(role.id)
                        ) {
                            D.memberRoles.push(role);
                        }
                    }
                    getAllGroupPosts({
                        groupId
                    });
                    D.isGetGroupDialogGroupLoading = true;
                    if (D.inGroup) {
                        groupRequest
                            .getGroupInstances({
                                groupId
                            })
                            .then((args) => {
                                if (
                                    state.groupDialog.id === args.params.groupId
                                ) {
                                    instanceStore.applyGroupDialogInstances(
                                        args.json.instances
                                    );
                                }
                                for (const json of args.json.instances) {
                                    instanceStore.applyInstance(json);
                                    worldRequest
                                        .getCachedWorld({
                                            worldId: json.world.id
                                        })
                                        .then((args1) => {
                                            json.world = args1.ref;
                                            return args1;
                                        });
                                    // get queue size etc
                                    instanceRequest.getInstance({
                                        worldId: json.worldId,
                                        instanceId: json.instanceId
                                    });
                                }
                                // });
                            });
                    }
                }
                $app.$nextTick(() => (D.isGetGroupDialogGroupLoading = false));
                return args;
            });
    }

    async function updateInGameGroupOrder() {
        state.inGameGroupOrder = [];
        try {
            const json = await gameStore.getVRChatRegistryKey(
                `VRC_GROUP_ORDER_${userStore.currentUser.id}`
            );
            if (!json) {
                return;
            }
            state.inGameGroupOrder = JSON.parse(json);
        } catch (err) {
            console.error(err);
        }
    }

    function sortGroupInstancesByInGame(a, b) {
        const aIndex = state.inGameGroupOrder.indexOf(a?.group?.id);
        const bIndex = state.inGameGroupOrder.indexOf(b?.group?.id);
        if (aIndex === -1 && bIndex === -1) {
            return 0;
        }
        if (aIndex === -1) {
            return 1;
        }
        if (bIndex === -1) {
            return -1;
        }
        return aIndex - bIndex;
    }

    function leaveGroup(groupId) {
        groupRequest
            .leaveGroup({
                groupId
            })
            .then((args) => {
                const groupId = args.params.groupId;
                if (
                    state.groupDialog.visible &&
                    state.groupDialog.id === groupId
                ) {
                    state.groupDialog.inGroup = false;
                    getGroupDialogGroup(groupId);
                }
                if (
                    userStore.userDialog.visible &&
                    userStore.userDialog.id === userStore.currentUser.id &&
                    userStore.userDialog.representedGroup.id === groupId
                ) {
                    getCurrentUserRepresentedGroup();
                }
            });
    }

    function leaveGroupPrompt(groupId) {
        $app.$confirm('Are you sure you want to leave this group?', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    leaveGroup(groupId);
                }
            }
        });
    }

    function updateGroupPostSearch() {
        const D = state.groupDialog;
        const search = D.postsSearch.toLowerCase();
        D.postsFiltered = D.posts.filter((post) => {
            if (search === '') {
                return true;
            }
            if (post.title.toLowerCase().includes(search)) {
                return true;
            }
            if (post.text.toLowerCase().includes(search)) {
                return true;
            }
            return false;
        });
    }

    function setGroupVisibility(groupId, visibility) {
        return groupRequest
            .setGroupMemberProps(userStore.currentUser.id, groupId, {
                visibility
            })
            .then((args) => {
                handleGroupMemberProps(args);
                $app.$message({
                    message: 'Group visibility updated',
                    type: 'success'
                });
                return args;
            });
    }

    /**
     *
     * @param {object} json
     * @returns {object} ref
     */
    function applyGroup(json) {
        let ref = state.cachedGroups.get(json.id);
        if (json.rules) {
            json.rules = replaceBioSymbols(json.rules);
        }
        if (json.name) {
            json.name = replaceBioSymbols(json.name);
        }
        if (json.description) {
            json.description = replaceBioSymbols(json.description);
        }
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                name: '',
                shortCode: '',
                description: '',
                bannerId: '',
                bannerUrl: '',
                createdAt: '',
                discriminator: '',
                galleries: [],
                iconId: '',
                iconUrl: '',
                isVerified: false,
                joinState: '',
                languages: [],
                links: [],
                memberCount: 0,
                memberCountSyncedAt: '',
                membershipStatus: '',
                onlineMemberCount: 0,
                ownerId: '',
                privacy: '',
                rules: null,
                tags: [],
                // in group
                initialRoleIds: [],
                myMember: {
                    bannedAt: null,
                    groupId: '',
                    has2FA: false,
                    id: '',
                    isRepresenting: false,
                    isSubscribedToAnnouncements: false,
                    joinedAt: '',
                    managerNotes: '',
                    membershipStatus: '',
                    permissions: [],
                    roleIds: [],
                    userId: '',
                    visibility: '',
                    _created_at: '',
                    _id: '',
                    _updated_at: ''
                },
                updatedAt: '',
                // includeRoles: true
                roles: [],
                // group list
                $memberId: '',
                groupId: '',
                isRepresenting: false,
                memberVisibility: false,
                mutualGroup: false,
                // VRCX
                $languages: [],
                ...json
            };
            state.cachedGroups.set(ref.id, ref);
        } else {
            if (state.currentUserGroups.has(ref.id)) {
                // compare group props
                if (
                    ref.ownerId &&
                    json.ownerId &&
                    ref.ownerId !== json.ownerId
                ) {
                    // owner changed
                    groupOwnerChange(json, ref.ownerId, json.ownerId);
                }
                if (ref.name && json.name && ref.name !== json.name) {
                    // name changed
                    groupChange(
                        json,
                        `Name changed from ${ref.name} to ${json.name}`
                    );
                }
                if (ref.myMember?.roleIds && json.myMember?.roleIds) {
                    const oldRoleIds = ref.myMember.roleIds;
                    const newRoleIds = json.myMember.roleIds;
                    if (
                        oldRoleIds.length !== newRoleIds.length ||
                        !oldRoleIds.every(
                            (value, index) => value === newRoleIds[index]
                        )
                    ) {
                        // roleIds changed
                        groupRoleChange(
                            json,
                            ref.roles,
                            json.roles,
                            oldRoleIds,
                            newRoleIds
                        );
                    }
                }
            }
            if (json.myMember) {
                if (typeof json.myMember.roleIds === 'undefined') {
                    // keep roleIds
                    json.myMember.roleIds = ref.myMember.roleIds;
                }
                Object.assign(ref.myMember, json.myMember);
            }
            Object.assign(ref, json);
        }
        // update myMember without fetching member
        if (typeof json.memberVisibility !== 'undefined') {
            ref.myMember.visibility = json.memberVisibility;
        }
        if (typeof json.isRepresenting !== 'undefined') {
            ref.myMember.isRepresenting = json.isRepresenting;
        }
        if (typeof json.membershipStatus !== 'undefined') {
            ref.myMember.membershipStatus = json.membershipStatus;
        }
        if (typeof json.roleIds !== 'undefined') {
            ref.myMember.roleIds = json.roleIds;
        }
        ref.$url = `https://vrc.group/${ref.shortCode}.${ref.discriminator}`;
        applyGroupLanguage(ref);

        const currentUserGroupRef = state.currentUserGroups.get(ref.id);
        if (currentUserGroupRef) {
            state.currentUserGroups.set(ref.id, ref);
        }

        const D = state.groupDialog;
        if (D.visible && D.id === ref.id) {
            D.inGroup = ref.membershipStatus === 'member';
            D.ref = ref;
        }
        return ref;
    }

    function handleGroupRepresented(args) {
        const D = userStore.userDialog;
        const json = args.json;
        D.representedGroup = json;
        D.representedGroup.$thumbnailUrl = convertFileUrlToImageUrl(
            json.iconUrl
        );
        if (!json || !json.isRepresenting) {
            D.isRepresentedGroupLoading = false;
        }
        if (!json.groupId) {
            // no group
            return;
        }
        if (args.params.userId !== userStore.currentUser.id) {
            // not current user, don't apply someone elses myMember
            return;
        }
        json.$memberId = json.id;
        json.id = json.groupId;
        applyGroup(json);
    }

    function handleGroupList(args) {
        for (const json of args.json) {
            json.$memberId = json.id;
            json.id = json.groupId;
            applyGroup(json);
        }
    }

    function handleGroupMemberProps(args) {
        if (args.userId === userStore.currentUser.id) {
            const json = args.json;
            json.$memberId = json.id;
            json.id = json.groupId;
            if (
                state.groupDialog.visible &&
                state.groupDialog.id === json.groupId
            ) {
                state.groupDialog.ref.myMember.visibility = json.visibility;
                state.groupDialog.ref.myMember.isSubscribedToAnnouncements =
                    json.isSubscribedToAnnouncements;
            }
            if (
                userStore.userDialog.visible &&
                userStore.userDialog.id === userStore.currentUser.id
            ) {
                getCurrentUserRepresentedGroup();
            }
            handleGroupMember({
                json,
                params: {
                    groupId: json.groupId
                }
            });
        }
        let member;
        if (state.groupDialog.id === args.json.groupId) {
            let i;
            for (i = 0; i < state.groupDialog.members.length; ++i) {
                member = state.groupDialog.members[i];
                if (member.userId === args.json.userId) {
                    Object.assign(member, applyGroupMember(args.json));
                    break;
                }
            }
            for (i = 0; i < state.groupDialog.memberSearchResults.length; ++i) {
                member = state.groupDialog.memberSearchResults[i];
                if (member.userId === args.json.userId) {
                    Object.assign(member, applyGroupMember(args.json));
                    break;
                }
            }
        }
    }

    function handleGroupPermissions(args) {
        if (args.params.userId !== userStore.currentUser.id) {
            return;
        }
        const json = args.json;
        for (const groupId in json) {
            const permissions = json[groupId];
            const group = state.cachedGroups.get(groupId);
            if (group) {
                group.myMember.permissions = permissions;
            }
        }
    }
    /**
     *
     * @param {object} args
     */
    function handleGroupPost(args) {
        const D = state.groupDialog;
        if (D.id !== args.params.groupId) {
            return;
        }

        const newPost = args.json;
        newPost.title = replaceBioSymbols(newPost.title);
        newPost.text = replaceBioSymbols(newPost.text);
        let hasPost = false;
        // update existing post
        for (const post of D.posts) {
            if (post.id === newPost.id) {
                Object.assign(post, newPost);
                hasPost = true;
                break;
            }
        }
        // set or update announcement
        if (newPost.id === D.announcement.id || !D.announcement.id) {
            D.announcement = newPost;
        }
        // add new post
        if (!hasPost) {
            D.posts.unshift(newPost);
        }
        updateGroupPostSearch();
    }

    function handleGroupMember(args) {
        args.ref = applyGroupMember(args.json);
    }

    async function handleGroupUserInstances(args) {
        state.groupInstances = [];
        for (const json of args.json.instances) {
            if (args.json.fetchedAt) {
                // tack on fetchedAt
                json.$fetchedAt = args.json.fetchedAt;
            }
            const instanceRef = instanceStore.applyInstance(json);
            const groupRef = state.cachedGroups.get(json.ownerId);
            if (typeof groupRef === 'undefined') {
                if (watchState.isFriendsLoaded) {
                    const args = await groupRequest.getGroup({
                        groupId: json.ownerId
                    });
                    applyGroup(args.json);
                }
                return;
            }
            state.groupInstances.push({
                group: groupRef,
                instance: instanceRef
            });
        }
    }

    /**
     *
     * @param {object} json
     * @returns {*}
     */
    function applyGroupMember(json) {
        let ref;
        if (typeof json?.user !== 'undefined') {
            if (json.userId === userStore.currentUser.id) {
                json.user = userStore.currentUser;
                json.$displayName = userStore.currentUser.displayName;
            } else {
                ref = userStore.cachedUsers.get(json.user.id);
                if (typeof ref !== 'undefined') {
                    json.user = ref;
                    json.$displayName = ref.displayName;
                } else {
                    json.$displayName = json.user?.displayName;
                }
            }
        }
        // update myMember without fetching member
        if (json?.userId === userStore.currentUser.id) {
            ref = state.cachedGroups.get(json.groupId);
            if (typeof ref !== 'undefined') {
                const newJson = {
                    id: json.groupId,
                    memberVisibility: json.visibility,
                    isRepresenting: json.isRepresenting,
                    isSubscribedToAnnouncements:
                        json.isSubscribedToAnnouncements,
                    joinedAt: json.joinedAt,
                    roleIds: json.roleIds,
                    membershipStatus: json.membershipStatus
                };
                applyGroup(newJson);
            }
        }

        return json;
    }

    function applyGroupLanguage(ref) {
        ref.$languages = [];
        const { languages } = ref;
        if (!languages) {
            return;
        }
        for (const language of languages) {
            const value = userStore.subsetOfLanguages[language];
            if (typeof value === 'undefined') {
                continue;
            }
            ref.$languages.push({
                key: language,
                value
            });
        }
    }

    async function loadCurrentUserGroups(userId, groups) {
        const savedGroups = JSON.parse(
            await configRepository.getString(
                `VRCX_currentUserGroups_${userId}`,
                '[]'
            )
        );
        state.cachedGroups.clear();
        state.currentUserGroups.clear();
        for (const group of savedGroups) {
            const json = {
                id: group.id,
                name: group.name,
                iconUrl: group.iconUrl,
                ownerId: group.ownerId,
                roles: group.roles,
                myMember: {
                    roleIds: group.roleIds
                }
            };
            const ref = applyGroup(json);
            state.currentUserGroups.set(group.id, ref);
        }

        if (groups) {
            const promises = groups.map(async (groupId) => {
                const groupRef = state.cachedGroups.get(groupId);

                if (
                    typeof groupRef !== 'undefined' &&
                    groupRef.roles?.length > 0
                ) {
                    return;
                }

                try {
                    console.log(`Fetching group with missing roles ${groupId}`);
                    const args = await groupRequest.getGroup({
                        groupId,
                        includeRoles: true
                    });
                    const ref = applyGroup(args.json);
                    state.currentUserGroups.set(groupId, ref);
                } catch (err) {
                    console.error(err);
                }
            });

            await Promise.allSettled(promises);
        }

        state.currentUserGroupsInit = true;
        getCurrentUserGroups();
    }

    async function getCurrentUserGroups() {
        const args = await groupRequest.getGroups({
            userId: userStore.currentUser.id
        });
        handleGroupList(args);
        state.currentUserGroups.clear();
        for (const group of args.json) {
            const ref = applyGroup(group);
            if (!state.currentUserGroups.has(group.id)) {
                state.currentUserGroups.set(group.id, ref);
            }
        }
        const args1 = await groupRequest.getGroupPermissions({
            userId: userStore.currentUser.id
        });
        handleGroupPermissions(args1);
        saveCurrentUserGroups();
    }

    function getCurrentUserRepresentedGroup() {
        return groupRequest
            .getRepresentedGroup({
                userId: userStore.currentUser.id
            })
            .then((args) => {
                handleGroupRepresented(args);
                return args;
            });
    }

    async function initUserGroups() {
        updateInGameGroupOrder();
        loadCurrentUserGroups(
            userStore.currentUser.id,
            userStore.currentUser?.presence?.groups
        );
    }

    return {
        state,
        groupDialog,
        currentUserGroups,
        inviteGroupDialog,
        cachedGroups,
        inGameGroupOrder,
        groupInstances,
        currentUserGroupsInit,
        initUserGroups,
        showGroupDialog,
        applyGroup,
        saveCurrentUserGroups,
        applyPresenceGroups,
        getGroupDialogGroup,
        updateInGameGroupOrder,
        sortGroupInstancesByInGame,
        leaveGroup,
        leaveGroupPrompt,
        updateGroupPostSearch,
        setGroupVisibility,
        applyGroupMember,
        loadCurrentUserGroups,
        handleGroupPost,
        handleGroupUserInstances,
        handleGroupMember,
        handleGroupPermissions,
        handleGroupMemberProps,
        handleGroupList,
        handleGroupRepresented
    };
});
