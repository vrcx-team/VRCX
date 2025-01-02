import configRepository from '../repository/config.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {}

    _data = {
        registryBackupDialog: {
            visible: false
        },

        registryBackupTable: {
            data: [],
            tableProps: {
                stripe: true,
                size: 'mini',
                defaultSort: {
                    prop: 'date',
                    order: 'descending'
                }
            },
            layout: 'table'
        }
    };

    _methods = {
        showRegistryBackupDialog() {
            this.$nextTick(() =>
                $app.adjustDialogZ(this.$refs.registryBackupDialog.$el)
            );
            var D = this.registryBackupDialog;
            D.visible = true;
            this.updateRegistryBackupDialog();
        },

        async updateRegistryBackupDialog() {
            var D = this.registryBackupDialog;
            this.registryBackupTable.data = [];
            if (!D.visible) {
                return;
            }
            var backupsJson = await configRepository.getString(
                'VRCX_VRChatRegistryBackups'
            );
            if (!backupsJson) {
                backupsJson = JSON.stringify([]);
            }
            this.registryBackupTable.data = JSON.parse(backupsJson);
        },

        async promptVrcRegistryBackupName() {
            var name = await this.$prompt(
                'Enter a name for the backup',
                'Backup Name',
                {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    inputPattern: /\S+/,
                    inputErrorMessage: 'Name is required',
                    inputValue: 'Backup'
                }
            );
            if (name.action === 'confirm') {
                this.backupVrcRegistry(name.value);
            }
        },

        async backupVrcRegistry(name) {
            var regJson;
            if (LINUX) {
                regJson = await AppApi.GetVRChatRegistryJson();
                regJson = JSON.parse(regJson);
            } else {
                regJson = await AppApi.GetVRChatRegistry();
            }
            var newBackup = {
                name,
                date: new Date().toJSON(),
                data: regJson
            };
            var backupsJson = await configRepository.getString(
                'VRCX_VRChatRegistryBackups'
            );
            if (!backupsJson) {
                backupsJson = JSON.stringify([]);
            }
            var backups = JSON.parse(backupsJson);
            backups.push(newBackup);
            await configRepository.setString(
                'VRCX_VRChatRegistryBackups',
                JSON.stringify(backups)
            );
            await this.updateRegistryBackupDialog();
        },

        async deleteVrcRegistryBackup(row) {
            var backups = this.registryBackupTable.data;
            $app.removeFromArray(backups, row);
            await configRepository.setString(
                'VRCX_VRChatRegistryBackups',
                JSON.stringify(backups)
            );
            await this.updateRegistryBackupDialog();
        },

        restoreVrcRegistryBackup(row) {
            this.$confirm('Continue? Restore Backup', 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'warning',
                callback: (action) => {
                    if (action !== 'confirm') {
                        return;
                    }
                    var data = JSON.stringify(row.data);
                    AppApi.SetVRChatRegistry(data)
                        .then(() => {
                            this.$message({
                                message: 'VRC registry settings restored',
                                type: 'success'
                            });
                        })
                        .catch((e) => {
                            console.error(e);
                            this.$message({
                                message: `Failed to restore VRC registry settings, check console for full error: ${e}`,
                                type: 'error'
                            });
                        });
                }
            });
        },

        saveVrcRegistryBackupToFile(row) {
            this.downloadAndSaveJson(row.name, row.data);
        },

        async openJsonFileSelectorDialogElectron() {
            return new Promise((resolve) => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                fileInput.onchange = function(event) {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function() {
                            fileInput.remove();
                            resolve(reader.result);
                        };
                        reader.readAsText(file);
                    } else {
                        fileInput.remove();
                        resolve(null);
                    }
                };
                
                fileInput.click();
            });
        },

        async restoreVrcRegistryFromFile() {
            if (WINDOWS) {
                var filePath = await AppApi.OpenFileSelectorDialog(null, ".json", "JSON Files (*.json)|*.json");
                if (filePath === "") {
                    return;
                }
            }

            var json;
            if (LINUX) {
                json = await this.openJsonFileSelectorDialogElectron();
            } else {
                json = await AppApi.ReadVrcRegJsonFile(filePath);
            }
            
            try {
                var data = JSON.parse(json);
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid JSON');
                }
                // quick check to make sure it's a valid registry backup
                for (var key in data) {
                    var value = data[key];
                    if (
                        typeof value !== 'object' ||
                        typeof value.type !== 'number' ||
                        typeof value.data === 'undefined'
                    ) {
                        throw new Error('Invalid JSON');
                    }
                }
                AppApi.SetVRChatRegistry(json)
                    .then(() => {
                        this.$message({
                            message: 'VRC registry settings restored',
                            type: 'success'
                        });
                    })
                    .catch((e) => {
                        console.error(e);
                        this.$message({
                            message: `Failed to restore VRC registry settings, check console for full error: ${e}`,
                            type: 'error'
                        });
                    });
            } catch {
                this.$message({
                    message: 'Invalid JSON',
                    type: 'error'
                });
            }
        },

        deleteVrcRegistry() {
            this.$confirm('Continue? Delete VRC Registry Settings', 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'warning',
                callback: (action) => {
                    if (action !== 'confirm') {
                        return;
                    }
                    AppApi.DeleteVRChatRegistryFolder().then(() => {
                        this.$message({
                            message: 'VRC registry settings deleted',
                            type: 'success'
                        });
                    });
                }
            });
        },

        clearVrcRegistryDialog() {
            this.registryBackupTable.data = [];
        },

        async checkAutoBackupRestoreVrcRegistry() {
            if (!this.vrcRegistryAutoBackup) {
                return;
            }

            // check for auto restore
            var hasVRChatRegistryFolder =
                await AppApi.HasVRChatRegistryFolder();
            if (!hasVRChatRegistryFolder) {
                var lastBackupDate = await configRepository.getString(
                    'VRCX_VRChatRegistryLastBackupDate'
                );
                var lastRestoreCheck = await configRepository.getString(
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
                this.$alert(
                    $t('dialog.registry_backup.restore_prompt'),
                    $t('dialog.registry_backup.header')
                );
                this.showRegistryBackupDialog();
                await AppApi.FocusWindow();
                await configRepository.setString(
                    'VRCX_VRChatRegistryLastRestoreCheck',
                    lastBackupDate
                );
            } else {
                await this.autoBackupVrcRegistry();
            }
        },

        async autoBackupVrcRegistry() {
            var date = new Date();
            var lastBackupDate = await configRepository.getString(
                'VRCX_VRChatRegistryLastBackupDate'
            );
            if (lastBackupDate) {
                var lastBackup = new Date(lastBackupDate);
                var diff = date.getTime() - lastBackup.getTime();
                var diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
                if (diffDays < 7) {
                    return;
                }
            }
            var backupsJson = await configRepository.getString(
                'VRCX_VRChatRegistryBackups'
            );
            if (!backupsJson) {
                backupsJson = JSON.stringify([]);
            }
            var backups = JSON.parse(backupsJson);
            backups.forEach((backup) => {
                if (backup.name === 'Auto Backup') {
                    // remove old auto backup
                    $app.removeFromArray(backups, backup);
                }
            });
            await configRepository.setString(
                'VRCX_VRChatRegistryBackups',
                JSON.stringify(backups)
            );
            this.backupVrcRegistry('Auto Backup');
            await configRepository.setString(
                'VRCX_VRChatRegistryLastBackupDate',
                date.toJSON()
            );
        }
    };
}
