import { moveArrayItem } from './base/array';

/**
 * Keep valid saved group IDs in their existing order, then append groups that
 * are not present in the saved VRChat registry value.
 *
 * @param {string[]} order
 * @param {string[]} groupIds
 * @returns {string[]}
 */
export function normalizeGroupOrder(order, groupIds) {
    const validGroupIds = new Set(groupIds);
    const seen = new Set();
    const normalized = [];

    for (const groupId of order) {
        if (validGroupIds.has(groupId) && !seen.has(groupId)) {
            normalized.push(groupId);
            seen.add(groupId);
        }
    }
    for (const groupId of groupIds) {
        if (!seen.has(groupId)) {
            normalized.push(groupId);
            seen.add(groupId);
        }
    }

    return normalized;
}

/**
 * @param {string[]} order
 * @param {string} groupId
 * @param {number} toIndex
 * @returns {boolean}
 */
export function moveGroupInOrder(order, groupId, toIndex) {
    const fromIndex = order.indexOf(groupId);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= order.length || fromIndex === toIndex) {
        return false;
    }

    moveArrayItem(order, fromIndex, toIndex);
    return true;
}
