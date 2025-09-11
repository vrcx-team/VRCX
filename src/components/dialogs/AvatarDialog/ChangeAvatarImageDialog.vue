<template>
    <el-dialog
        class="x-dialog"
        :model-value="changeAvatarImageDialogVisible"
        :title="t('dialog.change_content_image.avatar')"
        width="850px"
        append-to-body
        @close="closeDialog">
        <div v-loading="changeAvatarImageDialogLoading">
            <input
                id="AvatarImageUploadButton"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onFileChangeAvatarImage" />
            <span>{{ t('dialog.change_content_image.description') }}</span>
            <br />
            <el-button-group style="padding-bottom: 10px; padding-top: 10px">
                <el-button type="default" size="small" :icon="Upload" @click="uploadAvatarImage">
                    {{ t('dialog.change_content_image.upload') }}
                </el-button>
            </el-button-group>
            <br />
            <div class="x-change-image-item">
                <img :src="currentImageUrl" class="img-size" loading="lazy" />
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { Upload } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { avatarRequest } from '../../../api';
    import { useAvatarStore } from '../../../stores';

    const { t } = useI18n();

    const { avatarDialog } = storeToRefs(useAvatarStore());
    const { applyAvatar } = useAvatarStore();

    const props = defineProps({
        changeAvatarImageDialogVisible: {
            type: Boolean,
            required: true
        },
        previousImageUrl: {
            type: String,
            default: ''
        }
    });

    const changeAvatarImageDialogLoading = ref(false);
    const currentImageUrl = computed(() => props.previousImageUrl);

    const emit = defineEmits(['update:changeAvatarImageDialogVisible', 'update:previousImageUrl']);

    function closeDialog() {
        emit('update:changeAvatarImageDialogVisible', false);
    }

    async function resizeImageToFitLimits(file) {
        const response = await AppApi.ResizeImageToFitLimits(file);
        return response;
    }

    function onFileChangeAvatarImage(e) {
        const clearFile = function () {
            changeAvatarImageDialogLoading.value = false;
            const fileInput = /** @type{HTMLInputElement} */ (document.querySelector('#AvatarImageUploadButton'));
            if (fileInput) {
                fileInput.value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length || !avatarDialog.value.visible || avatarDialog.value.loading) {
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
                console.error('Avatar image upload process failed:', error);
            } finally {
                clearFile();
            }
        };

        changeAvatarImageDialogLoading.value = true;
        r.readAsBinaryString(files[0]);
    }

    async function initiateUpload(base64File) {
        const args = await avatarRequest.uploadAvatarImage(base64File);
        const fileUrl = args.json.versions[args.json.versions.length - 1].file.url;
        const avatarArgs = await avatarRequest.saveAvatar({
            id: avatarDialog.value.id,
            imageUrl: fileUrl
        });
        const ref = applyAvatar(avatarArgs.json);
        emit('update:previousImageUrl', ref.imageUrl);
        changeAvatarImageDialogLoading.value = false;
        ElMessage({
            message: t('message.avatar.image_changed'),
            type: 'success'
        });

        // closeDialog();
    }

    function uploadAvatarImage() {
        document.getElementById('AvatarImageUploadButton').click();
    }
</script>

<style lang="scss" scoped>
    .img-size {
        width: 500px;
        height: 375px;
    }
</style>
