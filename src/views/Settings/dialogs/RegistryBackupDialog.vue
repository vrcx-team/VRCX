<template>
    <el-dialog
        class="x-dialog"
        :model-value="isRegistryBackupDialogVisible"
        :title="t('dialog.registry_backup.header')"
        width="600px"
        @close="closeDialog"
        @closed="clearVrcRegistryDialog">
        <div style="margin-top: 10px">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px">
                <span class="name" style="margin-right: 24px">{{ t('dialog.registry_backup.auto_backup') }}</span>
                <Switch :model-value="vrcRegistryAutoBackup" @update:modelValue="setVrcRegistryAutoBackup" />
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
                <Switch :model-value="vrcRegistryAskRestore" @update:modelValue="setVrcRegistryAskRestore" />
            </div>
            <DataTable v-bind="registryBackupTable" style="margin-top: 10px">
                <el-table-column :label="t('dialog.registry_backup.name')" prop="name"></el-table-column>
                <el-table-column :label="t('dialog.registry_backup.date')" prop="date">
                    <template #default="scope">
                        <span>{{ formatDateFilter(scope.row.date, 'long') }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('dialog.registry_backup.action')" width="90" align="right">
                    <template #default="scope">
                        <TooltipWrapper side="top" :content="t('dialog.registry_backup.restore')">
                            <Button
                                size="sm"
                                variant="ghost"
                                class="button-pd-0"
                                @click="restoreVrcRegistryBackup(scope.row)">
                                <RotateCcw
                            /></Button>
                        </TooltipWrapper>
                        <TooltipWrapper side="top" :content="t('dialog.registry_backup.save_to_file')">
                            <Button
                                size="icon-sm"
                                variant="ghost"
                                class="button-pd-0"
                                @click="saveVrcRegistryBackupToFile(scope.row)">
                                <Download
                            /></Button>
                        </TooltipWrapper>
                        <TooltipWrapper side="top" :content="t('dialog.registry_backup.delete')">
                            <Button
                                size="icon-sm"
                                variant="ghost"
                                class="button-pd-0"
                                @click="deleteVrcRegistryBackup(scope.row)"
                                ><Trash2
                            /></Button>
                        </TooltipWrapper>
                    </template>
                </el-table-column>
            </DataTable>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px">
                <Button size="sm" variant="destructive" @click="deleteVrcRegistry">{{
                    t('dialog.registry_backup.reset')
                }}</Button>
                <div>
                    <Button size="sm" variant="outline" @click="promptVrcRegistryBackupName">{{
                        t('dialog.registry_backup.backup')
                    }}</Button>
                    <Button size="sm" variant="outline" @click="restoreVrcRegistryFromFile">{{
                        t('dialog.registry_backup.restore_from_file')
                    }}</Button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
    import { Download, RotateCcw, Trash2 } from 'lucide-vue-next';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { downloadAndSaveJson, formatDateFilter, removeFromArray } from '../../../shared/utils';
    import { useAdvancedSettingsStore, useVrcxStore } from '../../../stores';
    import { Switch } from '../../../components/ui/switch';

    import configRepository from '../../../service/config';

    const { backupVrcRegistry } = useVrcxStore();
    const { isRegistryBackupDialogVisible } = storeToRefs(useVrcxStore());
    const { vrcRegistryAutoBackup, vrcRegistryAskRestore } = storeToRefs(useAdvancedSettingsStore());
    const { setVrcRegistryAutoBackup, setVrcRegistryAskRestore } = useAdvancedSettingsStore();

    const { t } = useI18n();

    const registryBackupTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'small',
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
        ElMessageBox.confirm('Continue? Restore Backup', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'warning'
        })
            .then((action) => {
                if (action !== 'confirm') {
                    return;
                }
                const data = JSON.stringify(row.data);
                AppApi.SetVRChatRegistry(data)
                    .then(() => {
                        toast.success('VRC registry settings restored');
                    })
                    .catch((e) => {
                        console.error(e);
                        toast.error(`Failed to restore VRC registry settings, check console for full error: ${e}`);
                    });
            })
            .catch(() => {});
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
        ElMessageBox.confirm('Continue? Delete VRC Registry Settings', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'warning'
        })
            .then((action) => {
                if (action !== 'confirm') {
                    return;
                }
                AppApi.DeleteVRChatRegistryFolder().then(() => {
                    toast.success('VRC registry settings deleted');
                });
            })
            .catch(() => {});
    }

    async function handleBackupVrcRegistry(name) {
        await backupVrcRegistry(name);
        await updateRegistryBackupDialog();
    }

    function promptVrcRegistryBackupName() {
        ElMessageBox.prompt('Enter a name for the backup', 'Backup Name', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'Name is required',
            inputValue: 'Backup'
        })
            .then(({ value }) => {
                handleBackupVrcRegistry(value);
            })
            .catch(() => {});
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
                    toast.success('VRC registry settings restored');
                })
                .catch((e) => {
                    console.error(e);
                    toast.error(`Failed to restore VRC registry settings, check console for full error: ${e}`);
                });
        } catch {
            toast.error('Invalid JSON');
        }
    }

    function clearVrcRegistryDialog() {
        registryBackupTable.value.data = [];
    }

    function closeDialog() {
        isRegistryBackupDialogVisible.value = false;
    }
</script>

<style scoped>
    .button-pd-0 {
        padding: 0;
    }
</style>
