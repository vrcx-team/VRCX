import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import { AppDebug } from '../service/appConfig';
import { branches } from '../shared/constants';
import { changeLogRemoveLinks } from '../shared/utils';
import { useUiStore } from './ui';

import configRepository from '../service/config';

import * as workerTimers from 'worker-timers';

export const useVRCXUpdaterStore = defineStore('VRCXUpdater', () => {
    const uiStore = useUiStore();
    const { t } = useI18n();

    const arch = ref('x64');

    const appVersion = ref('');
    const autoUpdateVRCX = ref('Auto Download');
    const latestAppVersion = ref('');
    const branch = ref('Stable');
    const vrcxId = ref('');
    const checkingForVRCXUpdate = ref(false);
    const VRCXUpdateDialog = ref({
        visible: false,
        updatePending: false,
        updatePendingIsLatest: false,
        release: '',
        releases: []
    });
    const changeLogDialog = ref({
        visible: false,
        buildName: '',
        changeLog: ''
    });
    const pendingVRCXUpdate = ref(false);
    const pendingVRCXInstall = ref('');
    const updateInProgress = ref(false);
    const updateProgress = ref(0);

    async function initVRCXUpdaterSettings() {
        if (!WINDOWS) {
            const archResult = await window.electron.getArch();
            console.log('Architecture:', archResult);
            arch.value = archResult;
        }

        const [VRCX_autoUpdateVRCX, VRCX_id] = await Promise.all([
            configRepository.getString('VRCX_autoUpdateVRCX', 'Auto Download'),
            configRepository.getString('VRCX_id', '')
        ]);

        if (VRCX_autoUpdateVRCX === 'Auto Install') {
            autoUpdateVRCX.value = 'Auto Download';
        } else {
            autoUpdateVRCX.value = VRCX_autoUpdateVRCX;
        }

        appVersion.value = await AppApi.GetVersion();
        vrcxId.value = VRCX_id;

        await initBranch();
        await loadVrcxId();

        if (await compareAppVersion()) {
            showChangeLogDialog();
        }
        if (autoUpdateVRCX.value !== 'Off') {
            await checkForVRCXUpdate();
        }
    }

    const currentVersion = computed(() =>
        appVersion.value.replace(' (Linux)', '')
    );

    /**
     * @param {string} value
     */
    async function setAutoUpdateVRCX(value) {
        if (value === 'Off') {
            pendingVRCXUpdate.value = false;
        }
        autoUpdateVRCX.value = value;
        await configRepository.setString('VRCX_autoUpdateVRCX', value);
    }
    /**
     * @param {string} value
     */
    function setLatestAppVersion(value) {
        latestAppVersion.value = value;
    }
    /**
     * @param {string} value
     */
    function setBranch(value) {
        branch.value = value;
        configRepository.setString('VRCX_branch', value);
    }

    async function initBranch() {
        if (!appVersion.value) {
            return;
        }
        if (currentVersion.value.includes('VRCX Nightly')) {
            branch.value = 'Nightly';
        } else {
            branch.value = 'Stable';
        }
        await configRepository.setString('VRCX_branch', branch.value);
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
            return branch.value === 'Stable' && lastVersion;
        }
        return false;
    }
    async function loadVrcxId() {
        if (!vrcxId.value) {
            vrcxId.value = crypto.randomUUID();
            await configRepository.setString('VRCX_id', vrcxId.value);
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
                asset.name.endsWith(`${arch.value}.AppImage`) &&
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
        if (branch.value === 'Beta') {
            // move Beta users to stable
            setBranch('Stable');
        }
        if (typeof branches[branch.value] === 'undefined') {
            // handle invalid branch
            setBranch('Stable');
        }
        const url = branches[branch.value].urlLatest;
        checkingForVRCXUpdate.value = true;
        let response;
        try {
            response = await webApiService.execute({
                url,
                method: 'GET',
                headers: {
                    'VRCX-ID': vrcxId.value
                }
            });
        } finally {
            checkingForVRCXUpdate.value = false;
        }
        if (response.status !== 200) {
            ElMessage({
                message: t('message.vrcx_updater.failed', {
                    message: `${response.status} ${response.data}`
                }),
                type: 'error'
            });
            return;
        }
        pendingVRCXUpdate.value = false;
        const json = JSON.parse(response.data);
        if (AppDebug.debugWebRequests) {
            console.log(json, response);
        }
        if (json === Object(json) && json.name && json.published_at) {
            changeLogDialog.value.buildName = json.name;
            changeLogDialog.value.changeLog = changeLogRemoveLinks(json.body);
            const releaseName = json.name;
            setLatestAppVersion(releaseName);
            VRCXUpdateDialog.value.updatePendingIsLatest = false;
            if (releaseName === pendingVRCXInstall.value) {
                // update already downloaded
                VRCXUpdateDialog.value.updatePendingIsLatest = true;
            } else if (releaseName > currentVersion.value) {
                const { downloadUrl, hashString, size } = getAssetOfInterest(
                    json.assets
                );
                if (!downloadUrl) {
                    return;
                }
                pendingVRCXUpdate.value = true;
                uiStore.notifyMenu('settings');
                if (autoUpdateVRCX.value === 'Notify') {
                    // this.showVRCXUpdateDialog();
                } else if (autoUpdateVRCX.value === 'Auto Download') {
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
        const D = VRCXUpdateDialog.value;
        D.visible = true;
        D.updatePendingIsLatest = false;
        D.updatePending = await AppApi.CheckForUpdateExe();
        if (updateInProgress.value) {
            return;
        }
        await loadBranchVersions();
    }

    async function loadBranchVersions() {
        const D = VRCXUpdateDialog.value;
        const url = branches[branch.value].urlReleases;
        checkingForVRCXUpdate.value = true;
        let response;
        try {
            response = await webApiService.execute({
                url,
                method: 'GET',
                headers: {
                    'VRCX-ID': vrcxId.value
                }
            });
        } finally {
            checkingForVRCXUpdate.value = false;
        }
        if (response.status !== 200) {
            ElMessage({
                message: t('message.vrcx_updater.failed', {
                    message: `${response.status} ${response.data}`
                }),
                type: 'error'
            });
            return;
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
        VRCXUpdateDialog.value.updatePendingIsLatest = false;
        if (D.release === pendingVRCXInstall.value) {
            // update already downloaded and latest version
            VRCXUpdateDialog.value.updatePendingIsLatest = true;
        }
        setBranch(branch.value);
    }
    async function downloadVRCXUpdate(
        downloadUrl,
        hashString,
        size,
        releaseName
    ) {
        if (updateInProgress.value) {
            return;
        }
        try {
            updateInProgress.value = true;
            await downloadFileProgress();
            await AppApi.DownloadUpdate(downloadUrl, hashString, size);
            pendingVRCXInstall.value = releaseName;
        } catch (err) {
            console.error(err);
            ElMessage({
                message: `${t('message.vrcx_updater.failed_install')} ${err}`,
                type: 'error'
            });
        } finally {
            updateInProgress.value = false;
            updateProgress.value = 0;
        }
    }
    async function downloadFileProgress() {
        updateProgress.value = await AppApi.CheckUpdateProgress();
        if (updateInProgress.value) {
            workerTimers.setTimeout(() => downloadFileProgress(), 150);
        }
    }
    function installVRCXUpdate() {
        for (const release of VRCXUpdateDialog.value.releases) {
            if (release.name !== VRCXUpdateDialog.value.release) {
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
        changeLogDialog.value.visible = true;
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
        if (updateProgress.value === 100) {
            return t('message.vrcx_updater.checking_hash');
        }
        return `${updateProgress.value}%`;
    }
    async function cancelUpdate() {
        await AppApi.CancelUpdate();
        updateInProgress.value = false;
        updateProgress.value = 0;
    }

    initVRCXUpdaterSettings();

    return {
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
