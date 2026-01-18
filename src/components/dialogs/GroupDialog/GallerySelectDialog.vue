<template>
    <Dialog v-model:open="gallerySelectDialog.visible">
        <DialogContent class="x-dialog w-full sm:max-w-none">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.gallery_select.header') }}</DialogTitle>
            </DialogHeader>

            <div>
                <span>{{ t('dialog.gallery_select.gallery') }}</span>
                <span style="color: #909399; font-size: 12px; margin-left: 5px">{{ galleryTable.length }}/64</span>
                <br />
                <input
                    id="GalleryUploadButton"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="onFileChangeGallery" />
                <ButtonGroup>
                    <Button variant="outline" size="sm" @click="selectImageGallerySelect('', '')">
                        <X />
                        {{ t('dialog.gallery_select.none') }}
                    </Button>
                    <Button variant="outline" size="sm" @click="refreshGalleryTable">
                        <RefreshCw />
                        {{ t('dialog.gallery_select.refresh') }}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="!isLocalUserVrcPlusSupporter"
                        @click="displayGalleryUpload">
                        <Upload />
                        {{ t('dialog.gallery_select.upload') }}
                    </Button>
                </ButtonGroup>
                <br />
                <div
                    v-for="image in galleryTable"
                    :key="image.id"
                    class="x-friend-item"
                    style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                    <template v-if="image.versions && image.versions.length > 0">
                        <div
                            v-if="image.versions[image.versions.length - 1].file.url"
                            class="h-[200px] w-[200px] rounded-[20px] cursor-pointer overflow-hidden"
                            @click="
                                selectImageGallerySelect(image.versions[image.versions.length - 1].file.url, image.id)
                            ">
                            <img
                                :src="image.versions[image.versions.length - 1].file.url"
                                class="h-full w-full rounded-[15px] object-cover"
                                loading="lazy" />
                        </div>
                    </template>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { RefreshCw, Upload, X } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { ButtonGroup } from '@/components/ui/button-group';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useGalleryStore, useUserStore } from '../../../stores';
    import { vrcPlusImageRequest } from '../../../api';

    const { t } = useI18n();

    const { galleryTable } = storeToRefs(useGalleryStore());
    const { refreshGalleryTable, handleGalleryImageAdd } = useGalleryStore();
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());

    const props = defineProps({
        gallerySelectDialog: {
            type: Object,
            required: true
        }
    });

    function selectImageGallerySelect(imageUrl, fileId) {
        const D = props.gallerySelectDialog;
        D.selectedFileId = fileId;
        D.selectedImageUrl = imageUrl;
        D.visible = false;
    }

    function displayGalleryUpload() {
        document.getElementById('GalleryUploadButton').click();
    }

    function onFileChangeGallery(e) {
        const clearFile = function () {
            const fileInput = /** @type{HTMLInputElement} */ (document.querySelector('#GalleryUploadButton'));
            if (fileInput) {
                fileInput.value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 100000000) {
            // 100MB
            toast.error(t('message.file.too_large'));
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            toast.error(t('message.file.not_image'));
            clearFile();
            return;
        }
        const r = new FileReader();
        r.onload = function () {
            const base64Body = btoa(r.result.toString());
            vrcPlusImageRequest.uploadGalleryImage(base64Body).then((args) => {
                handleGalleryImageAdd(args);
                toast.success(t('message.gallery.uploaded'));
                if (Object.keys(galleryTable.value).length !== 0) {
                    galleryTable.value.unshift(args.json);
                }
                return args;
            });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    }
</script>
