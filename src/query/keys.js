export const queryKeys = Object.freeze({
    user: (userId) => ['user', userId],
    avatar: (avatarId) => ['avatar', avatarId],
    world: (worldId) => ['world', worldId],
    group: (groupId, includeRoles = false) => ['group', groupId, Boolean(includeRoles)],
    groupPosts: ({ groupId, n = 100, offset = 0 } = {}) => [
        'group',
        groupId,
        'posts',
        {
            n: Number(n),
            offset: Number(offset)
        }
    ],
    groupMember: ({ groupId, userId } = {}) => ['group', groupId, 'member', userId],
    groupMembers: ({ groupId, n = 100, offset = 0, sort = '', roleId = '' } = {}) => [
        'group',
        groupId,
        'members',
        {
            n: Number(n),
            offset: Number(offset),
            sort: String(sort || ''),
            roleId: String(roleId || '')
        }
    ],
    groupGallery: ({ groupId, galleryId, n = 100, offset = 0 } = {}) => [
        'group',
        groupId,
        'gallery',
        galleryId,
        {
            n: Number(n),
            offset: Number(offset)
        }
    ],
    groupCalendar: (groupId) => ['group', groupId, 'calendar'],
    groupCalendarEvent: ({ groupId, eventId } = {}) => [
        'group',
        groupId,
        'calendarEvent',
        eventId
    ],
    instance: (worldId, instanceId) => ['instance', worldId, instanceId],
    worldsByUser: ({
        userId,
        n = 50,
        offset = 0,
        sort = '',
        order = '',
        user = '',
        releaseStatus = '',
        option = ''
    } = {}) => [
        'worlds',
        'user',
        userId,
        {
            n: Number(n),
            offset: Number(offset),
            sort: String(sort || ''),
            order: String(order || ''),
            user: String(user || ''),
            releaseStatus: String(releaseStatus || ''),
            option: String(option || '')
        }
    ],
    friends: ({ offline = false, n = 50, offset = 0 } = {}) => [
        'friends',
        {
            offline: Boolean(offline),
            n: Number(n),
            offset: Number(offset)
        }
    ],
    favoriteLimits: () => ['favorite', 'limits'],
    favorites: ({ n = 300, offset = 0 } = {}) => [
        'favorite',
        'items',
        {
            n: Number(n),
            offset: Number(offset)
        }
    ],
    favoriteGroups: ({ n = 50, offset = 0, type = '' } = {}) => [
        'favorite',
        'groups',
        {
            n: Number(n),
            offset: Number(offset),
            type: String(type || '')
        }
    ],
    favoriteWorlds: ({ n = 300, offset = 0, ownerId = '', userId = '', tag = '' } = {}) => [
        'favorite',
        'worlds',
        {
            n: Number(n),
            offset: Number(offset),
            ownerId: String(ownerId || ''),
            userId: String(userId || ''),
            tag: String(tag || '')
        }
    ],
    favoriteAvatars: ({ n = 300, offset = 0, tag = '', ownerId = '', userId = '' } = {}) => [
        'favorite',
        'avatars',
        {
            n: Number(n),
            offset: Number(offset),
            tag: String(tag || ''),
            ownerId: String(ownerId || ''),
            userId: String(userId || '')
        }
    ],
    galleryFiles: ({ tag = '', n = 100 } = {}) => [
        'gallery',
        'files',
        {
            tag: String(tag || ''),
            n: Number(n)
        }
    ],
    prints: ({ n = 100 } = {}) => [
        'gallery',
        'prints',
        {
            n: Number(n)
        }
    ],
    print: (printId) => ['gallery', 'print', printId],
    inventoryItems: ({ n = 100, offset = 0, order = 'newest', types = '' } = {}) => [
        'inventory',
        'items',
        {
            n: Number(n),
            offset: Number(offset),
            order: String(order || 'newest'),
            types: String(types || '')
        }
    ],
    userInventoryItem: ({ inventoryId, userId }) => [
        'inventory',
        'item',
        userId,
        inventoryId
    ],
    file: (fileId) => ['file', fileId]
});
