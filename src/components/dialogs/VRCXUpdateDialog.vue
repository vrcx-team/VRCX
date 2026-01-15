<template>
    <Dialog v-model:open="VRCXUpdateDialog.visible">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.vrcx_updater.header') }}</DialogTitle>
            </DialogHeader>
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
                    <Tabs :model-value="branch" class="w-full" @update:modelValue="handleBranchChange">
                        <TabsList class="grid w-full grid-cols-2">
                            <TabsTrigger value="Stable">{{ t('dialog.vrcx_updater.branch_stable') }}</TabsTrigger>
                            <TabsTrigger value="Nightly">{{ t('dialog.vrcx_updater.branch_nightly') }}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="Nightly">
                            <Alert variant="destructive">
                                <AlertCircle class="text-muted-foreground" />
                                <AlertTitle>{{ t('dialog.vrcx_updater.nightly_title') }}</AlertTitle>
                                <AlertDescription>
                                    {{ t('dialog.vrcx_updater.nightly_notice') }}
                                </AlertDescription>
                            </Alert>
                        </TabsContent>
                    </Tabs>
                    <FieldGroup class="mt-3">
                        <Field>
                            <FieldLabel>{{ t('dialog.vrcx_updater.release') }}</FieldLabel>
                            <FieldContent>
                                <Select
                                    :model-value="VRCXUpdateDialog.release"
                                    @update:modelValue="(v) => (VRCXUpdateDialog.release = v)">
                                    <SelectTrigger class="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="item in VRCXUpdateDialog.releases"
                                            :key="item.name"
                                            :value="item.name">
                                            {{ item.tag_name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>
                    </FieldGroup>
                    <div
                        v-if="!VRCXUpdateDialog.updatePending && VRCXUpdateDialog.release === appVersion"
                        class="mt-3 text-xs text-muted-foreground">
                        <span>{{ t('dialog.vrcx_updater.latest_version') }}</span>
                    </div>
                </template>
            </div>

            <DialogFooter>
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
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
    import { AlertCircle } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Progress } from '@/components/ui/progress';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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

    const handleBranchChange = (value) => {
        if (!value || value === branch.value) {
            return;
        }
        branch.value = value;
        loadBranchVersions();
    };
</script>
