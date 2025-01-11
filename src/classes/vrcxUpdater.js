import { baseClass, $app, API, $t, $utils } from './baseClass.js';
import * as workerTimers from 'worker-timers';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    _data = {
        VRCXUpdateDialog: {
            visible: false,
            updatePending: false,
            updatePendingIsLatest: false,
            release: '',
            releases: [],
            json: {}
        },
        branch: 'Stable',
        autoUpdateVRCX: 'Auto Download',
        checkingForVRCXUpdate: false,
        pendingVRCXInstall: '',
        pendingVRCXUpdate: false,
        branches: {
            Stable: {
                name: 'Stable',
                urlReleases: 'https://api0.vrcx.app/releases/stable',
                urlLatest: 'https://api0.vrcx.app/releases/stable/latest'
            },
            Nightly: {
                name: 'Nightly',
                urlReleases: 'https://api0.vrcx.app/releases/nightly',
                urlLatest: 'https://api0.vrcx.app/releases/nightly/latest'
            }
            // LinuxTest: {
            //     name: 'LinuxTest',
            //     urlReleases: 'https://api.github.com/repos/rs189/VRCX/releases',
            //     urlLatest:
            //         'https://api.github.com/repos/rs189/VRCX/releases/latest'
            // }
        },
        updateProgress: 0,
        updateInProgress: false
    };

    _methods = {
        async showVRCXUpdateDialog() {
            this.$nextTick(() =>
                $app.adjustDialogZ(this.$refs.VRCXUpdateDialog.$el)
            );
            var D = this.VRCXUpdateDialog;
            D.visible = true;
            D.updatePendingIsLatest = false;
            D.updatePending = await AppApi.CheckForUpdateExe();
            this.loadBranchVersions();
        },

        async downloadVRCXUpdate(
            downloadUrl,
            downloadName,
            hashUrl,
            size,
            releaseName,
            type
        ) {
            if (this.updateInProgress) {
                return;
            }
            try {
                this.updateInProgress = true;
                this.downloadFileProgress();
                await AppApi.DownloadUpdate(
                    downloadUrl,
                    downloadName,
                    hashUrl,
                    size
                );
                this.pendingVRCXInstall = releaseName;
            } catch (err) {
                console.error(err);
                this.$message({
                    message: `${$t('message.vrcx_updater.failed_install')} ${err}`,
                    type: 'error'
                });
            } finally {
                this.updateInProgress = false;
                this.updateProgress = 0;
            }
        },

        async cancelUpdate() {
            await AppApi.CancelUpdate();
            this.updateInProgress = false;
            this.updateProgress = 0;
        },

        async downloadFileProgress() {
            this.updateProgress = await AppApi.CheckUpdateProgress();
            if (this.updateInProgress) {
                workerTimers.setTimeout(() => this.downloadFileProgress(), 150);
            }
        },

        updateProgressText() {
            if (this.updateProgress === 100) {
                return $t('message.vrcx_updater.checking_hash');
            }
            return `${this.updateProgress}%`;
        },

        installVRCXUpdate() {
            for (var release of this.VRCXUpdateDialog.releases) {
                if (release.name !== this.VRCXUpdateDialog.release) {
                    continue;
                }
                var downloadUrl = '';
                var downloadName = '';
                var hashUrl = '';
                var size = 0;
                for (var asset of release.assets) {
                    if (asset.state !== 'uploaded') {
                        continue;
                    }
                    if (
                        WINDOWS &&
                        (asset.content_type === 'application/x-msdownload' ||
                            asset.content_type ===
                                'application/x-msdos-program')
                    ) {
                        downloadUrl = asset.browser_download_url;
                        downloadName = asset.name;
                        size = asset.size;
                        continue;
                    }
                    if (
                        LINUX &&
                        asset.content_type === 'application/octet-stream'
                    ) {
                        downloadUrl = asset.browser_download_url;
                        downloadName = asset.name;
                        size = asset.size;
                        continue;
                    }
                    if (
                        asset.name === 'SHA256SUMS.txt' &&
                        asset.content_type === 'text/plain'
                    ) {
                        hashUrl = asset.browser_download_url;
                        continue;
                    }
                }
                if (!downloadUrl) {
                    return;
                }
                var releaseName = release.name;
                var type = 'Manual';
                this.downloadVRCXUpdate(
                    downloadUrl,
                    downloadName,
                    hashUrl,
                    size,
                    releaseName,
                    type
                );
                break;
            }
        },

        async loadBranchVersions() {
            var D = this.VRCXUpdateDialog;
            var url = this.branches[this.branch].urlReleases;
            this.checkingForVRCXUpdate = true;
            try {
                var response = await webApiService.execute({
                    url,
                    method: 'GET'
                });
            } finally {
                this.checkingForVRCXUpdate = false;
            }
            var json = JSON.parse(response.data);
            if (this.debugWebRequests) {
                console.log(json, response);
            }
            var releases = [];
            if (typeof json !== 'object' || json.message) {
                $app.$message({
                    message: $t('message.vrcx_updater.failed', {
                        message: json.message
                    }),
                    type: 'error'
                });
                return;
            }
            for (var release of json) {
                for (var asset of release.assets) {
                    if (
                        (asset.content_type === 'application/x-msdownload' ||
                            asset.content_type ===
                                'application/x-msdos-program') &&
                        asset.state === 'uploaded'
                    ) {
                        releases.push(release);
                    }
                }
            }
            D.releases = releases;
            D.release = json[0].name;
            this.VRCXUpdateDialog.updatePendingIsLatest = false;
            if (D.release === this.pendingVRCXInstall) {
                // update already downloaded and latest version
                this.VRCXUpdateDialog.updatePendingIsLatest = true;
            }
            if (
                (await configRepository.getString('VRCX_branch')) !==
                this.branch
            ) {
                await configRepository.setString('VRCX_branch', this.branch);
            }
        },

        async checkForVRCXUpdate() {
            var currentVersion = this.appVersion.replace(' (Linux)', '');
            if (
                !currentVersion ||
                currentVersion === 'VRCX Nightly Build' ||
                currentVersion === 'VRCX Build'
            ) {
                // ignore custom builds
                return;
            }
            if (this.branch === 'Beta') {
                // move Beta users to stable
                this.branch = 'Stable';
                await configRepository.setString('VRCX_branch', this.branch);
            }
            if (typeof this.branches[this.branch] === 'undefined') {
                // handle invalid branch
                this.branch = 'Stable';
                await configRepository.setString('VRCX_branch', this.branch);
            }
            var url = this.branches[this.branch].urlLatest;
            this.checkingForVRCXUpdate = true;
            try {
                var response = await webApiService.execute({
                    url,
                    method: 'GET'
                });
            } finally {
                this.checkingForVRCXUpdate = false;
            }
            this.pendingVRCXUpdate = false;
            var json = JSON.parse(response.data);
            if (this.debugWebRequests) {
                console.log(json, response);
            }
            if (json === Object(json) && json.name && json.published_at) {
                this.VRCXUpdateDialog.updateJson = json;
                this.changeLogDialog.buildName = json.name;
                this.changeLogDialog.changeLog = this.changeLogRemoveLinks(
                    json.body
                );
                var releaseName = json.name;
                this.latestAppVersion = releaseName;
                this.VRCXUpdateDialog.updatePendingIsLatest = false;
                if (releaseName === this.pendingVRCXInstall) {
                    // update already downloaded
                    this.VRCXUpdateDialog.updatePendingIsLatest = true;
                } else if (releaseName > currentVersion) {
                    var downloadUrl = '';
                    var downloadName = '';
                    var hashUrl = '';
                    var size = 0;
                    for (var asset of json.assets) {
                        if (asset.state !== 'uploaded') {
                            continue;
                        }
                        if (
                            !LINUX &&
                            (asset.content_type ===
                                'application/x-msdownload' ||
                                asset.content_type ===
                                    'application/x-msdos-program')
                        ) {
                            downloadUrl = asset.browser_download_url;
                            downloadName = asset.name;
                            size = asset.size;
                            continue;
                        }
                        if (
                            LINUX &&
                            asset.content_type === 'application/octet-stream'
                        ) {
                            downloadUrl = asset.browser_download_url;
                            downloadName = asset.name;
                            size = asset.size;
                            continue;
                        }
                        if (
                            asset.name === 'SHA256SUMS.txt' &&
                            asset.content_type === 'text/plain'
                        ) {
                            hashUrl = asset.browser_download_url;
                            continue;
                        }
                    }
                    if (!downloadUrl) {
                        return;
                    }
                    this.pendingVRCXUpdate = true;
                    this.notifyMenu('settings');
                    var type = 'Auto';
                    if (!API.isLoggedIn) {
                        this.showVRCXUpdateDialog();
                    } else if (this.autoUpdateVRCX === 'Notify') {
                        // this.showVRCXUpdateDialog();
                    } else if (this.autoUpdateVRCX === 'Auto Download') {
                        this.downloadVRCXUpdate(
                            downloadUrl,
                            downloadName,
                            hashUrl,
                            size,
                            releaseName,
                            type
                        );
                    }
                }
            }
        },

        restartVRCX(isUpgrade) {
            if (!LINUX) {
                AppApi.RestartApplication(isUpgrade);
            } else {
                window.electron.restartApp();
            }
        },

        async saveAutoUpdateVRCX() {
            if (this.autoUpdateVRCX === 'Off') {
                this.pendingVRCXUpdate = false;
            }
            await configRepository.setString(
                'VRCX_autoUpdateVRCX',
                this.autoUpdateVRCX
            );
        }
    };
}
