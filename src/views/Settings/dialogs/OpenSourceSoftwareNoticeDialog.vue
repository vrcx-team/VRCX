<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible="ossDialog"
        :title="t('dialog.open_source.header')"
        width="650px"
        @close="closeDialog"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
        <div v-once style="height: 350px; overflow: hidden scroll; word-break: break-all">
            <div>
                <span>{{ t('dialog.open_source.description') }} }}</span>
            </div>

            <div v-for="lib in openSourceSoftwareLicenses" :key="lib.name" style="margin-top: 15px">
                <p style="font-weight: bold">{{ lib.name }}</p>
                <pre style="font-size: 12px; white-space: pre-line">{{ lib.licenseText }}</pre>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
    import { inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { openSourceSoftwareLicenses } from '../../../composables/settings/constants/openSourceSoftwareLicenses';

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');

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
