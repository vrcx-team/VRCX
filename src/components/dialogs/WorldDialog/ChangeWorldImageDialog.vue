<template>
    <safe-dialog
        class="x-dialog"
        :visible="changeWorldImageDialogVisible"
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
                <el-button type="default" size="small" icon="el-icon-refresh" @click="refresh">{{
                    t('dialog.change_content_image.refresh')
                }}</el-button>
                <el-button type="default" size="small" icon="el-icon-upload2" @click="uploadWorldImage">{{
                    t('dialog.change_content_image.upload')
                }}</el-button>
                <!--                el-button(type="default" size="small" @click="deleteWorldImage" icon="el-icon-delete") Delete Latest Image-->
            </el-button-group>
            <br />
            <div v-for="image in previousImagesTable" :key="image.version" style="display: inline-block">
                <div
                    v-if="image.file"
                    class="x-change-image-item"
                    style="cursor: pointer"
                    :class="{ 'current-image': compareCurrentImage(image) }"
                    @click="setWorldImage(image)">
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
    import { useGalleryStore, useWorldStore } from '../../../stores';

    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const { worldDialog } = storeToRefs(useWorldStore());
    const { previousImagesTable } = storeToRefs(useGalleryStore());

    const props = defineProps({
        changeWorldImageDialogVisible: {
            type: Boolean,
            default: false
        },
        previousImagesFileId: {
            type: String,
            default: ''
        }
    });

    const emit = defineEmits(['update:changeWorldImageDialogVisible', 'refresh']);

    const changeWorldImageDialogLoading = ref(false);
    const worldImage = ref({
        base64File: '',
        fileMd5: '',
        base64SignatureFile: '',
        signatureMd5: '',
        fileId: '',
        avatarId: '',
        worldId: ''
    });

    function uploadWorldImage() {
        document.getElementById('WorldImageUploadButton').click();
    }

    function closeDialog() {
        emit('update:changeWorldImageDialogVisible', false);
    }

    function refresh() {
        emit('refresh', 'Change');
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

    function onFileChangeWorldImage(e) {
        const clearFile = function () {
            const fileInput = /** @type {HTMLInputElement} */ (document.querySelector('#WorldImageUploadButton'));
            if (fileInput) {
                fileInput.value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length || !worldDialog.value.visible || worldDialog.value.loading) {
            clearFile();
            return;
        }
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
        changeWorldImageDialogLoading.value = true;
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
                const worldId = worldDialog.value.id;
                const { imageUrl } = worldDialog.value.ref;
                const fileId = extractFileId(imageUrl);
                if (!fileId) {
                    $message({
                        message: t('message.world.image_invalid'),
                        type: 'error'
                    });
                    clearFile();
                    return;
                }
                worldImage.value = {
                    base64File,
                    fileMd5,
                    base64SignatureFile,
                    signatureMd5,
                    fileId,
                    worldId,
                    ...worldImage.value
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
                console.error('World image upload process failed:', error);
            } finally {
                changeWorldImageDialogLoading.value = false;
                clearFile();
            }
        };
        r.readAsBinaryString(files[0]);
    }

    // ------------ Upload Process Start ------------

    async function initiateUpload(params, fileId) {
        const res = await imageRequest.uploadWorldImage(params, fileId);
        return worldImageInit(res);
    }

    async function worldImageInit(args) {
        const fileId = args.json.id;
        const fileVersion = args.json.versions[args.json.versions.length - 1].version;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadWorldImageFileStart(params);
        return worldImageFileStart(res);
    }

    async function worldImageFileStart(args) {
        const { url } = args.json;
        const { fileId, fileVersion } = args.params;
        const params = {
            url,
            fileId,
            fileVersion
        };
        return uploadWorldImageFileAWS(params);
    }

    async function uploadWorldImageFileAWS(params) {
        const json = await webApiService.execute({
            url: params.url,
            uploadFilePUT: true,
            fileData: worldImage.value.base64File,
            fileMIME: 'image/png',
            headers: {
                'Content-MD5': worldImage.value.fileMd5
            }
        });

        if (json.status !== 200) {
            changeWorldImageDialogLoading.value = false;
            $throw(json.status, 'World image upload failed', params.url);
        }
        const args = {
            json,
            params
        };
        return worldImageFileAWS(args);
    }

    async function worldImageFileAWS(args) {
        const { fileId, fileVersion } = args.params;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadWorldImageFileFinish(params);
        return worldImageFileFinish(res);
    }

    async function worldImageFileFinish(args) {
        const { fileId, fileVersion } = args.params;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadWorldImageSigStart(params);
        return worldImageSigStart(res);
    }

    async function worldImageSigStart(args) {
        const { url } = args.json;
        const { fileId, fileVersion } = args.params;
        const params = {
            url,
            fileId,
            fileVersion
        };
        return uploadWorldImageSigAWS(params);
    }

    async function uploadWorldImageSigAWS(params) {
        const json = await webApiService.execute({
            url: params.url,
            uploadFilePUT: true,
            fileData: worldImage.value.base64SignatureFile,
            fileMIME: 'application/x-rsync-signature',
            headers: {
                'Content-MD5': worldImage.value.signatureMd5
            }
        });

        if (json.status !== 200) {
            changeWorldImageDialogLoading.value = false;
            $throw(json.status, 'World image upload failed', params.url);
        }
        const args = {
            json,
            params
        };
        return worldImageSigAWS(args);
    }

    async function worldImageSigAWS(args) {
        const { fileId, fileVersion } = args.params;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadWorldImageSigFinish(params);
        return worldImageSigFinish(res);
    }
    async function worldImageSigFinish(args) {
        const { fileId, fileVersion } = args.params;
        const parmas = {
            id: worldImage.value.worldId,
            imageUrl: `${AppGlobal.endpointDomain}/file/${fileId}/${fileVersion}/file`
        };
        const res = await imageRequest.setWorldImage(parmas);
        return worldImageSet(res);
    }

    function worldImageSet(args) {
        changeWorldImageDialogLoading.value = false;
        if (args.json.imageUrl === args.params.imageUrl) {
            $message({
                message: t('message.world.image_changed'),
                type: 'success'
            });
            refresh();
        } else {
            $throw(0, 'World image change failed', args.params.imageUrl);
        }
    }

    // ------------ Upload Process End ------------

    function setWorldImage(image) {
        changeWorldImageDialogLoading.value = true;
        const parmas = {
            id: worldDialog.value.id,
            imageUrl: `${AppGlobal.endpointDomain}/file/${props.previousImagesFileId}/${image.version}/file`
        };
        imageRequest
            .setWorldImage(parmas)
            .then((args) => worldImageSet(args))
            .finally(() => {
                changeWorldImageDialogLoading.value = false;
                closeDialog();
            });
    }

    function compareCurrentImage(image) {
        if (
            `${AppGlobal.endpointDomain}/file/${props.previousImagesFileId}/${image.version}/file` ===
            worldDialog.value.ref.imageUrl
        ) {
            return true;
        }
        return false;
    }
</script>
