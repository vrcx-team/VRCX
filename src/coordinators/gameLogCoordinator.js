import dayjs from 'dayjs';

import {
    createJoinLeaveEntry,
    createLocationEntry,
    createPortalSpawnEntry,
    createResourceLoadEntry,
    findUserByDisplayName,
    parseLocation,
    parseInventoryFromUrl,
    parsePrintFromUrl,
    replaceBioSymbols
} from '../shared/utils';
import { i18n } from '../plugins/i18n';
import { AppDebug, logWebRequest } from '../services/appConfig';
import { database } from '../services/database';
import {
    runLastLocationResetFlow,
    runUpdateCurrentUserLocationFlow
} from './locationCoordinator';
import { getGroupName } from '../shared/utils';
import { userRequest } from '../api';
import { watchState } from '../services/watchState';
import { toast } from 'vue-sonner';

import { useAdvancedSettingsStore } from '../stores/settings/advanced';
import { useFriendStore } from '../stores/friend';
import { useGalleryStore } from '../stores/gallery';
import { useGameStore } from '../stores/game';
import { useGameLogStore } from '../stores/gameLog';
import { useGeneralSettingsStore } from '../stores/settings/general';
import { useInstanceStore } from '../stores/instance';
import { useLocationStore } from '../stores/location';
import { useModalStore } from '../stores/modal';
import { useNotificationStore } from '../stores/notification';
import { usePhotonStore } from '../stores/photon';
import { useSharedFeedStore } from '../stores/sharedFeed';
import { useUserStore } from '../stores/user';
import { useVrStore } from '../stores/vr';
import { useVrcxStore } from '../stores/vrcx';

import gameLogService from '../services/gameLog.js';

import * as workerTimers from 'worker-timers';

/**
 * Loads the player list from game log history and syncs it to
 * locationStore, instanceStore, vrStore, and userStore.
 */
export async function tryLoadPlayerList() {
    const gameStore = useGameStore();
    const locationStore = useLocationStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();
    const instanceStore = useInstanceStore();
    const vrStore = useVrStore();

    if (!gameStore.isGameRunning) {
        return;
    }
    console.log('Loading player list from game log...');
    let ctx;
    let i;
    const data = await database.getGamelogDatabase();
    if (data.length === 0) {
        return;
    }
    let length = 0;
    for (i = data.length - 1; i > -1; i--) {
        ctx = data[i];
        if (ctx.type === 'Location') {
            locationStore.setLastLocation({
                date: Date.parse(ctx.created_at),
                location: ctx.location,
                name: ctx.worldName,
                playerList: new Map(),
                friendList: new Map()
            });
            length = i;
            break;
        }
    }
    if (length > 0) {
        for (i = length + 1; i < data.length; i++) {
            ctx = data[i];
            if (ctx.type === 'OnPlayerJoined') {
                if (!ctx.userId) {
                    ctx.userId =
                        findUserByDisplayName(
                            userStore.cachedUsers,
                            ctx.displayName,
                            userStore.cachedUserIdsByDisplayName
                        )?.id ?? '';
                }
                const userMap = {
                    displayName: ctx.displayName,
                    userId: ctx.userId,
                    joinTime: Date.parse(ctx.created_at),
                    lastAvatar: ''
                };
                locationStore.lastLocation.playerList.set(ctx.userId, userMap);
                if (friendStore.friends.has(ctx.userId)) {
                    locationStore.lastLocation.friendList.set(
                        ctx.userId,
                        userMap
                    );
                }
            }
            if (ctx.type === 'OnPlayerLeft') {
                locationStore.lastLocation.playerList.delete(ctx.userId);
                locationStore.lastLocation.friendList.delete(ctx.userId);
            }
        }
        locationStore.lastLocation.playerList.forEach((ref1) => {
            if (
                ref1.userId &&
                typeof ref1.userId === 'string' &&
                !userStore.cachedUsers.has(ref1.userId)
            ) {
                userRequest.getUser({ userId: ref1.userId });
            }
        });

        runUpdateCurrentUserLocationFlow();
        instanceStore.updateCurrentInstanceWorld();
        vrStore.updateVRLastLocation();
        instanceStore.getCurrentInstanceUserList();
        userStore.applyUserDialogLocation();
        instanceStore.applyWorldDialogInstances();
        instanceStore.applyGroupDialogInstances();
    }
}

/**
 * Core game log entry processor. Dispatches game log events to the
 * appropriate stores based on type.
 * @param {object} gameLog
 * @param {string} location
 */
export function addGameLogEntry(gameLog, location) {
    const gameLogStore = useGameLogStore();
    const locationStore = useLocationStore();
    const instanceStore = useInstanceStore();
    const userStore = useUserStore();
    const friendStore = useFriendStore();
    const vrStore = useVrStore();
    const gameStore = useGameStore();
    const vrcxStore = useVrcxStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const galleryStore = useGalleryStore();
    const photonStore = usePhotonStore();
    const sharedFeedStore = useSharedFeedStore();
    const notificationStore = useNotificationStore();

    let entry = undefined;
    if (advancedSettingsStore.gameLogDisabled) {
        return;
    }
    let userId = String(gameLog.userId || '');
    if (!userId && gameLog.displayName) {
        userId =
            findUserByDisplayName(
                userStore.cachedUsers,
                gameLog.displayName,
                userStore.cachedUserIdsByDisplayName
            )?.id ?? '';
    }
    switch (gameLog.type) {
        case 'location-destination':
            if (gameStore.isGameRunning) {
                gameLogStore.addGameLog({
                    created_at: gameLog.dt,
                    type: 'LocationDestination',
                    location: gameLog.location
                });
                runLastLocationResetFlow(gameLog.dt);
                locationStore.setLastLocationLocation('traveling');
                locationStore.setLastLocationDestination(gameLog.location);
                locationStore.setLastLocationDestinationTime(
                    Date.parse(gameLog.dt)
                );
                gameLogStore.state.lastLocationAvatarList.clear();
                instanceStore.removeQueuedInstance(gameLog.location);
                runUpdateCurrentUserLocationFlow();
                gameLogStore.clearNowPlaying();
                instanceStore.updateCurrentInstanceWorld();
                userStore.applyUserDialogLocation();
                instanceStore.applyWorldDialogInstances();
                instanceStore.applyGroupDialogInstances();
            }
            break;
        case 'location':
            instanceStore.addInstanceJoinHistory(
                locationStore.lastLocation.location,
                gameLog.dt
            );
            const worldName = replaceBioSymbols(gameLog.worldName);
            if (gameStore.isGameRunning) {
                runLastLocationResetFlow(gameLog.dt);
                gameLogStore.clearNowPlaying();
                locationStore.setLastLocation({
                    date: Date.parse(gameLog.dt),
                    location: gameLog.location,
                    name: worldName,
                    playerList: new Map(),
                    friendList: new Map()
                });
                instanceStore.removeQueuedInstance(gameLog.location);
                runUpdateCurrentUserLocationFlow();
                vrStore.updateVRLastLocation();
                instanceStore.updateCurrentInstanceWorld();
                userStore.applyUserDialogLocation();
                instanceStore.applyWorldDialogInstances();
                instanceStore.applyGroupDialogInstances();
            }
            instanceStore.addInstanceJoinHistory(gameLog.location, gameLog.dt);
            const L = parseLocation(gameLog.location);
            entry = createLocationEntry(
                gameLog.dt,
                gameLog.location,
                L.worldId,
                worldName
            );
            getGroupName(gameLog.location).then((groupName) => {
                entry.groupName = groupName;
            });
            gameLogStore.addGamelogLocationToDatabase(entry);
            break;
        case 'player-joined':
            const joinTime = Date.parse(gameLog.dt);
            const userMap = {
                displayName: gameLog.displayName,
                userId,
                joinTime,
                lastAvatar: ''
            };
            locationStore.lastLocation.playerList.set(userId, userMap);
            const ref = userStore.cachedUsers.get(userId);
            if (!userId) {
                console.error('Missing userId:', gameLog.displayName);
            } else if (userId === userStore.currentUser.id) {
                // skip
            } else if (
                friendStore.friends.has(userId) &&
                typeof ref !== 'undefined'
            ) {
                locationStore.lastLocation.friendList.set(userId, userMap);
                if (
                    ref.location !== locationStore.lastLocation.location &&
                    ref.travelingToLocation !==
                        locationStore.lastLocation.location
                ) {
                    ref.$location_at = joinTime;
                }
            } else if (typeof ref !== 'undefined') {
                ref.$location_at = joinTime;
            } else {
                if (AppDebug.debugGameLog || AppDebug.debugWebRequests) {
                    console.log('Fetching user from gameLog:', userId);
                }
                userRequest.getUser({ userId });
            }
            vrStore.updateVRLastLocation();
            instanceStore.getCurrentInstanceUserList();
            entry = createJoinLeaveEntry(
                'OnPlayerJoined',
                gameLog.dt,
                gameLog.displayName,
                location,
                userId
            );
            database.addGamelogJoinLeaveToDatabase(entry);
            break;
        case 'player-left':
            const ref1 = locationStore.lastLocation.playerList.get(userId);
            if (typeof ref1 === 'undefined') {
                break;
            }
            const time = dayjs(gameLog.dt) - ref1.joinTime;
            locationStore.lastLocation.playerList.delete(userId);
            locationStore.lastLocation.friendList.delete(userId);
            gameLogStore.state.lastLocationAvatarList.delete(
                gameLog.displayName
            );
            photonStore.photonLobbyAvatars.delete(userId);
            vrStore.updateVRLastLocation();
            instanceStore.getCurrentInstanceUserList();
            entry = createJoinLeaveEntry(
                'OnPlayerLeft',
                gameLog.dt,
                gameLog.displayName,
                location,
                userId,
                time
            );
            database.addGamelogJoinLeaveToDatabase(entry);
            break;
        case 'portal-spawn':
            if (vrcxStore.ipcEnabled && gameStore.isGameRunning) {
                break;
            }
            entry = createPortalSpawnEntry(gameLog.dt, location);
            database.addGamelogPortalSpawnToDatabase(entry);
            break;
        case 'video-play':
            gameLog.videoUrl = decodeURI(gameLog.videoUrl);
            if (gameLogStore.lastVideoUrl === gameLog.videoUrl) {
                break;
            }
            gameLogStore.setLastVideoUrl(gameLog.videoUrl);
            gameLogStore.addGameLogVideo(gameLog, location, userId);
            break;
        case 'video-sync':
            const timestamp = gameLog.timestamp.replace(/,/g, '');
            if (gameLogStore.nowPlaying.playing) {
                gameLogStore.nowPlaying.offset = parseInt(timestamp, 10);
            }
            break;
        case 'resource-load-string':
        case 'resource-load-image':
            if (
                !generalSettingsStore.logResourceLoad ||
                gameLogStore.lastResourceloadUrl === gameLog.resourceUrl
            ) {
                break;
            }
            gameLogStore.setLastResourceloadUrl(gameLog.resourceUrl);
            entry = createResourceLoadEntry(
                gameLog.type,
                gameLog.dt,
                gameLog.resourceUrl,
                location
            );
            database.addGamelogResourceLoadToDatabase(entry);
            break;
        case 'screenshot':
            vrcxStore.processScreenshot(gameLog.screenshotPath);
            break;
        case 'api-request':
            logWebRequest('[GAMELOG API]', gameLog.url);
            if (advancedSettingsStore.saveInstanceEmoji) {
                const inv = parseInventoryFromUrl(gameLog.url);
                if (inv) {
                    galleryStore.queueCheckInstanceInventory(
                        inv.inventoryId,
                        inv.userId
                    );
                }
            }
            if (advancedSettingsStore.saveInstancePrints) {
                const printId = parsePrintFromUrl(gameLog.url);
                if (printId) {
                    galleryStore.queueSavePrintToFile(printId);
                }
            }
            break;
        case 'avatar-change':
            if (!gameStore.isGameRunning) {
                break;
            }
            let avatarName = gameLogStore.state.lastLocationAvatarList.get(
                gameLog.displayName
            );
            if (
                photonStore.photonLoggingEnabled ||
                avatarName === gameLog.avatarName
            ) {
                break;
            }
            if (!avatarName) {
                avatarName = gameLog.avatarName;
                gameLogStore.state.lastLocationAvatarList.set(
                    gameLog.displayName,
                    avatarName
                );
                break;
            }
            avatarName = gameLog.avatarName;
            gameLogStore.state.lastLocationAvatarList.set(
                gameLog.displayName,
                avatarName
            );
            entry = {
                created_at: gameLog.dt,
                type: 'AvatarChange',
                userId,
                name: avatarName,
                displayName: gameLog.displayName
            };
            break;
        case 'vrcx':
            const type = gameLog.data.substr(0, gameLog.data.indexOf(' '));
            if (type === 'VideoPlay(PyPyDance)') {
                gameLogStore.addGameLogPyPyDance(gameLog, location);
            } else if (type === 'VideoPlay(VRDancing)') {
                gameLogStore.addGameLogVRDancing(gameLog, location);
            } else if (type === 'VideoPlay(ZuwaZuwaDance)') {
                gameLogStore.addGameLogZuwaZuwaDance(gameLog, location);
            } else if (type === 'LSMedia') {
                gameLogStore.addGameLogLSMedia(gameLog, location);
            } else if (type === 'VideoPlay(PopcornPalace)') {
                gameLogStore.addGameLogPopcornPalace(gameLog, location);
            }
            break;
        case 'photon-id':
            if (!gameStore.isGameRunning || !watchState.isFriendsLoaded) {
                break;
            }
            const photonId = parseInt(gameLog.photonId, 10);
            const ref2 = photonStore.photonLobby.get(photonId);
            if (typeof ref2 === 'undefined') {
                const foundUser = findUserByDisplayName(
                    userStore.cachedUsers,
                    gameLog.displayName,
                    userStore.cachedUserIdsByDisplayName
                );
                if (foundUser) {
                    photonStore.photonLobby.set(photonId, foundUser);
                    photonStore.photonLobbyCurrent.set(photonId, foundUser);
                }
                const ctx1 = {
                    displayName: gameLog.displayName
                };
                photonStore.photonLobby.set(photonId, ctx1);
                photonStore.photonLobbyCurrent.set(photonId, ctx1);
                instanceStore.getCurrentInstanceUserList();
            }
            break;
        case 'notification':
            break;
        case 'event':
            entry = {
                created_at: gameLog.dt,
                type: 'Event',
                data: gameLog.event
            };
            database.addGamelogEventToDatabase(entry);
            break;
        case 'vrc-quit':
            if (!gameStore.isGameRunning) {
                break;
            }
            if (advancedSettingsStore.vrcQuitFix) {
                const bias = Date.parse(gameLog.dt) + 3000;
                if (bias < Date.now()) {
                    console.log('QuitFix: Bias too low, not killing VRC');
                    break;
                }
                AppApi.QuitGame().then((processCount) => {
                    if (processCount > 1) {
                        console.log(
                            'QuitFix: More than 1 process running, not killing VRC'
                        );
                    } else if (processCount === 1) {
                        console.log('QuitFix: Killed VRC');
                    } else {
                        console.log(
                            'QuitFix: Nothing to kill, no VRC process running'
                        );
                    }
                });
            }
            break;
        case 'openvr-init':
            gameStore.setIsGameNoVR(false);
            configRepository.setBool('isGameNoVR', gameStore.isGameNoVR);
            vrStore.updateOpenVR();
            break;
        case 'desktop-mode':
            gameStore.setIsGameNoVR(true);
            configRepository.setBool('isGameNoVR', gameStore.isGameNoVR);
            vrStore.updateOpenVR();
            break;
        case 'udon-exception':
            if (generalSettingsStore.udonExceptionLogging) {
                console.log('UdonException', gameLog.data);
            }
            break;
        case 'sticker-spawn':
            if (!advancedSettingsStore.saveInstanceStickers) {
                break;
            }
            galleryStore.trySaveStickerToFile(
                gameLog.displayName,
                gameLog.userId,
                gameLog.inventoryId
            );
            break;
    }
    if (typeof entry !== 'undefined') {
        sharedFeedStore.addEntry(entry);
        notificationStore.queueGameLogNoty(entry);
        gameLogStore.addGameLog(entry);
    }
}

/**
 * Parses raw game log JSON and delegates to addGameLogEntry.
 * Called from C# / updateLoop.
 * @param {string} json
 */
export function addGameLogEvent(json) {
    const locationStore = useLocationStore();

    const rawLogs = JSON.parse(json);
    const gameLog = gameLogService.parseRawGameLog(
        rawLogs[1],
        rawLogs[2],
        rawLogs.slice(3)
    );
    if (
        AppDebug.debugGameLog &&
        gameLog.type !== 'photon-id' &&
        gameLog.type !== 'api-request' &&
        gameLog.type !== 'udon-exception'
    ) {
        console.log('gameLog:', gameLog);
    }
    addGameLogEntry(gameLog, locationStore.lastLocation.location);
}

/**
 * Starts game log processing from the database tail.
 */
export async function getGameLogTable() {
    await database.initTables();
    const dateTill = await database.getLastDateGameLogDatabase();
    await updateGameLog(dateTill);
}

/**
 * Fetches all game log entries since dateTill and processes them.
 * @param {string} dateTill
 */
async function updateGameLog(dateTill) {
    await gameLogService.setDateTill(dateTill);
    await new Promise((resolve) => {
        workerTimers.setTimeout(resolve, 10000);
    });
    let location = '';
    for (const gameLog of await gameLogService.getAll()) {
        if (gameLog.type === 'location') {
            location = gameLog.location;
        }
        addGameLogEntry(gameLog, location);
    }
}

/**
 * Shows confirmation dialog before toggling the game log disabled setting.
 */
export async function disableGameLogDialog() {
    const gameStore = useGameStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const modalStore = useModalStore();
    const t = i18n.global.t;

    if (gameStore.isGameRunning) {
        toast.error(t('message.gamelog.vrchat_must_be_closed'));
        return;
    }
    if (!advancedSettingsStore.gameLogDisabled) {
        modalStore
            .confirm({
                description: t('confirm.disable_gamelog'),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (!ok) return;
                advancedSettingsStore.setGameLogDisabled();
            })
            .catch(() => {});
    } else {
        advancedSettingsStore.setGameLogDisabled();
    }
}

import configRepository from '../services/config';
