<template>
    <safe-dialog
        class="x-dialog"
        :visible="ossDialog"
        :title="t('dialog.open_source.header')"
        width="650px"
        @close="closeDialog">
        <div v-once style="height: 350px; overflow: hidden scroll; word-break: break-all">
            <div>
                <span>{{ t('dialog.open_source.description') }}</span>
            </div>

            <div v-for="lib in openSourceSoftwareLicenses" :key="lib.name" style="margin-top: 15px">
                <p style="font-weight: bold">{{ lib.name }}</p>
                <pre style="font-size: 12px; white-space: pre-line">{{ lib.licenseText }}</pre>
            </div>
        </div>
    </safe-dialog>
</template>

<script setup>
    import { useI18n } from 'vue-i18n-bridge';
    import { openSourceSoftwareLicenses } from '../../../composables/setting/constants/openSourceSoftwareLicenses';

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
