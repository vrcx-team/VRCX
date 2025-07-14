import {
    compareByLastActive,
    compareByLastSeen,
    compareByLocation,
    compareByLocationAt,
    compareByName,
    compareByPrivate,
    compareByStatus
} from './compare';

/**
 *
 * @param {string[]} sortMethods
 * @returns
 */
function getFriendsSortFunction(sortMethods) {
    const sorts = [];
    for (const sortMethod of sortMethods) {
        switch (sortMethod) {
            case 'Sort Alphabetically':
                sorts.push(compareByName);
                break;
            case 'Sort Private to Bottom':
                sorts.push(compareByPrivate);
                break;
            case 'Sort by Status':
                sorts.push(compareByStatus);
                break;
            case 'Sort by Last Active':
                sorts.push(compareByLastActive);
                break;
            case 'Sort by Last Seen':
                sorts.push(compareByLastSeen);
                break;
            case 'Sort by Time in Instance':
                sorts.push((a, b) => {
                    if (
                        typeof a.ref === 'undefined' ||
                        typeof b.ref === 'undefined'
                    ) {
                        return 0;
                    }
                    if (a.state !== 'online' || b.state !== 'online') {
                        return 0;
                    }

                    return compareByLocationAt(b.ref, a.ref);
                });
                break;
            case 'Sort by Location':
                sorts.push(compareByLocation);
                break;
            case 'None':
                sorts.push(() => 0);
                break;
        }
    }

    /**
     * @param {object} a
     * @param {object} b
     * @returns {number}
     */
    return (a, b) => {
        let res;
        for (const sort of sorts) {
            res = sort(a, b);
            if (res !== 0) {
                return res;
            }
        }
        return res;
    };
}

/**
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function sortStatus(a, b) {
    switch (b) {
        case 'join me':
            switch (a) {
                case 'active':
                    return 1;
                case 'ask me':
                    return 1;
                case 'busy':
                    return 1;
            }
            break;
        case 'active':
            switch (a) {
                case 'join me':
                    return -1;
                case 'ask me':
                    return 1;
                case 'busy':
                    return 1;
            }
            break;
        case 'ask me':
            switch (a) {
                case 'join me':
                    return -1;
                case 'active':
                    return -1;
                case 'busy':
                    return 1;
            }
            break;
        case 'busy':
            switch (a) {
                case 'join me':
                    return -1;
                case 'active':
                    return -1;
                case 'ask me':
                    return -1;
            }
            break;
    }
    return 0;
}

/**
 *
 * @param {object} friend
 * @returns {boolean}
 */
function isFriendOnline(friend) {
    if (typeof friend === 'undefined' || typeof friend.ref === 'undefined') {
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
