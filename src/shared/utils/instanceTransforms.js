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
