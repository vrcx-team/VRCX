<template>
    <safe-dialog
        class="x-dialog"
        :visible="isRegistryBackupDialogVisible"
        :title="t('dialog.registry_backup.header')"
        width="600px"
        @close="closeDialog"
        @closed="clearVrcRegistryDialog">
        <div style="margin-top: 10px">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px">
                <span class="name" style="margin-right: 24px">{{ t('dialog.registry_backup.auto_backup') }}</span>
                <el-switch v-model="vrcRegistryAutoBackup" @change="setVrcRegistryAutoBackup"></el-switch>
            </div>
            <div
                style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 12px;
                    margin-top: 5px;
                ">
                <span class="name" style="margin-right: 24px">{{ t('dialog.registry_backup.ask_to_restore') }}</span>
                <el-switch v-model="vrcRegistryAskRestore" @change="setVrcRegistryAskRestore"></el-switch>
            </div>
            <data-tables v-bind="registryBackupTable" style="margin-top: 10px">
                <el-table-column :label="t('dialog.registry_backup.name')" prop="name"></el-table-column>
                <el-table-column :label="t('dialog.registry_backup.date')" prop="date">
                    <template #default="scope">
                        <span>{{ formatDateFilter(scope.row.date, 'long') }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('dialog.registry_backup.action')" width="90" align="right">
                    <template #default="scope">
                        <el-tooltip
                            placement="top"
                            :content="t('dialog.registry_backup.restore')"
                            :disabled="hideTooltips">
                            <el-button
                                type="text"
                                icon="el-icon-upload2"
                                size="mini"
                                @click="restoreVrcRegistryBackup(scope.row)"></el-button>
                        </el-tooltip>
                        <el-tooltip
                            placement="top"
                            :content="t('dialog.registry_backup.save_to_file')"
                            :disabled="hideTooltips">
                            <el-button
                                type="text"
                                icon="el-icon-download"
                                size="mini"
                                @click="saveVrcRegistryBackupToFile(scope.row)"></el-button>
                        </el-tooltip>
                        <el-tooltip
                            placement="top"
                            :content="t('dialog.registry_backup.delete')"
                            :disabled="hideTooltips">
                            <el-button
                                type="text"
                                icon="el-icon-delete"
                                size="mini"
                                @click="deleteVrcRegistryBackup(scope.row)"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </data-tables>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px">
                <el-button type="danger" size="small" @click="deleteVrcRegistry">{{
                    t('dialog.registry_backup.reset')
                }}</el-button>
                <div>
                    <el-button size="small" @click="promptVrcRegistryBackupName">{{
                        t('dialog.registry_backup.backup')
                    }}</el-button>
                    <el-button size="small" @click="restoreVrcRegistryFromFile">{{
                        t('dialog.registry_backup.restore_from_file')
                    }}</el-button>
                </div>
            </div>
        </div>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import configRepository from '../../../service/config';
    import { downloadAndSaveJson, removeFromArray, formatDateFilter } from '../../../shared/utils';

    import { useAppearanceSettingsStore, useVrcxStore, useAdvancedSettingsStore } from '../../../stores';

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { backupVrcRegistry } = useVrcxStore();
    const { isRegistryBackupDialogVisible } = storeToRefs(useVrcxStore());
    const { vrcRegistryAutoBackup, vrcRegistryAskRestore } = storeToRefs(useAdvancedSettingsStore());
    const { setVrcRegistryAutoBackup, setVrcRegistryAskRestore } = useAdvancedSettingsStore();

    const { t } = useI18n();

    const instance = getCurrentInstance();
    const { $confirm, $message, $prompt } = instance.proxy;

    const registryBackupTable = ref({
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
    });

    watch(
        () => isRegistryBackupDialogVisible.value,
        (newVal) => {
            if (newVal) {
                updateRegistryBackupDialog();
            }
        }
    );

    async function updateRegistryBackupDialog() {
        const backupsJson = await configRepository.getString('VRCX_VRChatRegistryBackups');
        registryBackupTable.value.data = JSON.parse(backupsJson || '[]');
    }

    function restoreVrcRegistryBackup(row) {
        $confirm('Continue? Restore Backup', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'warning',
            callback: (action) => {
                if (action !== 'confirm') {
                    return;
                }
                const data = JSON.stringify(row.data);
                AppApi.SetVRChatRegistry(data)
                    .then(() => {
                        $message({
                            message: 'VRC registry settings restored',
                            type: 'success'
                        });
                    })
                    .catch((e) => {
                        console.error(e);
                        $message({
                            message: `Failed to restore VRC registry settings, check console for full error: ${e}`,
                            type: 'error'
                        });
                    });
            }
        });
    }

    function saveVrcRegistryBackupToFile(row) {
        downloadAndSaveJson(row.name, row.data);
    }

    async function deleteVrcRegistryBackup(row) {
        const backups = registryBackupTable.value.data;
        removeFromArray(backups, row);
        await configRepository.setString('VRCX_VRChatRegistryBackups', JSON.stringify(backups));
        await updateRegistryBackupDialog();
    }

    function deleteVrcRegistry() {
        $confirm('Continue? Delete VRC Registry Settings', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'warning',
            callback: (action) => {
                if (action !== 'confirm') {
                    return;
                }
                AppApi.DeleteVRChatRegistryFolder().then(() => {
                    $message({
                        message: 'VRC registry settings deleted',
                        type: 'success'
                    });
                });
            }
        });
    }

    async function handleBackupVrcRegistry(name) {
        await backupVrcRegistry(name);
        await updateRegistryBackupDialog();
    }

    async function promptVrcRegistryBackupName() {
        const name = await $prompt('Enter a name for the backup', 'Backup Name', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'Name is required',
            inputValue: 'Backup'
        });
        if (name.action === 'confirm') {
            await handleBackupVrcRegistry(name.value);
        }
    }

    async function openJsonFileSelectorDialogElectron() {
        return new Promise((resolve) => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            fileInput.onchange = function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function () {
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
    }

    async function restoreVrcRegistryFromFile() {
        const filePath = await AppApi.OpenFileSelectorDialog(null, '.json', 'JSON Files (*.json)|*.json');
        if (WINDOWS) {
            if (filePath === '') {
                return;
            }
        }

        let json;
        if (LINUX) {
            json = await openJsonFileSelectorDialogElectron();
        } else {
            json = await AppApi.ReadVrcRegJsonFile(filePath);
        }

        try {
            const data = JSON.parse(json);
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid JSON');
            }
            // quick check to make sure it's a valid registry backup
            for (const key in data) {
                const value = data[key];
                if (typeof value !== 'object' || typeof value.type !== 'number' || typeof value.data === 'undefined') {
                    throw new Error('Invalid JSON');
                }
            }
            AppApi.SetVRChatRegistry(json)
                .then(() => {
                    $message({
                        message: 'VRC registry settings restored',
                        type: 'success'
                    });
                })
                .catch((e) => {
                    console.error(e);
                    $message({
                        message: `Failed to restore VRC registry settings, check console for full error: ${e}`,
                        type: 'error'
                    });
                });
        } catch {
            $message({
                message: 'Invalid JSON',
                type: 'error'
            });
        }
    }

    function clearVrcRegistryDialog() {
        registryBackupTable.value.data = [];
    }

    function closeDialog() {
        isRegistryBackupDialogVisible.value = false;
    }
</script>
