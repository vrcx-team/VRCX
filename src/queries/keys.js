export const queryKeys = Object.freeze({
    user: (userId) => ['user', userId],
    avatar: (avatarId) => ['avatar', avatarId],
    world: (worldId) => ['world', worldId],
    group: (groupId, includeRoles = false) => [
        'group',
        groupId,
        Boolean(includeRoles)
    ],
    groupMember: ({ groupId, userId } = {}) => [
        'group',
        groupId,
        'member',
        userId
    ],
    groupMembers: ({
        groupId,
        n = 100,
        offset = 0,
        sort = '',
        roleId = ''
    } = {}) => [
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
    avatarGallery: (avatarId) => ['avatar', avatarId, 'gallery'],
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
    favoriteLimits: () => ['favorite', 'limits'],
    userInventoryItem: ({ inventoryId, userId }) => [
        'inventory',
        'item',
        userId,
        inventoryId
    ],
    fileAnalysis: ({ fileId, version, variant } = {}) => [
        'analysis',
        fileId,
        Number(version),
        String(variant || '')
    ],
    worldPersistData: (worldId) => ['world', worldId, 'persistData'],
    mutualCounts: (userId) => ['user', userId, 'mutualCounts'],
    visits: () => ['visits'],
    file: (fileId) => ['file', fileId],
    avatarStyles: () => ['avatar', 'styles'],
    representedGroup: (userId) => ['user', userId, 'representedGroup'],
    vrchatCredits: () => ['credits']
});
