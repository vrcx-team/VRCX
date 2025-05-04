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
            <div
                v-for="image in previousImagesTable"
                v-if="image.file"
                :key="image.version"
                style="display: inline-block">
                <div
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
    import { getCurrentInstance, inject, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { imageRequest } from '../../../api';
    import { extractFileId } from '../../../composables/shared/utils';
    import webApiService from '../../../service/webapi';

    const { t } = useI18n();

    const API = inject('API');

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const props = defineProps({
        changeWorldImageDialogVisible: {
            type: Boolean,
            default: false
        },
        previousImagesTable: {
            type: Array,
            default: () => []
        },
        previousImagesFileId: {
            type: String,
            default: ''
        },
        worldDialog: {
            type: Object,
            default: () => ({})
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
        avatarId: ''
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
            if (document.querySelector('#WorldImageUploadButton')) {
                document.querySelector('#WorldImageUploadButton').value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length || !props.worldDialog.visible || props.worldDialog.loading) {
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
                const base64File = await resizeImageToFitLimits(btoa(r.result));
                // 10MB
                const fileMd5 = await genMd5(base64File);
                const fileSizeInBytes = parseInt(file.total, 10);
                const base64SignatureFile = await genSig(base64File);
                const signatureMd5 = await genMd5(base64SignatureFile);
                const signatureSizeInBytes = parseInt(await genLength(base64SignatureFile), 10);
                const worldId = props.worldDialog.id;
                const { imageUrl } = props.worldDialog.ref;
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
                    worldId
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
        // API.$on('WORLDIMAGE:INIT')
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
        // API.$on('WORLDIMAGE:FILESTART')
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
            // $app.worldDialog.loading = false;
            changeWorldImageDialogLoading.value = false;
            API.$throw('World image upload failed', json, params.url);
        }
        const args = {
            json,
            params
        };
        return worldImageFileAWS(args);
    }

    async function worldImageFileAWS(args) {
        // API.$on('WORLDIMAGE:FILEAWS')
        const { fileId, fileVersion } = args.params;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadWorldImageFileFinish(params);
        return worldImageFileFinish(res);
    }

    async function worldImageFileFinish(args) {
        // API.$on('WORLDIMAGE:FILEFINISH')
        const { fileId, fileVersion } = args.params;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadWorldImageSigStart(params);
        return worldImageSigStart(res);
    }

    async function worldImageSigStart(args) {
        // API.$on('WORLDIMAGE:SIGSTART')
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
            // $app.worldDialog.loading = false;
            changeWorldImageDialogLoading.value = false;
            API.$throw('World image upload failed', json, params.url);
        }
        const args = {
            json,
            params
        };
        return worldImageSigAWS(args);
    }

    async function worldImageSigAWS(args) {
        // API.$on('WORLDIMAGE:SIGAWS')
        const { fileId, fileVersion } = args.params;
        const params = {
            fileId,
            fileVersion
        };
        const res = await imageRequest.uploadWorldImageSigFinish(params);
        return worldImageSigFinish(res);
    }
    async function worldImageSigFinish(args) {
        // API.$on('WORLDIMAGE:SIGFINISH')
        const { fileId, fileVersion } = args.params;
        const parmas = {
            id: worldImage.value.worldId,
            imageUrl: `${API.endpointDomain}/file/${fileId}/${fileVersion}/file`
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
            API.$throw(0, 'World image change failed', args.params.imageUrl);
        }
    }

    // ------------ Upload Process End ------------

    function setWorldImage(image) {
        changeWorldImageDialogLoading.value = true;
        const parmas = {
            id: props.worldDialog.id,
            imageUrl: `${API.endpointDomain}/file/${props.previousImagesFileId}/${image.version}/file`
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
            `${API.endpointDomain}/file/${props.previousImagesFileId}/${image.version}/file` ===
            // FIXME: old:avatarDialog -> new:worldDialog, is this correct?
            props.worldDialog.ref.imageUrl
        ) {
            return true;
        }
        return false;
    }

    // $app.methods.deleteWorldImage = function () {
    //     this.changeWorldImageDialogLoading = true;
    //     var parmas = {
    //         fileId: this.previousImagesTableFileId,
    //         version: this.previousImagesTable[0].version
    //     };
    //     vrcPlusIconRequest
    //         .deleteFileVersion(parmas)
    //         .then((args) => {
    //             this.previousImagesTableFileId = args.json.id;
    //             var images = [];
    //             args.json.versions.forEach((item) => {
    //                 if (!item.deleted) {
    //                     images.unshift(item);
    //                 }
    //             });
    //             this.checkPreviousImageAvailable(images);
    //         })
    //         .finally(() => {
    //             this.changeWorldImageDialogLoading = false;
    //         });
    // };
</script>
