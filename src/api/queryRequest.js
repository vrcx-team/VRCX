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
    avatar: {
        key: (params) => queryKeys.avatar(params.avatarId),
        policy: entityQueryPolicies.avatar,
        queryFn: (params) => avatarRequest.getAvatar(params)
    },
    world: {
        key: (params) => queryKeys.world(params.worldId),
        policy: entityQueryPolicies.world,
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
    groupPosts: {
        key: (params) => queryKeys.groupPosts(params),
        policy: entityQueryPolicies.groupCollection,
        queryFn: (params) => groupRequest.getGroupPosts(params)
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
        policy: entityQueryPolicies.groupCollection,
        queryFn: (params) => groupRequest.getGroupCalendarEvent(params)
    },
    friends: {
        key: (params) => queryKeys.friends(params),
        policy: entityQueryPolicies.friendList,
        queryFn: (params) => friendRequest.getFriends(params)
    },
    favoriteLimits: {
        key: () => queryKeys.favoriteLimits(),
        policy: entityQueryPolicies.favoriteCollection,
        queryFn: () => favoriteRequest.getFavoriteLimits()
    },
    favorites: {
        key: (params) => queryKeys.favorites(params),
        policy: entityQueryPolicies.favoriteCollection,
        queryFn: (params) => favoriteRequest.getFavorites(params)
    },
    favoriteGroups: {
        key: (params) => queryKeys.favoriteGroups(params),
        policy: entityQueryPolicies.favoriteCollection,
        queryFn: (params) => favoriteRequest.getFavoriteGroups(params)
    },
    favoriteWorlds: {
        key: (params) => queryKeys.favoriteWorlds(params),
        policy: entityQueryPolicies.favoriteCollection,
        queryFn: (params) => favoriteRequest.getFavoriteWorlds(params)
    },
    favoriteAvatars: {
        key: (params) => queryKeys.favoriteAvatars(params),
        policy: entityQueryPolicies.favoriteCollection,
        queryFn: (params) => favoriteRequest.getFavoriteAvatars(params)
    },
    galleryFiles: {
        key: (params) => queryKeys.galleryFiles(params),
        policy: entityQueryPolicies.galleryCollection,
        queryFn: (params) => vrcPlusIconRequest.getFileList(params)
    },
    prints: {
        key: (params) => queryKeys.prints(params),
        policy: entityQueryPolicies.galleryCollection,
        queryFn: (params) => vrcPlusImageRequest.getPrints(params)
    },
    print: {
        key: (params) => queryKeys.print(params.printId),
        policy: entityQueryPolicies.galleryCollection,
        queryFn: (params) => vrcPlusImageRequest.getPrint(params)
    },
    userInventoryItem: {
        key: (params) => queryKeys.userInventoryItem(params),
        policy: entityQueryPolicies.inventoryCollection,
        queryFn: (params) => inventoryRequest.getUserInventoryItem(params)
    },
    inventoryItems: {
        key: (params) => queryKeys.inventoryItems(params),
        policy: entityQueryPolicies.inventoryCollection,
        queryFn: (params) => inventoryRequest.getInventoryItems(params)
    },
    file: {
        key: (params) => queryKeys.file(params.fileId),
        policy: entityQueryPolicies.fileObject,
        queryFn: (params) => miscRequest.getFile(params)
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
            queryFn: () => entry.queryFn(params)
        });

        return {
            ...data,
            cache
        };
    }
};

export default queryRequest;
