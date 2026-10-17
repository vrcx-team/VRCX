import { parseLocation } from './location';
import { queryRequest } from '../../api';

/**
 * @param {object} ref
 * @param {string} permission
 * @returns {boolean}
 */
function hasGroupPermission(ref, permission) {
    if (
        ref &&
        ref.myMember &&
        ref.myMember.permissions &&
        (ref.myMember.permissions.includes('*') || ref.myMember.permissions.includes(permission))
    ) {
        return true;
    }
    return false;
}

/**
 * @param {object} group
 * @returns {boolean}
 */
function hasGroupModerationPermission(group) {
    return (
        hasGroupPermission(group, 'group-invites-manage') ||
        hasGroupPermission(group, 'group-moderates-manage') ||
        hasGroupPermission(group, 'group-audit-view') ||
        hasGroupPermission(group, 'group-bans-manage') ||
        hasGroupPermission(group, 'group-data-manage') ||
        hasGroupPermission(group, 'group-members-manage') ||
        hasGroupPermission(group, 'group-members-remove') ||
        hasGroupPermission(group, 'group-roles-assign') ||
        hasGroupPermission(group, 'group-roles-manage') ||
        hasGroupPermission(group, 'group-default-role-manage') ||
        hasGroupPermission(group, 'group-announcement-manage') ||
        hasGroupPermission(group, 'group-calendar-manage')
    );
}

/**
 * @param {string} data
 * @returns {Promise<string>}
 */
async function getGroupName(data) {
    if (!data) {
        return '';
    }
    let groupName = '';
    let groupId = data;
    if (!data.startsWith('grp_')) {
        const L = parseLocation(data);
        groupId = L.groupId;
        if (!L.groupId) {
            return '';
        }
    }
    try {
        const args = await queryRequest.fetch('group.dialog', {
            groupId
        });
        groupName = args.ref.name;
    } catch (err) {
        console.error(err);
    }
    return groupName;
}

/**
 * Merges group member search results with matches from locally loaded members.
 * The server-side search index can lag behind recent member joins, so members
 * visible in the loaded list may be missing from API search results.
 *
 * @param {Array} results - API search results
 * @param {Array} members - Locally loaded group members
 * @param {string} search - Current search query
 * @returns {Array} Merged, deduplicated results
 */
function mergeGroupMemberSearchResults(results, members, search) {
    const merged = [...results];
    const seenUserIds = new Set(merged.map((member) => member.userId));
    const query = search.toLowerCase();
    for (const member of members) {
        if (!seenUserIds.has(member.userId)) {
            const displayName = (member.user?.displayName ?? '').toLowerCase();
            if (displayName.includes(query)) {
                merged.push(member);
                seenUserIds.add(member.userId);
            }
        }
    }
    return merged;
}

export { hasGroupPermission, hasGroupModerationPermission, getGroupName, mergeGroupMemberSearchResults };
