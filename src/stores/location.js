import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { database } from '../service/database';
import {
    getGroupName,
    getWorldName,
    isRealInstance,
    parseLocation
} from '../shared/utils';
import { useGameStore } from './game';
import { useGameLogStore } from './gameLog';
import { useInstanceStore } from './instance';
import { useNotificationStore } from './notification';
import { usePhotonStore } from './photon';
import { useAdvancedSettingsStore } from './settings/advanced';
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

    const state = reactive({
        lastLocation: {
            date: null,
            location: '',
            name: '',
            playerList: new Map(),
            friendList: new Map()
        },
        lastLocationDestination: '',
        lastLocationDestinationTime: 0
    });

    const lastLocation = computed({
        get: () => state.lastLocation,
        set: (value) => {
            state.lastLocation = value;
        }
    });

    const lastLocationDestination = computed({
        get: () => state.lastLocationDestination,
        set: (value) => {
            state.lastLocationDestination = value;
        }
    });

    const lastLocationDestinationTime = computed({
        get: () => state.lastLocationDestinationTime,
        set: (value) => {
            state.lastLocationDestinationTime = value;
        }
    });

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
            state.lastLocation.location !== ''
        ) {
            // use gameLog instead of API when game is running
            currentLocation = state.lastLocation.location;
            if (state.lastLocation.location === 'traveling') {
                currentLocation = state.lastLocationDestination;
            }
            ref.location = state.lastLocation.location;
            ref.travelingToLocation = state.lastLocationDestination;
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
            ref.$location_at = state.lastLocation.date;
            ref.$travelingToTime = state.lastLocationDestinationTime;
            userStore.currentUser.$travelingToTime =
                state.lastLocationDestinationTime;
        }
    }

    async function setCurrentUserLocation(location, travelingToLocation) {
        userStore.currentUser.$location_at = Date.now();
        userStore.currentUser.$travelingToTime = Date.now();
        userStore.currentUser.$locationTag = location;
        userStore.currentUser.$travelingToLocation = travelingToLocation;
        updateCurrentUserLocation();

        // janky gameLog support for Quest
        if (gameStore.isGameRunning) {
            // with the current state of things, lets not run this if we don't need to
            return;
        }
        let lastLocation = '';
        for (let i = gameLogStore.gameLogSessionTable.length - 1; i > -1; i--) {
            const item = gameLogStore.gameLogSessionTable[i];
            if (item.type === 'Location') {
                lastLocation = item.location;
                break;
            }
        }
        if (lastLocation === location) {
            return;
        }
        state.lastLocationDestination = '';
        state.lastLocationDestinationTime = 0;

        if (isRealInstance(location)) {
            const dt = new Date().toJSON();
            const L = parseLocation(location);

            state.lastLocation.location = location;
            state.lastLocation.date = Date.now();

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
            state.lastLocation.location = '';
            state.lastLocation.date = null;
        }
    }

    function lastLocationReset(gameLogDate) {
        let dateTime = gameLogDate;
        if (!gameLogDate) {
            dateTime = new Date().toJSON();
        }
        const dateTimeStamp = Date.parse(dateTime);
        photonStore.photonLobby = new Map();
        photonStore.photonLobbyCurrent = new Map();
        photonStore.photonLobbyMaster = 0;
        photonStore.photonLobbyCurrentUser = 0;
        photonStore.photonLobbyUserData = new Map();
        photonStore.photonLobbyWatcherLoopStop();
        photonStore.photonLobbyAvatars = new Map();
        photonStore.photonLobbyLastModeration = new Map();
        photonStore.photonLobbyJointime = new Map();
        photonStore.photonLobbyActivePortals = new Map();
        photonStore.photonEvent7List = new Map();
        photonStore.photonLastEvent7List = '';
        photonStore.photonLastChatBoxMsg = new Map();
        photonStore.moderationEventQueue = new Map();
        if (photonStore.photonEventTable.data.length > 0) {
            photonStore.photonEventTablePrevious.data =
                photonStore.photonEventTable.data;
            photonStore.photonEventTable.data = [];
        }
        const playerList = Array.from(state.lastLocation.playerList.values());
        const dataBaseEntries = [];
        for (const ref of playerList) {
            const entry = {
                created_at: dateTime,
                type: 'OnPlayerLeft',
                displayName: ref.displayName,
                location: state.lastLocation.location,
                userId: ref.userId,
                time: dateTimeStamp - ref.joinTime
            };
            dataBaseEntries.unshift(entry);
            gameLogStore.addGameLog(entry);
        }
        database.addGamelogJoinLeaveBulk(dataBaseEntries);
        if (state.lastLocation.date !== null && state.lastLocation.date > 0) {
            const update = {
                time: dateTimeStamp - state.lastLocation.date,
                created_at: new Date(state.lastLocation.date).toJSON()
            };
            database.updateGamelogLocationTimeToDatabase(update);
        }
        state.lastLocationDestination = '';
        state.lastLocationDestinationTime = 0;
        state.lastLocation = {
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
        gameLogStore.lastVideoUrl = '';
        gameLogStore.lastResourceloadUrl = '';
        userStore.applyUserDialogLocation();
        instanceStore.applyWorldDialogInstances();
        instanceStore.applyGroupDialogInstances();
    }

    return {
        state,
        lastLocation,
        lastLocationDestination,
        lastLocationDestinationTime,
        updateCurrentUserLocation,
        setCurrentUserLocation,
        lastLocationReset
    };
});
