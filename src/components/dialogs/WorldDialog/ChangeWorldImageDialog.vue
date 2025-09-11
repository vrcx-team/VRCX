<template>
    <el-dialog
        class="x-dialog"
        :model-value="changeWorldImageDialogVisible"
        :title="t('dialog.change_content_image.world')"
        width="850px"
        append-to-body
        @close="closeDialog">
        <div v-loading="changeWorldImageDialogLoading">
            <input
                id="WorldImageUploadButton"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onFileChangeWorldImage" />
            <span>{{ t('dialog.change_content_image.description') }}</span>
            <br />
            <el-button-group style="padding-bottom: 10px; padding-top: 10px">
                <el-button type="default" size="small" :icon="Upload" @click="uploadWorldImage">
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
    import { useWorldStore } from '../../../stores';

    const { t } = useI18n();

    const { worldDialog } = storeToRefs(useWorldStore());
    const { applyWorld } = useWorldStore();

    const props = defineProps({
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
        const clearFile = function () {
            changeWorldImageDialogLoading.value = false;
            const fileInput = /** @type{HTMLInputElement} */ (document.querySelector('#WorldImageUploadButton'));
            if (fileInput) {
                fileInput.value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length || !worldDialog.value.visible || worldDialog.value.loading) {
            clearFile();
            return;
        }

        // validate file
        if (files[0].size >= 100000000) {
            // 100MB
            ElMessage({
                message: t('message.file.too_large'),
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            ElMessage({
                message: t('message.file.not_image'),
                type: 'error'
            });
            clearFile();
            return;
        }

        const r = new FileReader();
        r.onload = async function () {
            try {
                const base64File = await resizeImageToFitLimits(btoa(r.result.toString()));
                // 10MB
                await initiateUpload(base64File);
            } catch (error) {
                console.error('World image upload process failed:', error);
            } finally {
                clearFile();
            }
        };

        changeWorldImageDialogLoading.value = true;
        r.readAsBinaryString(files[0]);
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
