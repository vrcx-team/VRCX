// NexVR → VRChat-shaped payloads. The rest of the app was written against the
// VRChat API, so everything NexVR returns is reshaped here before it leaves the
// shim. Keep these pure: no stores, no requests.

import { NotificationType, PresenceStatus, SocialRank } from './realtimeSchema';

const PRESENCE_STATUS = {
    [PresenceStatus.ONLINE]: 'active',
    [PresenceStatus.JOIN_ME]: 'join me',
    [PresenceStatus.ASK_ME]: 'ask me',
    [PresenceStatus.DO_NOT_DISTURB]: 'busy',
    [PresenceStatus.OFFLINE]: 'offline'
};

const PREFERENCE_STATUS = {
    online: 'active',
    'join-me': 'join me',
    'ask-me': 'ask me',
    'do-not-disturb': 'busy',
    invisible: 'offline'
};

export const VRC_STATUS_TO_PREFERENCE = {
    active: 'online',
    'join me': 'join-me',
    'ask me': 'ask-me',
    busy: 'do-not-disturb',
    offline: 'invisible'
};

// NexVR's social rank rides along as a tag; computeTrustLevel shows it in
// place of VRChat's trust level.
export const RANK_TAG_PREFIX = 'nexvr_rank_';

const PLATFORMS = {
    pc: 'standalonewindows',
    android: 'android',
    linux: 'standalonelinux',
    mac: 'standaloneosx'
};

/**
 * @param {string | undefined} rank Social rank letter (E..S+)
 * @param {string[]} [tags]
 * @returns {string[]}
 */
function withRankTag(rank, tags = []) {
    return [
        ...tags.filter((tag) => !tag.startsWith('system_trust_') && !tag.startsWith(RANK_TAG_PREFIX)),
        `${RANK_TAG_PREFIX}${rank || 'E'}`
    ];
}

/**
 * Builds a VRChat-style location tag. Region and access go in the `~key(value)`
 * suffixes parseLocation already understands.
 *
 * @param {string} worldId
 * @param {string} instanceId
 * @param {{ region?: string; type?: string; owner?: string | null; group?: string | null }} [extra]
 * @returns {string}
 */
export function makeLocation(worldId, instanceId, extra = {}) {
    if (!worldId || !instanceId) {
        return worldId || '';
    }
    let tag = `${worldId}:${instanceId}`;
    const owner = extra.owner || '';
    switch (extra.type) {
        case 'private':
            tag += `~private(${owner})`;
            break;
        case 'friends-only':
        case 'favourite-friends-only':
            tag += `~friends(${owner})`;
            break;
        case 'friends-of-friends':
        case 'hidden':
            tag += `~hidden(${owner})`;
            break;
        case 'group-private':
            tag += `~group(${extra.group})~groupAccessType(members)`;
            break;
        case 'group-plus':
            tag += `~group(${extra.group})~groupAccessType(plus)`;
            break;
        case 'group-public':
            tag += `~group(${extra.group})~groupAccessType(public)`;
            break;
        default:
            break;
    }
    const region = normalizeRegion(extra.region);
    if (region) {
        tag += `~region(${region})`;
    }
    return tag;
}

// Codes with a flag in styles/flags.css
const FLAG_REGIONS = new Set(
    'us usw use ca eu jp kr ru es pt cn de fr se nl pl dk no it th fi hu cz tr ae ro vn ua gb tw mt id hr be bg cy et ph lv lt sk nz au my'.split(
        ' '
    )
);

/** @type {[RegExp, string][]} */
const REGION_ALIASES = [
    [/^(us|na)[-_ ]?(west|w)/, 'usw'],
    [/^(us|na)[-_ ]?(east|e)/, 'use'],
    [/^(us|na)/, 'us'],
    [/^(eu|europe)/, 'eu'],
    [/^(jp|japan|tokyo|ap[-_ ]?northeast)/, 'jp'],
    [/^(kr|korea|seoul)/, 'kr'],
    [/^(au|oce|oceania|sydney)/, 'au'],
    [/^(uk|london)/, 'gb'],
    [/^(fra|frankfurt)/, 'de'],
    [/^(hel|helsinki)/, 'fi'],
    [/^(ams|amsterdam)/, 'nl']
];

/**
 * NexVR names regions after its server clusters; VRCX picks a flag by
 * VRChat's short region codes. Codes with no match pass through and show the
 * "unknown" flag.
 *
 * @param {string | undefined} region
 * @returns {string}
 */
export function normalizeRegion(region) {
    const value = String(region || '')
        .trim()
        .toLowerCase();
    if (!value || FLAG_REGIONS.has(value)) {
        return value;
    }
    for (const [pattern, code] of REGION_ALIASES) {
        if (pattern.test(value)) {
            return code;
        }
    }
    const prefix = value.slice(0, 2);
    return FLAG_REGIONS.has(prefix) && /^[a-z]{2}([-_ \d]|$)/.test(value) ? prefix : value;
}

/**
 * The NexVR instance id is the part of a location tag between ':' and the
 * first '~'.
 *
 * @param {string} location
 * @returns {string}
 */
export function instanceIdFromLocation(location) {
    const tag = String(location || '');
    const sep = tag.indexOf(':');
    const rest = sep >= 0 ? tag.slice(sep + 1) : tag;
    return rest.split('~')[0];
}

/**
 * Masks an email address the way VRChat's obfuscatedEmail does, keeping only
 * the first letter of the name and of the domain, e.g. i****@v****.xyz.
 *
 * @param {string | null | undefined} email
 * @returns {string}
 */
export function maskEmail(email) {
    const [name, domain] = String(email || '').split('@');
    if (!name || !domain) {
        return '';
    }
    const dot = domain.lastIndexOf('.');
    const host = dot > 0 ? domain.slice(0, dot) : domain;
    const tld = dot > 0 ? domain.slice(dot) : '';
    return `${name[0]}****@${host[0]}****${tld}`;
}

/**
 * @param {any} user NexVR public user, or the authenticated user
 * @returns {object} VRChat-style user fields shared by every user shape
 */
function baseUser(user) {
    const image = user.profileImageUrl || '';
    return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        bio: user.bio || '',
        bioLinks: [],
        pronouns: user.pronouns || '',
        statusDescription: user.statusText || '',
        // VRCX reads spoken languages from VRChat's language_xxx tags
        tags: [...withRankTag(user.socialRank, user.tags), ...(user.languages || []).map((code) => `language_${code}`)],
        currentAvatarImageUrl: image,
        currentAvatarThumbnailImageUrl: image,
        profilePicOverride: image,
        profilePicOverrideThumbnail: image,
        userIcon: image,
        bannerUrl: user.bannerImageUrl || '',
        // staff shows through NexVR's own badges, not VRChat's "VRChat Team" tag
        developerType: 'none',
        ageVerified: Boolean(user.ageVerification),
        ageVerificationStatus: user.ageBand || '',
        badges: [],
        last_platform: 'standalonewindows',
        // NexVR-only fields, kept for anything that wants the original values
        $nexvr: {
            socialRank: user.socialRank || 'E',
            languages: user.languages || [],
            badges: user.badges || []
        }
    };
}

/**
 * @param {any} user NexVR public user profile
 * @returns {object} VRChat PublicProfile (the bio and large picture of a user dialog)
 */
export function toVrcPublicProfile(user) {
    return {
        id: user.id,
        displayName: user.displayName || user.username,
        bio: user.bio || '',
        bioLinks: [],
        pronouns: user.pronouns || '',
        iconUrl: user.profileImageUrl || '',
        bannerUrl: user.bannerImageUrl || '',
        backgroundType: 'none',
        badges: [],
        hasVrcPlus: false,
        isEconomyCreator: false
    };
}

/**
 * @param {any} presence FriendPresence from the realtime socket
 * @returns {{ state: string; status: string; location: string; worldId: string; instanceId: string }}
 */
export function presenceState(presence) {
    const status = PRESENCE_STATUS[presence.status] ?? 'offline';
    if (status === 'offline') {
        return { state: 'offline', status, location: 'offline', worldId: 'offline', instanceId: 'offline' };
    }
    const loc = presence.location;
    if (!loc?.instanceId) {
        // on the platform, not in an instance: VRChat calls this "active"
        return { state: 'active', status, location: 'offline', worldId: 'offline', instanceId: 'offline' };
    }
    if (!loc.worldId || loc.worldId === 'private' || loc.instanceId === 'private') {
        // the friend is in an instance they hide; NexVR sends 'private' for both ids
        return { state: 'online', status, location: 'private', worldId: 'private', instanceId: 'private' };
    }
    return {
        state: 'online',
        status,
        location: makeLocation(loc.worldId, loc.instanceId, { region: loc.region }),
        worldId: loc.worldId,
        instanceId: loc.instanceId
    };
}

/**
 * @param {any} presence FriendPresence from the realtime socket
 * @param {string[]} [cachedTags] Tags already known for the user; presence
 *   frames carry no languages, so their language_ tags are kept
 * @returns {object} VRChat LimitedUserFriend
 */
export function presenceToUser(presence, cachedTags = []) {
    const user = baseUser({
        id: presence.userId,
        username: presence.username,
        displayName: presence.displayName,
        statusText: presence.statusText,
        pronouns: presence.pronouns,
        profileImageUrl: presence.profileImageUrl,
        bannerImageUrl: presence.bannerImageUrl,
        tags: presence.tags,
        socialRank: SocialRank[presence.socialRank] ?? 'E'
    });
    // presence frames carry no bio, badges or languages; leave them out so
    // what a profile fetch filled in survives
    delete user.bio;
    delete user.bioLinks;
    delete user.$nexvr;
    user.tags.push(...cachedTags.filter((tag) => tag.startsWith('language_')));
    const { state, status, location } = presenceState(presence);
    return {
        ...user,
        isFriend: true,
        friendKey: '',
        state,
        status,
        location,
        platform: state === 'online' ? 'standalonewindows' : '',
        $friendsSince: presence.friendsSince || ''
    };
}

/**
 * @param {any} user NexVR public user profile
 * @param {any} [presence] FriendPresence, when the user is a friend
 * @returns {object} VRChat User
 */
export function toVrcUser(user, presence) {
    const ref = {
        ...baseUser(user),
        isFriend: Boolean(presence),
        friendKey: '',
        state: '',
        status: '',
        location: '',
        worldId: '',
        instanceId: '',
        date_joined: '',
        last_login: '',
        last_activity: ''
    };
    if (presence) {
        Object.assign(ref, presenceState(presence), { $friendsSince: presence.friendsSince || '' });
    }
    return ref;
}

/**
 * @param {any} me NexVR /auth/me payload
 * @param {Map<string, any>} friends FriendPresence by id, from the realtime socket
 * @returns {object} VRChat CurrentUser
 */
export function toVrcCurrentUser(me, friends) {
    const onlineFriends = [];
    const activeFriends = [];
    const offlineFriends = [];
    let self = null;
    for (const [id, presence] of friends) {
        if (id === me.id) {
            self = presence;
            continue;
        }
        const { state } = presenceState(presence);
        if (state === 'online') {
            onlineFriends.push(id);
        } else if (state === 'active') {
            activeFriends.push(id);
        } else {
            offlineFriends.push(id);
        }
    }
    const location = self ? presenceState(self) : null;
    const inInstance = location?.state === 'online';
    // VRChat lists friends oldest first, and VRCX numbers them in that order
    // (the "friend number"); NexVR's friendsSince gives the same order
    const friendsByAge = [...friends.values()]
        .filter((presence) => presence.userId !== me.id)
        .sort((a, b) => (a.friendsSince || '').localeCompare(b.friendsSince || '') || a.userId.localeCompare(b.userId))
        .map((presence) => presence.userId);
    return {
        ...baseUser(me),
        emailVerified: me.emailVerified,
        hasEmail: Boolean(me.primaryEmail),
        obfuscatedEmail: maskEmail(me.primaryEmail),
        status: PREFERENCE_STATUS[me.userPreferenceStatus] ?? 'active',
        state: 'online',
        friends: friendsByAge,
        onlineFriends,
        activeFriends,
        offlineFriends,
        friendKey: '',
        currentAvatar: '',
        homeLocation: '',
        twoFactorAuthEnabled: false,
        acceptedTOSVersion: 0,
        acceptedPrivacyVersion: 0,
        isFriend: false,
        date_joined: '',
        last_login: '',
        last_activity: '',
        location: inInstance ? location.location : '',
        presence: {
            world: inInstance ? location.worldId : '',
            // VRChat's presence.instance carries the ~region(...) suffix VRCX reads the flag from
            instance: inInstance ? location.location.slice(location.location.indexOf(':') + 1) : '',
            travelingToWorld: '',
            travelingToInstance: '',
            groups: [],
            platform: 'standalonewindows',
            status: PREFERENCE_STATUS[me.userPreferenceStatus] ?? 'active'
        },
        $nexvr: {
            ...baseUser(me).$nexvr,
            permissions: me.permissions || [],
            restricted: Boolean(me.restricted),
            displayNameChangeableAt: me.displayNameChangeableAt || null
        }
    };
}

/**
 * @param {any} world NexVR world
 * @param {string} [authorName]
 * @returns {object} VRChat World
 */
export function toVrcWorld(world, authorName = '') {
    const versions = world.versions || [];
    const latest = versions.find((v) => v.versionNumber === world.currentVersion) || versions[versions.length - 1];
    const stats = world.stats || {};
    const image = world.images?.primary || '';
    const updatedAt = latest?.package?.uploadedAt || '';
    return {
        id: world._id,
        name: world.name,
        description: world.description || '',
        authorId: world.owner,
        authorName,
        imageUrl: image,
        thumbnailImageUrl: image,
        $secondaryImages: world.images?.secondary || [],
        capacity: 0,
        recommendedCapacity: 0,
        occupants: (stats.publicPlayers || 0) + (stats.privatePlayers || 0),
        publicOccupants: stats.publicPlayers || 0,
        privateOccupants: stats.privatePlayers || 0,
        popularity: Math.round(stats.popularity || 0),
        heat: 0,
        favorites: 0,
        visits: stats.uniqueVisitors || 0,
        tags: world.tags || [],
        releaseStatus: world.visibility === 'public' ? 'public' : 'private',
        created_at: updatedAt,
        updated_at: updatedAt,
        publicationDate: '',
        labsPublicationDate: '',
        version: versions.length,
        instances: [],
        unityPackages: (world.platforms || []).map((platform) => ({
            id: `${world._id}_${platform}`,
            platform: PLATFORMS[platform] || platform,
            assetVersion: 4,
            unityVersion: '',
            created_at: updatedAt,
            assetUrl: '',
            variant: 'standard'
        }))
    };
}

const INSTANCE_TYPES = {
    public: 'public',
    'friends-of-friends': 'hidden',
    hidden: 'hidden',
    'friends-only': 'friends',
    'favourite-friends-only': 'friends',
    private: 'private',
    'group-private': 'group',
    'group-plus': 'group',
    'group-public': 'group'
};

const GROUP_ACCESS = {
    'group-private': 'members',
    'group-plus': 'plus',
    'group-public': 'public'
};

/**
 * @param {any} instance NexVR instance
 * @returns {object} VRChat Instance
 */
export function toVrcInstance(instance) {
    const world = typeof instance.world === 'object' && instance.world ? instance.world : null;
    const worldId = world ? world._id : instance.world;
    const location = makeLocation(worldId, instance._id, {
        region: instance.region,
        type: instance.type,
        owner: instance.creator,
        group: instance.group
    });
    return {
        id: location,
        location,
        instanceId: location.slice(location.indexOf(':') + 1),
        worldId,
        name: instance.displayName || instance._id,
        displayName: instance.displayName || null,
        type: INSTANCE_TYPES[instance.type] || 'public',
        groupAccessType: GROUP_ACCESS[instance.type],
        region: normalizeRegion(instance.region),
        photonRegion: normalizeRegion(instance.region),
        ownerId: instance.group || instance.creator || '',
        n_users: instance.playerCount || 0,
        userCount: instance.playerCount || 0,
        capacity: instance.maxPlayers || 0,
        recommendedCapacity: instance.maxPlayers || 0,
        platforms: {},
        users: [],
        active: instance.status !== 'closed' && !instance.closedAt,
        full: instance.maxPlayers > 0 && instance.playerCount >= instance.maxPlayers,
        closedAt: instance.closedAt ? new Date(instance.closedAt).toISOString() : null,
        hardClose: null,
        queueEnabled: false,
        queueSize: 0,
        strict: false,
        ageGate: instance.contentMode === 'nsfw' || instance.contentMode === 'nsfw_plus',
        world: world ? toVrcWorld(world) : undefined,
        $nexvr: {
            contentMode: instance.contentMode,
            ephemeral: Boolean(instance.ephemeral),
            closesAt: instance.closesAt || null
        }
    };
}

const JOIN_STATES = {
    'free-join': 'open',
    'request-join': 'request',
    'invite-only': 'invite'
};

/**
 * @param {any} group NexVR group
 * @returns {object} VRChat Group
 */
export function toVrcGroup(group) {
    return {
        id: group.id,
        groupId: group.id,
        name: group.name,
        shortCode: '',
        discriminator: '',
        description: group.description || '',
        rules: '',
        iconUrl: group.iconUrl || '',
        bannerUrl: group.bannerUrl || '',
        ownerId: group.owner,
        memberCount: group.memberCount || 0,
        onlineMemberCount: 0,
        tags: group.tags || [],
        links: [],
        languages: [],
        galleries: [],
        privacy: 'default',
        joinState: JOIN_STATES[group.joinPolicy?.baseSetting] || 'open',
        createdAt: group.createdAt,
        roles: (group.roles || []).map((role, order) => ({
            id: role.id,
            groupId: group.id,
            name: role.name,
            description: '',
            permissions: role.permissions || [],
            order,
            isSelfAssignable: false,
            isManagementRole: false
        })),
        isRepresenting: false,
        mutualGroup: false,
        memberVisibility: 'visible',
        $nexvr: {
            motto: group.motto || '',
            contentMode: group.contentMode,
            coalition: group.coalition || null,
            coalitionName: group.coalitionName || null,
            socialRank: group.socialRank,
            secondaryImageUrls: group.secondaryImageUrls || []
        }
    };
}

const MEMBERSHIP_STATUS = {
    active: 'member',
    pending: 'requested',
    invited: 'invited'
};

const MEMBER_VISIBILITY = {
    public: 'visible',
    'friends-only': 'friends',
    hidden: 'hidden'
};

/**
 * @param {string | null | undefined} status NexVR membership status
 * @returns {string} VRChat membershipStatus ('inactive' when not a member)
 */
export function toVrcMembershipStatus(status) {
    return MEMBERSHIP_STATUS[status] ?? 'inactive';
}

/**
 * @param {string} groupId
 * @param {any} member NexVR group member (from /groups/:id/members)
 * @returns {object} VRChat GroupMember
 */
export function toVrcGroupMember(groupId, member) {
    const image = member.user.profileImageUrl || '';
    return {
        id: `${groupId}:${member.user.id}`,
        groupId,
        userId: member.user.id,
        user: {
            id: member.user.id,
            displayName: member.user.displayName || member.user.username,
            iconUrl: image,
            thumbnailUrl: image,
            currentAvatarThumbnailImageUrl: image
        },
        roleIds: (member.roles || []).map((role) => role.roleId),
        membershipStatus: toVrcMembershipStatus(member.status),
        visibility: MEMBER_VISIBILITY[member.membershipVisibility] ?? 'visible',
        joinedAt: member.joinedAt || null,
        isRepresenting: false,
        isSubscribedToAnnouncements: true,
        managerNotes: ''
    };
}

// NexVR permission → the VRChat ones VRCX checks. Only permissions whose VRCX
// features run on NexVR data are mapped; the rest (bans, kicks, roles, invites)
// would light up tools that call VRChat-only endpoints.
const PERMISSION_MAP = {
    'manage-members': ['group-members-viewall', 'group-members-manage']
};

/**
 * @param {string[]} permissions NexVR permissions
 * @returns {string[]} The NexVR names plus their VRChat equivalents
 */
export function toVrcGroupPermissions(permissions = []) {
    return [...new Set([...permissions, ...permissions.flatMap((permission) => PERMISSION_MAP[permission] ?? [])])];
}

/**
 * The caller's own membership as VRChat's group.myMember.
 *
 * @param {string} groupId
 * @param {string} userId The caller
 * @param {any} membership NexVR /groups/:id/membership
 * @param {any} [listed] The caller's entry from the member list, for the join date
 * @returns {object | null}
 */
export function toVrcMyMember(groupId, userId, membership, listed) {
    if (!membership?.status) {
        return null;
    }
    return {
        id: `${groupId}:${userId}`,
        groupId,
        userId,
        roleIds: membership.roles || [],
        membershipStatus: toVrcMembershipStatus(membership.status),
        visibility: MEMBER_VISIBILITY[membership.membershipVisibility] ?? 'visible',
        isSubscribedToAnnouncements: !membership.muted,
        isSubscribedToEventAnnouncements: !membership.muted,
        isRepresenting: false,
        joinedAt: listed?.joinedAt || null,
        permissions: toVrcGroupPermissions(membership.permissions),
        bannedAt: null
    };
}

/**
 * NexVR rules are markdown plus preset flags; VRCX shows one text block.
 *
 * @param {any} rules NexVR /groups/:id/rules
 * @returns {string}
 */
export function toVrcGroupRules(rules) {
    const flags = (rules?.flags || []).map((flag) => {
        const text = flag.replace(/_/g, ' ');
        return `• ${text.charAt(0).toUpperCase()}${text.slice(1)}`;
    });
    return [rules?.markdown?.trim(), flags.join('\n')].filter(Boolean).join('\n\n');
}

/**
 * @param {any} announcement NexVR group announcement
 * @returns {object} VRChat GroupPost
 */
export function toVrcGroupPost(announcement) {
    return {
        id: announcement.id,
        groupId: announcement.groupId,
        authorId: announcement.author?.id ?? '',
        editorId: null,
        title: announcement.title || '',
        text: announcement.body || '',
        imageUrl: '',
        imageId: null,
        roleIds: [],
        visibility: 'group',
        createdAt: announcement.createdAt,
        updatedAt: announcement.createdAt
    };
}

const NOTIFICATION_TYPES = {
    [NotificationType.INVITE]: 'invite',
    [NotificationType.FRIEND_REQUEST]: 'friendRequest',
    [NotificationType.INVITE_RESPONSE]: 'inviteResponse',
    [NotificationType.INVITE_REQUEST]: 'requestInvite',
    [NotificationType.FRIEND_REQUEST_RESPONSE]: 'message',
    [NotificationType.GROUP_INVITE]: 'message',
    [NotificationType.GROUP_JOIN_REQUEST]: 'message',
    [NotificationType.GROUP_JOIN_REQUEST_RESPONSE]: 'message',
    [NotificationType.COALITION_INVITE]: 'message',
    [NotificationType.COALITION_INVITE_RESPONSE]: 'message',
    [NotificationType.CALENDAR_EVENT_RSVP]: 'message',
    [NotificationType.CALENDAR_EVENT_UPDATED]: 'message',
    [NotificationType.CALENDAR_EVENT_CANCELLED]: 'message',
    [NotificationType.INSTANCE_WARNING]: 'message',
    [NotificationType.MODERATION_NOTICE]: 'message',
    [NotificationType.CASHOUT_RESOLVED]: 'message'
};

/**
 * @param {any} notification Notification from the realtime socket
 * @returns {object} VRChat Notification (v1)
 */
export function toVrcNotification(notification) {
    const data = { ...(notification.data || {}) };
    const details = { ...data };
    const worldId = data.worldId || data.world;
    const instanceId = data.instanceId || data.instance || data.toInstance;
    if (worldId && instanceId) {
        details.worldId = makeLocation(worldId, instanceId);
        details.worldName = data.worldName || data.instanceName || '';
    }
    const message = [notification.title, notification.message].filter(Boolean).join(': ');
    return {
        id: notification.id,
        type: NOTIFICATION_TYPES[notification.type] || 'message',
        senderUserId: notification.from,
        senderUsername: data.fromDisplayName || data.displayName || data.fromUsername || '',
        receiverUserId: notification.to,
        message,
        details,
        seen: false,
        created_at: notification.createdAt || new Date().toISOString(),
        $nexvrType: notification.type
    };
}

/**
 * @param {any} moderation NexVR moderation entry
 * @returns {object} VRChat PlayerModeration
 */
export function toVrcPlayerModeration(moderation) {
    const types = {
        block: 'block',
        mute: 'mute',
        hide_avatar: 'hideAvatar',
        show_avatar: 'showAvatar'
    };
    return {
        id: moderation.id,
        type: types[moderation.action] || moderation.action,
        sourceUserId: moderation.localUser || '',
        targetUserId: moderation.targetUser,
        targetDisplayName: '',
        created: moderation.createdAt
    };
}
