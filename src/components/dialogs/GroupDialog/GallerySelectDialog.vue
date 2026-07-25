<template>
    <Dialog v-model:open="gallerySelectDialog.visible">
        <DialogContent class="x-dialog w-full sm:max-w-none">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.gallery_select.header') }}</DialogTitle>
            </DialogHeader>

            <div>
                <span>{{ t('dialog.gallery_select.gallery') }}</span>
                <span class="ml-1.5 text-muted-foreground text-xs">{{ imageTable.length }}/64</span>
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
                    <Button variant="outline" size="sm" @click="refreshTable()">
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
                <div v-for="image in imageTable" :key="image.id" class="box-border inline-block mt-2.5 cursor-default">
                    <template v-if="image.versions && image.versions.length > 0">
                        <div
                            v-if="image.versions[image.versions.length - 1].file.url"
                            class="h-[200px] w-[200px] rounded-[20px] cursor-pointer overflow-hidden mr-5"
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
    import { vrcPlusIconRequest, vrcPlusImageRequest } from '../../../api';
    import { computed, watch } from 'vue';

    const { t } = useI18n();

    const { galleryTable, VRCPlusIconsTable } = storeToRefs(useGalleryStore());
    const { refreshGalleryTable, refreshVRCPlusIconsTable, handleGalleryImageAdd } = useGalleryStore();
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());

    const props = defineProps({
        gallerySelectDialog: {
            type: Object,
            required: true
        }
    });
    const emit = defineEmits(['select-image']);

    watch(
        () => props.gallerySelectDialog.visible,
        (newValue) => {
            if (newValue) {
                refreshTable();
            }
        }
    );

    function refreshTable() {
        if (props.gallerySelectDialog.isIconGallerySelectDialog) {
            refreshVRCPlusIconsTable();
            return;
        }
        refreshGalleryTable();
    }
    const imageTable = computed(() => {
        if (props.gallerySelectDialog.isIconGallerySelectDialog) {
            return VRCPlusIconsTable.value;
        }
        return galleryTable.value;
    });

    /**
     *
     * @param imageUrl
     * @param fileId
     */
    function selectImageGallerySelect(imageUrl, fileId) {
        const D = props.gallerySelectDialog;
        D.selectedFileId = fileId;
        D.selectedImageUrl = imageUrl;
        emit('select-image', { imageUrl, fileId });
        D.visible = false;
    }

    /**
     *
     */
    function displayGalleryUpload() {
        document.getElementById('GalleryUploadButton').click();
    }

    /**
     *
     * @param e
     */
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
            if (isLocalUserVrcPlusSupporter.value) {
                vrcPlusIconRequest.uploadVRCPlusIcon(base64Body).then((args) => {
                    handleGalleryImageAdd(args);
                    toast.success(t('message.gallery.uploaded'));
                    if (Object.keys(VRCPlusIconsTable.value).length !== 0) {
                        VRCPlusIconsTable.value.unshift(args.json);
                    }
                    return args;
                });

                return;
            }
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
