import { nextTick, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import {
    groupRequest,
    instanceRequest,
    userRequest,
    worldRequest
} from '../api';
import {
    convertFileUrlToImageUrl,
    hasGroupPermission,
    replaceBioSymbols
} from '../shared/utils';
import { database } from '../service/database.js';
import { groupDialogFilterOptions } from '../shared/constants/';
import { useAvatarStore } from './avatar';
import { useGameStore } from './game';
import { useInstanceStore } from './instance';
import { useModalStore } from './modal';
import { useNotificationStore } from './notification';
import { useUiStore } from './ui';
import { useUserStore } from './user';
import { useWorldStore } from './world';
import { watchState } from '../service/watchState';

import configRepository from '../service/config';

import * as workerTimers from 'worker-timers';

export const useGroupStore = defineStore('Group', () => {
    const instanceStore = useInstanceStore();
    const gameStore = useGameStore();
    const userStore = useUserStore();
    const worldStore = useWorldStore();
    const avatarStore = useAvatarStore();
    const notificationStore = useNotificationStore();
    const modalStore = useModalStore();
    const uiStore = useUiStore();
    const { t } = useI18n();

    let cachedGroups = new Map();

    const groupDialog = ref({
        visible: false,
        loading: false,
        activeTab: 'Info',
        lastActiveTab: 'Info',
        isGetGroupDialogGroupLoading: false,
        id: '',
        inGroup: false,
        ownerDisplayName: '',
        ref: {},
        announcement: {},
        posts: [],
        postsFiltered: [],
        calendar: [],
        members: [],
        memberSearch: '',
        memberSearchResults: [],
        instances: [],
        memberRoles: [],
        lastVisit: '',
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
    });

    const currentUserGroups = reactive(new Map());

    const inviteGroupDialog = ref({
        visible: false,
        loading: false,
        groupId: '',
        groupName: '',
        userId: '',
        userIds: [],
        userObject: {
            id: '',
            displayName: '',
            $userColour: ''
        }
    });

    const moderateGroupDialog = ref({
        visible: false,
        groupId: '',
        groupName: '',
        userId: '',
        userObject: {}
    });

    const groupMemberModeration = ref({
        visible: false,
        loading: false,
        id: '',
        groupRef: {},
        auditLogTypes: [],
        openWithUserId: ''
    });

    const inGameGroupOrder = ref([]);

    const groupInstances = ref([]);

    const currentUserGroupsInit = ref(false);

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            groupDialog.value.visible = false;
            inviteGroupDialog.value.visible = false;
            moderateGroupDialog.value.visible = false;
            groupMemberModeration.value.visible = false;
            currentUserGroupsInit.value = false;
            cachedGroups.clear();
            currentUserGroups.clear();
            if (isLoggedIn) {
                initUserGroups();
            }
        },
        { flush: 'sync' }
    );

    function showGroupDialog(groupId, options = {}) {
        if (!groupId) {
            return;
        }
        uiStore.openDialog({
            type: 'group',
            id: groupId,
            skipBreadcrumb: options.skipBreadcrumb
        });
        const D = groupDialog.value;
        D.visible = true;
        D.loading = true;
        D.id = groupId;
        D.inGroup = false;
        D.ownerDisplayName = '';
        D.announcement = {};
        D.posts = [];
        D.postsFiltered = [];
        D.instances = [];
        D.memberRoles = [];
        D.lastVisit = '';
        D.memberSearch = '';
        D.memberSearchResults = [];
        D.galleries = {};
        D.members = [];
        D.memberFilter = groupDialogFilterOptions.everyone;
        D.calendar = [];
        groupRequest
            .getCachedGroup({
                groupId
            })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                toast.error(t('message.group.load_failed'));
                throw err;
            })
            .then((args) => {
                if (groupId === args.ref.id) {
                    D.ref = args.ref;
                    uiStore.setDialogCrumbLabel(
                        'group',
                        D.id,
                        D.ref?.name || D.id
                    );
                    D.inGroup = args.ref.membershipStatus === 'member';
                    D.ownerDisplayName = args.ref.ownerId;
                    D.visible = true;
                    userRequest
                        .getCachedUser({
                            userId: args.ref.ownerId
                        })
                        .then((args1) => {
                            D.ownerDisplayName = args1.ref.displayName;
                            return args1;
                        });
                    database.getLastGroupVisit(D.ref.name).then((r) => {
                        if (D.id === args.ref.id) {
                            D.lastVisit = r.created_at;
                        }
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
        if (!currentUserGroupsInit.value) {
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
        if (!currentUserGroupsInit.value) {
            return;
        }
        const groups = [];
        for (const ref of currentUserGroups.values()) {
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
        if (typeof newRoles !== 'undefined') {
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
    }

    /**
     *
     * @param {object} ref
     */
    function applyPresenceGroups(ref) {
        if (!currentUserGroupsInit.value) {
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
            if (!currentUserGroups.has(groupId)) {
                onGroupJoined(groupId);
            }
        }
        for (const groupId of currentUserGroups.keys()) {
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
        if (!currentUserGroups.has(groupId)) {
            currentUserGroups.set(groupId, {
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
    async function onGroupLeft(groupId) {
        const args = await groupRequest.getGroup({ groupId });
        const ref = applyGroup(args.json);
        if (ref.membershipStatus === 'member') {
            // wtf, not trusting presence
            console.error(
                `onGroupLeft: presence lied, still a member of ${groupId}`
            );
            return;
        }
        if (groupDialog.value.visible && groupDialog.value.id === groupId) {
            showGroupDialog(groupId);
        }
        if (currentUserGroups.has(groupId)) {
            currentUserGroups.delete(groupId);
            groupChange(ref, 'Left group');

            // delay to wait for json to be assigned to ref
            workerTimers.setTimeout(saveCurrentUserGroups, 100);
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
        const D = groupDialog.value;
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
        const D = groupDialog.value;
        D.isGetGroupDialogGroupLoading = false;
        return groupRequest
            .getGroup({ groupId, includeRoles: true })
            .catch((err) => {
                throw err;
            })
            .then((args) => {
                const ref = applyGroup(args.json);
                if (D.id === ref.id) {
                    D.loading = false;
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
                    groupRequest
                        .getGroupInstances({
                            groupId
                        })
                        .then((args) => {
                            if (groupDialog.value.id === args.params.groupId) {
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
                                    });
                                // get queue size etc
                                instanceRequest.getInstance({
                                    worldId: json.worldId,
                                    instanceId: json.instanceId
                                });
                            }
                        });
                    groupRequest.getGroupCalendar(groupId).then((args) => {
                        if (groupDialog.value.id === args.params.groupId) {
                            D.calendar = args.json.results;
                            for (const event of D.calendar) {
                                applyGroupEvent(event);
                                // fetch again for isFollowing
                                groupRequest
                                    .getGroupCalendarEvent({
                                        groupId,
                                        eventId: event.id
                                    })
                                    .then((args) => {
                                        Object.assign(
                                            event,
                                            applyGroupEvent(args.json)
                                        );
                                    });
                            }
                        }
                    });
                }
                nextTick(() => (D.isGetGroupDialogGroupLoading = false));
                return args;
            });
    }

    function applyGroupEvent(event) {
        return {
            userInterest: {
                createdAt: null,
                isFollowing: false,
                updatedAt: null
            },
            ...event,
            title: replaceBioSymbols(event.title),
            description: replaceBioSymbols(event.description)
        };
    }

    async function updateInGameGroupOrder() {
        inGameGroupOrder.value = [];
        try {
            const json = await gameStore.getVRChatRegistryKey(
                `VRC_GROUP_ORDER_${userStore.currentUser.id}`
            );
            if (!json) {
                return;
            }
            inGameGroupOrder.value = JSON.parse(json);
        } catch (err) {
            console.error(err);
        }
    }

    function sortGroupInstancesByInGame(a, b) {
        const aIndex = inGameGroupOrder.value.indexOf(a?.group?.id);
        const bIndex = inGameGroupOrder.value.indexOf(b?.group?.id);
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
                    groupDialog.value.visible &&
                    groupDialog.value.id === groupId
                ) {
                    groupDialog.value.inGroup = false;
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
        modalStore
            .confirm({
                description: 'Are you sure you want to leave this group?',
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (!ok) return;
                leaveGroup(groupId);
            })
            .catch(() => {});
    }

    function updateGroupPostSearch() {
        const D = groupDialog.value;
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
                toast.success('Group visibility updated');
                return args;
            });
    }

    function setGroupSubscription(groupId, subscribe) {
        return groupRequest
            .setGroupMemberProps(userStore.currentUser.id, groupId, {
                isSubscribedToAnnouncements: subscribe
            })
            .then((args) => {
                handleGroupMemberProps(args);
                toast.success('Group subscription updated');
                return args;
            });
    }

    /**
     *
     * @param {object} json
     * @returns {object} ref
     */
    function applyGroup(json) {
        let ref = cachedGroups.get(json.id);
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
            cachedGroups.set(ref.id, ref);
        } else {
            if (currentUserGroups.has(ref.id)) {
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

        const currentUserGroupRef = currentUserGroups.get(ref.id);
        if (currentUserGroupRef) {
            currentUserGroups.set(ref.id, ref);
        }

        const D = groupDialog.value;
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
                groupDialog.value.visible &&
                groupDialog.value.id === json.groupId
            ) {
                groupDialog.value.ref.myMember.visibility = json.visibility;
                groupDialog.value.ref.myMember.isSubscribedToAnnouncements =
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
        if (groupDialog.value.id === args.json.groupId) {
            let i;
            for (i = 0; i < groupDialog.value.members.length; ++i) {
                member = groupDialog.value.members[i];
                if (member.userId === args.json.userId) {
                    Object.assign(member, applyGroupMember(args.json));
                    break;
                }
            }
            for (i = 0; i < groupDialog.value.memberSearchResults.length; ++i) {
                member = groupDialog.value.memberSearchResults[i];
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
            const group = cachedGroups.get(groupId);
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
        const D = groupDialog.value;
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
        groupInstances.value = [];
        for (const json of args.json.instances) {
            if (args.json.fetchedAt) {
                // tack on fetchedAt
                json.$fetchedAt = args.json.fetchedAt;
            }
            const instanceRef = instanceStore.applyInstance(json);
            const groupRef = cachedGroups.get(json.ownerId);
            if (typeof groupRef === 'undefined') {
                if (watchState.isFriendsLoaded) {
                    const args = await groupRequest.getGroup({
                        groupId: json.ownerId
                    });
                    applyGroup(args.json);
                }
                return;
            }
            groupInstances.value.push({
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
            ref = cachedGroups.get(json.groupId);
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
        cachedGroups.clear();
        currentUserGroups.clear();
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
            currentUserGroups.set(group.id, ref);
        }

        if (groups) {
            const promises = groups.map(async (groupId) => {
                const groupRef = cachedGroups.get(groupId);

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
                    currentUserGroups.set(groupId, ref);
                } catch (err) {
                    console.error(err);
                }
            });

            await Promise.allSettled(promises);
        }

        currentUserGroupsInit.value = true;
        getCurrentUserGroups();
    }

    async function getCurrentUserGroups() {
        const args = await groupRequest.getGroups({
            userId: userStore.currentUser.id
        });
        handleGroupList(args);
        currentUserGroups.clear();
        for (const group of args.json) {
            const ref = applyGroup(group);
            if (!currentUserGroups.has(group.id)) {
                currentUserGroups.set(group.id, ref);
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

    function showModerateGroupDialog(userId) {
        const D = moderateGroupDialog.value;
        D.userId = userId;
        D.userObject = {};
        D.visible = true;
    }

    function showGroupMemberModerationDialog(groupId, userId = '') {
        const D = groupMemberModeration.value;
        D.id = groupId;
        D.openWithUserId = userId;

        D.groupRef = {};
        D.auditLogTypes = [];
        groupRequest.getCachedGroup({ groupId }).then((args) => {
            D.groupRef = args.ref;
            if (hasGroupPermission(D.groupRef, 'group-audit-view')) {
                groupRequest.getGroupAuditLogTypes({ groupId }).then((args) => {
                    if (D.id !== args.params.groupId) {
                        return;
                    }
                    D.auditLogTypes = args.json;
                });
            }
        });
        D.visible = true;
    }

    return {
        groupDialog,
        currentUserGroups,
        inviteGroupDialog,
        moderateGroupDialog,
        groupMemberModeration,
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
        setGroupSubscription,
        applyGroupMember,
        loadCurrentUserGroups,
        handleGroupPost,
        handleGroupUserInstances,
        handleGroupMember,
        handleGroupPermissions,
        handleGroupMemberProps,
        handleGroupList,
        handleGroupRepresented,
        showModerateGroupDialog,
        showGroupMemberModerationDialog,
        onGroupLeft,
        applyGroupEvent
    };
});
