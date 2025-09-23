<template>
    <el-dialog
        class="x-dialog"
        :model-value="changeWorldImageDialogVisible"
        :title="t('dialog.change_content_image.world')"
        width="850px"
        append-to-body
        @close="closeDialog">
        <div>
            <input
                id="WorldImageUploadButton"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onFileChangeWorldImage" />
            <el-progress
                v-if="changeWorldImageDialogLoading"
                :show-text="false"
                :indeterminate="true"
                :percentage="100"
                :stroke-width="3"
                style="margin-bottom: 12px" />
            <span>{{ t('dialog.change_content_image.description') }}</span>
            <br />
            <el-button-group style="padding-bottom: 10px; padding-top: 10px">
                <el-button
                    type="default"
                    size="small"
                    :icon="Upload"
                    :loading="changeWorldImageDialogLoading"
                    :disabled="changeWorldImageDialogLoading"
                    @click="uploadWorldImage">
                    {{ t('dialog.change_content_image.upload') }}
                </el-button>
            </el-button-group>
            <br />
            <div class="x-change-image-item">
                <img :src="previousImageUrl" class="img-size" loading="lazy" />
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { Upload } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { worldRequest } from '../../../api';
    import { handleImageUploadInput } from '../../../shared/utils/imageUpload';
    import { useWorldStore } from '../../../stores';

    const { t } = useI18n();

    const { worldDialog } = storeToRefs(useWorldStore());
    const { applyWorld } = useWorldStore();

    defineProps({
        changeWorldImageDialogVisible: {
            type: Boolean,
            required: true
        },
        previousImageUrl: {
            type: String,
            default: ''
        }
    });

    const changeWorldImageDialogLoading = ref(false);

    const emit = defineEmits(['update:changeWorldImageDialogVisible', 'update:previousImageUrl']);

    function closeDialog() {
        emit('update:changeWorldImageDialogVisible', false);
    }

    async function resizeImageToFitLimits(file) {
        const response = await AppApi.ResizeImageToFitLimits(file);
        return response;
    }

    function onFileChangeWorldImage(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#WorldImageUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        if (!worldDialog.value.visible || worldDialog.value.loading) {
            clearInput();
            return;
        }

        const r = new FileReader();
        const finalize = () => {
            changeWorldImageDialogLoading.value = false;
            clearInput();
        };
        r.onerror = finalize;
        r.onabort = finalize;
        r.onload = async function () {
            try {
                const base64File = await resizeImageToFitLimits(btoa(r.result.toString()));
                // 10MB
                await initiateUpload(base64File);
            } catch (error) {
                console.error('World image upload process failed:', error);
            } finally {
                finalize();
            }
        };

        changeWorldImageDialogLoading.value = true;
        try {
            r.readAsBinaryString(file);
        } catch (error) {
            console.error('Failed to read file', error);
            finalize();
        }
    }

    async function initiateUpload(base64File) {
        const args = await worldRequest.uploadWorldImage(base64File);
        const fileUrl = args.json.versions[args.json.versions.length - 1].file.url;
        const worldArgs = await worldRequest.saveWorld({
            id: worldDialog.value.id,
            imageUrl: fileUrl
        });
        const ref = applyWorld(worldArgs.json);
        changeWorldImageDialogLoading.value = false;
        emit('update:previousImageUrl', ref.imageUrl);
        ElMessage({
            message: t('message.world.image_changed'),
            type: 'success'
        });

        // closeDialog();
    }

    function uploadWorldImage() {
        document.getElementById('WorldImageUploadButton').click();
    }
</script>

<style lang="scss" scoped>
    .img-size {
        width: 500px;
        height: 375px;
    }
</style>
