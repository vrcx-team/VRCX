import * as workerTimers from 'worker-timers';
import configRepository from '../service/config.js';
import { baseClass, $app, API, $t } from './baseClass.js';
import {
    userRequest,
    worldRequest,
    instanceRequest,
    groupRequest
} from '../api';
import $utils from './utils';
import database from '../service/database.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        API.cachedGroups = new Map();
        API.currentUserGroups = new Map();

        API.$on('GROUP', function (args) {
            args.ref = this.applyGroup(args.json);
        });

        API.$on('GROUP', function (args) {
            var { ref } = args;
            var D = $app.groupDialog;
            if (D.visible === false || D.id !== ref.id) {
                return;
            }
            D.inGroup = ref.membershipStatus === 'member';
            D.ref = ref;
        });

        API.$on('GROUP:REPRESENTED', function (args) {
            var json = args.json;
            if (!json.groupId) {
                // no group
                return;
            }
            json.$memberId = json.id;
            json.id = json.groupId;
            this.$emit('GROUP', {
                json,
                params: {
                    groupId: json.groupId,
                    userId: args.params.userId
                }
            });
        });

        API.$on('GROUP:LIST', function (args) {
            for (var json of args.json) {
                json.$memberId = json.id;
                json.id = json.groupId;
                this.$emit('GROUP', {
                    json,
                    params: {
                        groupId: json.id,
                        userId: args.params.userId
                    }
                });
            }
        });

        API.$on('GROUP:MEMBER:PROPS', function (args) {
            if (args.userId !== this.currentUser.id) {
                return;
            }
            var json = args.json;
            json.$memberId = json.id;
            json.id = json.groupId;
            if (
                $app.groupDialog.visible &&
                $app.groupDialog.id === json.groupId
            ) {
                $app.groupDialog.ref.myMember.visibility = json.visibility;
                $app.groupDialog.ref.myMember.isSubscribedToAnnouncements =
                    json.isSubscribedToAnnouncements;
            }
            if (
                $app.userDialog.visible &&
                $app.userDialog.id === this.currentUser.id
            ) {
                $app.getCurrentUserRepresentedGroup();
            }
            this.$emit('GROUP:MEMBER', {
                json,
                params: {
                    groupId: json.groupId
                }
            });
        });

        API.$on('GROUP:MEMBER:PROPS', function (args) {
            if ($app.groupDialog.id === args.json.groupId) {
                for (var i = 0; i < $app.groupDialog.members.length; ++i) {
                    var member = $app.groupDialog.members[i];
                    if (member.userId === args.json.userId) {
                        Object.assign(member, this.applyGroupMember(args.json));
                        break;
                    }
                }
                for (
                    var i = 0;
                    i < $app.groupDialog.memberSearchResults.length;
                    ++i
                ) {
                    var member = $app.groupDialog.memberSearchResults[i];
                    if (member.userId === args.json.userId) {
                        Object.assign(member, this.applyGroupMember(args.json));
                        break;
                    }
                }
            }

            // The 'GROUP:MEMBER:PROPS' event is triggered by the setGroupVisibility, setGroupSubscription, or groupMembersSaveNote.
            // The first two methods originate from the Group Dialog (visibility/Subscription);
            // Group Member Moderation Dialog is necessarily not visible then.

            // if (
            //     $app.groupMemberModeration.visible &&
            //     $app.groupMemberModeration.id === args.json.groupId
            // ) {
            //     // force redraw table
            //     $app.groupMembersSearch();
            // }
        });

        API.$on('GROUP:PERMISSIONS', function (args) {
            if (args.params.userId !== this.currentUser.id) {
                return;
            }
            var json = args.json;
            for (var groupId in json) {
                var permissions = json[groupId];
                var group = this.cachedGroups.get(groupId);
                if (group) {
                    group.myMember.permissions = permissions;
                }
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getAllGroupPosts = async function (params) {
            var posts = [];
            var offset = 0;
            var n = 100;
            var total = 0;
            do {
                var args = await groupRequest.getGroupPosts({
                    groupId: params.groupId,
                    n,
                    offset
                });
                posts = posts.concat(args.json.posts);
                total = args.json.total;
                offset += n;
            } while (offset < total);
            var returnArgs = {
                posts,
                params
            };
            this.$emit('GROUP:POSTS:ALL', returnArgs);
            return returnArgs;
        };

        API.$on('GROUP:POSTS:ALL', function (args) {
            var D = $app.groupDialog;
            if (D.id === args.params.groupId) {
                for (var post of args.posts) {
                    post.title = $utils.replaceBioSymbols(post.title);
                    post.text = $utils.replaceBioSymbols(post.text);
                }
                if (args.posts.length > 0) {
                    D.announcement = args.posts[0];
                }
                D.posts = args.posts;
                $app.updateGroupPostSearch();
            }
        });

        API.$on('GROUP:POST', function (args) {
            var D = $app.groupDialog;
            if (D.id !== args.params.groupId) {
                return;
            }

            var newPost = args.json;
            newPost.title = $utils.replaceBioSymbols(newPost.title);
            newPost.text = $utils.replaceBioSymbols(newPost.text);
            var hasPost = false;
            // update existing post
            for (var post of D.posts) {
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
            $app.updateGroupPostSearch();
        });

        API.$on('GROUP:MEMBERS', function (args) {
            for (var json of args.json) {
                this.$emit('GROUP:MEMBER', {
                    json,
                    params: {
                        groupId: args.params.groupId
                    }
                });
            }
        });

        API.$on('GROUP:MEMBER', function (args) {
            args.ref = this.applyGroupMember(args.json);
        });

        API.$on('GROUP:USER:INSTANCES', function (args) {
            $app.groupInstances = [];
            for (const json of args.json.instances) {
                if (args.json.fetchedAt) {
                    // tack on fetchedAt
                    json.$fetchedAt = args.json.fetchedAt;
                }
                this.$emit('INSTANCE', {
                    json,
                    params: {
                        fetchedAt: args.json.fetchedAt
                    }
                });
                const ref = this.cachedGroups.get(json.ownerId);
                if (typeof ref === 'undefined') {
                    if ($app.friendLogInitStatus) {
                        groupRequest.getGroup({ groupId: json.ownerId });
                    }
                    return;
                }
                $app.groupInstances.push({
                    group: ref,
                    instance: this.applyInstance(json)
                });
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getCachedGroup = function (params) {
            return new Promise((resolve, reject) => {
                var ref = this.cachedGroups.get(params.groupId);
                if (typeof ref === 'undefined') {
                    groupRequest.getGroup(params).catch(reject).then(resolve);
                } else {
                    resolve({
                        cache: true,
                        json: ref,
                        params,
                        ref
                    });
                }
            });
        };

        API.applyGroup = function (json) {
            var ref = this.cachedGroups.get(json.id);
            json.rules = $utils.replaceBioSymbols(json.rules);
            json.name = $utils.replaceBioSymbols(json.name);
            json.description = $utils.replaceBioSymbols(json.description);
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
                this.cachedGroups.set(ref.id, ref);
            } else {
                if (this.currentUserGroups.has(ref.id)) {
                    // compare group props
                    if (
                        ref.ownerId &&
                        json.ownerId &&
                        ref.ownerId !== json.ownerId
                    ) {
                        // owner changed
                        $app.groupOwnerChange(json, ref.ownerId, json.ownerId);
                    }
                    if (ref.name && json.name && ref.name !== json.name) {
                        // name changed
                        $app.groupChange(
                            json,
                            `Name changed from ${ref.name} to ${json.name}`
                        );
                    }
                    if (ref.myMember?.roleIds && json.myMember?.roleIds) {
                        var oldRoleIds = ref.myMember.roleIds;
                        var newRoleIds = json.myMember.roleIds;
                        if (
                            oldRoleIds.length !== newRoleIds.length ||
                            !oldRoleIds.every(
                                (value, index) => value === newRoleIds[index]
                            )
                        ) {
                            // roleIds changed
                            $app.groupRoleChange(
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
                    if (typeof json.myMember.isRepresenting !== 'undefined') {
                        json.myMember.isRepresenting =
                            ref.myMember.isRepresenting;
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
            this.applyGroupLanguage(ref);

            var currentUserGroupRef = this.currentUserGroups.get(ref.id);
            if (currentUserGroupRef && currentUserGroupRef !== ref) {
                this.currentUserGroups.set(ref.id, ref);
            }

            return ref;
        };

        API.applyGroupMember = function (json) {
            if (typeof json?.user !== 'undefined') {
                if (json.userId === this.currentUser.id) {
                    json.user = this.currentUser;
                    json.$displayName = this.currentUser.displayName;
                } else {
                    var ref = this.cachedUsers.get(json.user.id);
                    if (typeof ref !== 'undefined') {
                        json.user = ref;
                        json.$displayName = ref.displayName;
                    } else {
                        json.$displayName = json.user?.displayName;
                    }
                }
            }
            // update myMember without fetching member
            if (json?.userId === this.currentUser.id) {
                var ref = this.cachedGroups.get(json.groupId);
                if (typeof ref !== 'undefined') {
                    this.$emit('GROUP', {
                        json: {
                            ...ref,
                            memberVisibility: json.visibility,
                            isRepresenting: json.isRepresenting,
                            isSubscribedToAnnouncements:
                                json.isSubscribedToAnnouncements,
                            joinedAt: json.joinedAt,
                            roleIds: json.roleIds,
                            membershipStatus: json.membershipStatus
                        },
                        params: {
                            groupId: json.groupId
                        }
                    });
                }
            }

            return json;
        };

        API.applyGroupLanguage = function (ref) {
            ref.$languages = [];
            var { languages } = ref;
            if (!languages) {
                return;
            }
            for (var language of languages) {
                var value = $app.subsetOfLanguages[language];
                if (typeof value === 'undefined') {
                    continue;
                }
                ref.$languages.push({
                    key: language,
                    value
                });
            }
        };
    }

    _data = {
        currentUserGroupsInit: false,
        // maybe unnecessary
        // groupDialogLastMembers: '',
        // groupDialogLastGallery: '',
        groupMembersSearchTimer: null,
        groupMembersSearchPending: false,
        isGroupGalleryLoading: false,

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
                name: $t('dialog.group.members.filters.everyone'),
                id: null
            },
            memberSortOrder: {
                name: $t('dialog.group.members.sorting.joined_at_desc'),
                value: 'joinedAt:desc'
            },
            postsSearch: '',
            galleries: {},
            lastVisit: ''
        },
        inviteGroupDialog: {
            visible: false,
            loading: false,
            groupId: '',
            groupName: '',
            userId: '',
            userIds: [],
            userObject: {}
        }
    };

    _methods = {
        blockGroup(groupId) {
            this.$confirm(
                'Are you sure you want to block this group?',
                'Confirm',
                {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            groupRequest
                                .blockGroup({
                                    groupId
                                })
                                .then((args) => {
                                    // API.$on('GROUP:BLOCK', function (args) {
                                    if (
                                        this.groupDialog.visible &&
                                        this.groupDialog.id ===
                                            args.params.groupId
                                    ) {
                                        this.showGroupDialog(
                                            args.params.groupId
                                        );
                                    }
                                    // });
                                });
                        }
                    }
                }
            );
        },

        unblockGroup(groupId) {
            this.$confirm(
                'Are you sure you want to unblock this group?',
                'Confirm',
                {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            groupRequest
                                .unblockGroup({
                                    groupId,
                                    userId: API.currentUser.id
                                })
                                .then((args) => {
                                    // API.$on('GROUP:UNBLOCK', function (args) {
                                    if (
                                        this.groupDialog.visible &&
                                        this.groupDialog.id ===
                                            args.params.groupId
                                    ) {
                                        this.showGroupDialog(
                                            args.params.groupId
                                        );
                                    }
                                    // });
                                });
                        }
                    }
                }
            );
        },

        async groupOwnerChange(ref, oldUserId, newUserId) {
            var oldUser = await userRequest.getCachedUser({
                userId: oldUserId
            });
            var newUser = await userRequest.getCachedUser({
                userId: newUserId
            });
            var oldDisplayName = oldUser?.ref?.displayName;
            var newDisplayName = newUser?.ref?.displayName;

            this.groupChange(
                ref,
                `Owner changed from ${oldDisplayName} to ${newDisplayName}`
            );
        },

        groupRoleChange(ref, oldRoles, newRoles, oldRoleIds, newRoleIds) {
            // check for removed/added roleIds
            for (var roleId of oldRoleIds) {
                if (!newRoleIds.includes(roleId)) {
                    var roleName = '';
                    var role = oldRoles.find(
                        (fineRole) => fineRole.id === roleId
                    );
                    if (role) {
                        roleName = role.name;
                    }
                    this.groupChange(ref, `Role ${roleName} removed`);
                }
            }
            for (var roleId of newRoleIds) {
                if (!oldRoleIds.includes(roleId)) {
                    var roleName = '';
                    var role = newRoles.find(
                        (fineRole) => fineRole.id === roleId
                    );
                    if (role) {
                        roleName = role.name;
                    }
                    this.groupChange(ref, `Role ${roleName} added`);
                }
            }
        },

        groupChange(ref, message) {
            if (!this.currentUserGroupsInit) {
                return;
            }
            // oh the level of cursed for compibility
            var json = {
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
            API.$emit('NOTIFICATION', {
                json,
                params: {
                    notificationId: json.id
                }
            });

            // delay to wait for json to be assigned to ref
            workerTimers.setTimeout(this.saveCurrentUserGroups, 100);
        },

        saveCurrentUserGroups() {
            if (!this.currentUserGroupsInit) {
                return;
            }
            var groups = [];
            for (var ref of API.currentUserGroups.values()) {
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
                `VRCX_currentUserGroups_${API.currentUser.id}`,
                JSON.stringify(groups)
            );
        },

        async loadCurrentUserGroups(userId, groups) {
            var savedGroups = JSON.parse(
                await configRepository.getString(
                    `VRCX_currentUserGroups_${userId}`,
                    '[]'
                )
            );
            API.cachedGroups.clear();
            API.currentUserGroups.clear();
            for (var group of savedGroups) {
                var json = {
                    id: group.id,
                    name: group.name,
                    iconUrl: group.iconUrl,
                    ownerId: group.ownerId,
                    roles: group.roles,
                    myMember: {
                        roleIds: group.roleIds
                    }
                };
                var ref = API.applyGroup(json);
                API.currentUserGroups.set(group.id, ref);
            }

            if (groups) {
                const promises = groups.map(async (groupId) => {
                    const groupRef = API.cachedGroups.get(groupId);

                    if (
                        typeof groupRef !== 'undefined' &&
                        groupRef.roles?.length > 0
                    ) {
                        return;
                    }

                    try {
                        console.log(
                            `Fetching group with missing roles ${groupId}`
                        );
                        const args = await groupRequest.getGroup({
                            groupId,
                            includeRoles: true
                        });
                        const ref = API.applyGroup(args.json);
                        API.currentUserGroups.set(groupId, ref);
                    } catch (err) {
                        console.error(err);
                    }
                });

                await Promise.allSettled(promises);
            }

            this.currentUserGroupsInit = true;
            this.getCurrentUserGroups();
        },

        async getCurrentUserGroups() {
            var args = await groupRequest.getGroups({
                userId: API.currentUser.id
            });
            API.currentUserGroups.clear();
            for (var group of args.json) {
                var ref = API.applyGroup(group);
                if (!API.currentUserGroups.has(group.id)) {
                    API.currentUserGroups.set(group.id, ref);
                }
            }
            await groupRequest.getGroupPermissions({
                userId: API.currentUser.id
            });
            this.saveCurrentUserGroups();
        },

        showGroupDialog(groupId) {
            if (!groupId) {
                return;
            }
            var D = this.groupDialog;
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
            D.lastVisit = '';
            D.memberSearch = '';
            D.memberSearchResults = [];
            D.galleries = {};
            D.members = [];
            D.memberFilter = this.groupDialogFilterOptions.everyone;
            API.getCachedGroup({
                groupId
            })
                .catch((err) => {
                    D.loading = false;
                    D.visible = false;
                    this.$message({
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
                        database.getLastGroupVisit(D.ref.name).then((r) => {
                            if (D.id === args.ref.id) {
                                D.lastVisit = r.created_at;
                            }
                        });
                        this.applyGroupDialogInstances();
                        this.getGroupDialogGroup(groupId);
                    }
                });
        },

        getGroupDialogGroup(groupId) {
            var D = this.groupDialog;
            D.isGetGroupDialogGroupLoading = false;
            return groupRequest
                .getGroup({ groupId, includeRoles: true })
                .catch((err) => {
                    throw err;
                })
                .then((args1) => {
                    if (D.id === args1.ref.id) {
                        D.ref = args1.ref;
                        D.inGroup = args1.ref.membershipStatus === 'member';
                        for (var role of args1.ref.roles) {
                            if (
                                D.ref &&
                                D.ref.myMember &&
                                Array.isArray(D.ref.myMember.roleIds) &&
                                D.ref.myMember.roleIds.includes(role.id)
                            ) {
                                D.memberRoles.push(role);
                            }
                        }
                        API.getAllGroupPosts({
                            groupId
                        });
                        D.isGetGroupDialogGroupLoading = true;
                        if (D.inGroup) {
                            groupRequest
                                .getGroupInstances({
                                    groupId
                                })
                                .then((args) => {
                                    // API.$on('GROUP:INSTANCES', function (args) {
                                    if (
                                        this.groupDialog.id ===
                                        args.params.groupId
                                    ) {
                                        this.applyGroupDialogInstances(
                                            args.json.instances
                                        );
                                    }
                                    // });

                                    // API.$on('GROUP:INSTANCES', function (args) {
                                    for (const json of args.json.instances) {
                                        this.$emit('INSTANCE', {
                                            json,
                                            params: {
                                                fetchedAt: args.json.fetchedAt
                                            }
                                        });
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
                    this.$nextTick(
                        () => (D.isGetGroupDialogGroupLoading = false)
                    );
                    return args1;
                });
        },

        groupDialogCommand(command) {
            var D = this.groupDialog;
            if (D.visible === false) {
                return;
            }
            switch (command) {
                case 'Refresh':
                    this.showGroupDialog(D.id);
                    break;
                case 'Leave Group':
                    this.leaveGroupPrompt(D.id);
                    break;
                case 'Block Group':
                    this.blockGroup(D.id);
                    break;
                case 'Unblock Group':
                    this.unblockGroup(D.id);
                    break;
                case 'Visibility Everyone':
                    this.setGroupVisibility(D.id, 'visible');
                    break;
                case 'Visibility Friends':
                    this.setGroupVisibility(D.id, 'friends');
                    break;
                case 'Visibility Hidden':
                    this.setGroupVisibility(D.id, 'hidden');
                    break;
                case 'Subscribe To Announcements':
                    this.setGroupSubscription(D.id, true);
                    break;
                case 'Unsubscribe To Announcements':
                    this.setGroupSubscription(D.id, false);
                    break;
            }
        },

        leaveGroup(groupId) {
            groupRequest
                .leaveGroup({
                    groupId
                })
                .then((args) => {
                    const groupId = args.params.groupId;
                    if (
                        this.groupDialog.visible &&
                        this.groupDialog.id === groupId
                    ) {
                        this.groupDialog.inGroup = false;
                        this.getGroupDialogGroup(groupId);
                    }
                    if (
                        this.userDialog.visible &&
                        this.userDialog.id === API.currentUser.id &&
                        this.userDialog.representedGroup.id === groupId
                    ) {
                        this.getCurrentUserRepresentedGroup();
                    }
                });
        },

        leaveGroupPrompt(groupId) {
            this.$confirm(
                'Are you sure you want to leave this group?',
                'Confirm',
                {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            this.leaveGroup(groupId);
                        }
                    }
                }
            );
        },

        setGroupVisibility(groupId, visibility) {
            return groupRequest
                .setGroupMemberProps(API.currentUser.id, groupId, {
                    visibility
                })
                .then((args) => {
                    this.$message({
                        message: 'Group visibility updated',
                        type: 'success'
                    });
                    return args;
                });
        },

        setGroupSubscription(groupId, subscribe) {
            return groupRequest
                .setGroupMemberProps(API.currentUser.id, groupId, {
                    isSubscribedToAnnouncements: subscribe
                })
                .then((args) => {
                    this.$message({
                        message: 'Group subscription updated',
                        type: 'success'
                    });
                    return args;
                });
        },

        onGroupJoined(groupId) {
            // NOTE: don't know why need this
            // if (
            //     this.groupMemberModeration.visible &&
            //     this.groupMemberModeration.id === groupId
            // ) {
            //     // ignore this event if we were the one to trigger it
            //     return;
            // }
            if (!API.currentUserGroups.has(groupId)) {
                API.currentUserGroups.set(groupId, {
                    id: groupId,
                    name: '',
                    iconUrl: ''
                });
                groupRequest
                    .getGroup({ groupId, includeRoles: true })
                    .then((args) => {
                        API.applyGroup(args.json); // make sure this runs before saveCurrentUserGroups
                        this.saveCurrentUserGroups();
                        return args;
                    });
            }
        },

        onGroupLeft(groupId) {
            if (this.groupDialog.visible && this.groupDialog.id === groupId) {
                this.showGroupDialog(groupId);
            }
            if (API.currentUserGroups.has(groupId)) {
                API.currentUserGroups.delete(groupId);
                API.getCachedGroup({ groupId }).then((args) => {
                    this.groupChange(args.ref, 'Left group');
                });
            }
        },

        updateGroupPostSearch() {
            var D = this.groupDialog;
            var search = D.postsSearch.toLowerCase();
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
        },

        getCurrentUserRepresentedGroup() {
            return groupRequest
                .getRepresentedGroup({
                    userId: API.currentUser.id
                })
                .then((args) => {
                    this.userDialog.representedGroup = args.json;
                    return args;
                });
        }
    };
}
