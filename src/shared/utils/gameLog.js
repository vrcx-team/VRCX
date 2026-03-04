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

export { gameLogSearchFilter };
