<template>
    <el-dialog
        :z-index="VRCXUpdateDialogIndex"
        class="x-dialog"
        v-model="VRCXUpdateDialog.visible"
        :title="t('dialog.vrcx_updater.header')"
        append-to-body
        width="400px">
        <div v-loading="checkingForVRCXUpdate" style="margin-top: 15px">
            <template v-if="updateInProgress">
                <Progress :model-value="updateProgress" class="w-full" />
                <div class="mt-2 text-xs" v-text="updateProgressText()"></div>
                <br />
            </template>
            <template v-else>
                <div v-if="VRCXUpdateDialog.updatePending" style="margin-bottom: 15px">
                    <span>{{ pendingVRCXInstall }}</span>
                    <br />
                    <span>{{ t('dialog.vrcx_updater.ready_for_update') }}</span>
                </div>
                <Select
                    :model-value="branch"
                    @update:modelValue="
                        (v) => {
                            branch = v;
                            loadBranchVersions();
                        }
                    ">
                    <SelectTrigger style="display: inline-flex; width: 150px; margin-right: 15px">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="b in branches" :key="b.name" :value="b.name">{{ b.name }}</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    :model-value="VRCXUpdateDialog.release"
                    @update:modelValue="(v) => (VRCXUpdateDialog.release = v)">
                    <SelectTrigger style="display: inline-flex; width: 150px">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="item in VRCXUpdateDialog.releases" :key="item.name" :value="item.name">
                            {{ item.tag_name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <div
                    v-if="!VRCXUpdateDialog.updatePending && VRCXUpdateDialog.release === appVersion"
                    style="margin-top: 15px">
                    <span>{{ t('dialog.vrcx_updater.latest_version') }}</span>
                </div>
            </template>
        </div>

        <template #footer>
            <Button variant="secondary" class="mr-2" v-if="updateInProgress" @click="cancelUpdate">
                {{ t('dialog.vrcx_updater.cancel') }}
            </Button>
            <Button
                variant="default"
                v-if="VRCXUpdateDialog.release !== pendingVRCXInstall"
                :disabled="updateInProgress"
                @click="installVRCXUpdate">
                {{ t('dialog.vrcx_updater.download') }}
            </Button>
            <Button variant="default" v-if="!updateInProgress && pendingVRCXInstall" @click="restartVRCX(true)">
                {{ t('dialog.vrcx_updater.install') }}
            </Button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { nextTick, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Progress } from '@/components/ui/progress';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
    import { branches } from '../../shared/constants';
    import { getNextDialogIndex } from '../../shared/utils/base/ui';
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

    const VRCXUpdateDialogIndex = ref(2000);

    watch(
        () => VRCXUpdateDialog,
        (newVal) => {
            if (newVal.value.visible) {
                nextTick(() => {
                    VRCXUpdateDialogIndex.value = getNextDialogIndex();
                });
            }
        }
    );
</script>
