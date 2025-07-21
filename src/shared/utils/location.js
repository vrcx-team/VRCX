/**
 *
 * @param {string} location
 * @param {string} worldName
 * @param {string?} groupName
 * @returns {string}
 */
function displayLocation(location, worldName, groupName = '') {
    let text = worldName;
    const L = parseLocation(location);
    if (L.isOffline) {
        text = 'Offline';
    } else if (L.isPrivate) {
        text = 'Private';
    } else if (L.isTraveling) {
        text = 'Traveling';
    } else if (L.worldId) {
        if (groupName) {
            text = `${worldName} ${L.accessTypeName}(${groupName})`;
        } else if (L.instanceId) {
            text = `${worldName} ${L.accessTypeName}`;
        }
    }
    return text;
}

/**
 *
 * @param {string} tag
 * @returns
 */
function parseLocation(tag) {
    let _tag = String(tag || '');
    const ctx = {
        tag: _tag,
        isOffline: false,
        isPrivate: false,
        isTraveling: false,
        isRealInstance: false,
        worldId: '',
        instanceId: '',
        instanceName: '',
        accessType: '',
        accessTypeName: '',
        region: '',
        shortName: '',
        userId: null,
        hiddenId: null,
        privateId: null,
        friendsId: null,
        groupId: null,
        groupAccessType: null,
        canRequestInvite: false,
        strict: false,
        ageGate: false
    };
    if (_tag === 'offline' || _tag === 'offline:offline') {
        ctx.isOffline = true;
    } else if (_tag === 'private' || _tag === 'private:private') {
        ctx.isPrivate = true;
    } else if (_tag === 'traveling' || _tag === 'traveling:traveling') {
        ctx.isTraveling = true;
    } else if (tag && !_tag.startsWith('local')) {
        ctx.isRealInstance = true;
        const sep = _tag.indexOf(':');
        // technically not part of instance id, but might be there when coping id from url so why not support it
        const shortNameQualifier = '&shortName=';
        const shortNameIndex = _tag.indexOf(shortNameQualifier);
        if (shortNameIndex >= 0) {
            ctx.shortName = _tag.substr(
                shortNameIndex + shortNameQualifier.length
            );
            _tag = _tag.substr(0, shortNameIndex);
        }
        if (sep >= 0) {
            ctx.worldId = _tag.substr(0, sep);
            ctx.instanceId = _tag.substr(sep + 1);
            ctx.instanceId.split('~').forEach((s, i) => {
                if (i) {
                    const A = s.indexOf('(');
                    const Z = A >= 0 ? s.lastIndexOf(')') : -1;
                    const key = Z >= 0 ? s.substr(0, A) : s;
                    const value = A < Z ? s.substr(A + 1, Z - A - 1) : '';
                    if (key === 'hidden') {
                        ctx.hiddenId = value;
                    } else if (key === 'private') {
                        ctx.privateId = value;
                    } else if (key === 'friends') {
                        ctx.friendsId = value;
                    } else if (key === 'canRequestInvite') {
                        ctx.canRequestInvite = true;
                    } else if (key === 'region') {
                        ctx.region = value;
                    } else if (key === 'group') {
                        ctx.groupId = value;
                    } else if (key === 'groupAccessType') {
                        ctx.groupAccessType = value;
                    } else if (key === 'strict') {
                        ctx.strict = true;
                    } else if (key === 'ageGate') {
                        ctx.ageGate = true;
                    }
                } else {
                    ctx.instanceName = s;
                }
            });
            ctx.accessType = 'public';
            if (ctx.privateId !== null) {
                if (ctx.canRequestInvite) {
                    // InvitePlus
                    ctx.accessType = 'invite+';
                } else {
                    // InviteOnly
                    ctx.accessType = 'invite';
                }
                ctx.userId = ctx.privateId;
            } else if (ctx.friendsId !== null) {
                // FriendsOnly
                ctx.accessType = 'friends';
                ctx.userId = ctx.friendsId;
            } else if (ctx.hiddenId !== null) {
                // FriendsOfGuests
                ctx.accessType = 'friends+';
                ctx.userId = ctx.hiddenId;
            } else if (ctx.groupId !== null) {
                // Group
                ctx.accessType = 'group';
            }
            ctx.accessTypeName = ctx.accessType;
            if (ctx.groupAccessType !== null) {
                if (ctx.groupAccessType === 'public') {
                    ctx.accessTypeName = 'groupPublic';
                } else if (ctx.groupAccessType === 'plus') {
                    ctx.accessTypeName = 'groupPlus';
                }
            }
        } else {
            ctx.worldId = _tag;
        }
    }
    return ctx;
}

export { parseLocation, displayLocation };
