import { useQuery } from '@tanstack/vue-query';

import { avatarRequest, groupRequest, instanceRequest, userRequest, worldRequest } from '../api';
import { queryKeys } from './keys';
import { entityQueryPolicies, toQueryOptions } from './policies';

export function useUserQuery(userId, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.user(userId),
        queryFn: () => userRequest.getUser({ userId }),
        enabled: Boolean(userId),
        ...toQueryOptions(entityQueryPolicies.user)
    });
}

export function useAvatarQuery(avatarId, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.avatar(avatarId),
        queryFn: () => avatarRequest.getAvatar({ avatarId }),
        enabled: Boolean(avatarId),
        ...toQueryOptions(entityQueryPolicies.avatar)
    });
}

export function useWorldQuery(worldId, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.world(worldId),
        queryFn: () => worldRequest.getWorld({ worldId }),
        enabled: Boolean(worldId),
        ...toQueryOptions(entityQueryPolicies.world)
    });
}

export function useGroupQuery(groupId, includeRoles = false, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.group(groupId, includeRoles),
        queryFn: () => groupRequest.getGroup({ groupId, includeRoles }),
        enabled: Boolean(groupId),
        ...toQueryOptions(entityQueryPolicies.group)
    });
}

export function useInstanceQuery(worldId, instanceId, options = {}) {
    return useQuery({
        ...options,
        queryKey: queryKeys.instance(worldId, instanceId),
        queryFn: () => instanceRequest.getInstance({ worldId, instanceId }),
        enabled: Boolean(worldId && instanceId),
        ...toQueryOptions(entityQueryPolicies.instance)
    });
}
