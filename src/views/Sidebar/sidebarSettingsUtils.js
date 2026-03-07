/**
 * @param {string[]} stored - Stored favorite groups selection
 * @param {string[]} allKeys - All available group keys
 * @returns {string[]} Resolved group keys
 */
export function resolveFavoriteGroups(stored, allKeys) {
    if (stored.length === 0) {
        return allKeys;
    }
    return stored;
}

/**
 * @param {string[]|null} value - New selection value
 * @param {string[]} allKeys - All available group keys
 * @returns {string[]} Value to store
 */
export function normalizeFavoriteGroupsChange(value, allKeys) {
    if (!value || value.length === 0) {
        return [];
    }
    if (
        value.length >= allKeys.length &&
        allKeys.every((k) => value.includes(k))
    ) {
        return [];
    }
    return value;
}
