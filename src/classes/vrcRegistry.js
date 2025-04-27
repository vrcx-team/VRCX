import configRepository from '../service/config.js';
import { baseClass, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {}

    _data = {};

    _methods = {
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
            // await this.updateRegistryBackupDialog();
        },

        // Because it is a startup func, it is not integrated into RegistryBackupDialog.vue now
        // func backupVrcRegistry is also split up
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
                    $utils.removeFromArray(backups, backup);
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
