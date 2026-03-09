import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
    getGroupName,
    getWorldName,
    isRealInstance,
    parseLocation
} from '../shared/utils';
import { database } from '../service/database';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useGameLogStore } from './gameLog';
import { useGameStore } from './game';
import { useInstanceStore } from './instance';
import { useNotificationStore } from './notification';
import { usePhotonStore } from './photon';
import { useUserStore } from './user';
import { useVrStore } from './vr';

export const useLocationStore = defineStore('Location', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const userStore = useUserStore();
    const instanceStore = useInstanceStore();
    const notificationStore = useNotificationStore();
    const gameStore = useGameStore();
    const vrStore = useVrStore();
    const photonStore = usePhotonStore();
    const gameLogStore = useGameLogStore();

    const lastLocation = ref({
        date: null,
        location: '',
        name: '',
        playerList: new Map(),
        friendList: new Map()
    });
    const lastLocationDestination = ref('');
    const lastLocationDestinationTime = ref(0);

    function updateCurrentUserLocation() {
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
            lastLocation.value.location !== ''
        ) {
            // use gameLog instead of API when game is running
            currentLocation = lastLocation.value.location;
            if (lastLocation.value.location === 'traveling') {
                currentLocation = lastLocationDestination.value;
            }
            ref.location = lastLocation.value.location;
            ref.travelingToLocation = lastLocationDestination.value;
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
            ref.$location_at = lastLocation.value.date;
            ref.$travelingToTime = lastLocationDestinationTime.value;
            userStore.setCurrentUserTravelingToTime(
                lastLocationDestinationTime.value
            );
        }
    }

    async function setCurrentUserLocation(location, travelingToLocation) {
        userStore.setCurrentUserLocationState(location, travelingToLocation);
        updateCurrentUserLocation();

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
        lastLocationDestination.value = '';
        lastLocationDestinationTime.value = 0;

        if (isRealInstance(location)) {
            const dt = new Date().toJSON();
            const L = parseLocation(location);

            lastLocation.value.location = location;
            lastLocation.value.date = Date.now();

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
            lastLocation.value.location = '';
            lastLocation.value.date = null;
        }
    }

    function lastLocationReset(gameLogDate) {
        let dateTime = gameLogDate;
        if (!gameLogDate) {
            dateTime = new Date().toJSON();
        }
        const dateTimeStamp = Date.parse(dateTime);
        photonStore.resetLocationPhotonState();
        const playerList = Array.from(lastLocation.value.playerList.values());
        const dataBaseEntries = [];
        for (const ref of playerList) {
            const entry = {
                created_at: dateTime,
                type: 'OnPlayerLeft',
                displayName: ref.displayName,
                location: lastLocation.value.location,
                userId: ref.userId,
                time: dateTimeStamp - ref.joinTime
            };
            dataBaseEntries.unshift(entry);
            gameLogStore.addGameLog(entry);
        }
        database.addGamelogJoinLeaveBulk(dataBaseEntries);
        if (lastLocation.value.date !== null && lastLocation.value.date > 0) {
            const update = {
                time: dateTimeStamp - lastLocation.value.date,
                created_at: new Date(lastLocation.value.date).toJSON()
            };
            database.updateGamelogLocationTimeToDatabase(update);
        }
        lastLocationDestination.value = '';
        lastLocationDestinationTime.value = 0;
        lastLocation.value = {
            date: 0,
            location: '',
            name: '',
            playerList: new Map(),
            friendList: new Map()
        };
        updateCurrentUserLocation();
        instanceStore.updateCurrentInstanceWorld();
        vrStore.updateVRLastLocation();
        instanceStore.getCurrentInstanceUserList();
        gameLogStore.resetLastMediaUrls();
        userStore.applyUserDialogLocation();
        instanceStore.applyWorldDialogInstances();
        instanceStore.applyGroupDialogInstances();
    }

    /**
     * @param {{date: number|null, location: string, name: string, playerList: Map<any, any>, friendList: Map<any, any>}} value
     */
    function setLastLocation(value) {
        lastLocation.value = value;
    }

    /**
     * @param {string} value
     */
    function setLastLocationLocation(value) {
        lastLocation.value.location = value;
    }

    /**
     * @param {string} value
     */
    function setLastLocationDestination(value) {
        lastLocationDestination.value = value;
    }

    /**
     * @param {number} value
     */
    function setLastLocationDestinationTime(value) {
        lastLocationDestinationTime.value = value;
    }

    return {
        lastLocation,
        lastLocationDestination,
        lastLocationDestinationTime,
        updateCurrentUserLocation,
        setCurrentUserLocation,
        lastLocationReset,
        setLastLocation,
        setLastLocationLocation,
        setLastLocationDestination,
        setLastLocationDestinationTime
    };
});
