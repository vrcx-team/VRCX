import {
    compareByLastActive,
    compareByLastSeen,
    compareByLocation,
    compareByName,
    compareByPrivate,
    compareByStatus,
    compareByTimeInInstance
} from './compare';

const friendSortMethods = new Map([
    ['Sort Alphabetically', compareByName],
    ['Sort Private to Bottom', compareByPrivate],
    ['Sort by Status', compareByStatus],
    ['Sort by Last Active', compareByLastActive],
    ['Sort by Last Seen', compareByLastSeen],
    ['Sort by Time in Instance', compareByTimeInInstance],
    ['Sort by Location', compareByLocation],
    ['None', () => 0]
]);

/**
 * @param {string[]} sortMethods
 * @returns
 */
function getFriendsSortFunction(sortMethods) {
    const sorts = sortMethods.map((sortMethod) => friendSortMethods.get(sortMethod)).filter(Boolean);
    sorts.push(compareByName);

    /**
     * @param {object} a
     * @param {object} b
     * @returns {number}
     */
    return (a, b) => {
        for (const sort of sorts) {
            const res = sort(a, b);
            if (res !== 0) {
                return res;
            }
        }
        return 0;
    };
}

const statusOrder = ['join me', 'active', 'ask me', 'busy', 'offline'];

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function sortStatus(a, b) {
    const indexA = statusOrder.indexOf(a);
    const indexB = statusOrder.indexOf(b);
    if (indexA === -1 || indexB === -1 || indexA === indexB) {
        return 0;
    }
    return indexA < indexB ? -1 : 1;
}

/**
 * @param {object} friend
 * @returns {boolean}
 */
function isFriendOnline(friend) {
    if (typeof friend === 'undefined' || typeof friend?.ref === 'undefined') {
        return false;
    }
    if (friend.state === 'online') {
        return true;
    }
    if (friend.state !== 'online' && friend.ref.location !== 'private') {
        // wat
        return true;
    }
    return false;
}

export { getFriendsSortFunction, sortStatus, isFriendOnline };
