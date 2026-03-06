import { removeEmojis, replaceBioSymbols } from './base/string';

/**
 * Sanitize user JSON fields before applying to cache.
 * Applies replaceBioSymbols to statusDescription, bio, note;
 * removeEmojis to statusDescription;
 * strips robot avatar URL.
 * @param {object} json - Raw user API response
 * @param {string} robotUrl - The robot/default avatar URL to strip
 * @returns {object} The mutated json (same reference)
 */
export function sanitizeUserJson(json, robotUrl) {
    if (json.statusDescription) {
        json.statusDescription = replaceBioSymbols(json.statusDescription);
        json.statusDescription = removeEmojis(json.statusDescription);
    }
    if (json.bio) {
        json.bio = replaceBioSymbols(json.bio);
    }
    if (json.note) {
        json.note = replaceBioSymbols(json.note);
    }
    if (robotUrl && json.currentAvatarImageUrl === robotUrl) {
        delete json.currentAvatarImageUrl;
        delete json.currentAvatarThumbnailImageUrl;
    }
    return json;
}

/**
 * Sanitize arbitrary entity JSON fields via replaceBioSymbols.
 * @param {object} json - Raw API response
 * @param {string[]} fields - Field names to sanitize
 * @returns {object} The mutated json
 */
export function sanitizeEntityJson(json, fields) {
    for (const field of fields) {
        if (json[field]) {
            json[field] = replaceBioSymbols(json[field]);
        }
    }
    return json;
}

/**
 * Compute trust level, moderator status, and troll status from user tags.
 * Pure function — no store dependencies.
 * @param {string[]} tags - User tags array
 * @param {string} developerType - User's developerType field
 * @returns {{
 *   trustLevel: string,
 *   trustClass: string,
 *   trustSortNum: number,
 *   isModerator: boolean,
 *   isTroll: boolean,
 *   isProbableTroll: boolean,
 *   trustColorKey: string
 * }}
 */
export function computeTrustLevel(tags, developerType) {
    let isModerator = Boolean(developerType) && developerType !== 'none';
    let isTroll = false;
    let isProbableTroll = false;
    let trustLevel = 'Visitor';
    let trustClass = 'x-tag-untrusted';
    let trustColorKey = 'untrusted';
    let trustSortNum = 1;

    if (tags.includes('admin_moderator')) {
        isModerator = true;
    }
    if (tags.includes('system_troll')) {
        isTroll = true;
    }
    if (tags.includes('system_probable_troll') && !isTroll) {
        isProbableTroll = true;
    }

    if (tags.includes('system_trust_veteran')) {
        trustLevel = 'Trusted User';
        trustClass = 'x-tag-veteran';
        trustColorKey = 'veteran';
        trustSortNum = 5;
    } else if (tags.includes('system_trust_trusted')) {
        trustLevel = 'Known User';
        trustClass = 'x-tag-trusted';
        trustColorKey = 'trusted';
        trustSortNum = 4;
    } else if (tags.includes('system_trust_known')) {
        trustLevel = 'User';
        trustClass = 'x-tag-known';
        trustColorKey = 'known';
        trustSortNum = 3;
    } else if (tags.includes('system_trust_basic')) {
        trustLevel = 'New User';
        trustClass = 'x-tag-basic';
        trustColorKey = 'basic';
        trustSortNum = 2;
    }

    if (isTroll || isProbableTroll) {
        trustColorKey = 'troll';
        trustSortNum += 0.1;
    }
    if (isModerator) {
        trustColorKey = 'vip';
        trustSortNum += 0.3;
    }

    return {
        trustLevel,
        trustClass,
        trustSortNum,
        isModerator,
        isTroll,
        isProbableTroll,
        trustColorKey
    };
}

/**
 * Determine the effective user platform.
 * @param {string} platform - Current platform
 * @param {string} lastPlatform - Last known platform
 * @returns {string} Resolved platform
 */
export function computeUserPlatform(platform, lastPlatform) {
    if (platform && platform !== 'offline' && platform !== 'web') {
        return platform;
    }
    return lastPlatform || '';
}

/**
 * Compute which content settings are disabled for an instance.
 * @param {object} contentSettings - The instance's contentSettings object
 * @param {string[]} settingsList - List of all possible content setting keys
 * @returns {string[]} Array of disabled setting keys
 */
export function computeDisabledContentSettings(contentSettings, settingsList) {
    const disabled = [];
    if (!contentSettings || Object.keys(contentSettings).length === 0) {
        return disabled;
    }
    for (const setting of settingsList) {
        if (
            typeof contentSettings[setting] === 'undefined' ||
            contentSettings[setting] === true
        ) {
            continue;
        }
        disabled.push(setting);
    }
    return disabled;
}

/**
 * Detect which properties changed between an existing ref and incoming JSON.
 * Compares primitives directly; arrays via arraysMatchFn.
 * @param {object} ref - The existing cached object
 * @param {object} json - The incoming update
 * @param {(a: any[], b: any[]) => boolean} arraysMatchFn - Function to compare arrays
 * @returns {{ hasPropChanged: boolean, changedProps: object }}
 */
export function diffObjectProps(ref, json, arraysMatchFn) {
    const changedProps = {};
    let hasPropChanged = false;

    // Only compare primitive values
    for (const prop in ref) {
        if (typeof json[prop] === 'undefined') {
            continue;
        }
        if (ref[prop] === null || typeof ref[prop] !== 'object') {
            changedProps[prop] = true;
        }
    }

    // Check json props against ref (including array comparison)
    for (const prop in json) {
        if (typeof ref[prop] === 'undefined') {
            continue;
        }
        if (Array.isArray(json[prop]) && Array.isArray(ref[prop])) {
            if (!arraysMatchFn(json[prop], ref[prop])) {
                changedProps[prop] = true;
            }
        } else if (json[prop] === null || typeof json[prop] !== 'object') {
            changedProps[prop] = true;
        }
    }

    // Resolve actual changes
    for (const prop in changedProps) {
        const asIs = ref[prop];
        const toBe = json[prop];
        if (asIs === toBe) {
            delete changedProps[prop];
        } else {
            hasPropChanged = true;
            changedProps[prop] = [toBe, asIs];
        }
    }

    return { hasPropChanged, changedProps };
}

/**
 * Create a default user ref object with all expected fields.
 * Returns a plain object (caller wraps in reactive() if needed).
 * @param {object} json - API response to merge
 * @returns {object} Default user object with json spread on top
 */
export function createDefaultUserRef(json) {
    return {
        ageVerificationStatus: '',
        ageVerified: false,
        allowAvatarCopying: false,
        badges: [],
        bio: '',
        bioLinks: [],
        currentAvatarImageUrl: '',
        currentAvatarTags: [],
        currentAvatarThumbnailImageUrl: '',
        date_joined: '',
        developerType: '',
        discordId: '',
        displayName: '',
        friendKey: '',
        friendRequestStatus: '',
        id: '',
        instanceId: '',
        isFriend: false,
        last_activity: '',
        last_login: '',
        last_mobile: null,
        last_platform: '',
        location: '',
        platform: '',
        note: null,
        profilePicOverride: '',
        profilePicOverrideThumbnail: '',
        pronouns: '',
        state: '',
        status: '',
        statusDescription: '',
        tags: [],
        travelingToInstance: '',
        travelingToLocation: '',
        travelingToWorld: '',
        userIcon: '',
        worldId: '',
        // only in bulk request
        fallbackAvatar: '',
        // VRCX
        $location: {},
        $location_at: Date.now(),
        $online_for: Date.now(),
        $travelingToTime: Date.now(),
        $offline_for: null,
        $active_for: Date.now(),
        $isVRCPlus: false,
        $isModerator: false,
        $isTroll: false,
        $isProbableTroll: false,
        $trustLevel: 'Visitor',
        $trustClass: 'x-tag-untrusted',
        $userColour: '',
        $trustSortNum: 1,
        $languages: [],
        $joinCount: 0,
        $timeSpent: 0,
        $lastSeen: '',
        $mutualCount: 0,
        $nickName: '',
        $previousLocation: '',
        $customTag: '',
        $customTagColour: '',
        $friendNumber: 0,
        $platform: '',
        $moderations: {},
        //
        ...json
    };
}

/**
 * Create a default world ref object.
 * @param {object} json - API response to merge
 * @returns {object}
 */
export function createDefaultWorldRef(json) {
    return {
        id: '',
        name: '',
        description: '',
        defaultContentSettings: {},
        authorId: '',
        authorName: '',
        capacity: 0,
        recommendedCapacity: 0,
        tags: [],
        releaseStatus: '',
        imageUrl: '',
        thumbnailImageUrl: '',
        assetUrl: '',
        assetUrlObject: {},
        pluginUrl: '',
        pluginUrlObject: {},
        unityPackageUrl: '',
        unityPackageUrlObject: {},
        unityPackages: [],
        version: 0,
        favorites: 0,
        created_at: '',
        updated_at: '',
        publicationDate: '',
        labsPublicationDate: '',
        visits: 0,
        popularity: 0,
        heat: 0,
        publicOccupants: 0,
        privateOccupants: 0,
        occupants: 0,
        instances: [],
        featured: false,
        organization: '',
        previewYoutubeId: '',
        // VRCX
        $isLabs: false,
        //
        ...json
    };
}

/**
 * Create a default avatar ref object.
 * @param {object} json - API response to merge
 * @returns {object}
 */
export function createDefaultAvatarRef(json) {
    return {
        acknowledgements: '',
        authorId: '',
        authorName: '',
        created_at: '',
        description: '',
        featured: false,
        highestPrice: null,
        id: '',
        imageUrl: '',
        listingDate: null,
        lock: false,
        lowestPrice: null,
        name: '',
        pendingUpload: false,
        performance: {},
        productId: null,
        publishedListings: [],
        releaseStatus: '',
        searchable: false,
        styles: [],
        tags: [],
        thumbnailImageUrl: '',
        unityPackageUrl: '',
        unityPackageUrlObject: {},
        unityPackages: [],
        updated_at: '',
        version: 0,
        ...json
    };
}

/**
 * Create a default group ref object.
 * @param {object} json - API response to merge
 * @returns {object}
 */
export function createDefaultGroupRef(json) {
    return {
        id: '',
        name: '',
        shortCode: '',
        description: '',
        bannerId: '',
        bannerUrl: '',
        createdAt: '',
        discriminator: '',
        galleries: [],
        iconId: '',
        iconUrl: '',
        isVerified: false,
        joinState: '',
        languages: [],
        links: [],
        memberCount: 0,
        memberCountSyncedAt: '',
        membershipStatus: '',
        onlineMemberCount: 0,
        ownerId: '',
        privacy: '',
        rules: null,
        tags: [],
        // in group
        initialRoleIds: [],
        myMember: {
            bannedAt: null,
            groupId: '',
            has2FA: false,
            id: '',
            isRepresenting: false,
            isSubscribedToAnnouncements: false,
            joinedAt: '',
            managerNotes: '',
            membershipStatus: '',
            permissions: [],
            roleIds: [],
            userId: '',
            visibility: '',
            _created_at: '',
            _id: '',
            _updated_at: ''
        },
        updatedAt: '',
        // includeRoles: true
        roles: [],
        // group list
        $memberId: '',
        groupId: '',
        isRepresenting: false,
        memberVisibility: false,
        mutualGroup: false,
        // VRCX
        $languages: [],
        ...json
    };
}

/**
 * Create a default instance ref object.
 * @param {object} json - API response to merge
 * @returns {object}
 */
export function createDefaultInstanceRef(json) {
    return {
        id: '',
        location: '',
        instanceId: '',
        name: '',
        worldId: '',
        type: '',
        ownerId: '',
        tags: [],
        active: false,
        full: false,
        n_users: 0,
        hasCapacityForYou: true, // not present depending on endpoint
        capacity: 0,
        recommendedCapacity: 0,
        userCount: 0,
        queueEnabled: false, // only present with group instance type
        queueSize: 0, // only present when queuing is enabled
        platforms: {},
        gameServerVersion: 0,
        hardClose: null, // boolean or null
        closedAt: null, // string or null
        secureName: '',
        shortName: '',
        world: {},
        users: [], // only present when you're the owner
        clientNumber: '',
        contentSettings: {},
        photonRegion: '',
        region: '',
        canRequestInvite: false,
        permanent: false,
        private: '', // part of instance tag
        hidden: '', // part of instance tag
        nonce: '', // only present when you're the owner
        strict: false, // deprecated
        displayName: null,
        groupAccessType: null, // only present with group instance type
        roleRestricted: false, // only present with group instance type
        instancePersistenceEnabled: null,
        playerPersistenceEnabled: null,
        ageGate: null,
        // VRCX
        $fetchedAt: '',
        $disabledContentSettings: [],
        ...json
    };
}

/**
 * Build a default favorite group ref from JSON data.
 * @param {object} json
 * @returns {object}
 */
export function createDefaultFavoriteGroupRef(json) {
    return {
        id: '',
        ownerId: '',
        ownerDisplayName: '',
        name: '',
        displayName: '',
        type: '',
        visibility: '',
        tags: [],
        ...json
    };
}

/**
 * Build a default cached favorite ref from JSON data.
 * Computes $groupKey from type and first tag.
 * @param {object} json
 * @returns {object}
 */
export function createDefaultFavoriteCachedRef(json) {
    const ref = {
        id: '',
        type: '',
        favoriteId: '',
        tags: [],
        // VRCX
        $groupKey: '',
        //
        ...json
    };
    ref.$groupKey = `${ref.type}:${String(ref.tags[0])}`;
    return ref;
}
