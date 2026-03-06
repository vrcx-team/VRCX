/**
 * Filter a game log row by search query.
 * @param {object} row
 * @param {string} searchQuery
 * @returns {boolean}
 */
function gameLogSearchFilter(row, searchQuery) {
    const value = searchQuery.trim().toUpperCase();
    if (!value) {
        return true;
    }
    if (
        (value.startsWith('WRLD_') || value.startsWith('GRP_')) &&
        String(row.location).toUpperCase().includes(value)
    ) {
        return true;
    }
    switch (row.type) {
        case 'Location':
            if (String(row.worldName).toUpperCase().includes(value)) {
                return true;
            }
            return false;
        case 'OnPlayerJoined':
            if (String(row.displayName).toUpperCase().includes(value)) {
                return true;
            }
            return false;
        case 'OnPlayerLeft':
            if (String(row.displayName).toUpperCase().includes(value)) {
                return true;
            }
            return false;
        case 'PortalSpawn':
            if (String(row.displayName).toUpperCase().includes(value)) {
                return true;
            }
            if (String(row.worldName).toUpperCase().includes(value)) {
                return true;
            }
            return false;
        case 'Event':
            if (String(row.data).toUpperCase().includes(value)) {
                return true;
            }
            return false;
        case 'External':
            if (String(row.message).toUpperCase().includes(value)) {
                return true;
            }
            if (String(row.displayName).toUpperCase().includes(value)) {
                return true;
            }
            return false;
        case 'VideoPlay':
            if (String(row.displayName).toUpperCase().includes(value)) {
                return true;
            }
            if (String(row.videoName).toUpperCase().includes(value)) {
                return true;
            }
            if (String(row.videoUrl).toUpperCase().includes(value)) {
                return true;
            }
            return false;
        case 'StringLoad':
        case 'ImageLoad':
            if (String(row.resourceUrl).toUpperCase().includes(value)) {
                return true;
            }
            return false;
    }
    return true;
}

/**
 * Extract a millisecond timestamp from a game log row.
 * Handles numeric (seconds or millis), ISO string, and dayjs-parseable formats.
 * @param {object} row
 * @returns {number} millisecond timestamp, or 0 if unparseable
 */
function getGameLogCreatedAtTs(row) {
    // dynamic import avoided — dayjs is a lightweight dep already used by the
    // consumer; we import it lazily to keep the module usable without bundler
    // context in tests (dayjs is a CJS/ESM dual package).
    const createdAtRaw = row?.created_at ?? row?.createdAt ?? row?.dt;
    if (typeof createdAtRaw === 'number') {
        const ts =
            createdAtRaw > 1_000_000_000_000
                ? createdAtRaw
                : createdAtRaw * 1000;
        return Number.isFinite(ts) ? ts : 0;
    }

    const createdAt = typeof createdAtRaw === 'string' ? createdAtRaw : '';
    // dayjs is imported at the call site (store) — here we do a simple
    // Date.parse fallback to stay dependency-free.
    const ts = Date.parse(createdAt);
    return Number.isFinite(ts) ? ts : 0;
}

/**
 * Compare two game log rows for descending sort order.
 * Primary key: created_at timestamp (newest first).
 * Secondary: rowId (highest first).
 * Tertiary: uid string (reverse lexicographic).
 * @param {object} a
 * @param {object} b
 * @returns {number} negative if a should come first, positive if b first
 */
function compareGameLogRows(a, b) {
    const aTs = getGameLogCreatedAtTs(a);
    const bTs = getGameLogCreatedAtTs(b);
    if (aTs !== bTs) {
        return bTs - aTs;
    }

    const aRowId = typeof a?.rowId === 'number' ? a.rowId : 0;
    const bRowId = typeof b?.rowId === 'number' ? b.rowId : 0;
    if (aRowId !== bRowId) {
        return bRowId - aRowId;
    }

    const aUid = typeof a?.uid === 'string' ? a.uid : '';
    const bUid = typeof b?.uid === 'string' ? b.uid : '';
    return aUid < bUid ? 1 : aUid > bUid ? -1 : 0;
}

export { gameLogSearchFilter, getGameLogCreatedAtTs, compareGameLogRows };

/**
 * Create a Location game log entry.
 * @param {string} dt
 * @param {string} location
 * @param {string} worldId
 * @param {string} worldName
 * @returns {object}
 */
export function createLocationEntry(dt, location, worldId, worldName) {
    return {
        created_at: dt,
        type: 'Location',
        location,
        worldId,
        worldName,
        groupName: '',
        time: 0
    };
}

/**
 * Create a player join or leave game log entry.
 * @param {'OnPlayerJoined'|'OnPlayerLeft'} type
 * @param {string} dt
 * @param {string} displayName
 * @param {string} location
 * @param {string} userId
 * @param {number} [time]
 * @returns {object}
 */
export function createJoinLeaveEntry(
    type,
    dt,
    displayName,
    location,
    userId,
    time = 0
) {
    return {
        created_at: dt,
        type,
        displayName,
        location,
        userId,
        time
    };
}

/**
 * Create a PortalSpawn game log entry.
 * @param {string} dt
 * @param {string} location
 * @returns {object}
 */
export function createPortalSpawnEntry(dt, location) {
    return {
        created_at: dt,
        type: 'PortalSpawn',
        location,
        displayName: '',
        userId: '',
        instanceId: '',
        worldName: ''
    };
}

/**
 * Create a resource load game log entry.
 * @param {string} rawType - 'resource-load-string' or 'resource-load-image'
 * @param {string} dt
 * @param {string} resourceUrl
 * @param {string} location
 * @returns {object}
 */
export function createResourceLoadEntry(rawType, dt, resourceUrl, location) {
    return {
        created_at: dt,
        type: rawType === 'resource-load-string' ? 'StringLoad' : 'ImageLoad',
        resourceUrl,
        location
    };
}

/**
 * Parse an API request URL for inventory info.
 * Matches: /api/1/user/{userId}/inventory/{inventoryId}
 * @example
 * // https://api.vrchat.cloud/api/1/user/usr_032383a7-748c-4fb2-94e4-bcb928e5de6b/inventory/inv_75781d65-92fe-4a80-a1ff-27ee6e843b08
 * @param {string} url
 * @returns {{ userId: string, inventoryId: string } | null}
 */
export function parseInventoryFromUrl(url) {
    try {
        const parsed = new URL(url);
        if (
            parsed.pathname.substring(0, 12) === '/api/1/user/' &&
            parsed.pathname.includes('/inventory/inv_')
        ) {
            const pathArray = parsed.pathname.split('/');
            const userId = pathArray[4];
            const inventoryId = pathArray[6];
            if (userId && inventoryId && inventoryId.length === 40) {
                return { userId, inventoryId };
            }
        }
    } catch {
        // invalid URL
    }
    return null;
}

/**
 * Parse an API request URL for print info.
 * Matches: /api/1/prints/{printId}
 * @param {string} url
 * @returns {string|null} printId or null
 */
export function parsePrintFromUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.pathname.substring(0, 14) === '/api/1/prints/') {
            const pathArray = parsed.pathname.split('/');
            const printId = pathArray[4];
            if (printId && printId.length === 41) {
                return printId;
            }
        }
    } catch {
        // invalid URL
    }
    return null;
}
