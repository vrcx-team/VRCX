import { useQuery } from '@tanstack/vue-query';

import { avatarRequest, groupRequest, userRequest, worldRequest } from '../api';
import { database } from '../services/database';
import { entityQueryPolicies, toQueryOptions } from './policies';
import { queryKeys } from './keys';

/**
 *
 * @param userId
 * @param options
 */
export function useUserQuery(userId, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.user(userId),
        queryFn: () => userRequest.getUser({ userId }),
        enabled: Boolean(userId),
        ...toQueryOptions(entityQueryPolicies.user)
    });
}

/**
 *
 * @param avatarId
 * @param options
 */
export function useAvatarQuery(avatarId, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.avatar(avatarId),
        queryFn: () => avatarRequest.getAvatar({ avatarId }),
        enabled: Boolean(avatarId),
        ...toQueryOptions(entityQueryPolicies.avatar)
    });
}

/**
 *
 * @param worldId
 * @param options
 */
export function useWorldQuery(worldId, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.world(worldId),
        queryFn: () => worldRequest.getWorld({ worldId }),
        enabled: Boolean(worldId),
        ...toQueryOptions(entityQueryPolicies.world)
    });
}

/**
 *
 * @param groupId
 * @param includeRoles
 * @param options
 */
export function useGroupQuery(groupId, includeRoles = false, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.group(groupId, includeRoles),
        queryFn: () => groupRequest.getGroup({ groupId, includeRoles }),
        enabled: Boolean(groupId),
        ...toQueryOptions(entityQueryPolicies.group)
    });
}

/**
 * 好友加入的热门公开群组列表（本地数据库聚合查询）。
 * @param {object} [options]
 */
export function usePopularFriendGroupsQuery(options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.friendGroupsPopular(),
        /**
         * @returns {Promise<Array<{groupId: string, name: string, shortCode: string, discriminator: string, description: string, iconUrl: string, bannerUrl: string, privacy: string, memberCount: number, friendCount: number}>>}
         */
        queryFn: () => database.getPopularGroups(2, 200),
        ...toQueryOptions(entityQueryPolicies.friendGroupsPopular)
    });
}

/**
 * 热门群组内已加入的好友 id 映射（头像预览用）。
 * @param {object} [options]
 */
export function usePopularFriendGroupIdsQuery(options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.friendGroupsFriendIds(),
        queryFn: () => database.getPopularGroupFriendIds(2),
        ...toQueryOptions(entityQueryPolicies.friendGroupsPopular)
    });
}
