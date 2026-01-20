<template>
    <Dialog :open="isLaunchOptionsDialogVisible" @update:open="(open) => (open ? null : closeDialog())">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.launch_options.header') }}</DialogTitle>
            </DialogHeader>
            <div style="font-size: 12px">
                {{ t('dialog.launch_options.description') }} <br />
                {{ t('dialog.launch_options.example') }}
                <div>--fps=144</div>
                <div>--enable-debug-gui</div>
                <div>--enable-sdk-log-levels</div>
                <div>--enable-udon-debug-logging</div>
            </div>

            <InputGroupTextareaField
                v-model="launchOptionsDialog.launchArguments"
                :autosize="{ minRows: 2, maxRows: 5 }"
                :rows="2"
                placeholder="e.g. --fps=144 --enable-sdk-log-levels"
                input-class="resize-none" />

            <template v-if="!isLinux">
                <div class="text-sm">
                    {{ t('dialog.launch_options.path_override') }}
                </div>

                <InputGroupTextareaField
                    v-model="launchOptionsDialog.vrcLaunchPathOverride"
                    placeholder="C:\Program Files (x86)\Steam\steamapps\common\VRChat"
                    :rows="1"
                    class="mb-4"
                    spellcheck="false"
                    data-gramm="false"
                    input-class="resize-none min-h-0" />
            </template>

            <DialogFooter>
                <div class="flex items-center justify-between w-full">
                    <div>
                        <Button
                            variant="outline"
                            class="mr-2"
                            @click="openExternalLink('https://docs.vrchat.com/docs/launch-options')">
                            {{ t('dialog.launch_options.vrchat_docs') }}
                        </Button>
                        <Button
                            variant="outline"
                            @click="openExternalLink('https://docs.unity3d.com/Manual/CommandLineArguments.html')">
                            {{ t('dialog.launch_options.unity_manual') }}
                        </Button>
                    </div>
                    <Button @click="updateLaunchOptions">
                        {{ t('dialog.launch_options.save') }}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { Badge } from '../../../components/ui/badge';
    import { openExternalLink } from '../../../shared/utils';
    import { useLaunchStore } from '../../../stores';

    import configRepository from '../../../service/config';

    const { t } = useI18n();

    const launchStore = useLaunchStore();
    const { isLaunchOptionsDialogVisible } = storeToRefs(launchStore);

    const launchOptionsDialog = ref({
        launchArguments: '',
        vrcLaunchPathOverride: ''
    });

    const isLinux = computed(() => LINUX);

    function init() {
        configRepository
            .getString('launchArguments')
            .then((launchArguments) => (launchOptionsDialog.value.launchArguments = launchArguments));

        configRepository.getString('vrcLaunchPathOverride').then((vrcLaunchPathOverride) => {
            if (vrcLaunchPathOverride === null || vrcLaunchPathOverride === 'null') {
                launchOptionsDialog.value.vrcLaunchPathOverride = '';
                configRepository.setString('vrcLaunchPathOverride', '');
            } else {
                launchOptionsDialog.value.vrcLaunchPathOverride = vrcLaunchPathOverride;
            }
        });
    }

    // created
    init();

    function updateLaunchOptions() {
        const D = launchOptionsDialog.value;
        D.launchArguments = String(D.launchArguments).replace(/\s+/g, ' ').trim();
        configRepository.setString('launchArguments', D.launchArguments);
        if (
            D.vrcLaunchPathOverride &&
            D.vrcLaunchPathOverride.endsWith('.exe') &&
            !D.vrcLaunchPathOverride.endsWith('launch.exe')
        ) {
            toast.error(t('message.launch.invalid_path'));
            return;
        }
        configRepository.setString('vrcLaunchPathOverride', D.vrcLaunchPathOverride);
        toast.success('Updated launch options');
        closeDialog();
    }

    function closeDialog() {
        isLaunchOptionsDialogVisible.value = false;
    }
</script>
