import {
    getGroupName,
    getWorldName,
    isRealInstance,
    parseLocation
} from '../shared/utils';
import { database } from '../services/database';
import { useAdvancedSettingsStore } from '../stores/settings/advanced';
import { useGameLogStore } from '../stores/gameLog';
import { useGameStore } from '../stores/game';
import { useInstanceStore } from '../stores/instance';
import { useLocationStore } from '../stores/location';
import { useNotificationStore } from '../stores/notification';
import { usePhotonStore } from '../stores/photon';
import { useUserStore } from '../stores/user';
import { useVrStore } from '../stores/vr';

export function runUpdateCurrentUserLocationFlow() {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const userStore = useUserStore();
    const instanceStore = useInstanceStore();
    const gameStore = useGameStore();
    const locationStore = useLocationStore();

    const ref = userStore.cachedUsers.get(userStore.currentUser.id);
    if (typeof ref === 'undefined') {
        return;
    }

    // update cached user with both gameLog and API locations
    let currentLocation = userStore.currentUser.$locationTag;
    const L = parseLocation(currentLocation);
    if (L.isTraveling) {
        currentLocation = userStore.currentUser.$travelingToLocation;
    }
    ref.location = userStore.currentUser.$locationTag;
    ref.travelingToLocation = userStore.currentUser.$travelingToLocation;

    if (
        gameStore.isGameRunning &&
        !advancedSettingsStore.gameLogDisabled &&
        locationStore.lastLocation.location !== ''
    ) {
        // use gameLog instead of API when game is running
        currentLocation = locationStore.lastLocation.location;
        if (locationStore.lastLocation.location === 'traveling') {
            currentLocation = locationStore.lastLocationDestination;
        }
        ref.location = locationStore.lastLocation.location;
        ref.travelingToLocation = locationStore.lastLocationDestination;
    }

    ref.$online_for = userStore.currentUser.$online_for;
    ref.$offline_for = userStore.currentUser.$offline_for;
    ref.$location = parseLocation(currentLocation);
    if (!gameStore.isGameRunning || advancedSettingsStore.gameLogDisabled) {
        ref.$location_at = userStore.currentUser.$location_at;
        ref.$travelingToTime = userStore.currentUser.$travelingToTime;
        userStore.applyUserDialogLocation();
        instanceStore.applyWorldDialogInstances();
        instanceStore.applyGroupDialogInstances();
    } else {
        ref.$location_at = locationStore.lastLocation.date;
        ref.$travelingToTime = locationStore.lastLocationDestinationTime;
        userStore.setCurrentUserTravelingToTime(
            locationStore.lastLocationDestinationTime
        );
    }
}

export async function runSetCurrentUserLocationFlow(
    location,
    travelingToLocation
) {
    const userStore = useUserStore();
    const instanceStore = useInstanceStore();
    const notificationStore = useNotificationStore();
    const gameStore = useGameStore();
    const gameLogStore = useGameLogStore();
    const locationStore = useLocationStore();

    userStore.setCurrentUserLocationState(location, travelingToLocation);
    runUpdateCurrentUserLocationFlow();

    // janky gameLog support for Quest
    if (gameStore.isGameRunning) {
        // with the current state of things, lets not run this if we don't need to
        return;
    }
    const lastLocationArray = await database.lookupGameLogDatabase(
        ['Location'],
        [],
        1
    );
    const lastLocationTemp =
        lastLocationArray.length > 0 ? lastLocationArray[0].location : '';
    if (lastLocationTemp === location) {
        return;
    }
    locationStore.setLastLocationDestination('');
    locationStore.setLastLocationDestinationTime(0);

    if (isRealInstance(location)) {
        const dt = new Date().toJSON();
        const L = parseLocation(location);

        locationStore.setLastLocation({
            ...locationStore.lastLocation,
            location,
            date: Date.now()
        });

        const entry = {
            created_at: dt,
            type: 'Location',
            location,
            worldId: L.worldId,
            worldName: await getWorldName(L.worldId),
            groupName: await getGroupName(L.groupId),
            time: 0
        };
        database.addGamelogLocationToDatabase(entry);
        notificationStore.queueGameLogNoty(entry);
        gameLogStore.addGameLog(entry);
        instanceStore.addInstanceJoinHistory(location, dt);

        userStore.applyUserDialogLocation();
        instanceStore.applyWorldDialogInstances();
        instanceStore.applyGroupDialogInstances();
    } else {
        locationStore.setLastLocation({
            ...locationStore.lastLocation,
            location: '',
            date: null
        });
    }
}

export function runLastLocationResetFlow(gameLogDate) {
    const photonStore = usePhotonStore();
    const instanceStore = useInstanceStore();
    const gameLogStore = useGameLogStore();
    const vrStore = useVrStore();
    const userStore = useUserStore();
    const locationStore = useLocationStore();

    let dateTime = gameLogDate;
    if (!gameLogDate) {
        dateTime = new Date().toJSON();
    }
    const dateTimeStamp = Date.parse(dateTime);
    photonStore.resetLocationPhotonState();
    const playerList = Array.from(
        locationStore.lastLocation.playerList.values()
    );
    const dataBaseEntries = [];
    for (const ref of playerList) {
        const entry = {
            created_at: dateTime,
            type: 'OnPlayerLeft',
            displayName: ref.displayName,
            location: locationStore.lastLocation.location,
            userId: ref.userId,
            time: dateTimeStamp - ref.joinTime
        };
        dataBaseEntries.unshift(entry);
        gameLogStore.addGameLog(entry);
    }
    database.addGamelogJoinLeaveBulk(dataBaseEntries);
    if (
        locationStore.lastLocation.date !== null &&
        locationStore.lastLocation.date > 0
    ) {
        const update = {
            time: dateTimeStamp - locationStore.lastLocation.date,
            created_at: new Date(locationStore.lastLocation.date).toJSON()
        };
        database.updateGamelogLocationTimeToDatabase(update);
    }
    locationStore.setLastLocationDestination('');
    locationStore.setLastLocationDestinationTime(0);
    locationStore.setLastLocation({
        date: 0,
        location: '',
        name: '',
        playerList: new Map(),
        friendList: new Map()
    });
    runUpdateCurrentUserLocationFlow();
    instanceStore.updateCurrentInstanceWorld();
    vrStore.updateVRLastLocation();
    instanceStore.getCurrentInstanceUserList();
    gameLogStore.resetLastMediaUrls();
    userStore.applyUserDialogLocation();
    instanceStore.applyWorldDialogInstances();
    instanceStore.applyGroupDialogInstances();
}
