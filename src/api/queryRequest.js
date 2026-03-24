import {
    entityQueryPolicies,
    fetchWithEntityPolicy,
    queryKeys
} from '../queries';

import avatarRequest from './avatar';
import favoriteRequest from './favorite';
import friendRequest from './friend';
import groupRequest from './group';
import inventoryRequest from './inventory';
import miscRequest from './misc';
import userRequest from './user';
import vrcPlusIconRequest from './vrcPlusIcon';
import vrcPlusImageRequest from './vrcPlusImage';
import worldRequest from './world';

const registry = Object.freeze({
    user: {
        key: (params) => queryKeys.user(params.userId),
        policy: entityQueryPolicies.user,
        queryFn: (params) => userRequest.getUser(params)
    },
    'user.dialog': {
        key: (params) => queryKeys.user(params.userId),
        policy: Object.freeze({
            ...entityQueryPolicies.user,
            staleTime: 60_000
        }),
        queryFn: (params) => userRequest.getUser(params)
    },
    'user.force': {
        key: (params) => queryKeys.user(params.userId),
        policy: Object.freeze({
            ...entityQueryPolicies.user,
            staleTime: 0
        }),
        queryFn: (params) => userRequest.getUser(params)
    },
    avatar: {
        key: (params) => queryKeys.avatar(params.avatarId),
        policy: entityQueryPolicies.avatar,
        queryFn: (params) => avatarRequest.getAvatar(params)
    },
    'avatar.dialog': {
        key: (params) => queryKeys.avatar(params.avatarId),
        policy: Object.freeze({
            ...entityQueryPolicies.avatar,
            staleTime: 120_000
        }),
        queryFn: (params) => avatarRequest.getAvatar(params)
    },
    world: {
        key: (params) => queryKeys.world(params.worldId),
        policy: entityQueryPolicies.world,
        queryFn: (params) => worldRequest.getWorld(params)
    },
    'world.dialog': {
        key: (params) => queryKeys.world(params.worldId),
        policy: Object.freeze({
            ...entityQueryPolicies.world,
            staleTime: 120_000
        }),
        queryFn: (params) => worldRequest.getWorld(params)
    },
    'world.location': {
        key: (params) => queryKeys.world(params.worldId),
        policy: Object.freeze({
            ...entityQueryPolicies.world,
            staleTime: 120_000
        }),
        queryFn: (params) => worldRequest.getWorld(params)
    },
    'world.force': {
        key: (params) => queryKeys.world(params.worldId),
        policy: Object.freeze({
            ...entityQueryPolicies.world,
            staleTime: 0
        }),
        queryFn: (params) => worldRequest.getWorld(params)
    },
    worldsByUser: {
        key: (params) => queryKeys.worldsByUser(params),
        policy: entityQueryPolicies.worldCollection,
        queryFn: (params) =>
            worldRequest.getWorlds(params, params.option || undefined)
    },
    group: {
        key: (params) => queryKeys.group(params.groupId, params.includeRoles),
        policy: entityQueryPolicies.group,
        queryFn: (params) => groupRequest.getGroup(params)
    },
    'group.dialog': {
        key: (params) => queryKeys.group(params.groupId, params.includeRoles),
        policy: Object.freeze({
            ...entityQueryPolicies.group,
            staleTime: 120_000
        }),
        queryFn: (params) => groupRequest.getGroup(params)
    },
    'group.force': {
        key: (params) => queryKeys.group(params.groupId, params.includeRoles),
        policy: Object.freeze({
            ...entityQueryPolicies.group,
            staleTime: 0
        }),
        queryFn: (params) => groupRequest.getGroup(params)
    },
    groupMember: {
        key: (params) => queryKeys.groupMember(params),
        policy: entityQueryPolicies.groupCollection,
        queryFn: (params) => groupRequest.getGroupMember(params)
    },
    groupMembers: {
        key: (params) => queryKeys.groupMembers(params),
        policy: entityQueryPolicies.groupCollection,
        queryFn: (params) => groupRequest.getGroupMembers(params)
    },
    groupGallery: {
        key: (params) => queryKeys.groupGallery(params),
        policy: entityQueryPolicies.groupCollection,
        queryFn: (params) => groupRequest.getGroupGallery(params)
    },
    groupCalendar: {
        key: (params) => queryKeys.groupCalendar(params.groupId),
        policy: entityQueryPolicies.groupCollection,
        queryFn: (params) => groupRequest.getGroupCalendar(params.groupId)
    },
    groupCalendarEvent: {
        key: (params) => queryKeys.groupCalendarEvent(params),
        policy: entityQueryPolicies.groupCalendarEvent,
        queryFn: (params) => groupRequest.getGroupCalendarEvent(params)
    },
    avatarGallery: {
        key: (params) => queryKeys.avatarGallery(params.avatarId),
        policy: entityQueryPolicies.avatarGallery,
        queryFn: (params) => avatarRequest.getAvatarGallery(params.avatarId)
    },
    favoriteLimits: {
        key: () => queryKeys.favoriteLimits(),
        policy: entityQueryPolicies.favoriteLimits,
        queryFn: () => favoriteRequest.getFavoriteLimits()
    },
    userInventoryItem: {
        key: (params) => queryKeys.userInventoryItem(params),
        policy: entityQueryPolicies.inventoryCollection,
        queryFn: (params) => inventoryRequest.getUserInventoryItem(params)
    },
    fileAnalysis: {
        key: (params) => queryKeys.fileAnalysis(params),
        policy: entityQueryPolicies.fileAnalysis,
        queryFn: (params) => miscRequest.getFileAnalysis(params)
    },
    worldPersistData: {
        key: (params) => queryKeys.worldPersistData(params.worldId),
        policy: entityQueryPolicies.worldPersistData,
        queryFn: (params) => miscRequest.hasWorldPersistData(params)
    },
    mutualCounts: {
        key: (params) => queryKeys.mutualCounts(params.userId),
        policy: entityQueryPolicies.mutualCounts,
        queryFn: (params) => userRequest.getMutualCounts(params)
    },
    visits: {
        key: () => queryKeys.visits(),
        policy: entityQueryPolicies.visits,
        queryFn: () => miscRequest.getVisits()
    },
    file: {
        key: (params) => queryKeys.file(params.fileId),
        policy: entityQueryPolicies.fileObject,
        queryFn: (params) => miscRequest.getFile(params)
    },
    avatarStyles: {
        key: () => queryKeys.avatarStyles(),
        policy: entityQueryPolicies.avatarStyles,
        queryFn: () => avatarRequest.getAvailableAvatarStyles()
    },
    representedGroup: {
        key: (params) => queryKeys.representedGroup(params.userId),
        policy: entityQueryPolicies.representedGroup,
        queryFn: (params) => groupRequest.getRepresentedGroup(params)
    },
    vrchatCredits: {
        key: () => queryKeys.vrchatCredits(),
        policy: entityQueryPolicies.vrchatCredits,
        queryFn: () => miscRequest.getVRChatCredits()
    }
});

const queryRequest = {
    /**
     * @template T
     * @param {keyof typeof registry} resource
     * @param {any} [params]
     * @returns {Promise<T & {cache: boolean}>}
     */
    async fetch(resource, params = {}) {
        const entry = registry[resource];
        if (!entry) {
            throw new Error(`Unknown query resource: ${String(resource)}`);
        }

        const { data, cache } = await fetchWithEntityPolicy({
            queryKey: entry.key(params),
            policy: entry.policy,
            queryFn: () => entry.queryFn(params),
            label: resource
        });

        return {
            ...data,
            cache
        };
    }
};

export default queryRequest;
