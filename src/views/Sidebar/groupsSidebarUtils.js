/**
 * @param {Array} group - Array of group instance refs
 * @returns {string} The groupId, or empty string
 */
export function getGroupId(group) {
    return group[0]?.group?.groupId || '';
}

/**
 * @param {Array} group - Array of group instance refs
 * @param {number} index - Index of the group in the list
 * @param {object} cfg - Collapsed state config object
 * @returns {object} Row object
 */
export function buildGroupHeaderRow(group, index, cfg) {
    const groupId = getGroupId(group);
    return {
        type: 'group-header',
        key: `group-header:${groupId}`,
        groupId,
        label: group[0]?.group?.name ?? '',
        count: group.length,
        isCollapsed: Boolean(cfg[groupId]?.isCollapsed),
        headerPaddingTop: index === 0 ? '0px' : '10px'
    };
}

/**
 * @param {object} ref - Group instance ref object
 * @param {number} index - Index within the group
 * @param {string} groupId - Parent group ID
 * @param {boolean} isAgeGatedVisible - Whether age-gated instances should be visible
 * @returns {object} Row object
 */
export function buildGroupItemRow(ref, index, groupId, isAgeGatedVisible) {
    return {
        type: 'group-item',
        key: `group-item:${groupId}:${ref?.instance?.id ?? index}`,
        ownerId: ref?.instance?.ownerId ?? '',
        iconUrl: ref?.group?.iconUrl ?? '',
        name: ref?.group?.name ?? '',
        userCount: ref?.instance?.userCount ?? 0,
        capacity: ref?.instance?.capacity ?? 0,
        location: ref?.instance?.location ?? '',
        isVisible: Boolean(
            isAgeGatedVisible ||
            !(ref?.ageGate || ref?.location?.includes('~ageGate'))
        )
    };
}

/**
 * @param {object} row - Row object with type property
 * @returns {number} Estimated height in pixels
 */
export function estimateGroupRowSize(row) {
    if (!row) return 44;
    if (row.type === 'group-header') {
        return 30;
    }
    return 52;
}
