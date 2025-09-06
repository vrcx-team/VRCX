<template>
    <el-dialog
        class="x-dialog"
        :model-value="previousImagesDialogVisible"
        :title="t('dialog.previous_images.header')"
        width="800px"
        append-to-body
        @close="closeDialog">
        <div>
            <div v-for="image in previousImagesTable" :key="image.version" style="display: inline-block">
                <el-popover
                    class="x-change-image-item"
                    placement="right"
                    width="500px"
                    trigger="click"
                    v-if="image.file">
                    <template #reference>
                        <img :src="image.file.url" :class="['x-link', 'img-size']" loading="lazy" />
                    </template>
                    <img :src="image.file.url" @click="showFullscreenImageDialog(image.file.url)" loading="lazy" />
                </el-popover>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useGalleryStore } from '../../stores';

    const { t } = useI18n();

    const { previousImagesDialogVisible, previousImagesTable } = storeToRefs(useGalleryStore());
    const { showFullscreenImageDialog } = useGalleryStore();

    function closeDialog() {
        previousImagesDialogVisible.value = false;
    }
</script>

<style lang="scss" scoped>
    .img-size {
        width: 250px;
        height: 187.5px;
    }
</style>
