<template>
    <Dialog
        :open="changeAvatarImageDialogVisible"
        @update:open="(open) => {
            if (!open) closeDialog();
        }">
        <DialogContent class="x-dialog sm:max-w-212.5">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.change_content_image.avatar') }}</DialogTitle>
            </DialogHeader>

            <div>
            <input
                id="AvatarImageUploadButton"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onFileChangeAvatarImage" />
            <span>{{ t('dialog.change_content_image.description') }}</span>
            <br />
            <Button
                variant="outline"
                size="icon-sm"
                :disabled="changeAvatarImageDialogLoading"
                @click="uploadAvatarImage">
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
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Upload } from 'lucide-vue-next';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { avatarRequest, imageRequest } from '../../../api';
    import { $throw } from '../../../service/request';
    import { AppDebug } from '../../../service/appConfig';
    import { extractFileId } from '../../../shared/utils';
    import { handleImageUploadInput } from '../../../shared/utils/imageUpload';
    import { useAvatarStore } from '../../../stores';

    const { t } = useI18n();

    const { avatarDialog } = storeToRefs(useAvatarStore());
    const { applyAvatar } = useAvatarStore();

    defineProps({
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
    const avatarImage = ref({
        base64File: '',
        fileMd5: '',
        base64SignatureFile: '',
        signatureMd5: '',
        fileId: '',
        avatarId: ''
    });

    const emit = defineEmits(['update:changeAvatarImageDialogVisible', 'update:previousImageUrl']);

    function closeDialog() {
        emit('update:changeAvatarImageDialogVisible', false);
    }

    async function resizeImageToFitLimits(file) {
        const response = await AppApi.ResizeImageToFitLimits(file);
        return response;
    }

    function onFileChangeAvatarImage(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#AvatarImageUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        if (!avatarDialog.value.visible || avatarDialog.value.loading) {
            clearInput();
            return;
        }

        const r = new FileReader();
        const finalize = () => {
            changeAvatarImageDialogLoading.value = false;
            clearInput();
        };
        r.onerror = finalize;
        r.onabort = finalize;
        r.onload = async function () {
            const uploadPromise = (async () => {
                const base64File = await resizeImageToFitLimits(btoa(r.result.toString()));
                // 10MB
                if (LINUX) {
                    // use new website upload process on Linux, we're missing the needed libraries for Unity method
                    // website method clears avatar name and is missing world image uploading
                    await initiateUpload(base64File);
                    return;
                }
                await initiateUploadLegacy(base64File, file);
            })();
            toast.promise(uploadPromise, {
                loading: t('message.upload.loading'),
                success: t('message.upload.success'),
                error: t('message.upload.error')
            });
            try {
                await uploadPromise;
            } catch (error) {
                console.error('avatar image upload process failed:', error);
            } finally {
                finalize();
            }
        };

        changeAvatarImageDialogLoading.value = true;
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
        const avatarId = avatarDialog.value.id;
        const { imageUrl } = avatarDialog.value.ref;
        const fileId = extractFileId(imageUrl);
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
            fileMD5: avatarImage.value.fileMd5
        });

        if (json.status !== 200) {
            changeAvatarImageDialogLoading.value = false;
            $throw(json.status, 'avatar image upload failed', params.url);
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
            fileMD5: avatarImage.value.signatureMd5
        });

        if (json.status !== 200) {
            changeAvatarImageDialogLoading.value = false;
            $throw(json.status, 'avatar image upload failed', params.url);
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
        const params = {
            id: avatarImage.value.avatarId,
            imageUrl: `${AppDebug.endpointDomain}/file/${fileId}/${fileVersion}/file`
        };
        const res = await imageRequest.setAvatarImage(params);
        return avatarImageSet(res);
    }

    function avatarImageSet(args) {
        changeAvatarImageDialogLoading.value = false;
        if (args.json.imageUrl === args.params.imageUrl) {
            emit('update:previousImageUrl', args.json.imageUrl);
        } else {
            $throw(0, 'avatar image change failed', args.params.imageUrl);
        }
    }

    // ------------ Upload Process End ------------

    async function initiateUpload(base64File) {
        const args = await avatarRequest.uploadAvatarImage(base64File);
        const fileUrl = args.json.versions[args.json.versions.length - 1].file.url;
        const avatarArgs = await avatarRequest.saveAvatar({
            id: avatarDialog.value.id,
            imageUrl: fileUrl
        });
        const ref = applyAvatar(avatarArgs.json);
        changeAvatarImageDialogLoading.value = false;
        emit('update:previousImageUrl', ref.imageUrl);

        // closeDialog();
    }

    function uploadAvatarImage() {
        document.getElementById('AvatarImageUploadButton').click();
    }
</script>

<style scoped>
    .img-size {
        width: 500px;
        height: 375px;
    }
</style>
