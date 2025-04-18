<template>
    <el-dialog
        ref="VRCXUpdateDialogRef"
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible.sync="VRCXUpdateDialog.visible"
        :title="t('dialog.vrcx_updater.header')"
        width="400px"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
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
                    v-model="currentBranch"
                    style="display: inline-block; width: 150px; margin-right: 15px"
                    @change="loadBranchVersions">
                    <el-option v-for="branch in branches" :key="branch.name" :label="branch.name" :value="branch.name">
                    </el-option>
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
    </el-dialog>
</template>

<script setup>
    import { ref, computed, inject, watch, nextTick } from 'vue';

    import { useI18n } from 'vue-i18n-bridge';

    const { t } = useI18n();
    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');
    const adjustDialogZ = inject('adjustDialogZ');

    const props = defineProps({
        // eslint-disable-next-line vue/prop-name-casing
        VRCXUpdateDialog: {
            type: Object,
            required: true
        },
        appVersion: {
            type: String,
            required: true
        },
        checkingForVRCXUpdate: {
            type: Boolean,
            default: false
        },
        updateInProgress: {
            type: Boolean,
            default: false
        },
        updateProgress: {
            type: Number,
            default: 0
        },
        updateProgressText: {
            type: Function,
            default: () => ''
        },
        pendingVRCXInstall: {
            type: String,
            default: ''
        },
        branch: {
            type: String,
            default: ''
        },
        branches: {
            type: Object,
            default: () => {}
        }
    });

    const VRCXUpdateDialogRef = ref(null);

    const emit = defineEmits([
        'loadBranchVersions',
        'cancelUpdate',
        'installVRCXUpdate',
        'restartVRCX',
        'update:branch'
    ]);

    const currentBranch = computed({
        get: () => props.branch,
        set: (value) => {
            emit('update:branch', value);
        }
    });

    watch(
        () => props.VRCXUpdateDialog,
        (newVal) => {
            if (newVal.visible) {
                nextTick(() => {
                    adjustDialogZ(VRCXUpdateDialogRef.value.$el);
                });
            }
        }
    );

    function loadBranchVersions(event) {
        emit('loadBranchVersions', event);
    }

    function cancelUpdate() {
        emit('cancelUpdate');
    }

    function installVRCXUpdate() {
        emit('installVRCXUpdate');
    }

    function restartVRCX(isUpgrade) {
        emit('restartVRCX', isUpgrade);
    }
</script>
