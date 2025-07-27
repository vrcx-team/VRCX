<template>
    <safe-dialog
        ref="VRCXUpdateDialogRef"
        class="x-dialog"
        :visible.sync="VRCXUpdateDialog.visible"
        :title="t('dialog.vrcx_updater.header')"
        append-to-body
        width="400px">
        <div v-loading="checkingForVRCXUpdate" style="margin-top: 15px">
            <template v-if="updateInProgress">
                <el-progress :percentage="updateProgress" :format="updateProgressText"></el-progress>
                <br />
            </template>
            <template v-else>
                <div v-if="VRCXUpdateDialog.updatePending" style="margin-bottom: 15px">
                    <span>{{ pendingVRCXInstall }}</span>
                    <br />
                    <span>{{ t('dialog.vrcx_updater.ready_for_update') }}</span>
                </div>
                <el-select
                    v-model="branch"
                    style="display: inline-block; width: 150px; margin-right: 15px"
                    @change="loadBranchVersions">
                    <el-option v-for="b in branches" :key="b.name" :label="b.name" :value="b.name"> </el-option>
                </el-select>
                <el-select v-model="VRCXUpdateDialog.release" style="display: inline-block; width: 150px">
                    <el-option
                        v-for="item in VRCXUpdateDialog.releases"
                        :key="item.name"
                        :label="item.tag_name"
                        :value="item.name">
                    </el-option>
                </el-select>
                <div
                    v-if="!VRCXUpdateDialog.updatePending && VRCXUpdateDialog.release === appVersion"
                    style="margin-top: 15px">
                    <span>{{ t('dialog.vrcx_updater.latest_version') }}</span>
                </div>
            </template>
        </div>

        <template #footer>
            <el-button v-if="updateInProgress" type="primary" size="small" @click="cancelUpdate">
                {{ t('dialog.vrcx_updater.cancel') }}
            </el-button>
            <el-button
                v-if="VRCXUpdateDialog.release !== pendingVRCXInstall"
                :disabled="updateInProgress"
                type="primary"
                size="small"
                @click="installVRCXUpdate">
                {{ t('dialog.vrcx_updater.download') }}
            </el-button>
            <el-button
                v-if="!updateInProgress && pendingVRCXInstall"
                type="primary"
                size="small"
                @click="restartVRCX(true)">
                {{ t('dialog.vrcx_updater.install') }}
            </el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { nextTick, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { branches } from '../../shared/constants';
    import { adjustDialogZ } from '../../shared/utils';
    import { useVRCXUpdaterStore } from '../../stores';

    const VRCXUpdaterStore = useVRCXUpdaterStore();

    const {
        appVersion,
        branch,
        checkingForVRCXUpdate,
        VRCXUpdateDialog,
        pendingVRCXInstall,
        updateInProgress,
        updateProgress
    } = storeToRefs(VRCXUpdaterStore);
    const { installVRCXUpdate, loadBranchVersions, restartVRCX, updateProgressText, cancelUpdate } = VRCXUpdaterStore;

    const { t } = useI18n();

    const VRCXUpdateDialogRef = ref(null);

    watch(
        () => VRCXUpdateDialog,
        (newVal) => {
            if (newVal.value.visible) {
                nextTick(() => {
                    adjustDialogZ(VRCXUpdateDialogRef.value.$el);
                });
            }
        }
    );
</script>
