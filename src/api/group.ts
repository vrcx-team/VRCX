import type {
    AddGroupGalleryImageRequest,
    BanGroupMemberRequest,
    CalendarEvent,
    CreateCalendarEventRequest,
    CreateGroupGalleryRequest,
    CreateGroupInviteRequest,
    CreateGroupPostRequest,
    CreateGroupRequest,
    CreateGroupRoleRequest,
    DeleteGroup,
    FollowCalendarEventRequest,
    GetCalendarEvents,
    GetFeaturedCalendarEvents,
    GetFollowedCalendarEvents,
    GetGroup,
    GetGroupBans,
    GetGroupGalleryImages,
    GetGroupGalleryImagesResponse,
    GetGroupInvites,
    GetGroupMemberResponse,
    GetGroupMembers,
    GetGroupPosts,
    GetGroupPostsResponse,
    GetGroupRequests,
    GetGroupRoleTemplatesResponse,
    GetGroupTransferability,
    GetUserGroupInstancesForGroupResponse,
    GetUserGroupInstancesResponse,
    Group,
    GroupAuditLogEntryType,
    GroupGallery,
    GroupGalleryImage,
    GroupMember,
    GroupPermission,
    GroupPost,
    GroupRole,
    GroupRoleIdList,
    GroupTransferable,
    LimitedGroup,
    LimitedUserGroups,
    PaginatedCalendarEventList,
    PaginatedGroupAuditLogEntryList,
    RepresentedGroup,
    SearchGroupMembers,
    SearchGroupMembersResponse,
    SearchGroups,
    Success,
    TransferGroupRequest,
    UpdateCalendarEventRequest,
    UpdateGroupGalleryRequest,
    UpdateGroupMemberRequest,
    UpdateGroupRepresentation,
    UpdateGroupRequest,
    UpdateGroupRoleRequest,
    UserAllGroupPermissions
} from 'vrchat';
import type { Json, VrcxGroup } from '../types/vrcx';
import { useUserStore } from '../stores';
import { applyGroup } from '../coordinators/groupCoordinator';
import { queryClient } from '../queries';
import { request } from '../services/request';

function getCurrentUserId() {
    return useUserStore().currentUser.id;
}

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
    setGroupRepresentation(groupId: string, params: UpdateGroupRepresentation['body']) {
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

    cancelGroupRequest(params: { groupId: string }): Promise<{ json: unknown; params }> {
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

    deleteGroupPost(params: { groupId: string; postId: string }): Promise<{ json: Json<Success>; params }> {
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
    getGroup(
        params: { groupId: string } & GetGroup['query']
    ): Promise<{ json: Json<Group>; params: { groupId: string } & GetGroup['query']; ref: VrcxGroup }> {
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
    getRepresentedGroup(params: { userId: string }): Promise<{ json: Json<RepresentedGroup>; params }> {
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
    getGroups(params: { userId: string }): Promise<{ json: Json<LimitedUserGroups[]>; params }> {
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

    checkTransferGroup(
        params: { groupId: string } & GetGroupTransferability['query']
    ): Promise<{ json: Json<GroupTransferable>; params: { groupId: string } & GetGroupTransferability['query'] }> {
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

    transferGroup(
        params: { groupId: string } & TransferGroupRequest
    ): Promise<{ json: Json<Success>; params: { groupId: string } & TransferGroupRequest }> {
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

    deleteGroup(
        params: { groupId: string } & DeleteGroup['query']
    ): Promise<{ json: Json<Success>; params: { groupId: string } & DeleteGroup['query'] }> {
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

    joinGroup(params: { groupId: string }): Promise<{ json: Json<GroupMember>; params }> {
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
    leaveGroup(params: { groupId: string }): Promise<{ json: unknown; params }> {
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
    groupStrictsearch(params: { query: string }): Promise<{ json: any; params }> {
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
    setGroupMemberProps(
        userId: string,
        groupId: string,
        params: UpdateGroupMemberRequest
    ): Promise<{ json: Json<GroupMember>; userId: string; groupId: string; params: UpdateGroupMemberRequest }> {
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
    addGroupMemberRole(params: {
        userId: string;
        groupId: string;
        roleId: string;
    }): Promise<{ json: Json<GroupRoleIdList>; params }> {
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
    removeGroupMemberRole(params: {
        userId: string;
        groupId: string;
        roleId: string;
    }): Promise<{ json: Json<GroupRoleIdList>; params }> {
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
    getGroupPermissions(params: {
        userId: string;
    }): Promise<{ json: Json<UserAllGroupPermissions>; params: { userId: string } }> {
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
    getGroupPosts(
        params: { groupId: string } & GetGroupPosts['query']
    ): Promise<{ json: Json<GetGroupPostsResponse>; params: { groupId: string } & GetGroupPosts['query'] }> {
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
    editGroupPost(params: { groupId: string; postId: string } & Partial<CreateGroupPostRequest>): Promise<{
        json: Json<GroupPost>;
        params: { groupId: string; postId: string } & Partial<CreateGroupPostRequest>;
    }> {
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
    createGroupPost(
        params: { groupId: string } & CreateGroupPostRequest
    ): Promise<{ json: Json<GroupPost>; params: { groupId: string } & CreateGroupPostRequest }> {
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
    getGroupMember(params: {
        groupId: string;
        userId: string;
    }): Promise<{ json: Json<GetGroupMemberResponse>; params; ref?: any }> {
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
    getGroupMembers(
        params: { groupId: string } & GetGroupMembers['query']
    ): Promise<{ json: Json<GroupMember[]>; params: { groupId: string } & GetGroupMembers['query'] }> {
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
    getGroupMembersSearch(
        params: { groupId: string } & SearchGroupMembers['query']
    ): Promise<{ json: Json<SearchGroupMembersResponse>; params: { groupId: string } & SearchGroupMembers['query'] }> {
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

    getBlockedGroups(params: {
        membershipStatus: 'invited' | 'requested' | 'userblocked';
    }): Promise<{ json: Json<Group[]>; params }> {
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

    blockGroup(params: { groupId: string }): Promise<{ json: Json<Success>; params }> {
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
    unblockGroup(params: { groupId: string; userId: string }): Promise<{ json: Json<Success>; params }> {
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
    sendGroupInvite(
        params: { groupId: string } & CreateGroupInviteRequest
    ): Promise<{ json: Json<Success>; params: { groupId: string } & CreateGroupInviteRequest }> {
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
    kickGroupMember(params: { groupId: string; userId: string }): Promise<{ json: Json<Success>; params }> {
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
    banGroupMember(
        params: { groupId: string } & BanGroupMemberRequest
    ): Promise<{ json: Json<GroupMember>; params: { groupId: string } & BanGroupMemberRequest }> {
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
    unbanGroupMember(params: {
        groupId: string;
        userId: string;
    }): Promise<{ json: Json<GroupMember>; params: { groupId: string; userId: string } }> {
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
    deleteSentGroupInvite(params: { groupId: string; userId: string }): Promise<{ json: Json<Success>; params }> {
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
    deleteBlockedGroupRequest(params: {
        groupId: string;
        userId: string;
    }): Promise<{ json: Json<Success>; params: { groupId: string; userId: string } }> {
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
    acceptGroupInviteRequest(params: {
        groupId: string;
        userId: string;
    }): Promise<{ json: unknown; params: { groupId: string; userId: string } }> {
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
    rejectGroupInviteRequest(params: {
        groupId: string;
        userId: string;
    }): Promise<{ json: unknown; params: { groupId: string; userId: string } }> {
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
    blockGroupInviteRequest(params: {
        groupId: string;
        userId: string;
    }): Promise<{ json: unknown; params: { groupId: string; userId: string } }> {
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
    getGroupBans(
        params: { groupId: string } & GetGroupBans['query']
    ): Promise<{ json: Json<GroupMember[]>; params: { groupId: string } & GetGroupBans['query'] }> {
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
    getGroupAuditLogTypes(params: { groupId: string }): Promise<{ json: Json<GroupAuditLogEntryType[]>; params }> {
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
    getGroupLogs(params: { groupId: string; n: number; offset: number; eventTypes?: string[] }): Promise<{
        json: Json<PaginatedGroupAuditLogEntryList>;
        params: { groupId: string; n: number; offset: number; eventTypes?: string[] };
    }> {
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
    getGroupInvites(
        params: { groupId: string } & GetGroupInvites['query']
    ): Promise<{ json: Json<GroupMember[]>; params: { groupId: string } & GetGroupInvites['query'] }> {
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
    getGroupJoinRequests(
        params: { groupId: string } & GetGroupRequests['query']
    ): Promise<{ json: Json<GroupMember[]>; params: { groupId: string } & GetGroupRequests['query'] }> {
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
    getGroupInstances(params: {
        groupId: string;
    }): Promise<{ json: Json<GetUserGroupInstancesForGroupResponse>; params }> {
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
    getGroupRoles(params: { groupId: string }): Promise<{ json: Json<GroupRole[]>; params }> {
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

    createGroupRole(
        params: { groupId: string } & CreateGroupRoleRequest & {
                isAddedOnJoin?: boolean;
                requiresTwoFactor?: boolean;
                requiresPurchase?: boolean;
            }
    ): Promise<{
        json: Json<GroupRole>;
        params: { groupId: string } & CreateGroupRoleRequest & {
                isAddedOnJoin?: boolean;
                requiresTwoFactor?: boolean;
                requiresPurchase?: boolean;
            };
    }> {
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

    editGroupRole(
        params: { groupId: string; roleId: string } & UpdateGroupRoleRequest & {
                isAddedOnJoin?: boolean;
                requiresTwoFactor?: boolean;
                requiresPurchase?: boolean;
            }
    ): Promise<{
        json: Json<GroupRole[]>;
        params: { groupId: string; roleId: string } & UpdateGroupRoleRequest & {
                isAddedOnJoin?: boolean;
                requiresTwoFactor?: boolean;
                requiresPurchase?: boolean;
            };
    }> {
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

    deleteGroupRole(params: { groupId: string; roleId: string }): Promise<{ json: Json<GroupRole[]>; params }> {
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

    getGroupPermissionList(params: { groupId: string }): Promise<{ json: Json<GroupPermission[]>; params }> {
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

    getUsersGroupInstances(): Promise<{ json: Json<GetUserGroupInstancesResponse> }> {
        return request(`users/${getCurrentUserId()}/instances/groups`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            return args;
        });
    },

    groupSearch(params: SearchGroups['query']): Promise<{ json: Json<LimitedGroup[]>; params: SearchGroups['query'] }> {
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
    getGroupGallery(params: { groupId: string; galleryId: string } & GetGroupGalleryImages['query']): Promise<{
        json: Json<GetGroupGalleryImagesResponse>;
        params: { groupId: string; galleryId: string } & GetGroupGalleryImages['query'];
    }> {
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

    createGroupGallery(params: { groupId: string } & CreateGroupGalleryRequest): Promise<{
        json: Json<GroupGallery>;
        params: { groupId: string } & CreateGroupGalleryRequest;
    }> {
        const { groupId, ...body } = params;
        return request(`groups/${groupId}/galleries`, {
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

    deleteGroupGallery(params: {
        groupId: string;
        galleryId: string;
    }): Promise<{ json: Json<Success>; params: { groupId: string; galleryId: string } }> {
        return request(`groups/${params.groupId}/galleries/${params.galleryId}`, {
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

    editGroupGallery(params: { groupId: string; galleryId: string } & UpdateGroupGalleryRequest): Promise<{
        json: Json<GroupGallery>;
        params: { groupId: string; galleryId: string } & UpdateGroupGalleryRequest;
    }> {
        const { groupId, galleryId, ...body } = params;
        return request(`groups/${groupId}/galleries/${galleryId}`, {
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

    addGroupGalleryImage(params: { groupId: string; galleryId: string } & AddGroupGalleryImageRequest): Promise<{
        json: Json<GroupGalleryImage>;
        params: { groupId: string; galleryId: string } & AddGroupGalleryImageRequest;
    }> {
        return request(`groups/${params.groupId}/galleries/${params.galleryId}/images`, {
            method: 'POST',
            params: {
                fileId: params.fileId
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

    deleteGroupGalleryImage(params: {
        groupId: string;
        galleryId: string;
        imageId: string;
    }): Promise<{ json: Json<Success>; params: { groupId: string; galleryId: string; imageId: string } }> {
        return request(`groups/${params.groupId}/galleries/${params.galleryId}/images/${params.imageId}`, {
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

    getGroupCalendar(
        groupId: string
    ): Promise<{ json: Json<PaginatedCalendarEventList>; params: { groupId: string } }> {
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

    getGroupCalendarEvent(params: {
        groupId: string;
        eventId: string;
    }): Promise<{ json: Json<CalendarEvent>; params }> {
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
    getGroupCalendars(params: Json<GetCalendarEvents['query']>): Promise<Json<PaginatedCalendarEventList>> {
        return request('calendar', {
            method: 'GET',
            params
        });
    },

    getFollowingGroupCalendars(
        params: Json<GetFollowedCalendarEvents['query']>
    ): Promise<Json<PaginatedCalendarEventList>> {
        return request('calendar/following', {
            method: 'GET',
            params
        });
    },

    getFeaturedGroupCalendars(
        params: Json<GetFeaturedCalendarEvents['query']>
    ): Promise<Json<PaginatedCalendarEventList>> {
        return request('calendar/featured', {
            method: 'GET',
            params
        });
    },

    followGroupEvent(params: { groupId: string; eventId: string } & FollowCalendarEventRequest): Promise<{
        json: Json<CalendarEvent>;
        params: { groupId: string; eventId: string } & FollowCalendarEventRequest;
    }> {
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

    deleteGroupEvent(params: {
        groupId: string;
        eventId: string;
    }): Promise<{ json: Json<Success>; params: { groupId: string; eventId: string } }> {
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

    createGroupEvent(
        params: { groupId: string } & Json<CreateCalendarEventRequest>
    ): Promise<{ json: Json<CalendarEvent>; params: { groupId: string } & Json<CreateCalendarEventRequest> }> {
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

    editGroupEvent(
        params: { groupId: string; eventId: string } & Json<UpdateCalendarEventRequest> & {
                accessType?: CreateCalendarEventRequest['accessType'];
            }
    ): Promise<{
        json: Json<CalendarEvent>;
        params: { groupId: string; eventId: string } & Json<UpdateCalendarEventRequest> & {
                accessType?: CreateCalendarEventRequest['accessType'];
            };
    }> {
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

    createGroup(params: CreateGroupRequest): Promise<{ json: Json<Group>; params: CreateGroupRequest }> {
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

    editGroup(params: { id: string } & UpdateGroupRequest & { allowGroupJoinPrompt?: boolean }): Promise<{
        json: Json<Group>;
        params: { id: string } & UpdateGroupRequest & { allowGroupJoinPrompt?: boolean };
    }> {
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

    getRoleTemplates(): Promise<{ json: Json<GetGroupRoleTemplatesResponse> }> {
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
