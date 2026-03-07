import { useGroupStore, useUserStore } from '../stores';
import { request } from '../service/request';
import {
    entityQueryPolicies,
    fetchWithEntityPolicy,
    queryClient,
    queryKeys
} from '../query';

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
    /**
     * @param {string} groupId
     * @param {{isRepresenting: bool}} params
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
     * @return { Promise<{json: any, params}> }
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
     * @param {{ groupId: string, postId: string }} params
     * @return { Promise<{json: any, params}> }
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
     * @type {import('../types/api/group').GetGroup}
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
                params
            };
            return args;
        });
    },
    /**
     *
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, ref: any, cache?: boolean, params}> }
     */
    getCachedGroup(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.group(params.groupId, params.includeRoles),
            policy: entityQueryPolicies.group,
            queryFn: () => groupReq.getGroup(params).then((args) => {
                const groupStore = useGroupStore();
                args.ref = groupStore.applyGroup(args.json);
                return args;
            })
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },
    /**
     * @param {{ userId: string }} params
     * @return { Promise<{json: any, params}> }
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
     * @return { Promise<{json: any, params}> }
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
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
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
     * @return { Promise<{json: any, params}> }
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
     * @return { Promise<{json: any, params}> }
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
    userId: string,
    groupId: string,
    params: {
        visibility: string,
        isSubscribedToAnnouncements: bool,
        managerNotes: string
    }
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
     * userId: string,
     * groupId: string,
     * roleId: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    addGroupMemberRole(params) {
        return request(
            `groups/${params.groupId}/members/${params.userId}/roles/${params.roleId}`,
            {
                method: 'PUT'
            }
        ).then((json) => {
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
     * userId: string,
     * groupId: string,
     * roleId: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    removeGroupMemberRole(params) {
        return request(
            `groups/${params.groupId}/members/${params.userId}/roles/${params.roleId}`,
            {
                method: 'DELETE'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            refetchActiveGroupScope(params.groupId);
            return args;
        });
    },
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
     * @param {{
     groupId: string,
     n: number,
     offset: number
     }} params
     * @return { Promise<{json: any, params}> }
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
    getCachedGroupPosts(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.groupPosts(params),
            policy: entityQueryPolicies.groupCollection,
            queryFn: () => groupReq.getGroupPosts(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },
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
     * groupId: string,
     * userId: string
     * }} params
     * @return { Promise<{json: any, params, ref?: any}> }
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
    getCachedGroupMember(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.groupMember(params),
            policy: entityQueryPolicies.groupCollection,
            queryFn: () => groupReq.getGroupMember(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },
    /**
     * @param {{
     * groupId: string,
     * n: number,
     * offset: number
     * }} params
     * @return { Promise<{json: any, params}> }
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
    getCachedGroupMembers(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.groupMembers(params),
            policy: entityQueryPolicies.groupCollection,
            queryFn: () => groupReq.getGroupMembers(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },
    /**
     * @param {{
     * groupId: string,
     * query: string,
     * n: number,
     * offset: number
     * }} params
     * @return { Promise<{json: any, params}> }
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
     * groupId: string
     * }} params
     * @return { Promise<{json: any, params}> }
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
     * groupId: string,
     * userId: string
     * }} params
     * @return { Promise<{json: any, params}> }
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
     * @param {{
     * groupId: string,
     * userId: string
     * }} params
     * @return { Promise<{json: any, params}> }
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
     * groupId: string,
     * userId: string
     * }} params
     * @return { Promise<{json: any, params}> }
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
     * @param {{ groupId: string, userId: string }} params
     * @return { Promise<{json: any, params}> }
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
     * @param {{ groupId: string, userId: string }} params
     * @return { Promise<{json: any, params}> }
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
     * @return { Promise<{json: any, params}> }
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
     * @param {{ groupId: string, n: number, offset: number, eventTypes?: array }} params
     * @return { Promise<{json: any, params}> }
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
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
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
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
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
     * @return { Promise<{json: any, params}> }
     */
    getGroupInstances(params) {
        return request(
            `users/${getCurrentUserId()}/instances/groups/${params.groupId}`,
            {
                method: 'GET'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
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
     * @param {{
     query: string,
     n: number,
     offset: number,
     order: string,
     sortBy: string
     }} params
     * @return { Promise<{json: any, params}> }
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
     * @param {{
     groupId: string,
     galleryId: string,
     n: number,
     offset: number
     }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupGallery(params) {
        return request(
            `groups/${params.groupId}/galleries/${params.galleryId}`,
            {
                method: 'GET',
                params: {
                    n: params.n,
                    offset: params.offset
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    getCachedGroupGallery(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.groupGallery(params),
            policy: entityQueryPolicies.groupCollection,
            queryFn: () => groupReq.getGroupGallery(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },

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
    getCachedGroupCalendar(groupId) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.groupCalendar(groupId),
            policy: entityQueryPolicies.groupCollection,
            queryFn: () => groupReq.getGroupCalendar(groupId)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },

    /**
     * @param {{
     groupId: string,
     eventId: string
     }} params
     * @return { Promise<{json: any, params}> }
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
    getCachedGroupCalendarEvent(params) {
        return fetchWithEntityPolicy({
            queryKey: queryKeys.groupCalendarEvent(params),
            policy: entityQueryPolicies.groupCollection,
            queryFn: () => groupReq.getGroupCalendarEvent(params)
        }).then(({ data, cache }) => ({
            ...data,
            cache
        }));
    },

    /**
     * @type {import('../types/api/group').GetCalendars}
     */
    getGroupCalendars(params) {
        return request('calendar', {
            method: 'GET',
            params
        });
    },

    /**
     * @type {import('../types/api/group').GetFollowingCalendars}
     */
    getFollowingGroupCalendars(params) {
        return request('calendar/following', {
            method: 'GET',
            params
        });
    },

    /**
     * @type {import('../types/api/group').GetFeaturedCalendars}
     */
    getFeaturedGroupCalendars(params) {
        return request('calendar/featured', {
            method: 'GET',
            params
        });
    },

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
