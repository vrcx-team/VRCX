import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { logWebRequest } from '../services/appConfig';
import { branches } from '../shared/constants';
import {
    getLatestWhatsNewRelease,
    getWhatsNewRelease,
    normalizeReleaseVersion
} from '../shared/constants/whatsNewReleases';
import { changeLogRemoveLinks } from '../shared/utils';

import configRepository from '../services/config';

import * as workerTimers from 'worker-timers';

const emptyWhatsNewDialog = () => ({
    visible: false,
    titleKey: '',
    subtitleKey: '',
    items: []
});

export const useVRCXUpdaterStore = defineStore('VRCXUpdater', () => {
    const { t } = useI18n();

    const arch = ref('x64');
    const noUpdater = ref(false);
    const isMacOS = computed(() => navigator.platform.includes('Mac'));

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
    const whatsNewDialog = ref(emptyWhatsNewDialog());
    const pendingVRCXUpdate = ref(false);
    const pendingVRCXInstall = ref('');
    const updateInProgress = ref(false);
    const updateProgress = ref(0);
    const updateToastRelease = ref('');

    async function initVRCXUpdaterSettings() {
        if (LINUX) {
            arch.value = await window.electron.getArch();
            noUpdater.value = await window.electron.getNoUpdater();
            console.log('Architecture:', arch.value);
        }
        if (isMacOS.value) {
            noUpdater.value = true;
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
        if (noUpdater.value) {
            autoUpdateVRCX.value = 'Off';
        }

        appVersion.value = await AppApi.GetVersion();
        vrcxId.value = VRCX_id;

        await initBranch();
        await loadVrcxId();

        let checkedForUpdatesDuringAnnouncement = false;
        if (await shouldAnnounceCurrentVersion()) {
            const shown = await showWhatsNewDialog();
            if (shown) {
                await markCurrentVersionAsSeen();
            } else if (isRecognizedStableReleaseVersion()) {
                const result = await showChangeLogDialog({ prefetch: true });
                checkedForUpdatesDuringAnnouncement = result.checkedForUpdates;
                if (result.shown) {
                    await markCurrentVersionAsSeen();
                }
            }
        } else {
            await syncCurrentVersionState();
        }
        if (
            autoUpdateVRCX.value !== 'Off' &&
            !checkedForUpdatesDuringAnnouncement
        ) {
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

    async function hasVersionChanged() {
        const lastVersion = await configRepository.getString(
            'VRCX_lastVRCXVersion',
            ''
        );
        return lastVersion !== currentVersion.value;
    }

    async function markCurrentVersionAsSeen() {
        await configRepository.setString(
            'VRCX_lastVRCXVersion',
            currentVersion.value
        );
    }

    async function syncCurrentVersionState() {
        if (await hasVersionChanged()) {
            await markCurrentVersionAsSeen();
            return true;
        }
        return false;
    }

    async function shouldAnnounceCurrentVersion() {
        if (branch.value !== 'Stable' || !isRecognizedStableReleaseVersion()) {
            return false;
        }
        const lastVersion = await configRepository.getString(
            'VRCX_lastVRCXVersion',
            ''
        );
        return Boolean(lastVersion) && lastVersion !== currentVersion.value;
    }

    function isRecognizedStableReleaseVersion() {
        return Boolean(normalizeReleaseVersion(currentVersion.value));
    }

    /**
     * @returns {Promise<boolean>}
     */
    async function showWhatsNewDialog() {
        const release = getWhatsNewRelease(currentVersion.value);

        if (!release) {
            whatsNewDialog.value = emptyWhatsNewDialog();
            return false;
        }

        whatsNewDialog.value = {
            visible: true,
            titleKey: release.titleKey,
            subtitleKey: release.subtitleKey,
            items: release.items.map((item) => ({ ...item }))
        };

        return true;
    }

    /**
     * @returns {boolean}
     */
    function showLatestWhatsNewDialog() {
        const release = getLatestWhatsNewRelease();

        if (!release) {
            return false;
        }

        whatsNewDialog.value = {
            visible: true,
            titleKey: release.titleKey,
            subtitleKey: release.subtitleKey,
            items: release.items.map((item) => ({ ...item }))
        };

        return true;
    }

    function closeWhatsNewDialog() {
        whatsNewDialog.value.visible = false;
    }

    async function openChangeLogDialogOnly() {
        changeLogDialog.value.visible = true;
        if (
            !changeLogDialog.value.buildName ||
            !changeLogDialog.value.changeLog
        ) {
            await checkForVRCXUpdate();
        }
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
            return false;
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
        let json;
        try {
            response = await webApiService.execute({
                url,
                method: 'GET',
                headers: {
                    'VRCX-ID': vrcxId.value
                }
            });
            json = JSON.parse(response.data);
        } catch (error) {
            console.error('Failed to check for VRCX update', error);
            return false;
        } finally {
            checkingForVRCXUpdate.value = false;
        }
        if (response.status !== 200) {
            toast.error(
                t('message.vrcx_updater.failed', {
                    message: `${response.status} ${response.data}`
                })
            );
            return false;
        }
        pendingVRCXUpdate.value = false;
        logWebRequest('[EXTERNAL GET]', url, `(${response.status})`, json);
        if (json === Object(json) && json.name && json.published_at) {
            changeLogDialog.value.buildName = json.name;
            changeLogDialog.value.changeLog = changeLogRemoveLinks(json.body);
            const releaseName = json.name;
            setLatestAppVersion(releaseName);
            VRCXUpdateDialog.value.updatePendingIsLatest = false;
            if (autoUpdateVRCX.value === 'Off') {
                return true;
            }
            if (releaseName === pendingVRCXInstall.value) {
                // update already downloaded
                VRCXUpdateDialog.value.updatePendingIsLatest = true;
            } else if (releaseName > currentVersion.value) {
                const { downloadUrl, hashString, size } = getAssetOfInterest(
                    json.assets
                );
                if (!downloadUrl) {
                    return true;
                }
                pendingVRCXUpdate.value = true;
                if (updateToastRelease.value !== releaseName) {
                    updateToastRelease.value = releaseName;
                    toast(t('nav_menu.update_available'), {
                        description: releaseName,
                        duration: 5000,
                        action: {
                            label: t('nav_menu.update'),
                            onClick: () => showVRCXUpdateDialog()
                        }
                    });
                }
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
            return true;
        }
        return false;
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
        let json;
        try {
            response = await webApiService.execute({
                url,
                method: 'GET',
                headers: {
                    'VRCX-ID': vrcxId.value
                }
            });
            json = JSON.parse(response.data);
        } catch (error) {
            console.error('Failed to check for VRCX update', error);
            return;
        } finally {
            checkingForVRCXUpdate.value = false;
        }
        if (response.status !== 200) {
            toast.error(
                t('message.vrcx_updater.failed', {
                    message: `${response.status} ${response.data}`
                })
            );
            return;
        }
        logWebRequest('[EXTERNAL GET]', url, `(${response.status})`, json);
        const releases = [];
        if (typeof json !== 'object' || json.message) {
            toast.error(
                t('message.vrcx_updater.failed', {
                    message: json.message
                })
            );
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
            toast.error(`${t('message.vrcx_updater.failed_install')} ${err}`);
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
    async function showChangeLogDialog(options = {}) {
        const { prefetch = false } = options;

        if (prefetch) {
            const loaded = await ensureChangeLogReady();
            if (!loaded) {
                return { shown: false, checkedForUpdates: true };
            }
            changeLogDialog.value.visible = true;
            return { shown: true, checkedForUpdates: true };
        }

        changeLogDialog.value.visible = true;
        void ensureChangeLogReady();
        return { shown: true, checkedForUpdates: true };
    }

    async function ensureChangeLogReady() {
        if (
            changeLogDialog.value.buildName &&
            changeLogDialog.value.changeLog
        ) {
            return true;
        }
        return checkForVRCXUpdate();
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
        whatsNewDialog,
        pendingVRCXUpdate,
        pendingVRCXInstall,
        updateInProgress,
        updateProgress,
        noUpdater,

        setAutoUpdateVRCX,
        setBranch,

        showWhatsNewDialog,
        showLatestWhatsNewDialog,
        closeWhatsNewDialog,
        openChangeLogDialogOnly,
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
