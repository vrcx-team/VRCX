import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import * as workerTimers from 'worker-timers';
import configRepository from '../service/config';
import { branches } from '../shared/constants';
import { changeLogRemoveLinks } from '../shared/utils';
import { useUiStore } from './ui';
import { useI18n } from 'vue-i18n';
import { AppDebug } from '../service/appConfig';

export const useVRCXUpdaterStore = defineStore('VRCXUpdater', () => {
    const uiStore = useUiStore();
    const { t } = useI18n();

    const state = reactive({
        arch: 'x64',
        appVersion: '',
        autoUpdateVRCX: 'Auto Download',
        latestAppVersion: '',
        branch: 'Stable',
        vrcxId: '',
        checkingForVRCXUpdate: false,
        VRCXUpdateDialog: {
            visible: false,
            updatePending: false,
            updatePendingIsLatest: false,
            release: '',
            releases: []
        },
        changeLogDialog: {
            visible: false,
            buildName: '',
            changeLog: ''
        },
        pendingVRCXUpdate: false,
        pendingVRCXInstall: '',

        updateInProgress: false,
        updateProgress: 0
    });

    async function initVRCXUpdaterSettings() {
        if (!WINDOWS) {
            const arch = await window.electron.getArch();
            console.log('Architecture:', arch);
            state.arch = arch;
        }

        const [autoUpdateVRCX, vrcxId] = await Promise.all([
            configRepository.getString('VRCX_autoUpdateVRCX', 'Auto Download'),
            configRepository.getString('VRCX_id', '')
        ]);

        if (autoUpdateVRCX === 'Auto Install') {
            state.autoUpdateVRCX = 'Auto Download';
        } else {
            state.autoUpdateVRCX = autoUpdateVRCX;
        }

        state.appVersion = await AppApi.GetVersion();
        state.vrcxId = vrcxId;

        await initBranch();
        await loadVrcxId();

        if (await compareAppVersion()) {
            showChangeLogDialog();
        }
        if (state.autoUpdateVRCX !== 'Off') {
            await checkForVRCXUpdate();
        }
    }

    const appVersion = computed(() => state.appVersion);
    const autoUpdateVRCX = computed(() => state.autoUpdateVRCX);
    const latestAppVersion = computed(() => state.latestAppVersion);
    const branch = computed({
        get: () => state.branch,
        set: (value) => {
            state.branch = value;
        }
    });
    const currentVersion = computed(() =>
        state.appVersion.replace(' (Linux)', '')
    );
    const vrcxId = computed(() => state.vrcxId);
    const checkingForVRCXUpdate = computed({
        get: () => state.checkingForVRCXUpdate,
        set: (value) => {
            state.checkingForVRCXUpdate = value;
        }
    });
    const VRCXUpdateDialog = computed({
        get: () => state.VRCXUpdateDialog,
        set: (value) => {
            state.VRCXUpdateDialog = { ...state.VRCXUpdateDialog, ...value };
        }
    });
    const changeLogDialog = computed({
        get: () => state.changeLogDialog,
        set: (value) => {
            state.changeLogDialog = value;
        }
    });
    const pendingVRCXUpdate = computed({
        get: () => state.pendingVRCXUpdate,
        set: (value) => {
            state.pendingVRCXUpdate = value;
        }
    });
    const pendingVRCXInstall = computed({
        get: () => state.pendingVRCXInstall,
        set: (value) => {
            state.pendingVRCXInstall = value;
        }
    });
    const updateInProgress = computed({
        get: () => state.updateInProgress,
        set: (value) => {
            state.updateInProgress = value;
        }
    });
    const updateProgress = computed({
        get: () => state.updateProgress,
        set: (value) => {
            state.updateProgress = value;
        }
    });

    /**
     * @param {string} value
     */
    async function setAutoUpdateVRCX(value) {
        if (value === 'Off') {
            state.pendingVRCXUpdate = false;
        }
        state.autoUpdateVRCX = value;
        await configRepository.setString('VRCX_autoUpdateVRCX', value);
    }
    /**
     * @param {string} value
     */
    function setLatestAppVersion(value) {
        state.latestAppVersion = value;
    }
    /**
     * @param {string} value
     */
    function setBranch(value) {
        state.branch = value;
        configRepository.setString('VRCX_branch', value);
    }

    async function initBranch() {
        if (!state.appVersion) {
            return;
        }
        if (currentVersion.value.includes('VRCX Nightly')) {
            state.branch = 'Nightly';
        } else {
            state.branch = 'Stable';
        }
        await configRepository.setString('VRCX_branch', state.branch);
    }

    async function compareAppVersion() {
        const lastVersion = await configRepository.getString(
            'VRCX_lastVRCXVersion',
            ''
        );
        if (lastVersion !== currentVersion.value) {
            await configRepository.setString(
                'VRCX_lastVRCXVersion',
                currentVersion.value
            );
            return state.branch === 'Stable' && lastVersion;
        }
        return false;
    }
    async function loadVrcxId() {
        if (!state.vrcxId) {
            state.vrcxId = crypto.randomUUID();
            await configRepository.setString('VRCX_id', state.vrcxId);
        }
    }
    function getAssetOfInterest(assets) {
        let downloadUrl = '';
        let hashString = '';
        let size = 0;
        for (const asset of assets) {
            if (asset.state !== 'uploaded') {
                continue;
            }
            if (
                WINDOWS &&
                asset.name.endsWith('.exe') &&
                (asset.content_type === 'application/x-msdownload' ||
                    asset.content_type === 'application/x-msdos-program')
            ) {
                downloadUrl = asset.browser_download_url;
                if (asset.digest && asset.digest.startsWith('sha256:')) {
                    hashString = asset.digest.replace('sha256:', '');
                }
                size = asset.size;
                break;
            }
            if (
                LINUX &&
                asset.name.endsWith(`${state.arch}.AppImage`) &&
                asset.content_type === 'application/octet-stream'
            ) {
                downloadUrl = asset.browser_download_url;
                if (asset.digest && asset.digest.startsWith('sha256:')) {
                    hashString = asset.digest.replace('sha256:', '');
                }
                size = asset.size;
                break;
            }
        }
        return { downloadUrl, hashString, size };
    }
    async function checkForVRCXUpdate() {
        if (
            !currentVersion.value ||
            currentVersion.value === 'VRCX Nightly Build' ||
            currentVersion.value === 'VRCX Build'
        ) {
            // ignore custom builds
            return;
        }
        if (state.branch === 'Beta') {
            // move Beta users to stable
            setBranch('Stable');
        }
        if (typeof branches[state.branch] === 'undefined') {
            // handle invalid branch
            setBranch('Stable');
        }
        const url = branches[state.branch].urlLatest;
        state.checkingForVRCXUpdate = true;
        let response;
        try {
            response = await webApiService.execute({
                url,
                method: 'GET',
                headers: {
                    'VRCX-ID': state.vrcxId
                }
            });
        } finally {
            state.checkingForVRCXUpdate = false;
        }
        state.pendingVRCXUpdate = false;
        const json = JSON.parse(response.data);
        if (AppDebug.debugWebRequests) {
            console.log(json, response);
        }
        if (json === Object(json) && json.name && json.published_at) {
            state.changeLogDialog.buildName = json.name;
            state.changeLogDialog.changeLog = changeLogRemoveLinks(json.body);
            const releaseName = json.name;
            setLatestAppVersion(releaseName);
            state.VRCXUpdateDialog.updatePendingIsLatest = false;
            if (releaseName === state.pendingVRCXInstall) {
                // update already downloaded
                state.VRCXUpdateDialog.updatePendingIsLatest = true;
            } else if (releaseName > currentVersion.value) {
                const { downloadUrl, hashString, size } = getAssetOfInterest(
                    json.assets
                );
                if (!downloadUrl) {
                    return;
                }
                state.pendingVRCXUpdate = true;
                uiStore.notifyMenu('settings');
                if (state.autoUpdateVRCX === 'Notify') {
                    // this.showVRCXUpdateDialog();
                } else if (state.autoUpdateVRCX === 'Auto Download') {
                    await downloadVRCXUpdate(
                        downloadUrl,
                        hashString,
                        size,
                        releaseName
                    );
                }
            }
        }
    }
    async function showVRCXUpdateDialog() {
        const D = state.VRCXUpdateDialog;
        D.visible = true;
        D.updatePendingIsLatest = false;
        D.updatePending = await AppApi.CheckForUpdateExe();
        if (state.updateInProgress) {
            return;
        }
        await loadBranchVersions();
    }

    async function loadBranchVersions() {
        const D = state.VRCXUpdateDialog;
        const url = branches[state.branch].urlReleases;
        state.checkingForVRCXUpdate = true;
        let response;
        try {
            response = await webApiService.execute({
                url,
                method: 'GET',
                headers: {
                    'VRCX-ID': state.vrcxId
                }
            });
        } finally {
            state.checkingForVRCXUpdate = false;
        }
        const json = JSON.parse(response.data);
        if (AppDebug.debugWebRequests) {
            console.log(json, response);
        }
        const releases = [];
        if (typeof json !== 'object' || json.message) {
            ElMessage({
                message: t('message.vrcx_updater.failed', {
                    message: json.message
                }),
                type: 'error'
            });
            return;
        }
        for (const release of json) {
            if (release.prerelease) {
                continue;
            }
            assetLoop: for (const asset of release.assets) {
                if (asset.state === 'uploaded') {
                    releases.push(release);
                    break assetLoop;
                }
            }
        }
        D.releases = releases;
        D.release = json[0].name;
        state.VRCXUpdateDialog.updatePendingIsLatest = false;
        if (D.release === state.pendingVRCXInstall) {
            // update already downloaded and latest version
            state.VRCXUpdateDialog.updatePendingIsLatest = true;
        }
        setBranch(state.branch);
    }
    async function downloadVRCXUpdate(
        downloadUrl,
        hashString,
        size,
        releaseName
    ) {
        if (state.updateInProgress) {
            return;
        }
        try {
            state.updateInProgress = true;
            await downloadFileProgress();
            await AppApi.DownloadUpdate(downloadUrl, hashString, size);
            state.pendingVRCXInstall = releaseName;
        } catch (err) {
            console.error(err);
            ElMessage({
                message: `${t('message.vrcx_updater.failed_install')} ${err}`,
                type: 'error'
            });
        } finally {
            state.updateInProgress = false;
            state.updateProgress = 0;
        }
    }
    async function downloadFileProgress() {
        state.updateProgress = await AppApi.CheckUpdateProgress();
        if (state.updateInProgress) {
            workerTimers.setTimeout(() => downloadFileProgress(), 150);
        }
    }
    function installVRCXUpdate() {
        for (const release of state.VRCXUpdateDialog.releases) {
            if (release.name !== state.VRCXUpdateDialog.release) {
                continue;
            }
            const { downloadUrl, hashString, size } = getAssetOfInterest(
                release.assets
            );
            if (!downloadUrl) {
                return;
            }
            const releaseName = release.name;
            downloadVRCXUpdate(downloadUrl, hashString, size, releaseName);
            break;
        }
    }
    function showChangeLogDialog() {
        state.changeLogDialog.visible = true;
        checkForVRCXUpdate();
    }
    function restartVRCX(isUpgrade) {
        if (!LINUX) {
            AppApi.RestartApplication(isUpgrade);
        } else {
            window.electron.restartApp();
        }
    }
    function updateProgressText() {
        if (state.updateProgress === 100) {
            return t('message.vrcx_updater.checking_hash');
        }
        return `${state.updateProgress}%`;
    }
    async function cancelUpdate() {
        await AppApi.CancelUpdate();
        state.updateInProgress = false;
        state.updateProgress = 0;
    }

    initVRCXUpdaterSettings();

    return {
        state,

        appVersion,
        autoUpdateVRCX,
        latestAppVersion,
        branch,
        currentVersion,
        vrcxId,
        checkingForVRCXUpdate,
        VRCXUpdateDialog,
        changeLogDialog,
        pendingVRCXUpdate,
        pendingVRCXInstall,
        updateInProgress,
        updateProgress,

        setAutoUpdateVRCX,
        setBranch,

        compareAppVersion,
        checkForVRCXUpdate,
        loadBranchVersions,
        installVRCXUpdate,
        showVRCXUpdateDialog,
        showChangeLogDialog,
        restartVRCX,
        updateProgressText,
        cancelUpdate
    };
});
