import { baseClass, $app, API, $t, $utils } from './baseClass.js';

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
        }
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

        downloadVRCXUpdate(updateSetupUrl, updateHashUrl, size, name, type) {
            var ref = {
                id: 'VRCXUpdate',
                name
            };
            this.downloadQueue.set('VRCXUpdate', {
                ref,
                type,
                updateSetupUrl,
                updateHashUrl,
                size
            });
            this.downloadQueueTable.data = Array.from(
                this.downloadQueue.values()
            );
            if (!this.downloadInProgress) {
                this.downloadFileQueueUpdate();
            }
        },

        installVRCXUpdate() {
            for (var release of this.VRCXUpdateDialog.releases) {
                if (release.name === this.VRCXUpdateDialog.release) {
                    var downloadUrl = '';
                    var hashUrl = '';
                    var size = 0;
                    for (var asset of release.assets) {
                        if (asset.state !== 'uploaded') {
                            continue;
                        }
                        if (
                            asset.content_type === 'application/x-msdownload' ||
                            asset.content_type === 'application/x-msdos-program'
                        ) {
                            downloadUrl = asset.browser_download_url;
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
                    var name = release.name;
                    var type = 'Manual';
                    this.downloadVRCXUpdate(
                        downloadUrl,
                        hashUrl,
                        size,
                        name,
                        type
                    );
                    this.VRCXUpdateDialog.visible = false;
                    this.showDownloadDialog();
                }
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
            if (
                !this.appVersion ||
                this.appVersion === 'VRCX Nightly Build' ||
                this.appVersion === 'VRCX Build'
            ) {
                return;
            }
            if (this.branch === 'Beta') {
                // move Beta users to stable
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
                this.latestAppVersion = json.name;
                var name = json.name;
                this.VRCXUpdateDialog.updatePendingIsLatest = false;
                if (name === this.pendingVRCXInstall) {
                    // update already downloaded
                    this.VRCXUpdateDialog.updatePendingIsLatest = true;
                } else if (name > this.appVersion) {
                    var downloadUrl = '';
                    var hashUrl = '';
                    var size = 0;
                    for (var asset of json.assets) {
                        if (asset.state !== 'uploaded') {
                            continue;
                        }
                        if (
                            asset.content_type === 'application/x-msdownload' ||
                            asset.content_type === 'application/x-msdos-program'
                        ) {
                            downloadUrl = asset.browser_download_url;
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
                            hashUrl,
                            size,
                            name,
                            type
                        );
                    }
                }
            }
        },

        restartVRCX(isUpgrade) {
            AppApi.RestartApplication(isUpgrade);
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
