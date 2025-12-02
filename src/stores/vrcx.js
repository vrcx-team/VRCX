import { reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import Noty from 'noty';

import { debounce, parseLocation } from '../shared/utils';
import { AppDebug } from '../service/appConfig';
import { database } from '../service/database';
import { failedGetRequests } from '../service/request';
import { refreshCustomScript } from '../shared/utils/base/ui';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useAvatarProviderStore } from './avatarProvider';
import { useAvatarStore } from './avatar';
import { useFavoriteStore } from './favorite';
import { useFriendStore } from './friend';
import { useGameLogStore } from './gameLog';
import { useGameStore } from './game';
import { useGroupStore } from './group';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { usePhotonStore } from './photon';
import { useSearchStore } from './search';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { useVrcStatusStore } from './vrcStatus';
import { useWorldStore } from './world';
import { watchState } from '../service/watchState';
import { worldRequest } from '../api';

import configRepository from '../service/config';

export const useVrcxStore = defineStore('Vrcx', () => {
    const gameStore = useGameStore();
    const locationStore = useLocationStore();
    const notificationStore = useNotificationStore();
    const avatarStore = useAvatarStore();
    const worldStore = useWorldStore();
    const instanceStore = useInstanceStore();
    const friendStore = useFriendStore();
    const favoriteStore = useFavoriteStore();
    const groupStore = useGroupStore();
    const userStore = useUserStore();
    const photonStore = usePhotonStore();
    const advancedSettingsStore = useAdvancedSettingsStore();
    const searchStore = useSearchStore();
    const avatarProviderStore = useAvatarProviderStore();
    const gameLogStore = useGameLogStore();
    const updateLoopStore = useUpdateLoopStore();
    const vrcStatusStore = useVrcStatusStore();
    const { t } = useI18n();

    const state = reactive({
        databaseVersion: 0,
        locationX: 0,
        locationY: 0,
        sizeWidth: 800,
        sizeHeight: 600,
        windowState: '',
        externalNotifierVersion: 0
    });

    const currentlyDroppingFile = ref(null);
    const isRegistryBackupDialogVisible = ref(false);
    const ipcEnabled = ref(false);
    const clearVRCXCacheFrequency = ref(172800);
    const maxTableSize = ref(1000);
    const proxyServer = ref('');

    async function init() {
        if (LINUX) {
            window.electron.ipcRenderer.on('launch-command', (command) => {
                if (command) {
                    eventLaunchCommand(command);
                }
            });

            window.electron.onWindowPositionChanged((event, position) => {
                state.locationX = position.x;
                state.locationY = position.y;
                debounce(saveVRCXWindowOption, 300)();
            });

            window.electron.onWindowSizeChanged((event, size) => {
                state.sizeWidth = size.width;
                state.sizeHeight = size.height;
                debounce(saveVRCXWindowOption, 300)();
            });

            window.electron.onWindowStateChange((event, newState) => {
                state.windowState = newState.toString();
                debounce(saveVRCXWindowOption, 300)();
            });

            window.electron.onBrowserFocus(() => {
                vrcStatusStore.onBrowserFocus();
            });
        }

        state.databaseVersion = await configRepository.getInt(
            'VRCX_databaseVersion',
            0
        );
        updateDatabaseVersion();

        clearVRCXCacheFrequency.value = await configRepository.getInt(
            'VRCX_clearVRCXCacheFrequency',
            172800
        );

        if (!(await VRCXStorage.Get('VRCX_DatabaseLocation'))) {
            await VRCXStorage.Set('VRCX_DatabaseLocation', '');
        }
        if (!(await VRCXStorage.Get('VRCX_ProxyServer'))) {
            await VRCXStorage.Set('VRCX_ProxyServer', '');
        }
        if ((await VRCXStorage.Get('VRCX_DisableGpuAcceleration')) === '') {
            await VRCXStorage.Set('VRCX_DisableGpuAcceleration', 'false');
        }
        if (
            (await VRCXStorage.Get('VRCX_DisableVrOverlayGpuAcceleration')) ===
            ''
        ) {
            await VRCXStorage.Set(
                'VRCX_DisableVrOverlayGpuAcceleration',
                'false'
            );
        }
        proxyServer.value = await VRCXStorage.Get('VRCX_ProxyServer');
        state.locationX = parseInt(await VRCXStorage.Get('VRCX_LocationX'), 10);
        state.locationY = parseInt(await VRCXStorage.Get('VRCX_LocationY'), 10);
        state.sizeWidth = parseInt(await VRCXStorage.Get('VRCX_SizeWidth'), 10);
        state.sizeHeight = parseInt(
            await VRCXStorage.Get('VRCX_SizeHeight'),
            10
        );
        state.windowState = await VRCXStorage.Get('VRCX_WindowState');

        maxTableSize.value = await configRepository.getInt(
            'VRCX_maxTableSize',
            1000
        );
        if (maxTableSize.value > 10000) {
            maxTableSize.value = 1000;
        }
        database.setMaxTableSize(maxTableSize.value);

        refreshCustomScript();
    }

    init();

    async function updateDatabaseVersion() {
        // requires dbVars.userPrefix to be already set
        const databaseVersion = 13;
        let msgBox;
        if (state.databaseVersion < databaseVersion) {
            if (state.databaseVersion) {
                msgBox = ElMessage({
                    message:
                        'DO NOT CLOSE VRCX, database upgrade in progress...',
                    type: 'warning',
                    duration: 0
                });
            }
            console.log(
                `Updating database from ${state.databaseVersion} to ${databaseVersion}...`
            );
            try {
                await database.cleanLegendFromFriendLog(); // fix friendLog spammed with crap
                await database.fixGameLogTraveling(); // fix bug with gameLog location being set as traveling
                await database.fixNegativeGPS(); // fix GPS being a negative value due to VRCX bug with traveling
                await database.fixBrokenLeaveEntries(); // fix user instance timer being higher than current user location timer
                await database.fixBrokenGroupInvites(); // fix notification v2 in wrong table
                await database.fixBrokenNotifications(); // fix notifications being null
                await database.fixBrokenGroupChange(); // fix spam group left & name change
                await database.fixCancelFriendRequestTypo(); // fix CancelFriendRequst typo
                await database.fixBrokenGameLogDisplayNames(); // fix gameLog display names "DisplayName (userId)"
                await database.upgradeDatabaseVersion(); // update database version
                await database.vacuum(); // succ
                await database.optimize();
                await configRepository.setInt(
                    'VRCX_databaseVersion',
                    databaseVersion
                );
                console.log('Database update complete.');
                msgBox?.close();
                if (state.databaseVersion) {
                    // only display when database exists
                    ElMessage({
                        message: 'Database upgrade complete',
                        type: 'success'
                    });
                }
                state.databaseVersion = databaseVersion;
            } catch (err) {
                console.error(err);
                msgBox?.close();
                ElMessage({
                    message:
                        'Database upgrade failed, check console for details',
                    type: 'error',
                    duration: 120000
                });
                AppApi.ShowDevTools();
            }
        }
    }

    function clearVRCXCache() {
        failedGetRequests.clear();
        userStore.cachedUsers.forEach((ref, id) => {
            if (
                !friendStore.friends.has(id) &&
                !locationStore.lastLocation.playerList.has(ref.id) &&
                id !== userStore.currentUser.id
            ) {
                userStore.cachedUsers.delete(id);
            }
        });
        worldStore.cachedWorlds.forEach((ref, id) => {
            if (
                !favoriteStore.getCachedFavoritesByObjectId(id) &&
                ref.authorId !== userStore.currentUser.id &&
                !favoriteStore.localWorldFavoritesList.includes(id)
            ) {
                worldStore.cachedWorlds.delete(id);
            }
        });
        avatarStore.cachedAvatars.forEach((ref, id) => {
            if (
                !favoriteStore.getCachedFavoritesByObjectId(id) &&
                ref.authorId !== userStore.currentUser.id &&
                !favoriteStore.localAvatarFavoritesList.includes(id) &&
                !avatarStore.avatarHistory.includes(id)
            ) {
                avatarStore.cachedAvatars.delete(id);
            }
        });
        groupStore.cachedGroups.forEach((ref, id) => {
            if (!groupStore.currentUserGroups.has(id)) {
                groupStore.cachedGroups.delete(id);
            }
        });
        instanceStore.cachedInstances.forEach((ref, id) => {
            if (
                [...friendStore.friends.values()].some(
                    (f) => f.$location?.tag === id
                )
            ) {
                return;
            }
            // delete instances over an hour old
            if (Date.parse(ref.$fetchedAt) < Date.now() - 3600000) {
                instanceStore.cachedInstances.delete(id);
            }
        });
        avatarStore.cachedAvatarNames = new Map();
        userStore.customUserTags = new Map();
    }

    function eventVrcxMessage(data) {
        let entry;
        switch (data.MsgType) {
            case 'CustomTag':
                userStore.addCustomTag(data);
                break;
            case 'ClearCustomTags':
                userStore.customUserTags.forEach((value, key) => {
                    userStore.customUserTags.delete(key);
                    const ref = userStore.cachedUsers.get(key);
                    if (typeof ref !== 'undefined') {
                        ref.$customTag = '';
                        ref.$customTagColour = '';
                    }
                });
                break;
            case 'Noty':
                if (
                    photonStore.photonLoggingEnabled ||
                    (state.externalNotifierVersion &&
                        state.externalNotifierVersion > 21)
                ) {
                    return;
                }
                entry = {
                    created_at: new Date().toJSON(),
                    type: 'Event',
                    data: data.Data
                };
                database.addGamelogEventToDatabase(entry);
                notificationStore.queueGameLogNoty(entry);
                gameLogStore.addGameLog(entry);
                break;
            case 'External': {
                const displayName = data.DisplayName ?? '';
                const notify = data.notify ?? true;
                entry = {
                    created_at: new Date().toJSON(),
                    type: 'External',
                    message: data.Data,
                    displayName,
                    userId: data.UserId,
                    location: locationStore.lastLocation.location
                };
                database.addGamelogExternalToDatabase(entry);
                if (notify) {
                    notificationStore.queueGameLogNoty(entry);
                }
                gameLogStore.addGameLog(entry);
                break;
            }
            default:
                console.log('VRCXMessage:', data);
                break;
        }
    }

    async function saveVRCXWindowOption() {
        if (LINUX) {
            VRCXStorage.Set('VRCX_LocationX', state.locationX.toString());
            VRCXStorage.Set('VRCX_LocationY', state.locationY.toString());
            VRCXStorage.Set('VRCX_SizeWidth', state.sizeWidth.toString());
            VRCXStorage.Set('VRCX_SizeHeight', state.sizeHeight.toString());
            VRCXStorage.Set('VRCX_WindowState', state.windowState);
        }
    }

    async function processScreenshot(path) {
        let newPath = path;
        if (advancedSettingsStore.screenshotHelper) {
            const location = parseLocation(locationStore.lastLocation.location);
            const metadata = {
                application: 'VRCX',
                version: 1,
                author: {
                    id: userStore.currentUser.id,
                    displayName: userStore.currentUser.displayName
                },
                world: {
                    name: locationStore.lastLocation.name,
                    id: location.worldId,
                    instanceId: locationStore.lastLocation.location
                },
                players: []
            };
            for (const user of locationStore.lastLocation.playerList.values()) {
                metadata.players.push({
                    id: user.userId,
                    displayName: user.displayName
                });
            }
            newPath = await AppApi.AddScreenshotMetadata(
                path,
                JSON.stringify(metadata),
                location.worldId,
                advancedSettingsStore.screenshotHelperModifyFilename
            );
            if (!newPath) {
                console.error('Failed to add screenshot metadata', path);
                return;
            }
            console.log('Screenshot metadata added', newPath);
        }
        if (advancedSettingsStore.screenshotHelperCopyToClipboard) {
            await AppApi.CopyImageToClipboard(newPath);
            console.log('Screenshot copied to clipboard', newPath);
        }
    }

    // use in C# side
    function ipcEvent(json) {
        if (!watchState.isLoggedIn) {
            return;
        }
        let data;
        try {
            data = JSON.parse(json);
        } catch {
            console.log(`IPC invalid JSON, ${json}`);
            return;
        }

        switch (data.type) {
            case 'OnEvent':
                if (!gameStore.isGameRunning) {
                    console.log('Game closed, skipped event', data);
                    return;
                }
                if (AppDebug.debugPhotonLogging || AppDebug.debugIPC) {
                    console.log(
                        'OnEvent',
                        data.OnEventData.Code,
                        'Param[254]:',
                        data.OnEventData.Parameters?.[254],
                        data.OnEventData
                    );
                }
                photonStore.parsePhotonEvent(data.OnEventData, data.dt);
                photonStore.photonEventPulse();
                break;
            case 'OnOperationResponse':
                if (!gameStore.isGameRunning) {
                    console.log('Game closed, skipped event', data);
                    return;
                }
                if (AppDebug.debugPhotonLogging || AppDebug.debugIPC) {
                    console.log(
                        'OnOperationResponse',
                        data.OnOperationResponseData.OperationCode,
                        'Param[254]:',
                        data.OnOperationResponseData.Parameters?.[254],
                        data.OnOperationResponseData
                    );
                }
                photonStore.parseOperationResponse(
                    data.OnOperationResponseData,
                    data.dt
                );
                photonStore.photonEventPulse();
                break;
            case 'OnOperationRequest':
                if (!gameStore.isGameRunning) {
                    console.log('Game closed, skipped event', data);
                    return;
                }
                if (AppDebug.debugPhotonLogging || AppDebug.debugIPC) {
                    console.log(
                        'OnOperationRequest',
                        data.OnOperationRequestData.OperationCode,
                        data.OnOperationRequestData
                    );
                }
                break;
            case 'VRCEvent':
                if (!gameStore.isGameRunning) {
                    console.log('Game closed, skipped event', data);
                    return;
                }
                if (AppDebug.debugIPC) {
                    console.log('VRCEvent:', data);
                }
                photonStore.parseVRCEvent(data);
                photonStore.photonEventPulse();
                break;
            case 'Event7List':
                if (AppDebug.debugIPC) {
                    console.log('Event7List:', data);
                }
                photonStore.photonEvent7List.clear();
                for (const [id, dt] of Object.entries(data.Event7List)) {
                    photonStore.photonEvent7List.set(parseInt(id, 10), dt);
                }
                photonStore.photonLastEvent7List = Date.parse(data.dt);
                break;
            case 'VrcxMessage':
                if (AppDebug.debugPhotonLogging || AppDebug.debugIPC) {
                    console.log('VrcxMessage:', data);
                }
                eventVrcxMessage(data);
                break;
            case 'Ping':
                if (AppDebug.debugIPC) {
                    console.log('IPC Ping');
                }
                if (!photonStore.photonLoggingEnabled) {
                    photonStore.setPhotonLoggingEnabled();
                }
                ipcEnabled.value = true;
                updateLoopStore.ipcTimeout = 60; // 30 seconds
                break;
            case 'MsgPing':
                if (AppDebug.debugIPC) {
                    console.log('MsgPing:', data);
                }
                state.externalNotifierVersion = data.version;
                break;
            case 'LaunchCommand':
                eventLaunchCommand(data.command);
                break;
            case 'VRCXLaunch':
                console.log('VRCXLaunch:', data);
                break;
            default:
                console.log('IPC:', data);
        }
    }

    /**
     * This function is called by .NET(CefCustomDragHandler#CefCustomDragHandler) when a file is dragged over a drop zone in the app window.
     * @param {string} filePath - The full path to the file being dragged into the window
     */
    function dragEnterCef(filePath) {
        currentlyDroppingFile.value = filePath;
    }

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            isRegistryBackupDialogVisible.value = false;
            if (isLoggedIn) {
                startupLaunchCommand();
            }
        },
        { flush: 'sync' }
    );

    async function startupLaunchCommand() {
        const command = await AppApi.GetLaunchCommand();
        if (command) {
            eventLaunchCommand(command);
        }
    }

    function eventLaunchCommand(input) {
        if (!watchState.isLoggedIn) {
            return;
        }
        console.log('LaunchCommand:', input);
        const args = input.split('/');
        const command = args[0];
        const commandArg = args[1]?.trim();
        let shouldFocusWindow = true;
        switch (command) {
            case 'world':
                if (
                    !searchStore.directAccessWorld(input.replace('world/', ''))
                ) {
                    // fallback for mangled world ids
                    worldStore.showWorldDialog(commandArg);
                }
                break;
            case 'avatar':
                avatarStore.showAvatarDialog(commandArg);
                break;
            case 'user':
                userStore.showUserDialog(commandArg);
                break;
            case 'group':
                groupStore.showGroupDialog(commandArg);
                break;
            case 'local-favorite-world':
                console.log('local-favorite-world', commandArg);
                const [id, group] = commandArg.split(':');
                worldRequest.getCachedWorld({ worldId: id }).then((args1) => {
                    searchStore.directAccessWorld(id);
                    favoriteStore.addLocalWorldFavorite(id, group);
                    return args1;
                });
                break;
            case 'addavatardb':
                avatarProviderStore.addAvatarProvider(
                    input.replace('addavatardb/', '')
                );
                break;
            case 'switchavatar':
                const avatarId = commandArg;
                const regexAvatarId =
                    /avtr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
                if (!avatarId.match(regexAvatarId) || avatarId.length !== 41) {
                    ElMessage({
                        message: 'Invalid Avatar ID',
                        type: 'error'
                    });
                    break;
                }
                if (advancedSettingsStore.showConfirmationOnSwitchAvatar) {
                    avatarStore.selectAvatarWithConfirmation(avatarId);
                    // Makes sure the window is focused
                    shouldFocusWindow = true;
                } else {
                    avatarStore
                        .selectAvatarWithoutConfirmation(avatarId)
                        .then(() => {
                            new Noty({
                                type: 'success',
                                text: 'Avatar changed via launch command'
                            }).show();
                        });
                    shouldFocusWindow = false;
                }
                break;
            case 'import':
                const type = args[1];
                if (!type) break;
                const data = input.replace(`import/${type}/`, '');
                if (type === 'avatar') {
                    favoriteStore.avatarImportDialogInput = data;
                    favoriteStore.showAvatarImportDialog();
                } else if (type === 'world') {
                    favoriteStore.worldImportDialogInput = data;
                    favoriteStore.showWorldImportDialog();
                } else if (type === 'friend') {
                    favoriteStore.friendImportDialogInput = data;
                    favoriteStore.showFriendImportDialog();
                }
                break;
        }
        if (shouldFocusWindow) {
            AppApi.FocusWindow();
        }
    }

    async function backupVrcRegistry(name) {
        let regJson;
        try {
            if (WINDOWS) {
                regJson = await AppApi.GetVRChatRegistry();
            } else {
                regJson = await AppApi.GetVRChatRegistryJson();
                regJson = JSON.parse(regJson);
            }
        } catch (e) {
            console.error('Failed to get VRChat registry for backup:', e);
            return;
        }
        const newBackup = {
            name,
            date: new Date().toJSON(),
            data: regJson
        };
        let backupsJson = await configRepository.getString(
            'VRCX_VRChatRegistryBackups'
        );
        if (!backupsJson) {
            backupsJson = JSON.stringify([]);
        }
        const backups = JSON.parse(backupsJson);
        backups.push(newBackup);
        await configRepository.setString(
            'VRCX_VRChatRegistryBackups',
            JSON.stringify(backups)
        );
        // await this.updateRegistryBackupDialog();
    }

    async function checkAutoBackupRestoreVrcRegistry() {
        if (
            !advancedSettingsStore.vrcRegistryAutoBackup ||
            !advancedSettingsStore.vrcRegistryAskRestore
        ) {
            return;
        }

        // check for auto restore
        const hasVRChatRegistryFolder = await AppApi.HasVRChatRegistryFolder();
        if (!hasVRChatRegistryFolder) {
            const lastBackupDate = await configRepository.getString(
                'VRCX_VRChatRegistryLastBackupDate'
            );
            const lastRestoreCheck = await configRepository.getString(
                'VRCX_VRChatRegistryLastRestoreCheck'
            );
            if (
                !lastBackupDate ||
                (lastRestoreCheck &&
                    lastBackupDate &&
                    lastRestoreCheck === lastBackupDate)
            ) {
                // only ask to restore once and when backup is present
                return;
            }
            // popup message about auto restore
            ElMessageBox.alert(
                t('dialog.registry_backup.restore_prompt'),
                t('dialog.registry_backup.header')
            ).catch(() => {});
            showRegistryBackupDialog();
            await AppApi.FocusWindow();
            await configRepository.setString(
                'VRCX_VRChatRegistryLastRestoreCheck',
                lastBackupDate
            );
        } else {
            await tryAutoBackupVrcRegistry();
        }
    }

    function showRegistryBackupDialog() {
        isRegistryBackupDialogVisible.value = true;
    }

    async function tryAutoBackupVrcRegistry() {
        if (!advancedSettingsStore.vrcRegistryAutoBackup) {
            return;
        }
        const date = new Date();
        const lastBackupDate = await configRepository.getString(
            'VRCX_VRChatRegistryLastBackupDate'
        );
        if (lastBackupDate) {
            const lastBackup = new Date(lastBackupDate);
            const diff = date.getTime() - lastBackup.getTime();
            const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (diffDays < 3) {
                return;
            }
        }
        let backupsJson = await configRepository.getString(
            'VRCX_VRChatRegistryBackups'
        );
        if (!backupsJson) {
            backupsJson = JSON.stringify([]);
        }
        const backups = JSON.parse(backupsJson);
        for (let i = backups.length - 1; i >= 0; i--) {
            const backupDate = new Date(backups[i].date);
            // remove backups older than 2 weeks
            if (
                backups[i].name === 'Auto Backup' &&
                backupDate.getTime() < date.getTime() - 1209600000 // 2 weeks in milliseconds
            ) {
                backups.splice(i, 1);
            }
        }
        await configRepository.setString(
            'VRCX_VRChatRegistryBackups',
            JSON.stringify(backups)
        );
        backupVrcRegistry('Auto Backup');
        await configRepository.setString(
            'VRCX_VRChatRegistryLastBackupDate',
            date.toJSON()
        );
    }

    return {
        state,

        proxyServer,
        currentlyDroppingFile,
        isRegistryBackupDialogVisible,
        ipcEnabled,
        clearVRCXCacheFrequency,
        maxTableSize,
        clearVRCXCache,
        eventVrcxMessage,
        eventLaunchCommand,
        showRegistryBackupDialog,
        checkAutoBackupRestoreVrcRegistry,
        tryAutoBackupVrcRegistry,
        processScreenshot,
        ipcEvent,
        dragEnterCef,
        backupVrcRegistry,
        updateDatabaseVersion
    };
});
