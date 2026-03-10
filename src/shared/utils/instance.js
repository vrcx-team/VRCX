/**
 *
 * @param {string} instanceId
 * @returns
 */
function isRealInstance(instanceId) {
    if (!instanceId) {
        return false;
    }
    switch (instanceId) {
        case ':':
        case 'offline':
        case 'offline:offline':
        case 'private':
        case 'private:private':
        case 'traveling':
        case 'traveling:traveling':
            return false;
    }
    if (instanceId.startsWith('local')) {
        return false;
    }
    return true;
}

/**
 *
 * @param {object} instance
 * @returns {string}
 */
function getLaunchURL(instance) {
    const L = instance;
    if (L.instanceId) {
        if (L.shortName) {
            return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
                L.worldId
            )}&instanceId=${encodeURIComponent(
                L.instanceId
            )}&shortName=${encodeURIComponent(L.shortName)}`;
        }
        return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
            L.worldId
        )}&instanceId=${encodeURIComponent(L.instanceId)}`;
    }
    return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
        L.worldId
    )}`;
}

const regionTagMap = {
    'US West': 'us',
    'US East': 'use',
    Europe: 'eu',
    Japan: 'jp'
};

/**
 * @param {object} opts
 * @param {string} opts.instanceName - Sanitised instance name segment
 * @param {string} opts.userId
 * @param {string} opts.accessType
 * @param {string} [opts.groupId]
 * @param {string} [opts.groupAccessType]
 * @param {string} opts.region - Display region name ('US West', 'US East', 'Europe', 'Japan')
 * @param {boolean} [opts.ageGate]
 * @param {boolean} [opts.strict]
 * @returns {string} instance tag, e.g. '12345~hidden(usr_xxx)~region(us)'
 */
function buildLegacyInstanceTag({
    instanceName,
    userId,
    accessType,
    groupId,
    groupAccessType,
    region,
    ageGate,
    strict
}) {
    const tags = [];

    if (instanceName) {
        tags.push(instanceName);
    }

    if (accessType !== 'public') {
        if (accessType === 'friends+') {
            tags.push(`~hidden(${userId})`);
        } else if (accessType === 'friends') {
            tags.push(`~friends(${userId})`);
        } else if (accessType === 'group') {
            tags.push(`~group(${groupId})`);
            tags.push(`~groupAccessType(${groupAccessType})`);
        } else {
            tags.push(`~private(${userId})`);
        }
        if (accessType === 'invite+') {
            tags.push('~canRequestInvite');
        }
    }

    if (accessType === 'group' && ageGate) {
        tags.push('~ageGate');
    }

    const regionCode = regionTagMap[region];
    if (regionCode) {
        tags.push(`~region(${regionCode})`);
    }

    if (strict && (accessType === 'invite' || accessType === 'friends')) {
        tags.push('~strict');
    }

    return tags.join('');
}

export { isRealInstance, getLaunchURL, buildLegacyInstanceTag };
