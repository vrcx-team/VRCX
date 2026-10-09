import { useUserStore } from '../stores';
import { applyGroup } from '../coordinators/groupCoordinator';
import { queryClient } from '../queries';
import { request } from '../services/request';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

/**
 * @param groupId
 */
function refetchActiveGroupScope(groupId) {
    if (!groupId) {
        return;
    }
    queryClient
        .invalidateQueries({
            queryKey: ['group', groupId],
            refetchType: 'active'
        })
        .catch((err) => {
            console.error('Failed to refresh scoped group queries:', err);
        });
}
const groupReq = {
    /**
     * @param {string} groupId
     * @param {import('vrchat').UpdateGroupRepresentation['body']} params
     * @returns
     */
    setGroupRepresentation(groupId, params) {
        return request(`groups/${groupId}/representation`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                groupId,
                params
            };
            refetchActiveGroupScope(groupId);
            return args;
        });
    },

    /**
     * @param {{ groupId: string }} params
     * @returns {Promise<{ json: unknown; params }>}
     */
    cancelGroupRequest(params) {
        return request(`groups/${params.groupId}/requests`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string; postId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Success>; params }>}
     */
    deleteGroupPost(params) {
        return request(`groups/${params.groupId}/posts/${params.postId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').GetGroup['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Group>;
     *     params: { groupId: string } & import('vrchat').GetGroup['query'];
     *     ref: import('@/types/vrcx').VrcxGroup;
     * }>}
     */
    getGroup(params) {
        return request(`groups/${params.groupId}`, {
            method: 'GET',
            params: {
                includeRoles: params.includeRoles || false
            }
        }).then((json) => {
            const args = {
                json,
                params,
                ref: applyGroup(json)
            };
            return args;
        });
    },
    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').RepresentedGroup>; params }>}
     */
    getRepresentedGroup(params) {
        return request(`users/${params.userId}/groups/represented`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').LimitedUserGroups[]>; params }>}
     */
    getGroups(params) {
        return request(`users/${params.userId}/groups`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string } & import('vrchat').GetGroupTransferability['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupTransferable>;
     *     params: { groupId: string } & import('vrchat').GetGroupTransferability['query'];
     * }>}
     */
    checkTransferGroup(params) {
        return request(`groups/${params.groupId}/transfer`, {
            method: 'GET',
            params: {
                transferTargetId: params.transferTargetId
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string } & import('vrchat').TransferGroupRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Success>;
     *     params: { groupId: string } & import('vrchat').TransferGroupRequest;
     * }>}
     */
    transferGroup(params) {
        return request(`groups/${params.groupId}/transfer`, {
            method: 'POST',
            params: {
                transferTargetId: params.transferTargetId
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },

    /**
     * @param {{ groupId: string } & import('vrchat').DeleteGroup['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Success>;
     *     params: { groupId: string } & import('vrchat').DeleteGroup['query'];
     * }>}
     */
    deleteGroup(params) {
        return request(`groups/${params.groupId}`, {
            method: 'DELETE',
            params: {
                hardDelete: params.hardDelete ?? false
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').GroupMember>; params }>}
     */
    joinGroup(params) {
        return request(`groups/${params.groupId}/join`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @returns {Promise<{ json: unknown; params }>}
     */
    leaveGroup(params) {
        return request(`groups/${params.groupId}/leave`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ query: string }} params
     * @returns {Promise<{ json: any; params }>}
     */
    groupStrictsearch(params) {
        return request(`groups/strictsearch`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {string} userId
     * @param {string} groupId
     * @param {import('vrchat').UpdateGroupMemberRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupMember>;
     *     userId: string;
     *     groupId: string;
     *     params: import('vrchat').UpdateGroupMemberRequest;
     * }>}
     */
    setGroupMemberProps(userId, groupId, params) {
        return request(`groups/${groupId}/members/${userId}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                userId,
                groupId,
                params
            };
            refetchActiveGroupScope(groupId);
            return args;
        });
    },
    /**
     * @param {{
     *     userId: string;
     *     groupId: string;
     *     roleId: string;
     * }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').GroupRoleIdList>; params }>}
     */
    addGroupMemberRole(params) {
        return request(`groups/${params.groupId}/members/${params.userId}/roles/${params.roleId}`, {
            method: 'PUT'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{
     *     userId: string;
     *     groupId: string;
     *     roleId: string;
     * }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').GroupRoleIdList>; params }>}
     */
    removeGroupMemberRole(params) {
        return request(`groups/${params.groupId}/members/${params.userId}/roles/${params.roleId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').UserAllGroupPermissions>;
     *     params: { userId: string };
     * }>}
     */
    getGroupPermissions(params) {
        return request(`users/${params.userId}/groups/permissions`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').GetGroupPosts['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GetGroupPostsResponse>;
     *     params: { groupId: string } & import('vrchat').GetGroupPosts['query'];
     * }>}
     */
    getGroupPosts(params) {
        return request(`groups/${params.groupId}/posts`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string; postId: string } & Partial<import('vrchat').CreateGroupPostRequest>} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupPost>;
     *     params: { groupId: string; postId: string } & Partial<import('vrchat').CreateGroupPostRequest>;
     * }>}
     */
    editGroupPost(params) {
        return request(`groups/${params.groupId}/posts/${params.postId}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').CreateGroupPostRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupPost>;
     *     params: { groupId: string } & import('vrchat').CreateGroupPostRequest;
     * }>}
     */
    createGroupPost(params) {
        return request(`groups/${params.groupId}/posts`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{
     *     groupId: string;
     *     userId: string;
     * }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GetGroupMemberResponse>;
     *     params;
     *     ref?: any;
     * }>}
     */
    getGroupMember(params) {
        return request(`groups/${params.groupId}/members/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').GetGroupMembers['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupMember[]>;
     *     params: { groupId: string } & import('vrchat').GetGroupMembers['query'];
     * }>}
     */
    getGroupMembers(params) {
        return request(`groups/${params.groupId}/members`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').SearchGroupMembers['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').SearchGroupMembersResponse>;
     *     params: { groupId: string } & import('vrchat').SearchGroupMembers['query'];
     * }>}
     */
    getGroupMembersSearch(params) {
        return request(`groups/${params.groupId}/members/search`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{
     *     membershipStatus: 'invited' | 'requested' | 'userblocked';
     * }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Group[]>; params }>}
     */
    getBlockedGroups(params) {
        return request(`users/${getCurrentUserId()}/groups/${params.membershipStatus}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{
     *     groupId: string;
     * }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Success>; params }>}
     */
    blockGroup(params) {
        return request(`groups/${params.groupId}/block`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{
     *     groupId: string;
     *     userId: string;
     * }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Success>; params }>}
     */
    unblockGroup(params) {
        return request(`groups/${params.groupId}/members/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').CreateGroupInviteRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Success>;
     *     params: { groupId: string } & import('vrchat').CreateGroupInviteRequest;
     * }>}
     */
    sendGroupInvite(params) {
        return request(`groups/${params.groupId}/invites`, {
            method: 'POST',
            params: {
                userId: params.userId
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{
     *     groupId: string;
     *     userId: string;
     * }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Success>; params }>}
     */
    kickGroupMember(params) {
        return request(`groups/${params.groupId}/members/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').BanGroupMemberRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupMember>;
     *     params: { groupId: string } & import('vrchat').BanGroupMemberRequest;
     * }>}
     */
    banGroupMember(params) {
        return request(`groups/${params.groupId}/bans`, {
            method: 'POST',
            params: {
                userId: params.userId
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string; userId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupMember>;
     *     params: { groupId: string; userId: string };
     * }>}
     */
    unbanGroupMember(params) {
        return request(`groups/${params.groupId}/bans/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string; userId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').Success>; params }>}
     */
    deleteSentGroupInvite(params) {
        return request(`groups/${params.groupId}/invites/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string; userId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Success>;
     *     params: { groupId: string; userId: string };
     * }>}
     */
    deleteBlockedGroupRequest(params) {
        return request(`groups/${params.groupId}/members/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string; userId: string }} params
     * @returns {Promise<{ json: unknown; params: { groupId: string; userId: string } }>}
     */
    acceptGroupInviteRequest(params) {
        return request(`groups/${params.groupId}/requests/${params.userId}`, {
            method: 'PUT',
            params: {
                action: 'accept'
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string; userId: string }} params
     * @returns {Promise<{ json: unknown; params: { groupId: string; userId: string } }>}
     */
    rejectGroupInviteRequest(params) {
        return request(`groups/${params.groupId}/requests/${params.userId}`, {
            method: 'PUT',
            params: {
                action: 'reject'
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string; userId: string }} params
     * @returns {Promise<{ json: unknown; params: { groupId: string; userId: string } }>}
     */
    blockGroupInviteRequest(params) {
        return request(`groups/${params.groupId}/requests/${params.userId}`, {
            method: 'PUT',
            params: {
                action: 'reject',
                block: true
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').GetGroupBans['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupMember[]>;
     *     params: { groupId: string } & import('vrchat').GetGroupBans['query'];
     * }>}
     */
    getGroupBans(params) {
        return request(`groups/${params.groupId}/bans`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').GroupAuditLogEntryType[]>; params }>}
     */
    getGroupAuditLogTypes(params) {
        return request(`groups/${params.groupId}/auditLogTypes`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string; n: number; offset: number; eventTypes?: string[] }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').PaginatedGroupAuditLogEntryList>;
     *     params: { groupId: string; n: number; offset: number; eventTypes?: string[] };
     * }>}
     */
    getGroupLogs(params) {
        return request(`groups/${params.groupId}/auditLogs`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').GetGroupInvites['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupMember[]>;
     *     params: { groupId: string } & import('vrchat').GetGroupInvites['query'];
     * }>}
     */
    getGroupInvites(params) {
        return request(`groups/${params.groupId}/invites`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string } & import('vrchat').GetGroupRequests['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupMember[]>;
     *     params: { groupId: string } & import('vrchat').GetGroupRequests['query'];
     * }>}
     */
    getGroupJoinRequests(params) {
        return request(`groups/${params.groupId}/requests`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GetUserGroupInstancesForGroupResponse>;
     *     params;
     * }>}
     */
    getGroupInstances(params) {
        return request(`users/${getCurrentUserId()}/instances/groups/${params.groupId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').GroupRole[]>; params }>}
     */
    getGroupRoles(params) {
        return request(`groups/${params.groupId}/roles`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string } & import('vrchat').CreateGroupRoleRequest & {
     *         isAddedOnJoin?: boolean;
     *         requiresTwoFactor?: boolean;
     *         requiresPurchase?: boolean;
     *     }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupRole>;
     *     params: { groupId: string } & import('vrchat').CreateGroupRoleRequest & {
     *             isAddedOnJoin?: boolean;
     *             requiresTwoFactor?: boolean;
     *             requiresPurchase?: boolean;
     *         };
     * }>}
     */
    createGroupRole(params) {
        const { groupId, ...body } = params;
        return request(`groups/${groupId}/roles`, {
            method: 'POST',
            params: body
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(groupId);
            return args;
        });
    },

    /**
     * @param {{ groupId: string; roleId: string } & import('vrchat').UpdateGroupRoleRequest & {
     *         isAddedOnJoin?: boolean;
     *         requiresTwoFactor?: boolean;
     *     }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GroupRole[]>;
     *     params: { groupId: string; roleId: string } & import('vrchat').UpdateGroupRoleRequest & {
     *             isAddedOnJoin?: boolean;
     *             requiresTwoFactor?: boolean;
     *         };
     * }>}
     */
    editGroupRole(params) {
        const { groupId, roleId, ...body } = params;
        return request(`groups/${groupId}/roles/${roleId}`, {
            method: 'PUT',
            params: body
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(groupId);
            return args;
        });
    },

    /**
     * @param {{ groupId: string; roleId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').GroupRole[]>; params }>}
     */
    deleteGroupRole(params) {
        return request(`groups/${params.groupId}/roles/${params.roleId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },

    /**
     * @param {{ groupId: string }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').GroupPermission[]>; params }>}
     */
    getGroupPermissionList(params) {
        return request(`groups/${params.groupId}/permissions`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').GetUserGroupInstancesResponse> }>}
     */
    getUsersGroupInstances() {
        return request(`users/${getCurrentUserId()}/instances/groups`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    /**
     * @param {import('vrchat').SearchGroups['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').LimitedGroup[]>;
     *     params: import('vrchat').SearchGroups['query'];
     * }>}
     */
    groupSearch(params) {
        return request(`groups`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string; galleryId: string } & import('vrchat').GetGroupGalleryImages['query']} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').GetGroupGalleryImagesResponse>;
     *     params: { groupId: string; galleryId: string } & import('vrchat').GetGroupGalleryImages['query'];
     * }>}
     */
    getGroupGallery(params) {
        return request(`groups/${params.groupId}/galleries/${params.galleryId}`, {
            method: 'GET',
            params: {
                n: params.n,
                offset: params.offset
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {string} groupId
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').PaginatedCalendarEventList>;
     *     params: { groupId: string };
     * }>}
     */
    getGroupCalendar(groupId) {
        return request(`calendar/${groupId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params: {
                    groupId
                }
            };
            return args;
        });
    },

    /**
     * @param {{
     *     groupId: string;
     *     eventId: string;
     * }} params
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').CalendarEvent>; params }>}
     */
    getGroupCalendarEvent(params) {
        return request(`calendar/${params.groupId}/${params.eventId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {import('@/types/vrcx').Json<import('vrchat').GetCalendarEvents['query']>} params
     * @returns {Promise<import('@/types/vrcx').Json<import('vrchat').PaginatedCalendarEventList>>}
     */
    getGroupCalendars(params) {
        return request('calendar', {
            method: 'GET',
            params
        });
    },

    /**
     * @param {import('@/types/vrcx').Json<import('vrchat').GetFollowedCalendarEvents['query']>} params
     * @returns {Promise<import('@/types/vrcx').Json<import('vrchat').PaginatedCalendarEventList>>}
     */
    getFollowingGroupCalendars(params) {
        return request('calendar/following', {
            method: 'GET',
            params
        });
    },

    /**
     * @param {import('@/types/vrcx').Json<import('vrchat').GetFeaturedCalendarEvents['query']>} params
     * @returns {Promise<import('@/types/vrcx').Json<import('vrchat').PaginatedCalendarEventList>>}
     */
    getFeaturedGroupCalendars(params) {
        return request('calendar/featured', {
            method: 'GET',
            params
        });
    },

    /**
     * @param {{ groupId: string; eventId: string } & import('vrchat').FollowCalendarEventRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').CalendarEvent>;
     *     params: { groupId: string; eventId: string } & import('vrchat').FollowCalendarEventRequest;
     * }>}
     */
    followGroupEvent(params) {
        return request(`calendar/${params.groupId}/${params.eventId}/follow`, {
            method: 'POST',
            params: {
                isFollowing: params.isFollowing
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string; eventId: string }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Success>;
     *     params: { groupId: string; eventId: string };
     * }>}
     */
    deleteGroupEvent(params) {
        return request(`calendar/${params.groupId}/${params.eventId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string } & import('@/types/vrcx').Json<import('vrchat').CreateCalendarEventRequest>} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').CalendarEvent>;
     *     params: { groupId: string } & import('@/types/vrcx').Json<import('vrchat').CreateCalendarEventRequest>;
     * }>}
     */
    createGroupEvent(params) {
        return request(`calendar/${params.groupId}/event`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string; eventId: string } & import('@/types/vrcx').Json<
     *     import('vrchat').UpdateCalendarEventRequest
     * > & {
     *         accessType?: import('vrchat').CreateCalendarEventRequest['accessType'];
     *     }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').CalendarEvent>;
     *     params: { groupId: string; eventId: string } & import('@/types/vrcx').Json<
     *         import('vrchat').UpdateCalendarEventRequest
     *     > & {
     *             accessType?: import('vrchat').CreateCalendarEventRequest['accessType'];
     *         };
     * }>}
     */
    editGroupEvent(params) {
        return request(`calendar/${params.groupId}/${params.eventId}/event`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {import('vrchat').CreateGroupRequest} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Group>;
     *     params: import('vrchat').CreateGroupRequest;
     * }>}
     */
    createGroup(params) {
        return request('groups', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ id: string } & import('vrchat').UpdateGroupRequest & { allowGroupJoinPrompt?: boolean }} params
     * @returns {Promise<{
     *     json: import('@/types/vrcx').Json<import('vrchat').Group>;
     *     params: { id: string } & import('vrchat').UpdateGroupRequest & { allowGroupJoinPrompt?: boolean };
     * }>}
     */
    editGroup(params) {
        return request(`groups/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @returns {Promise<{ json: import('@/types/vrcx').Json<import('vrchat').GetGroupRoleTemplatesResponse> }>}
     */
    getRoleTemplates() {
        return request('groups/roleTemplates', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    }

    // getRequestedGroups() {
    //     return request(
    //         `users/${API.currentUser.id}/groups/requested`,
    //         {
    //             method: 'GET'
    //         }
    //     ).then((json) => {
    //         const args = {
    //             json
    //         };
    //         API.$emit('GROUP:REQUESTED', args);
    //         return args;
    //     });
    // }

    // /**
    // * @param {{ groupId: string }} params
    // * @return { Promise<{json: any, params}> }
    // */
    // API.getGroupAnnouncement = function (params) {
    //     return request(`groups/${params.groupId}/announcement`, {
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
};

export default groupReq;
