import { groupRequest } from '../../api';
import { parseLocation } from './location';

/**
 *
 * @param {object} ref
 * @param {string} permission
 * @returns {boolean}
 */
function hasGroupPermission(ref, permission) {
    if (
        ref &&
        ref.myMember &&
        ref.myMember.permissions &&
        (ref.myMember.permissions.includes('*') ||
            ref.myMember.permissions.includes(permission))
    ) {
        return true;
    }
    return false;
}

/**
 *
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
        hasGroupPermission(group, 'group-default-role-manage')
    );
}

/**
 *
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
        const args = await groupRequest.getCachedGroup({
            groupId
        });
        groupName = args.ref.name;
    } catch (err) {
        console.error(err);
    }
    return groupName;
}

export { hasGroupPermission, hasGroupModerationPermission, getGroupName };
