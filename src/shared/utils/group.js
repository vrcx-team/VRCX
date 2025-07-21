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

export { hasGroupPermission, getGroupName };
