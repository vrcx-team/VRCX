<template>
    <Dialog :open="ossDialog" @update:open="(open) => !open && closeDialog()">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.open_source.header') }}</DialogTitle>
            </DialogHeader>
            <div v-once style="height: 350px; overflow: hidden scroll; word-break: break-all">
                <div>
                    <span>{{ t('dialog.open_source.description') }}</span>
                </div>

                <div v-for="lib in openSourceSoftwareLicenses" :key="lib.name" style="margin-top: 15px">
                    <p style="font-weight: bold">{{ lib.name }}</p>
                    <pre style="font-size: 12px; white-space: pre-line">{{ lib.licenseText }}</pre>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { useI18n } from 'vue-i18n';

    import { openSourceSoftwareLicenses } from '../../../shared/constants/ossLicenses';

    const { t } = useI18n();

    defineProps({
        ossDialog: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:ossDialog']);

    function closeDialog() {
        emit('update:ossDialog', false);
    }
</script>
