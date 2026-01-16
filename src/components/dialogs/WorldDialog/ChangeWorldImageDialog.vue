<template>
    <Dialog
        :open="changeWorldImageDialogVisible"
        @update:open="
            (open) => {
                if (!open) closeDialog();
            }
        ">
        <DialogContent class="x-dialog sm:max-w-212.5">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.change_content_image.world') }}</DialogTitle>
            </DialogHeader>

            <div>
                <input
                    id="WorldImageUploadButton"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="onFileChangeWorldImage" />
                <span>{{ t('dialog.change_content_image.description') }}</span>
                <br />
                <Button variant="outline" size="sm" :disabled="changeWorldImageDialogLoading" @click="uploadWorldImage">
                    <Upload />
                    {{ t('dialog.change_content_image.upload') }}
                </Button>
                <br />
                <div class="inline-block p-1 pb-0 hover:rounded-sm">
                    <img :src="previousImageUrl" class="img-size" loading="lazy" />
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Upload } from 'lucide-vue-next';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { imageRequest, worldRequest } from '../../../api';
    import { $throw } from '../../../service/request';
    import { AppDebug } from '../../../service/appConfig';
    import { extractFileId } from '../../../shared/utils';
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
    const worldImage = ref({
        base64File: '',
        fileMd5: '',
        base64SignatureFile: '',
        signatureMd5: '',
        fileId: '',
        worldId: ''
    });

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
            const uploadPromise = (async () => {
                const base64File = await resizeImageToFitLimits(btoa(r.result.toString()));
                // 10MB
                await initiateUploadLegacy(base64File, file);
                // await initiateUpload(base64File);
            })();
            toast.promise(uploadPromise, {
                loading: t('message.upload.loading'),
                success: t('message.upload.success'),
                error: t('message.upload.error')
            });
            try {
                await uploadPromise;
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

    async function initiateUploadLegacy(base64File, file) {
        const fileMd5 = await AppApi.MD5File(base64File);
        const fileSizeInBytes = parseInt(file.size, 10);
        const base64SignatureFile = await AppApi.SignFile(base64File);
        const signatureMd5 = await AppApi.MD5File(base64SignatureFile);
        const signatureSizeInBytes = parseInt(await AppApi.FileLength(base64SignatureFile), 10);
        const worldId = worldDialog.value.id;
        const { imageUrl } = worldDialog.value.ref;
        const fileId = extractFileId(imageUrl);
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
        const params = {
            id: worldImage.value.worldId,
            imageUrl: `${AppDebug.endpointDomain}/file/${fileId}/${fileVersion}/file`
        };
        const res = await imageRequest.setWorldImage(params);
        return worldImageSet(res);
    }

    function worldImageSet(args) {
        changeWorldImageDialogLoading.value = false;
        if (args.json.imageUrl === args.params.imageUrl) {
            emit('update:previousImageUrl', args.json.imageUrl);
        } else {
            $throw(0, 'World image change failed', args.params.imageUrl);
        }
    }

    // ------------ Upload Process End ------------

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

        // closeDialog();
    }

    function uploadWorldImage() {
        document.getElementById('WorldImageUploadButton').click();
    }
</script>

<style scoped>
    .img-size {
        width: 500px;
        height: 375px;
    }
</style>
