// Feeds the Game Log and Player List from NexVR. VRCX filled them by tailing
// VRChat's output_log; the NexVR client's Player.log names neither the world
// nor the players, so the realtime socket stands in for it:
//
// - the caller's own presence says which instance they are in
// - that instance's moderation feed lists its occupants, when NexVR sends it
//   to the caller; otherwise friends whose presence shares the instance stand
//   in for the occupant list
//
// Entries go through addGameLogEntry, the same path VRChat log lines took.

import { watch } from 'vue';

import { addGameLogEntry } from '../../coordinators/gameLogCoordinator';
import { AppDebug } from '../appConfig';
import { getWorldName } from '../../shared/utils/world';
import { presenceState } from './mappers';
import { realtime } from './realtime';
import { useGameStore } from '../../stores/game';
import { useLocationStore } from '../../stores/location';

/** Location tag of the instance being logged, '' when none */
let currentLocation = '';
let currentInstanceId = '';
/** @type {Map<string, string>} userId → displayName of players logged as joined */
const occupants = new Map();
/** Whether NexVR is sending the instance's occupant list */
let hasOccupantFeed = false;
/** Serializes syncs so a burst of presence frames can't interleave entries */
let queue = Promise.resolve();

function debug(...args) {
    if (AppDebug.debugGameLog) {
        console.log('[NexVR session]', ...args);
    }
}

function now() {
    return new Date().toJSON();
}

/**
 * @param {{ userId: string; displayName: string; joinedAt?: string }} player
 */
async function logJoin(player) {
    occupants.set(player.userId, player.displayName);
    const joinedAt = player.joinedAt && !Number.isNaN(Date.parse(player.joinedAt)) ? player.joinedAt : now();
    await addGameLogEntry(
        { type: 'player-joined', dt: joinedAt, userId: player.userId, displayName: player.displayName },
        currentLocation
    );
}

/**
 * @param {string} userId
 */
async function logLeave(userId) {
    const displayName = occupants.get(userId) ?? '';
    occupants.delete(userId);
    await addGameLogEntry({ type: 'player-left', dt: now(), userId, displayName }, currentLocation);
}

/**
 * Logs whoever joined or left since the last list.
 *
 * @param {{ userId: string; displayName: string; joinedAt?: string }[]} players
 */
async function applyOccupants(players) {
    const next = new Map(players.map((player) => [player.userId, player]));
    for (const player of next.values()) {
        if (!occupants.has(player.userId)) {
            await logJoin(player);
        }
    }
    for (const userId of [...occupants.keys()]) {
        if (!next.has(userId)) {
            await logLeave(userId);
        }
    }
}

/**
 * Friends (and the caller) whose presence puts them in the current instance.
 *
 * @returns {{ userId: string; displayName: string }[]}
 */
function friendsInInstance() {
    const players = [];
    for (const presence of realtime.friends.values()) {
        if (presence.location?.instanceId === currentInstanceId) {
            players.push({ userId: presence.userId, displayName: presence.displayName });
        }
    }
    return players;
}

/**
 * @returns {string} The caller's instance location tag, '' when not in one
 */
function ownLocation() {
    const self = realtime.friends.get(realtime.userId);
    if (!self) {
        return '';
    }
    const state = presenceState(self);
    return state.state === 'online' && state.location !== 'private' ? state.location : '';
}

async function sync() {
    const location = useGameStore().isGameRunning ? ownLocation() : '';
    if (location === currentLocation) {
        if (location && !hasOccupantFeed) {
            await applyOccupants(friendsInInstance());
        }
        return;
    }

    debug('instance changed', currentLocation, '→', location);
    currentLocation = location;
    currentInstanceId = location ? location.slice(location.indexOf(':') + 1).split('~')[0] : '';
    hasOccupantFeed = false;
    occupants.clear();
    realtime.watchInstances(currentInstanceId ? [currentInstanceId] : []);
    if (!location) {
        return;
    }

    const locationStore = useLocationStore();
    if (locationStore.lastLocation.location === location) {
        // restored from the database after a restart: carry on with that list
        for (const [userId, player] of locationStore.lastLocation.playerList) {
            occupants.set(userId, player.displayName);
        }
    } else {
        const worldName = await getWorldName(location).catch(() => '');
        await addGameLogEntry({ type: 'location', dt: now(), location, worldName }, location);
    }

    // until (unless) the occupant feed shows up, friends stand in for it
    await applyOccupants(friendsInInstance());
}

function enqueue(task) {
    queue = queue.then(task).catch((err) => console.error('NexVR session sync failed:', err));
    return queue;
}

/**
 * @param {{ instanceId: string; moderation: any }} update
 */
function onInstanceModeration({ instanceId, moderation }) {
    if (instanceId !== currentInstanceId) {
        return;
    }
    const players = (moderation.occupants || [])
        .filter((occupant) => occupant.userId)
        .map((occupant) => ({
            userId: occupant.userId,
            displayName: occupant.displayName,
            joinedAt: occupant.joinedAt
        }));
    // the caller is always an occupant; an empty list means NexVR withheld it
    if (!players.length) {
        return;
    }
    if (!hasOccupantFeed) {
        debug('occupant feed active for', instanceId);
    }
    hasOccupantFeed = true;
    enqueue(() => applyOccupants(players));
}

/**
 * Starts following the caller's NexVR session. Safe to call more than once.
 *
 * @returns {() => void} Stops following
 */
export function startGameSession() {
    const offFriends = realtime.on('friends', () => enqueue(sync));
    const offModeration = realtime.on('instanceModeration', onInstanceModeration);
    const stopWatch = watch(
        () => useGameStore().isGameRunning,
        () => enqueue(sync)
    );
    enqueue(sync);
    return () => {
        offFriends();
        offModeration();
        stopWatch();
        currentLocation = '';
        currentInstanceId = '';
        occupants.clear();
        realtime.watchInstances([]);
    };
}
