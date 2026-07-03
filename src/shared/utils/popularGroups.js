/**
 * Aggregate friend -> groupIds links and cached group metadata into a ranked list of groups
 * sorted by how many friends are in each group.
 * @param {Map<string, string[]>} links friendId -> groupId[]
 * @param {Map<string, object>} groupInfoMap groupId -> { name, shortCode, discriminator, iconUrl, bannerUrl, memberCount, ownerId }
 * @param {object} [options]
 * @param {Set<string>} [options.joinedGroupIds] group ids the current user is already a member of
 * @returns {Array<{ groupId: string, friendIds: string[], friendCount: number, info: object, isJoined: boolean }>}
 */
export function aggregateFriendGroups(links, groupInfoMap, options = {}) {
    const joinedGroupIds =
        options.joinedGroupIds instanceof Set ? options.joinedGroupIds : new Set();
    const groups = groupInfoMap instanceof Map ? groupInfoMap : new Map();
    const membership = new Map();

    if (links instanceof Map) {
        links.forEach((groupIds, friendId) => {
            if (!friendId || !Array.isArray(groupIds)) {
                return;
            }
            for (const groupId of groupIds) {
                if (!groupId) {
                    continue;
                }
                let friendIds = membership.get(groupId);
                if (!friendIds) {
                    friendIds = new Set();
                    membership.set(groupId, friendIds);
                }
                friendIds.add(friendId);
            }
        });
    }

    const ranked = [];
    membership.forEach((friendIdSet, groupId) => {
        const info = groups.get(groupId) || {};
        ranked.push({
            groupId,
            friendIds: Array.from(friendIdSet),
            friendCount: friendIdSet.size,
            info,
            isJoined: joinedGroupIds.has(groupId)
        });
    });

    ranked.sort((a, b) => {
        if (b.friendCount !== a.friendCount) {
            return b.friendCount - a.friendCount;
        }
        const memberA = Number.isFinite(a.info.memberCount)
            ? a.info.memberCount
            : Infinity;
        const memberB = Number.isFinite(b.info.memberCount)
            ? b.info.memberCount
            : Infinity;
        if (memberA !== memberB) {
            return memberA - memberB;
        }
        const nameA = a.info.name || '';
        const nameB = b.info.name || '';
        return nameA.localeCompare(nameB);
    });

    return ranked;
}
