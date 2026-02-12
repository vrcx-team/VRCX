import { isRealInstance } from './instance.js';
import { useLocationStore } from '../../stores/location.js';

// Re-export pure parsing functions from the standalone module
export { parseLocation, displayLocation } from './locationParser.js';

function getFriendsLocations(friendsArr) {
    const locationStore = useLocationStore();
    // prevent the instance title display as "Traveling".
    if (!friendsArr?.length) {
        return '';
    }
    for (const friend of friendsArr) {
        if (isRealInstance(friend.ref?.location)) {
            return friend.ref.location;
        }
    }
    for (const friend of friendsArr) {
        if (isRealInstance(friend.ref?.travelingToLocation)) {
            return friend.ref.travelingToLocation;
        }
    }
    for (const friend of friendsArr) {
        if (locationStore.lastLocation.friendList.has(friend.id)) {
            return locationStore.lastLocation.location;
        }
    }
    return friendsArr[0].ref?.location;
}

export { getFriendsLocations };
