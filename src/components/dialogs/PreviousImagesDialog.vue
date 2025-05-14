<template>
    <safe-dialog
        class="x-dialog"
        :visible="previousImagesDialogVisible"
        :title="t('dialog.previous_images.header')"
        width="800px"
        append-to-body
        @close="closeDialog">
        <div>
            <div
                v-for="image in previousImagesTable"
                v-if="image.file"
                :key="image.version"
                style="display: inline-block">
                <el-popover class="x-change-image-item" placement="right" width="500px" trigger="click">
                    <img slot="reference" v-lazy="image.file.url" class="x-link" />
                    <img
                        v-lazy="image.file.url"
                        class="x-link"
                        style="width: 500px; height: 375px"
                        @click="showFullscreenImageDialog(image.file.url)" />
                </el-popover>
            </div>
        </div>
    </safe-dialog>
</template>

<script setup>
    import { inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    const { t } = useI18n();

    const showFullscreenImageDialog = inject('showFullscreenImageDialog');

    defineProps({
        previousImagesDialogVisible: {
            type: Boolean,
            required: true
        },
        previousImagesTable: {
            type: Array,
            required: true
        }
    });

    const emit = defineEmits(['update:previousImagesDialogVisible']);

    function closeDialog() {
        emit('update:previousImagesDialogVisible', false);
    }
</script>
