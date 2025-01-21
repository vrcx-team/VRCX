import * as workerTimers from 'worker-timers';
import configRepository from '../repository/config.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        API.cachedGroups = new Map();
        API.currentUserGroups = new Map();

        /**
         * @param {{ groupId: string }} params
         */
        API.getGroup = function (params) {
            return this.call(`groups/${params.groupId}`, {
                method: 'GET',
                params: {
                    includeRoles: params.includeRoles || false
                }
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP', args);
                return args;
            });
        };

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

        /**
         * @param {{ userId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getRepresentedGroup = function (params) {
            return this.call(`users/${params.userId}/groups/represented`, {
                method: 'GET'
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:REPRESENTED', args);
                return args;
            });
        };

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

        /**
         * @param {{ userId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getGroups = function (params) {
            return this.call(`users/${params.userId}/groups`, {
                method: 'GET'
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:LIST', args);
                return args;
            });
        };

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

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.joinGroup = function (params) {
            return this.call(`groups/${params.groupId}/join`, {
                method: 'POST'
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:JOIN', args);
                return args;
            });
        };

        API.$on('GROUP:JOIN', function (args) {
            var json = {
                $memberId: args.json.id,
                id: args.json.groupId,
                membershipStatus: args.json.membershipStatus,
                myMember: {
                    isRepresenting: args.json.isRepresenting,
                    id: args.json.id,
                    roleIds: args.json.roleIds,
                    joinedAt: args.json.joinedAt,
                    membershipStatus: args.json.membershipStatus,
                    visibility: args.json.visibility,
                    isSubscribedToAnnouncements:
                        args.json.isSubscribedToAnnouncements
                }
            };
            var groupId = json.id;
            this.$emit('GROUP', {
                json,
                params: {
                    groupId,
                    userId: args.params.userId
                }
            });
            if ($app.groupDialog.visible && $app.groupDialog.id === groupId) {
                $app.groupDialog.inGroup = json.membershipStatus === 'member';
                $app.getGroupDialogGroup(groupId);
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.leaveGroup = function (params) {
            return this.call(`groups/${params.groupId}/leave`, {
                method: 'POST'
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:LEAVE', args);
                return args;
            });
        };

        API.$on('GROUP:LEAVE', function (args) {
            var groupId = args.params.groupId;
            if ($app.groupDialog.visible && $app.groupDialog.id === groupId) {
                $app.groupDialog.inGroup = false;
                $app.getGroupDialogGroup(groupId);
            }
            if (
                $app.userDialog.visible &&
                $app.userDialog.id === this.currentUser.id &&
                $app.userDialog.representedGroup.id === groupId
            ) {
                $app.getCurrentUserRepresentedGroup();
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.cancelGroupRequest = function (params) {
            return this.call(`groups/${params.groupId}/requests`, {
                method: 'DELETE'
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:CANCELJOINREQUEST', args);
                return args;
            });
        };

        API.$on('GROUP:CANCELJOINREQUEST', function (args) {
            var groupId = args.params.groupId;
            if ($app.groupDialog.visible && $app.groupDialog.id === groupId) {
                $app.getGroupDialogGroup(groupId);
            }
        });

        /*
            groupId: string,
            params: {
                isRepresenting: bool
            }
        */
        API.setGroupRepresentation = function (groupId, params) {
            return this.call(`groups/${groupId}/representation`, {
                method: 'PUT',
                params
            }).then((json) => {
                var args = {
                    json,
                    groupId,
                    params
                };
                this.$emit('GROUP:SETREPRESENTATION', args);
                return args;
            });
        };

        API.$on('GROUP:SETREPRESENTATION', function (args) {
            if (
                $app.groupDialog.visible &&
                $app.groupDialog.id === args.groupId
            ) {
                $app.groupDialog.ref.isRepresenting =
                    args.params.isRepresenting;
            }
        });

        /**
         * @param {{ query: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.groupStrictsearch = function (params) {
            return this.call(`groups/strictsearch`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:STRICTSEARCH', args);
                return args;
            });
        };

        API.$on('GROUP:STRICTSEARCH', function (args) {
            for (var json of args.json) {
                this.$emit('GROUP', {
                    json,
                    params: {
                        groupId: json.id
                    }
                });
            }
        });

        /*
            userId: string,
            groupId: string,
            params: {
                visibility: string,
                isSubscribedToAnnouncements: bool,
                managerNotes: string
            }
        */
        API.setGroupMemberProps = function (userId, groupId, params) {
            return this.call(`groups/${groupId}/members/${userId}`, {
                method: 'PUT',
                params
            }).then((json) => {
                var args = {
                    json,
                    userId,
                    groupId,
                    params
                };
                this.$emit('GROUP:MEMBER:PROPS', args);
                return args;
            });
        };

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
            if (
                $app.groupMemberModeration.visible &&
                $app.groupMemberModeration.id === args.json.groupId
            ) {
                // force redraw table
                $app.groupMembersSearch();
            }
        });

        /**
        * @param {{
                userId: string,
                groupId: string,
                roleId: string
        }} params
        * @return { Promise<{json: any, params}> }
        */
        API.addGroupMemberRole = function (params) {
            return this.call(
                `groups/${params.groupId}/members/${params.userId}/roles/${params.roleId}`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:MEMBER:ROLE:CHANGE', args);
                return args;
            });
        };

        /**
        * @param {{
                userId: string,
                groupId: string,
                roleId: string
        }} params
        * @return { Promise<{json: any, params}> }
        */
        API.removeGroupMemberRole = function (params) {
            return this.call(
                `groups/${params.groupId}/members/${params.userId}/roles/${params.roleId}`,
                {
                    method: 'DELETE'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:MEMBER:ROLE:CHANGE', args);
                return args;
            });
        };

        API.$on('GROUP:MEMBER:ROLE:CHANGE', function (args) {
            if ($app.groupDialog.id === args.params.groupId) {
                for (var i = 0; i < $app.groupDialog.members.length; ++i) {
                    var member = $app.groupDialog.members[i];
                    if (member.userId === args.params.userId) {
                        member.roleIds = args.json;
                        break;
                    }
                }
                for (
                    var i = 0;
                    i < $app.groupDialog.memberSearchResults.length;
                    ++i
                ) {
                    var member = $app.groupDialog.memberSearchResults[i];
                    if (member.userId === args.params.userId) {
                        member.roleIds = args.json;
                        break;
                    }
                }
            }

            if (
                $app.groupMemberModeration.visible &&
                $app.groupMemberModeration.id === args.params.groupId
            ) {
                // force redraw table
                $app.groupMembersSearch();
            }
        });

        API.getGroupPermissions = function (params) {
            return this.call(`users/${params.userId}/groups/permissions`, {
                method: 'GET'
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:PERMISSIONS', args);
                return args;
            });
        };

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

        // /**
        // * @param {{ groupId: string }} params
        // * @return { Promise<{json: any, params}> }
        // */
        // API.getGroupAnnouncement = function (params) {
        //     return this.call(`groups/${params.groupId}/announcement`, {
        //         method: 'GET'
        //     }).then((json) => {
        //         var args = {
        //             json,
        //             params
        //         };
        //         this.$emit('GROUP:ANNOUNCEMENT', args);
        //         return args;
        //     });
        // };

        /**
        * @param {{
                groupId: string,
                n: number,
                offset: number
        }} params
        * @return { Promise<{json: any, params}> }
        */
        API.getGroupPosts = function (params) {
            return this.call(`groups/${params.groupId}/posts`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:POSTS', args);
                return args;
            });
        };

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
                var args = await this.getGroupPosts({
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
                    post.title = $app.replaceBioSymbols(post.title);
                    post.text = $app.replaceBioSymbols(post.text);
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
            newPost.title = $app.replaceBioSymbols(newPost.title);
            newPost.text = $app.replaceBioSymbols(newPost.text);
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

        API.$on('GROUP:POST:DELETE', function (args) {
            var D = $app.groupDialog;
            if (D.id !== args.params.groupId) {
                return;
            }

            var postId = args.params.postId;
            // remove existing post
            for (var post of D.posts) {
                if (post.id === postId) {
                    $app.removeFromArray(D.posts, post);
                    break;
                }
            }
            // remove/update announcement
            if (postId === D.announcement.id) {
                if (D.posts.length > 0) {
                    D.announcement = D.posts[0];
                } else {
                    D.announcement = {};
                }
            }
            $app.updateGroupPostSearch();
        });

        /**
         * @param {{ groupId: string, postId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.deleteGroupPost = function (params) {
            return this.call(
                `groups/${params.groupId}/posts/${params.postId}`,
                {
                    method: 'DELETE'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:POST:DELETE', args);
                return args;
            });
        };

        API.editGroupPost = function (params) {
            return this.call(
                `groups/${params.groupId}/posts/${params.postId}`,
                {
                    method: 'PUT',
                    params
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:POST', args);
                return args;
            });
        };

        API.createGroupPost = function (params) {
            return this.call(`groups/${params.groupId}/posts`, {
                method: 'POST',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:POST', args);
                return args;
            });
        };

        /**
        * @param {{
                groupId: string,
                userId: string
        }} params
        * @return { Promise<{json: any, params}> }
        */
        API.getGroupMember = function (params) {
            return this.call(
                `groups/${params.groupId}/members/${params.userId}`,
                {
                    method: 'GET'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:MEMBER', args);
                return args;
            });
        };

        /**
        * @param {{
                groupId: string,
                n: number,
                offset: number
        }} params
        * @return { Promise<{json: any, params}> }
        */
        API.getGroupMembers = function (params) {
            return this.call(`groups/${params.groupId}/members`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:MEMBERS', args);
                return args;
            });
        };

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

        /**
        * @param {{
                groupId: string,
                query: string,
                n: number,
                offset: number
        }} params
        * @return { Promise<{json: any, params}> }
        */
        API.getGroupMembersSearch = function (params) {
            return this.call(`groups/${params.groupId}/members/search`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:MEMBERS:SEARCH', args);
                return args;
            });
        };

        API.$on('GROUP:MEMBERS:SEARCH', function (args) {
            for (var json of args.json.results) {
                this.$emit('GROUP:MEMBER', {
                    json,
                    params: {
                        groupId: args.params.groupId
                    }
                });
            }
        });

        /**
        * @param {{
                groupId: string
        * }} params
        * @return { Promise<{json: any, params}> }
        */
        API.blockGroup = function (params) {
            return this.call(`groups/${params.groupId}/block`, {
                method: 'POST'
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:BLOCK', args);
                return args;
            });
        };

        /**
        * @param {{
                groupId: string,
                userId: string
        * }} params
        * @return { Promise<{json: any, params}> }
        */
        API.unblockGroup = function (params) {
            return this.call(
                `groups/${params.groupId}/members/${params.userId}`,
                {
                    method: 'DELETE'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:UNBLOCK', args);
                return args;
            });
        };

        API.$on('GROUP:BLOCK', function (args) {
            if (
                $app.groupDialog.visible &&
                $app.groupDialog.id === args.params.groupId
            ) {
                $app.showGroupDialog(args.params.groupId);
            }
        });

        API.$on('GROUP:UNBLOCK', function (args) {
            if (
                $app.groupDialog.visible &&
                $app.groupDialog.id === args.params.groupId
            ) {
                $app.showGroupDialog(args.params.groupId);
            }
        });

        /**
        * @param {{
                groupId: string,
                userId: string
        * }} params
        * @return { Promise<{json: any, params}> }
        */
        API.sendGroupInvite = function (params) {
            return this.call(`groups/${params.groupId}/invites`, {
                method: 'POST',
                params: {
                    userId: params.userId
                }
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:INVITE', args);
                return args;
            });
        };

        /**
        * @param {{
                groupId: string,
                userId: string
        }} params
        * @return { Promise<{json: any, params}> }
        */
        API.kickGroupMember = function (params) {
            return this.call(
                `groups/${params.groupId}/members/${params.userId}`,
                {
                    method: 'DELETE'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:MEMBER:KICK', args);
                return args;
            });
        };

        /**
         * @param {{ groupId: string, userId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.banGroupMember = function (params) {
            return this.call(`groups/${params.groupId}/bans`, {
                method: 'POST',
                params: {
                    userId: params.userId
                }
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:MEMBER:BAN', args);
                return args;
            });
        };

        /**
         * @param {{ groupId: string, userId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.unbanGroupMember = function (params) {
            return this.call(`groups/${params.groupId}/bans/${params.userId}`, {
                method: 'DELETE'
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:MEMBER:UNBAN', args);
                return args;
            });
        };

        API.deleteSentGroupInvite = function (params) {
            return this.call(
                `groups/${params.groupId}/invites/${params.userId}`,
                {
                    method: 'DELETE'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:INVITE:DELETE', args);
                return args;
            });
        };

        API.deleteBlockedGroupRequest = function (params) {
            return this.call(
                `groups/${params.groupId}/members/${params.userId}`,
                {
                    method: 'DELETE'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:BLOCKED:DELETE', args);
                return args;
            });
        };

        API.acceptGroupInviteRequest = function (params) {
            return this.call(
                `groups/${params.groupId}/requests/${params.userId}`,
                {
                    method: 'PUT',
                    params: {
                        action: 'accept'
                    }
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:INVITE:ACCEPT', args);
                return args;
            });
        };

        API.rejectGroupInviteRequest = function (params) {
            return this.call(
                `groups/${params.groupId}/requests/${params.userId}`,
                {
                    method: 'PUT',
                    params: {
                        action: 'reject'
                    }
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:INVITE:REJECT', args);
                return args;
            });
        };

        API.blockGroupInviteRequest = function (params) {
            return this.call(
                `groups/${params.groupId}/requests/${params.userId}`,
                {
                    method: 'PUT',
                    params: {
                        action: 'reject',
                        block: true
                    }
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:INVITE:BLOCK', args);
                return args;
            });
        };

        API.getGroupBans = function (params) {
            return this.call(`groups/${params.groupId}/bans`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:BANS', args);
                return args;
            });
        };

        API.$on('GROUP:BANS', function (args) {
            if ($app.groupMemberModeration.id !== args.params.groupId) {
                return;
            }

            for (var json of args.json) {
                var ref = this.applyGroupMember(json);
                $app.groupBansModerationTable.data.push(ref);
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getGroupAuditLogTypes = function (params) {
            return this.call(`groups/${params.groupId}/auditLogTypes`, {
                method: 'GET'
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:AUDITLOGTYPES', args);
                return args;
            });
        };

        API.$on('GROUP:AUDITLOGTYPES', function (args) {
            if ($app.groupMemberModeration.id !== args.params.groupId) {
                return;
            }

            $app.groupMemberModeration.auditLogTypes = args.json;
        });

        /**
         * @param {{ groupId: string, eventTypes: array }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getGroupLogs = function (params) {
            return this.call(`groups/${params.groupId}/auditLogs`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:LOGS', args);
                return args;
            });
        };

        API.$on('GROUP:LOGS', function (args) {
            if ($app.groupMemberModeration.id !== args.params.groupId) {
                return;
            }

            for (var json of args.json.results) {
                const existsInData = $app.groupLogsModerationTable.data.some(
                    (dataItem) => dataItem.id === json.id
                );
                if (!existsInData) {
                    $app.groupLogsModerationTable.data.push(json);
                }
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getGroupInvites = function (params) {
            return this.call(`groups/${params.groupId}/invites`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:INVITES', args);
                return args;
            });
        };

        API.$on('GROUP:INVITES', function (args) {
            if ($app.groupMemberModeration.id !== args.params.groupId) {
                return;
            }

            for (var json of args.json) {
                var ref = this.applyGroupMember(json);
                $app.groupInvitesModerationTable.data.push(ref);
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getGroupJoinRequests = function (params) {
            return this.call(`groups/${params.groupId}/requests`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:JOINREQUESTS', args);
                return args;
            });
        };

        API.$on('GROUP:JOINREQUESTS', function (args) {
            if ($app.groupMemberModeration.id !== args.params.groupId) {
                return;
            }

            if (!args.params.blocked) {
                for (var json of args.json) {
                    var ref = this.applyGroupMember(json);
                    $app.groupJoinRequestsModerationTable.data.push(ref);
                }
            } else {
                for (var json of args.json) {
                    var ref = this.applyGroupMember(json);
                    $app.groupBlockedModerationTable.data.push(ref);
                }
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getGroupInstances = function (params) {
            return this.call(
                `users/${this.currentUser.id}/instances/groups/${params.groupId}`,
                {
                    method: 'GET'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:INSTANCES', args);
                return args;
            });
        };

        API.$on('GROUP:INSTANCES', function (args) {
            if ($app.groupDialog.id === args.params.groupId) {
                $app.applyGroupDialogInstances(args.json.instances);
            }
        });

        API.$on('GROUP:INSTANCES', function (args) {
            for (var json of args.json.instances) {
                this.$emit('INSTANCE', {
                    json,
                    params: {
                        fetchedAt: args.json.fetchedAt
                    }
                });
                this.getCachedWorld({
                    worldId: json.world.id
                }).then((args1) => {
                    json.world = args1.ref;
                    return args1;
                });
                // get queue size etc
                this.getInstance({
                    worldId: json.worldId,
                    instanceId: json.instanceId
                });
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */

        API.getGroupRoles = function (params) {
            return this.call(`groups/${params.groupId}/roles`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:ROLES', args);
                return args;
            });
        };

        API.getRequestedGroups = function () {
            return this.call(`users/${this.currentUser.id}/groups/requested`, {
                method: 'GET'
            }).then((json) => {
                var args = {
                    json
                };
                this.$emit('GROUP:REQUESTED', args);
                return args;
            });
        };

        API.getUsersGroupInstances = function () {
            return this.call(`users/${this.currentUser.id}/instances/groups`, {
                method: 'GET'
            }).then((json) => {
                var args = {
                    json
                };
                this.$emit('GROUP:USER:INSTANCES', args);
                return args;
            });
        };

        API.$on('GROUP:USER:INSTANCES', function (args) {
            $app.groupInstances = [];
            for (var json of args.json.instances) {
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
                var ref = this.cachedGroups.get(json.ownerId);
                if (typeof ref === 'undefined') {
                    if ($app.friendLogInitStatus) {
                        this.getGroup({ groupId: json.ownerId });
                    }
                    return;
                }
                $app.groupInstances.push({
                    group: ref,
                    instance: this.applyInstance(json)
                });
            }
            $app.groupInstances.sort(this.sortGroupInstancesByInGame);
        });

        /**
        * @param {{
                query: string,
                n: number,
                offset: number,
                order: string,
                sortBy: string
        }} params
        * @return { Promise<{json: any, params}> }
        */
        API.groupSearch = function (params) {
            return this.call(`groups`, {
                method: 'GET',
                params
            }).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:SEARCH', args);
                return args;
            });
        };

        API.$on('GROUP:SEARCH', function (args) {
            for (var json of args.json) {
                this.$emit('GROUP', {
                    json,
                    params: {
                        groupId: json.id
                    }
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
                    this.getGroup(params).catch(reject).then(resolve);
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
            json.rules = $app.replaceBioSymbols(json.rules);
            json.name = $app.replaceBioSymbols(json.name);
            json.description = $app.replaceBioSymbols(json.description);
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
            if (json.userId === this.currentUser.id) {
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

        API.$on('LOGOUT', function () {
            $app.groupDialog.visible = false;
            $app.inviteGroupDialog.visible = false;
            $app.groupPostEditDialog.visible = false;
        });

        /**
        * @param {{
                groupId: string,
                galleryId: string,
                n: number,
                offset: number
        }} params
        * @return { Promise<{json: any, params}> }
        */
        API.getGroupGallery = function (params) {
            return this.call(
                `groups/${params.groupId}/galleries/${params.galleryId}`,
                {
                    method: 'GET',
                    params: {
                        n: params.n,
                        offset: params.offset
                    }
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('GROUP:GALLERY', args);
                return args;
            });
        };

        API.$on('GROUP:GALLERY', function (args) {
            for (var json of args.json) {
                if ($app.groupDialog.id === json.groupId) {
                    if (!$app.groupDialog.galleries[json.galleryId]) {
                        $app.groupDialog.galleries[json.galleryId] = [];
                    }
                    $app.groupDialog.galleries[json.galleryId].push(json);
                }
            }
        });
    }

    _data = {
        currentUserGroupsInit: false,
        groupDialogLastActiveTab: '',
        groupDialogLastMembers: '',
        groupDialogLastGallery: '',
        groupMembersSearchTimer: null,
        groupMembersSearchPending: false,
        isGroupMembersLoading: false,
        isGroupMembersDone: false,
        isGroupGalleryLoading: false,
        loadMoreGroupMembersParams: {},
        groupMemberModerationTableForceUpdate: 0,
        isGroupLogsExportDialogVisible: false,

        groupDialog: {
            visible: false,
            loading: false,
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
            galleries: {}
        },
        inviteGroupDialog: {
            visible: false,
            loading: false,
            groupId: '',
            groupName: '',
            userId: '',
            userIds: [],
            userObject: {}
        },
        groupPostEditDialog: {
            visible: false,
            groupRef: {},
            title: '',
            text: '',
            sendNotification: true,
            visibility: 'group',
            roleIds: [],
            postId: '',
            groupId: ''
        },
        groupMemberModeration: {
            visible: false,
            loading: false,
            id: '',
            groupRef: {},
            auditLogTypes: [],
            selectedAuditLogTypes: [],
            note: '',
            selectedUsers: new Map(),
            selectedUsersArray: [],
            selectedRoles: [],
            progressCurrent: 0,
            progressTotal: 0,
            selectUserId: ''
        },
        groupMemberModerationTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 25, 50, 100]
            }
        },
        groupBansModerationTable: {
            data: [],
            filters: [
                {
                    prop: ['$displayName'],
                    value: ''
                }
            ],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 25, 50, 100]
            }
        },
        groupLogsModerationTable: {
            data: [],
            filters: [
                {
                    prop: ['description'],
                    value: ''
                }
            ],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 25, 50, 100]
            }
        },
        groupInvitesModerationTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 25, 50, 100]
            }
        },
        groupJoinRequestsModerationTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 25, 50, 100]
            }
        },
        groupBlockedModerationTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 25, 50, 100]
            }
        },
        checkedGroupLogsExportLogsOptions: [
            'created_at',
            'eventType',
            'actorDisplayName',
            'description',
            'data'
        ],
        checkGroupsLogsExportLogsOptions: [
            {
                label: 'created_at',
                text: 'dialog.group_member_moderation.created_at'
            },
            {
                label: 'eventType',
                text: 'dialog.group_member_moderation.type'
            },
            {
                label: 'actorDisplayName',
                text: 'dialog.group_member_moderation.display_name'
            },
            {
                label: 'description',
                text: 'dialog.group_member_moderation.description'
            },
            {
                label: 'data',
                text: 'dialog.group_member_moderation.data'
            }
        ],
        groupLogsExportContent: ''
    };

    _methods = {
        confirmDeleteGroupPost(post) {
            this.$confirm(
                'Are you sure you want to delete this post?',
                'Confirm',
                {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            API.deleteGroupPost({
                                groupId: post.groupId,
                                postId: post.id
                            });
                        }
                    }
                }
            );
        },

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
                            API.blockGroup({
                                groupId
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
                            API.unblockGroup({
                                groupId,
                                userId: API.currentUser.id
                            });
                        }
                    }
                }
            );
        },

        async getAllGroupBans(groupId) {
            this.groupBansModerationTable.data = [];
            var params = {
                groupId,
                n: 100,
                offset: 0
            };
            var count = 50; // 5000 max
            this.isGroupMembersLoading = true;
            try {
                for (var i = 0; i < count; i++) {
                    var args = await API.getGroupBans(params);
                    params.offset += params.n;
                    if (args.json.length < params.n) {
                        break;
                    }
                    if (!this.groupMemberModeration.visible) {
                        break;
                    }
                }
            } catch (err) {
                this.$message({
                    message: 'Failed to get group bans',
                    type: 'error'
                });
            } finally {
                this.isGroupMembersLoading = false;
            }
        },

        async getAllGroupLogs(groupId) {
            this.groupLogsModerationTable.data = [];
            var params = {
                groupId,
                n: 100,
                offset: 0
            };
            if (this.groupMemberModeration.selectedAuditLogTypes.length) {
                params.eventTypes =
                    this.groupMemberModeration.selectedAuditLogTypes;
            }
            var count = 50; // 5000 max
            this.isGroupMembersLoading = true;
            try {
                for (var i = 0; i < count; i++) {
                    var args = await API.getGroupLogs(params);
                    params.offset += params.n;
                    if (!args.json.hasNext) {
                        break;
                    }
                    if (!this.groupMemberModeration.visible) {
                        break;
                    }
                }
            } catch (err) {
                this.$message({
                    message: 'Failed to get group logs',
                    type: 'error'
                });
            } finally {
                this.isGroupMembersLoading = false;
            }
        },

        getAuditLogTypeName(auditLogType) {
            if (!auditLogType) {
                return '';
            }
            return auditLogType
                .replace('group.', '')
                .replace(/\./g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());
        },

        async getAllGroupInvitesAndJoinRequests(groupId) {
            await this.getAllGroupInvites(groupId);
            await this.getAllGroupJoinRequests(groupId);
            await this.getAllGroupBlockedRequests(groupId);
        },

        async getAllGroupInvites(groupId) {
            this.groupInvitesModerationTable.data = [];
            var params = {
                groupId,
                n: 100,
                offset: 0
            };
            var count = 50; // 5000 max
            this.isGroupMembersLoading = true;
            try {
                for (var i = 0; i < count; i++) {
                    var args = await API.getGroupInvites(params);
                    params.offset += params.n;
                    if (args.json.length < params.n) {
                        break;
                    }
                    if (!this.groupMemberModeration.visible) {
                        break;
                    }
                }
            } catch (err) {
                this.$message({
                    message: 'Failed to get group invites',
                    type: 'error'
                });
            } finally {
                this.isGroupMembersLoading = false;
            }
        },

        async getAllGroupJoinRequests(groupId) {
            this.groupJoinRequestsModerationTable.data = [];
            var params = {
                groupId,
                n: 100,
                offset: 0
            };
            var count = 50; // 5000 max
            this.isGroupMembersLoading = true;
            try {
                for (var i = 0; i < count; i++) {
                    var args = await API.getGroupJoinRequests(params);
                    params.offset += params.n;
                    if (args.json.length < params.n) {
                        break;
                    }
                    if (!this.groupMemberModeration.visible) {
                        break;
                    }
                }
            } catch (err) {
                this.$message({
                    message: 'Failed to get group join requests',
                    type: 'error'
                });
            } finally {
                this.isGroupMembersLoading = false;
            }
        },

        async getAllGroupBlockedRequests(groupId) {
            this.groupBlockedModerationTable.data = [];
            var params = {
                groupId,
                n: 100,
                offset: 0,
                blocked: true
            };
            var count = 50; // 5000 max
            this.isGroupMembersLoading = true;
            try {
                for (var i = 0; i < count; i++) {
                    var args = await API.getGroupJoinRequests(params);
                    params.offset += params.n;
                    if (args.json.length < params.n) {
                        break;
                    }
                    if (!this.groupMemberModeration.visible) {
                        break;
                    }
                }
            } catch (err) {
                this.$message({
                    message: 'Failed to get group join requests',
                    type: 'error'
                });
            } finally {
                this.isGroupMembersLoading = false;
            }
        },

        async groupOwnerChange(ref, oldUserId, newUserId) {
            var oldUser = await API.getCachedUser({
                userId: oldUserId
            });
            var newUser = await API.getCachedUser({
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
                for (var i = 0; i < groups.length; i++) {
                    var groupId = groups[i];
                    var groupRef = API.cachedGroups.get(groupId);
                    if (
                        typeof groupRef !== 'undefined' &&
                        groupRef.myMember?.roleIds?.length > 0
                    ) {
                        continue;
                    }

                    try {
                        var args = await API.getGroup({
                            groupId,
                            includeRoles: true
                        });
                        var ref = API.applyGroup(args.json);
                        API.currentUserGroups.set(groupId, ref);
                    } catch (err) {
                        console.error(err);
                    }
                }
            }

            this.currentUserGroupsInit = true;
        },

        showGroupDialog(groupId) {
            if (!groupId) {
                return;
            }
            if (
                this.groupMemberModeration.visible &&
                this.groupMemberModeration.id !== groupId
            ) {
                this.groupMemberModeration.visible = false;
            }
            this.$nextTick(() =>
                $app.adjustDialogZ(this.$refs.groupDialog.$el)
            );
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
            D.memberSearch = '';
            D.memberSearchResults = [];
            if (this.groupDialogLastGallery !== groupId) {
                D.galleries = {};
            }
            if (this.groupDialogLastMembers !== groupId) {
                D.members = [];
                D.memberFilter = this.groupDialogFilterOptions.everyone;
            }
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
                        API.getCachedUser({
                            userId: args.ref.ownerId
                        }).then((args1) => {
                            D.ownerDisplayName = args1.ref.displayName;
                            return args1;
                        });
                        this.applyGroupDialogInstances();
                        this.getGroupDialogGroup(groupId);
                    }
                });
        },

        getGroupDialogGroup(groupId) {
            var D = this.groupDialog;
            return API.getGroup({ groupId, includeRoles: true })
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
                        if (D.inGroup) {
                            API.getGroupInstances({
                                groupId
                            });
                        }
                        if (this.$refs.groupDialogTabs.currentName === '0') {
                            this.groupDialogLastActiveTab = $t(
                                'dialog.group.info.header'
                            );
                        } else if (
                            this.$refs.groupDialogTabs.currentName === '1'
                        ) {
                            this.groupDialogLastActiveTab = $t(
                                'dialog.group.posts.header'
                            );
                        } else if (
                            this.$refs.groupDialogTabs.currentName === '2'
                        ) {
                            this.groupDialogLastActiveTab = $t(
                                'dialog.group.members.header'
                            );
                            if (this.groupDialogLastMembers !== groupId) {
                                this.groupDialogLastMembers = groupId;
                                this.getGroupDialogGroupMembers();
                            }
                        } else if (
                            this.$refs.groupDialogTabs.currentName === '3'
                        ) {
                            this.groupDialogLastActiveTab = $t(
                                'dialog.group.gallery.header'
                            );
                            if (this.groupDialogLastGallery !== groupId) {
                                this.groupDialogLastGallery = groupId;
                                this.getGroupGalleries();
                            }
                        } else if (
                            this.$refs.groupDialogTabs.currentName === '4'
                        ) {
                            this.groupDialogLastActiveTab = $t(
                                'dialog.group.json.header'
                            );
                            this.refreshGroupDialogTreeData();
                        }
                    }
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
                case 'Share':
                    this.copyGroupUrl(D.ref.$url);
                    break;
                case 'Moderation Tools':
                    this.showGroupMemberModerationDialog(D.id);
                    break;
                case 'Create Post':
                    this.showGroupPostEditDialog(D.id, null);
                    break;
                case 'Leave Group':
                    this.leaveGroup(D.id);
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
                case 'Invite To Group':
                    this.showInviteGroupDialog(D.id, '');
                    break;
            }
        },

        groupDialogTabClick(obj) {
            var groupId = this.groupDialog.id;
            if (this.groupDialogLastActiveTab === obj.label) {
                return;
            }
            if (obj.label === $t('dialog.group.info.header')) {
                //
            } else if (obj.label === $t('dialog.group.posts.header')) {
                //
            } else if (obj.label === $t('dialog.group.members.header')) {
                if (this.groupDialogLastMembers !== groupId) {
                    this.groupDialogLastMembers = groupId;
                    this.getGroupDialogGroupMembers();
                }
            } else if (obj.label === $t('dialog.group.gallery.header')) {
                if (this.groupDialogLastGallery !== groupId) {
                    this.groupDialogLastGallery = groupId;
                    this.getGroupGalleries();
                }
            } else if (obj.label === $t('dialog.group.json.header')) {
                this.refreshGroupDialogTreeData();
            }
            this.groupDialogLastActiveTab = obj.label;
        },

        refreshGroupDialogTreeData() {
            var D = this.groupDialog;
            D.treeData = $utils.buildTreeData({
                group: D.ref,
                posts: D.posts,
                instances: D.instances,
                members: D.members,
                galleries: D.galleries
            });
        },

        joinGroup(groupId) {
            if (!groupId) {
                return null;
            }
            return API.joinGroup({
                groupId
            }).then((args) => {
                if (args.json.membershipStatus === 'member') {
                    this.$message({
                        message: 'Group joined',
                        type: 'success'
                    });
                } else if (args.json.membershipStatus === 'requested') {
                    this.$message({
                        message: 'Group join request sent',
                        type: 'success'
                    });
                }
                return args;
            });
        },

        leaveGroup(groupId) {
            return API.leaveGroup({
                groupId
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

        cancelGroupRequest(groupId) {
            return API.cancelGroupRequest({
                groupId
            });
        },

        setGroupRepresentation(groupId) {
            return API.setGroupRepresentation(groupId, {
                isRepresenting: true
            });
        },

        clearGroupRepresentation(groupId) {
            return API.setGroupRepresentation(groupId, {
                isRepresenting: false
            });
        },

        setGroupVisibility(groupId, visibility) {
            return API.setGroupMemberProps(API.currentUser.id, groupId, {
                visibility
            }).then((args) => {
                this.$message({
                    message: 'Group visibility updated',
                    type: 'success'
                });
                return args;
            });
        },

        setGroupSubscription(groupId, subscribe) {
            return API.setGroupMemberProps(API.currentUser.id, groupId, {
                isSubscribedToAnnouncements: subscribe
            }).then((args) => {
                this.$message({
                    message: 'Group subscription updated',
                    type: 'success'
                });
                return args;
            });
        },

        onGroupJoined(groupId) {
            if (
                this.groupMemberModeration.visible &&
                this.groupMemberModeration.id === groupId
            ) {
                // ignore this event if we were the one to trigger it
                return;
            }
            if (!API.currentUserGroups.has(groupId)) {
                API.currentUserGroups.set(groupId, {
                    id: groupId,
                    name: '',
                    iconUrl: ''
                });
                API.getGroup({ groupId, includeRoles: true }).then((args) => {
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

        groupMembersSearchDebounce() {
            var D = this.groupDialog;
            var search = D.memberSearch;
            D.memberSearchResults = [];
            if (!search || search.length < 3) {
                this.setGroupMemberModerationTable(D.members);
                return;
            }
            this.isGroupMembersLoading = true;
            API.getGroupMembersSearch({
                groupId: D.id,
                query: search,
                n: 100,
                offset: 0
            })
                .then((args) => {
                    if (D.id === args.params.groupId) {
                        D.memberSearchResults = args.json.results;
                        this.setGroupMemberModerationTable(args.json.results);
                    }
                })
                .finally(() => {
                    this.isGroupMembersLoading = false;
                });
        },

        groupMembersSearch() {
            if (this.groupMembersSearchTimer) {
                this.groupMembersSearchPending = true;
            } else {
                this.groupMembersSearchExecute();
                this.groupMembersSearchTimer = setTimeout(() => {
                    if (this.groupMembersSearchPending) {
                        this.groupMembersSearchExecute();
                    }
                    this.groupMembersSearchTimer = null;
                }, 500);
            }
        },

        groupMembersSearchExecute() {
            try {
                this.groupMembersSearchDebounce();
            } catch (err) {
                console.error(err);
            }
            this.groupMembersSearchTimer = null;
            this.groupMembersSearchPending = false;
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

        async getGroupDialogGroupMembers() {
            var D = this.groupDialog;
            D.members = [];
            this.isGroupMembersDone = false;
            this.loadMoreGroupMembersParams = {
                n: 100,
                offset: 0,
                groupId: D.id
            };
            if (D.memberSortOrder.value) {
                this.loadMoreGroupMembersParams.sort = D.memberSortOrder.value;
            }
            if (D.memberFilter.id !== null) {
                this.loadMoreGroupMembersParams.roleId = D.memberFilter.id;
            }
            if (D.inGroup) {
                await API.getGroupMember({
                    groupId: D.id,
                    userId: API.currentUser.id
                }).then((args) => {
                    if (args.json) {
                        args.json.user = API.currentUser;
                        if (D.memberFilter.id === null) {
                            // when flitered by role don't include self
                            D.members.push(args.json);
                        }
                    }
                    return args;
                });
            }
            await this.loadMoreGroupMembers();
        },

        async loadMoreGroupMembers() {
            if (this.isGroupMembersDone || this.isGroupMembersLoading) {
                return;
            }
            var D = this.groupDialog;
            var params = this.loadMoreGroupMembersParams;
            D.memberSearch = '';
            this.isGroupMembersLoading = true;
            await API.getGroupMembers(params)
                .finally(() => {
                    this.isGroupMembersLoading = false;
                })
                .then((args) => {
                    for (var i = 0; i < args.json.length; i++) {
                        var member = args.json[i];
                        if (member.userId === API.currentUser.id) {
                            if (
                                D.members.length > 0 &&
                                D.members[0].userId === API.currentUser.id
                            ) {
                                // remove duplicate and keep sort order
                                D.members.splice(0, 1);
                            }
                            break;
                        }
                    }
                    if (args.json.length < params.n) {
                        this.isGroupMembersDone = true;
                    }
                    D.members = [...D.members, ...args.json];
                    this.setGroupMemberModerationTable(D.members);
                    params.offset += params.n;
                    return args;
                })
                .catch((err) => {
                    this.isGroupMembersDone = true;
                    throw err;
                });
        },

        async loadAllGroupMembers() {
            if (this.isGroupMembersLoading) {
                return;
            }
            await this.getGroupDialogGroupMembers();
            while (this.groupDialog.visible && !this.isGroupMembersDone) {
                this.isGroupMembersLoading = true;
                await new Promise((resolve) => {
                    workerTimers.setTimeout(resolve, 1000);
                });
                this.isGroupMembersLoading = false;
                await this.loadMoreGroupMembers();
            }
        },

        async setGroupMemberSortOrder(sortOrder) {
            var D = this.groupDialog;
            if (D.memberSortOrder === sortOrder) {
                return;
            }
            D.memberSortOrder = sortOrder;
            await this.getGroupDialogGroupMembers();
        },

        async setGroupMemberFilter(filter) {
            var D = this.groupDialog;
            if (D.memberFilter === filter) {
                return;
            }
            D.memberFilter = filter;
            await this.getGroupDialogGroupMembers();
        },

        getCurrentUserRepresentedGroup() {
            return API.getRepresentedGroup({
                userId: API.currentUser.id
            }).then((args) => {
                this.userDialog.representedGroup = args.json;
                return args;
            });
        },

        hasGroupPermission(ref, permission) {
            if (
                ref &&
                ref.myMember &&
                ref.myMember.permissions &&
                (ref.myMember.permissions.includes('*') ||
                    ref.myMember.permissions.includes(permission))
            ) {
                return true;
            }
            return false;
        },

        async getGroupGalleries() {
            this.groupDialog.galleries = {};
            this.$refs.groupDialogGallery.currentName = '0'; // select first tab
            this.isGroupGalleryLoading = true;
            for (var i = 0; i < this.groupDialog.ref.galleries.length; i++) {
                var gallery = this.groupDialog.ref.galleries[i];
                await this.getGroupGallery(this.groupDialog.id, gallery.id);
            }
            this.isGroupGalleryLoading = false;
        },

        async getGroupGallery(groupId, galleryId) {
            try {
                var params = {
                    groupId,
                    galleryId,
                    n: 100,
                    offset: 0
                };
                var count = 50; // 5000 max
                for (var i = 0; i < count; i++) {
                    var args = await API.getGroupGallery(params);
                    params.offset += 100;
                    if (args.json.length < 100) {
                        break;
                    }
                }
            } catch (err) {
                console.error(err);
            }
        },

        groupGalleryStatus(gallery) {
            var style = {};
            if (!gallery.membersOnly) {
                style.blue = true;
            } else if (!gallery.roleIdsToView) {
                style.green = true;
            } else {
                style.red = true;
            }
            return style;
        },

        showInviteGroupDialog(groupId, userId) {
            this.$nextTick(() =>
                $app.adjustDialogZ(this.$refs.inviteGroupDialog.$el)
            );
            var D = this.inviteGroupDialog;
            D.userIds = '';
            D.groups = [];
            D.groupId = groupId;
            D.groupName = groupId;
            D.userId = userId;
            D.userObject = {};
            D.visible = true;
            if (groupId) {
                API.getCachedGroup({
                    groupId
                })
                    .then((args) => {
                        D.groupName = args.ref.name;
                    })
                    .catch(() => {
                        D.groupId = '';
                    });
                this.isAllowedToInviteToGroup();
            }

            if (userId) {
                API.getCachedUser({ userId }).then((args) => {
                    D.userObject = args.ref;
                });
                D.userIds = [userId];
            }
        },

        sendGroupInvite() {
            this.$confirm('Continue? Invite User(s) To Group', 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info',
                callback: (action) => {
                    var D = this.inviteGroupDialog;
                    if (action !== 'confirm' || D.loading === true) {
                        return;
                    }
                    D.loading = true;
                    var inviteLoop = () => {
                        if (D.userIds.length === 0) {
                            D.loading = false;
                            return;
                        }
                        var receiverUserId = D.userIds.shift();
                        API.sendGroupInvite({
                            groupId: D.groupId,
                            userId: receiverUserId
                        })
                            .then(inviteLoop)
                            .catch(() => {
                                D.loading = false;
                            });
                    };
                    inviteLoop();
                }
            });
        },

        isAllowedToInviteToGroup() {
            var D = this.inviteGroupDialog;
            var groupId = D.groupId;
            if (!groupId) {
                return;
            }
            D.loading = true;
            API.getGroup({ groupId })
                .then((args) => {
                    if (
                        this.hasGroupPermission(
                            args.ref,
                            'group-invites-manage'
                        )
                    ) {
                        return args;
                    }
                    // not allowed to invite
                    D.groupId = '';
                    this.$message({
                        type: 'error',
                        message: 'You are not allowed to invite to this group'
                    });
                    return args;
                })
                .finally(() => {
                    D.loading = false;
                });
        },

        showGroupPostEditDialog(groupId, post) {
            this.$nextTick(() =>
                $app.adjustDialogZ(this.$refs.groupPostEditDialog.$el)
            );
            var D = this.groupPostEditDialog;
            D.sendNotification = true;
            D.groupRef = {};
            D.title = '';
            D.text = '';
            D.visibility = 'group';
            D.roleIds = [];
            D.postId = '';
            D.groupId = groupId;
            $app.gallerySelectDialog.selectedFileId = '';
            $app.gallerySelectDialog.selectedImageUrl = '';
            if (post) {
                D.title = post.title;
                D.text = post.text;
                D.visibility = post.visibility;
                D.roleIds = post.roleIds;
                D.postId = post.id;
                $app.gallerySelectDialog.selectedFileId = post.imageId;
                $app.gallerySelectDialog.selectedImageUrl = post.imageUrl;
            }
            API.getCachedGroup({ groupId }).then((args) => {
                D.groupRef = args.ref;
            });
            D.visible = true;
        },

        editGroupPost() {
            var D = this.groupPostEditDialog;
            if (!D.groupId || !D.postId) {
                return;
            }
            var params = {
                groupId: D.groupId,
                postId: D.postId,
                title: D.title,
                text: D.text,
                roleIds: D.roleIds,
                visibility: D.visibility,
                imageId: null
            };
            if (this.gallerySelectDialog.selectedFileId) {
                params.imageId = this.gallerySelectDialog.selectedFileId;
            }
            API.editGroupPost(params).then((args) => {
                this.$message({
                    message: 'Group post edited',
                    type: 'success'
                });
                return args;
            });
            D.visible = false;
        },

        createGroupPost() {
            var D = this.groupPostEditDialog;
            var params = {
                groupId: D.groupId,
                title: D.title,
                text: D.text,
                roleIds: D.roleIds,
                visibility: D.visibility,
                sendNotification: D.sendNotification,
                imageId: null
            };
            if (this.gallerySelectDialog.selectedFileId) {
                params.imageId = this.gallerySelectDialog.selectedFileId;
            }
            API.createGroupPost(params).then((args) => {
                this.$message({
                    message: 'Group post created',
                    type: 'success'
                });
                return args;
            });
            D.visible = false;
        },

        setGroupMemberModerationTable(data) {
            if (!this.groupMemberModeration.visible) {
                return;
            }
            for (var i = 0; i < data.length; i++) {
                var member = data[i];
                member.$selected = this.groupMemberModeration.selectedUsers.has(
                    member.userId
                );
            }
            this.groupMemberModerationTable.data = data;
            // force redraw
            this.groupMemberModerationTableForceUpdate++;
        },

        showGroupMemberModerationDialog(groupId) {
            this.$nextTick(() =>
                $app.adjustDialogZ(this.$refs.groupMemberModeration.$el)
            );
            if (groupId !== this.groupDialog.id) {
                return;
            }
            var D = this.groupMemberModeration;
            D.id = groupId;
            D.selectedUsers.clear();
            D.selectedUsersArray = [];
            D.selectedRoles = [];
            D.groupRef = {};
            D.auditLogTypes = [];
            D.selectedAuditLogTypes = [];
            API.getCachedGroup({ groupId }).then((args) => {
                D.groupRef = args.ref;
                if (this.hasGroupPermission(D.groupRef, 'group-audit-view')) {
                    API.getGroupAuditLogTypes({ groupId });
                }
            });
            this.groupMemberModerationTableForceUpdate = 0;
            D.visible = true;
            this.setGroupMemberModerationTable(this.groupDialog.members);
        },

        groupMemberModerationTableSelectionChange(row) {
            var D = this.groupMemberModeration;
            if (row.$selected && !D.selectedUsers.has(row.userId)) {
                D.selectedUsers.set(row.userId, row);
            } else if (!row.$selected && D.selectedUsers.has(row.userId)) {
                D.selectedUsers.delete(row.userId);
            }
            D.selectedUsersArray = Array.from(D.selectedUsers.values());
            // force redraw
            this.groupMemberModerationTableForceUpdate++;
        },

        deleteSelectedGroupMember(user) {
            var D = this.groupMemberModeration;
            D.selectedUsers.delete(user.userId);
            D.selectedUsersArray = Array.from(D.selectedUsers.values());
            for (
                var i = 0;
                i < this.groupMemberModerationTable.data.length;
                i++
            ) {
                var row = this.groupMemberModerationTable.data[i];
                if (row.userId === user.userId) {
                    row.$selected = false;
                    break;
                }
            }
            for (
                var i = 0;
                i < this.groupBansModerationTable.data.length;
                i++
            ) {
                var row = this.groupBansModerationTable.data[i];
                if (row.userId === user.userId) {
                    row.$selected = false;
                    break;
                }
            }
            for (
                var i = 0;
                i < this.groupInvitesModerationTable.data.length;
                i++
            ) {
                var row = this.groupInvitesModerationTable.data[i];
                if (row.userId === user.userId) {
                    row.$selected = false;
                    break;
                }
            }
            for (
                var i = 0;
                i < this.groupJoinRequestsModerationTable.data.length;
                i++
            ) {
                var row = this.groupJoinRequestsModerationTable.data[i];
                if (row.userId === user.userId) {
                    row.$selected = false;
                    break;
                }
            }
            for (
                var i = 0;
                i < this.groupBlockedModerationTable.data.length;
                i++
            ) {
                var row = this.groupBlockedModerationTable.data[i];
                if (row.userId === user.userId) {
                    row.$selected = false;
                    break;
                }
            }

            // force redraw
            this.groupMemberModerationTableForceUpdate++;
        },

        clearSelectedGroupMembers() {
            var D = this.groupMemberModeration;
            D.selectedUsers.clear();
            D.selectedUsersArray = [];
            for (
                var i = 0;
                i < this.groupMemberModerationTable.data.length;
                i++
            ) {
                var row = this.groupMemberModerationTable.data[i];
                row.$selected = false;
            }
            for (
                var i = 0;
                i < this.groupBansModerationTable.data.length;
                i++
            ) {
                var row = this.groupBansModerationTable.data[i];
                row.$selected = false;
            }
            for (
                var i = 0;
                i < this.groupInvitesModerationTable.data.length;
                i++
            ) {
                var row = this.groupInvitesModerationTable.data[i];
                row.$selected = false;
            }
            for (
                var i = 0;
                i < this.groupJoinRequestsModerationTable.data.length;
                i++
            ) {
                var row = this.groupJoinRequestsModerationTable.data[i];
                row.$selected = false;
            }
            for (
                var i = 0;
                i < this.groupBlockedModerationTable.data.length;
                i++
            ) {
                var row = this.groupBlockedModerationTable.data[i];
                row.$selected = false;
            }
            // force redraw
            this.groupMemberModerationTableForceUpdate++;
        },

        selectAllGroupMembers() {
            var D = this.groupMemberModeration;
            for (
                var i = 0;
                i < this.groupMemberModerationTable.data.length;
                i++
            ) {
                var row = this.groupMemberModerationTable.data[i];
                row.$selected = true;
                D.selectedUsers.set(row.userId, row);
            }
            D.selectedUsersArray = Array.from(D.selectedUsers.values());
            // force redraw
            this.groupMemberModerationTableForceUpdate++;
        },

        selectAllGroupBans() {
            var D = this.groupMemberModeration;
            for (
                var i = 0;
                i < this.groupBansModerationTable.data.length;
                i++
            ) {
                var row = this.groupBansModerationTable.data[i];
                row.$selected = true;
                D.selectedUsers.set(row.userId, row);
            }
            D.selectedUsersArray = Array.from(D.selectedUsers.values());
            // force redraw
            this.groupMemberModerationTableForceUpdate++;
        },

        selectAllGroupInvites() {
            var D = this.groupMemberModeration;
            for (
                var i = 0;
                i < this.groupInvitesModerationTable.data.length;
                i++
            ) {
                var row = this.groupInvitesModerationTable.data[i];
                row.$selected = true;
                D.selectedUsers.set(row.userId, row);
            }
            D.selectedUsersArray = Array.from(D.selectedUsers.values());
            // force redraw
            this.groupMemberModerationTableForceUpdate++;
        },

        selectAllGroupJoinRequests() {
            var D = this.groupMemberModeration;
            for (
                var i = 0;
                i < this.groupJoinRequestsModerationTable.data.length;
                i++
            ) {
                var row = this.groupJoinRequestsModerationTable.data[i];
                row.$selected = true;
                D.selectedUsers.set(row.userId, row);
            }
            D.selectedUsersArray = Array.from(D.selectedUsers.values());
            // force redraw
            this.groupMemberModerationTableForceUpdate++;
        },

        selectAllGroupBlocked() {
            var D = this.groupMemberModeration;
            for (
                var i = 0;
                i < this.groupBlockedModerationTable.data.length;
                i++
            ) {
                var row = this.groupBlockedModerationTable.data[i];
                row.$selected = true;
                D.selectedUsers.set(row.userId, row);
            }
            D.selectedUsersArray = Array.from(D.selectedUsers.values());
            // force redraw
            this.groupMemberModerationTableForceUpdate++;
        },

        async groupMembersKick() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                if (user.userId === API.currentUser.id) {
                    continue;
                }
                console.log(`Kicking ${user.userId} ${i + 1}/${memberCount}`);
                try {
                    await API.kickGroupMember({
                        groupId: D.id,
                        userId: user.userId
                    });
                } catch (err) {
                    console.error(err);
                    this.$message({
                        message: `Failed to kick group member: ${err}`,
                        type: 'error'
                    });
                }
            }
            this.$message({
                message: `Kicked ${memberCount} group members`,
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async groupMembersBan() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                if (user.userId === API.currentUser.id) {
                    continue;
                }
                console.log(`Banning ${user.userId} ${i + 1}/${memberCount}`);
                try {
                    await API.banGroupMember({
                        groupId: D.id,
                        userId: user.userId
                    });
                } catch (err) {
                    console.error(err);
                    this.$message({
                        message: `Failed to ban group member: ${err}`,
                        type: 'error'
                    });
                }
            }
            this.$message({
                message: `Banned ${memberCount} group members`,
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async groupMembersUnban() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;

            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                if (user.userId === API.currentUser.id) {
                    continue;
                }
                console.log(`Unbanning ${user.userId} ${i + 1}/${memberCount}`);
                try {
                    await API.unbanGroupMember({
                        groupId: D.id,
                        userId: user.userId
                    });
                } catch (err) {
                    console.error(err);
                    this.$message({
                        message: `Failed to unban group member: ${err}`,
                        type: 'error'
                    });
                }
            }
            this.$message({
                message: `Unbanned ${memberCount} group members`,
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async groupMembersDeleteSentInvite() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                if (user.userId === API.currentUser.id) {
                    continue;
                }
                console.log(
                    `Deleting group invite ${user.userId} ${i + 1}/${memberCount}`
                );
                try {
                    await API.deleteSentGroupInvite({
                        groupId: D.id,
                        userId: user.userId
                    });
                } catch (err) {
                    console.error(err);
                    this.$message({
                        message: `Failed to delete group invites: ${err}`,
                        type: 'error'
                    });
                }
            }
            this.$message({
                message: `Deleted ${memberCount} group invites`,
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async groupMembersDeleteBlockedRequest() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                if (user.userId === API.currentUser.id) {
                    continue;
                }
                console.log(
                    `Deleting blocked group request ${user.userId} ${i + 1}/${memberCount}`
                );
                try {
                    await API.deleteBlockedGroupRequest({
                        groupId: D.id,
                        userId: user.userId
                    });
                } catch (err) {
                    console.error(err);
                    this.$message({
                        message: `Failed to delete blocked group requests: ${err}`,
                        type: 'error'
                    });
                }
            }
            this.$message({
                message: `Deleted ${memberCount} blocked group requests`,
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async groupMembersAcceptInviteRequest() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                if (user.userId === API.currentUser.id) {
                    continue;
                }
                console.log(
                    `Accepting group join request ${user.userId} ${i + 1}/${memberCount}`
                );
                try {
                    await API.acceptGroupInviteRequest({
                        groupId: D.id,
                        userId: user.userId
                    });
                } catch (err) {
                    console.error(err);
                    this.$message({
                        message: `Failed to accept group join requests: ${err}`,
                        type: 'error'
                    });
                }
            }
            this.$message({
                message: `Accepted ${memberCount} group join requests`,
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async groupMembersRejectInviteRequest() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                if (user.userId === API.currentUser.id) {
                    continue;
                }
                console.log(
                    `Rejecting group join request ${user.userId} ${i + 1}/${memberCount}`
                );
                try {
                    await API.rejectGroupInviteRequest({
                        groupId: D.id,
                        userId: user.userId
                    });
                } catch (err) {
                    console.error(err);
                    this.$message({
                        message: `Failed to reject group join requests: ${err}`,
                        type: 'error'
                    });
                }
                this.$message({
                    message: `Rejected ${memberCount} group join requests`,
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
            }
        },

        async groupMembersBlockJoinRequest() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                if (user.userId === API.currentUser.id) {
                    continue;
                }
                console.log(
                    `Blocking group join request ${user.userId} ${i + 1}/${memberCount}`
                );
                try {
                    await API.blockGroupInviteRequest({
                        groupId: D.id,
                        userId: user.userId
                    });
                } catch (err) {
                    console.error(err);
                    this.$message({
                        message: `Failed to block group join requests: ${err}`,
                        type: 'error'
                    });
                }
            }
            this.$message({
                message: `Blocked ${memberCount} group join requests`,
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async groupMembersSaveNote() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                if (user.managerNotes === D.note) {
                    continue;
                }
                console.log(
                    `Setting note ${D.note} ${user.userId} ${
                        i + 1
                    }/${memberCount}`
                );
                try {
                    await API.setGroupMemberProps(user.userId, D.id, {
                        managerNotes: D.note
                    });
                } catch (err) {
                    console.error(err);
                    this.$message({
                        message: `Failed to set group member note: ${err}`,
                        type: 'error'
                    });
                }
            }
            this.$message({
                message: `Saved notes for ${memberCount} group members`,
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async groupMembersAddRoles() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                var rolesToAdd = [];
                D.selectedRoles.forEach((roleId) => {
                    if (!user.roleIds.includes(roleId)) {
                        rolesToAdd.push(roleId);
                    }
                });

                if (!rolesToAdd.length) {
                    continue;
                }
                for (var j = 0; j < rolesToAdd.length; j++) {
                    var roleId = rolesToAdd[j];
                    console.log(
                        `Adding role: ${roleId} ${user.userId} ${
                            i + 1
                        }/${memberCount}`
                    );
                    try {
                        await API.addGroupMemberRole({
                            groupId: D.id,
                            userId: user.userId,
                            roleId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to add group member roles: ${err}`,
                            type: 'error'
                        });
                    }
                }
            }
            this.$message({
                message: 'Added group member roles',
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async groupMembersRemoveRoles() {
            var D = this.groupMemberModeration;
            var memberCount = D.selectedUsersArray.length;
            D.progressTotal = memberCount;
            for (var i = 0; i < memberCount; i++) {
                if (!D.visible || !D.progressTotal) {
                    break;
                }
                var user = D.selectedUsersArray[i];
                D.progressCurrent = i + 1;
                var rolesToRemove = [];
                D.selectedRoles.forEach((roleId) => {
                    if (user.roleIds.includes(roleId)) {
                        rolesToRemove.push(roleId);
                    }
                });
                if (!rolesToRemove.length) {
                    continue;
                }
                for (var j = 0; j < rolesToRemove.length; j++) {
                    var roleId = rolesToRemove[j];
                    console.log(
                        `Removing role ${roleId} ${user.userId} ${
                            i + 1
                        }/${memberCount}`
                    );
                    try {
                        await API.removeGroupMemberRole({
                            groupId: D.id,
                            userId: user.userId,
                            roleId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to remove group member roles: ${err}`,
                            type: 'error'
                        });
                    }
                }
            }
            this.$message({
                message: 'Roles removed',
                type: 'success'
            });
            D.progressCurrent = 0;
            D.progressTotal = 0;
        },

        async selectGroupMemberUserId() {
            var D = this.groupMemberModeration;
            if (!D.selectUserId) {
                return;
            }

            var regexUserId =
                /usr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
            var match = [];
            var userIdList = new Set();
            while ((match = regexUserId.exec(D.selectUserId)) !== null) {
                userIdList.add(match[0]);
            }
            if (userIdList.size === 0) {
                // for those users missing the usr_ prefix
                userIdList.add(D.selectUserId);
            }
            for (var userId of userIdList) {
                try {
                    await this.addGroupMemberToSelection(userId);
                } catch {
                    console.error(`Failed to add user ${userId}`);
                }
            }

            D.selectUserId = '';
        },

        async addGroupMemberToSelection(userId) {
            var D = this.groupMemberModeration;

            // fetch member if there is one
            // banned members don't have a user object

            var member = {};
            var memberArgs = await API.getGroupMember({
                groupId: D.id,
                userId
            });
            if (memberArgs.json) {
                member = API.applyGroupMember(memberArgs.json);
            }
            if (member.user) {
                D.selectedUsers.set(member.userId, member);
                D.selectedUsersArray = Array.from(D.selectedUsers.values());
                this.groupMemberModerationTableForceUpdate++;
                return;
            }

            var userArgs = await API.getCachedUser({
                userId
            });
            member.userId = userArgs.json.id;
            member.user = userArgs.json;
            member.displayName = userArgs.json.displayName;

            D.selectedUsers.set(member.userId, member);
            D.selectedUsersArray = Array.from(D.selectedUsers.values());
            this.groupMemberModerationTableForceUpdate++;
        },
        showGroupLogsExportDialog() {
            this.$nextTick(() =>
                $app.adjustDialogZ(this.$refs.groupLogsExportDialogRef.$el)
            );
            this.groupLogsExportContent = '';
            this.updateGrouptLogsExporContent();
            this.isGroupLogsExportDialogVisible = true;
        },
        handleCopyGroupLogsExportContent(event) {
            event.target.tagName === 'TEXTAREA' && event.target.select();
            navigator.clipboard
                .writeText(this.groupLogsExportContent)
                .then(() => {
                    this.$message({
                        message: 'Copied successfully!',
                        type: 'success',
                        duration: 2000
                    });
                })
                .catch((err) => {
                    console.error('Copy failed:', err);
                    this.$message.error('Copy failed!');
                });
        },
        updateGrouptLogsExporContent() {
            const formatter = (str) =>
                /[\x00-\x1f,"]/.test(str)
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;

            const sortedCheckedOptions = this.checkGroupsLogsExportLogsOptions
                .filter((option) =>
                    this.checkedGroupLogsExportLogsOptions.includes(
                        option.label
                    )
                )
                .map((option) => option.label);

            const header = sortedCheckedOptions.join(',') + '\n';

            const content = this.groupLogsModerationTable.data
                .map((item) =>
                    sortedCheckedOptions
                        .map((key) =>
                            formatter(
                                key === 'data'
                                    ? JSON.stringify(item[key])
                                    : item[key]
                            )
                        )
                        .join(',')
                )
                .join('\n');

            this.groupLogsExportContent = header + content;
        }
    };
}
