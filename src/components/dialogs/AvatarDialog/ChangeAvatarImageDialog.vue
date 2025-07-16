<template>
    <safe-dialog
        class="x-dialog"
        :visible="changeAvatarImageDialogVisible"
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
                <el-button type="default" size="small" icon="el-icon-refresh" @click="refresh">
                    {{ t('dialog.change_content_image.refresh') }}
                </el-button>
                <el-button type="default" size="small" icon="el-icon-upload2" @click="uploadAvatarImage">
                    {{ t('dialog.change_content_image.upload') }}
                </el-button>
            </el-button-group>
            <br />
            <div
                v-for="image in previousImagesTable"
                v-if="image.file"
                :key="image.version"
                style="display: inline-block">
                <div
                    class="x-change-image-item"
                    style="cursor: pointer"
                    :class="{ 'current-image': compareCurrentImage(image) }"
                    @click="setAvatarImage(image)">
                    <img v-lazy="image.file.url" class="image" />
                </div>
            </div>
        </div>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { imageRequest } from '../../../api';
    import { AppGlobal } from '../../../service/appConfig';
    import { $throw } from '../../../service/request';
    import { extractFileId } from '../../../shared/utils';
    import { useAvatarStore, useGalleryStore } from '../../../stores';

    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const { avatarDialog } = storeToRefs(useAvatarStore());
    const { previousImagesTable } = storeToRefs(useGalleryStore());
    const { applyAvatar } = useAvatarStore();

    const props = defineProps({
        changeAvatarImageDialogVisible: {
            type: Boolean,
            default: false
        },
        previousImagesFileId: {
            type: String,
            default: ''
        }
    });

    const changeAvatarImageDialogLoading = ref(false);
    const avatarImage = ref({
        base64File: '',
        fileMd5: '',
        base64SignatureFile: '',
        signatureMd5: '',
        fileId: '',
        avatarId: ''
    });

    const emit = defineEmits(['update:changeAvatarImageDialogVisible', 'refresh']);

    function refresh() {
        emit('refresh', 'Change');
    }

    function closeDialog() {
        emit('update:changeAvatarImageDialogVisible', false);
    }

    async function resizeImageToFitLimits(file) {
        const response = await AppApi.ResizeImageToFitLimits(file);
        return response;
    }

    async function genMd5(file) {
        const response = await AppApi.MD5File(file);
        return response;
    }

    async function genSig(file) {
        const response = await AppApi.SignFile(file);
        return response;
    }

    async function genLength(file) {
        const response = await AppApi.FileLength(file);
        return response;
    }

    function onFileChangeAvatarImage(e) {
        const clearFile = function () {
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
            $message({
                message: t('message.file.too_large'),
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $message({
                message: t('message.file.not_image'),
                type: 'error'
            });
            clearFile();
            return;
        }

        const r = new FileReader();
        r.onload = async function (file) {
            try {
                const base64File = await resizeImageToFitLimits(btoa(r.result.toString()));
                // 10MB
                const fileMd5 = await genMd5(base64File);
                const fileSizeInBytes = parseInt(file.total.toString(), 10);
                const base64SignatureFile = await genSig(base64File);
                const signatureMd5 = await genMd5(base64SignatureFile);
                const signatureSizeInBytes = parseInt(await genLength(base64SignatureFile), 10);

                const avatarId = avatarDialog.value.id;
                const { imageUrl } = avatarDialog.value.ref;

                const fileId = extractFileId(imageUrl);
                if (!fileId) {
                    $message({
                        message: t('message.avatar.image_invalid'),
                        type: 'error'
                    });
                    clearFile();
                    return;
                }

                avatarImage.value = {
                    base64File,
                    fileMd5,
                    base64SignatureFile,
                    signatureMd5,
                    fileId,
                    avatarId
                };
                const params = {
                    fileMd5,
                    fileSizeInBytes,
                    signatureMd5,
                    signatureSizeInBytes
                };

                // Upload chaining
                await initiateUpload(params, fileId);
            } catch (error) {
                console.error('Avatar image upload process failed:', error);
            } finally {
                changeAvatarImageDialogLoading.value = false;
                clearFile();
            }
        };

        changeAvatarImageDialogLoading.value = true;
        r.readAsBinaryString(files[0]);
    }

    // ------------ Upload Process Start ------------

    async function initiateUpload(params, fileId) {
        const res = await imageRequest.uploadAvatarImage(params, fileId);
        return avatarImageInit(res);
    }

    async function avatarImageInit(args) {
        const fileId = args.json.id;
        const fileVersion = args.json.versions[args.json.versions.length - 1].version;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadAvatarImageFileStart(params);
        return avatarImageFileStart(res);
    }

    async function avatarImageFileStart(args) {
        const { url } = args.json;
        const { fileId, fileVersion } = args.params;
        const params = {
            url,
            fileId,
            fileVersion
        };
        return uploadAvatarImageFileAWS(params);
    }

    async function uploadAvatarImageFileAWS(params) {
        const json = await webApiService.execute({
            url: params.url,
            uploadFilePUT: true,
            fileData: avatarImage.value.base64File,
            fileMIME: 'image/png',
            headers: {
                'Content-MD5': avatarImage.value.fileMd5
            }
        });

        if (json.status !== 200) {
            changeAvatarImageDialogLoading.value = false;
            $throw(json.status, 'Avatar image upload failed', params.url);
        }
        const args = {
            json,
            params
        };
        return avatarImageFileAWS(args);
    }

    async function avatarImageFileAWS(args) {
        const { fileId, fileVersion } = args.params;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadAvatarImageFileFinish(params);
        return avatarImageFileFinish(res);
    }

    async function avatarImageFileFinish(args) {
        const { fileId, fileVersion } = args.params;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadAvatarImageSigStart(params);
        return avatarImageSigStart(res);
    }

    async function avatarImageSigStart(args) {
        const { url } = args.json;
        const { fileId, fileVersion } = args.params;
        const params = {
            url,
            fileId,
            fileVersion
        };
        return uploadAvatarImageSigAWS(params);
    }

    async function uploadAvatarImageSigAWS(params) {
        const json = await webApiService.execute({
            url: params.url,
            uploadFilePUT: true,
            fileData: avatarImage.value.base64SignatureFile,
            fileMIME: 'application/x-rsync-signature',
            headers: {
                'Content-MD5': avatarImage.value.signatureMd5
            }
        });

        if (json.status !== 200) {
            changeAvatarImageDialogLoading.value = false;
            $throw(json.status, 'Avatar image upload failed', params.url);
        }
        const args = {
            json,
            params
        };
        return avatarImageSigAWS(args);
    }

    async function avatarImageSigAWS(args) {
        const { fileId, fileVersion } = args.params;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadAvatarImageSigFinish(params);
        return avatarImageSigFinish(res);
    }

    async function avatarImageSigFinish(args) {
        const { fileId, fileVersion } = args.params;
        const parmas = {
            id: avatarImage.value.avatarId,
            imageUrl: `${AppGlobal.endpointDomain}/file/${fileId}/${fileVersion}/file`
        };
        const res = await imageRequest.setAvatarImage(parmas);
        return avatarImageSet(res);
    }

    async function avatarImageSet(args) {
        applyAvatar(args.json);
        changeAvatarImageDialogLoading.value = false;
        if (args.json.imageUrl === args.params.imageUrl) {
            $message({
                message: t('message.avatar.image_changed'),
                type: 'success'
            });
            refresh();
        } else {
            $throw(0, 'Avatar image change failed', args.params.imageUrl);
        }
    }

    // ------------ Upload Process End ------------

    function uploadAvatarImage() {
        document.getElementById('AvatarImageUploadButton').click();
    }

    function setAvatarImage(image) {
        changeAvatarImageDialogLoading.value = true;
        const parmas = {
            id: avatarDialog.value.id,
            imageUrl: `${AppGlobal.endpointDomain}/file/${props.previousImagesFileId}/${image.version}/file`
        };
        imageRequest
            .setAvatarImage(parmas)
            .then((args) => applyAvatar(args.json))
            .finally(() => {
                changeAvatarImageDialogLoading.value = false;
                closeDialog();
            });
    }

    function compareCurrentImage(image) {
        return (
            `${AppGlobal.endpointDomain}/file/${props.previousImagesFileId}/${image.version}/file` ===
            avatarDialog.value.ref.imageUrl
        );
    }
</script>
