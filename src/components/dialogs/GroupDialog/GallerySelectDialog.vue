<template>
    <el-dialog
        class="x-dialog"
        v-model="gallerySelectDialog.visible"
        :title="t('dialog.gallery_select.header')"
        width="100%"
        append-to-body>
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
            <el-button-group>
                <el-button type="default" size="small" :icon="Close" @click="selectImageGallerySelect('', '')">{{
                    t('dialog.gallery_select.none')
                }}</el-button>
                <el-button type="default" size="small" :icon="Refresh" @click="refreshGalleryTable">{{
                    t('dialog.gallery_select.refresh')
                }}</el-button>
                <el-button
                    type="default"
                    size="small"
                    :icon="Upload"
                    :disabled="!isLocalUserVrcPlusSupporter"
                    @click="displayGalleryUpload"
                    >{{ t('dialog.gallery_select.upload') }}</el-button
                >
            </el-button-group>
            <br />
            <div
                v-for="image in galleryTable"
                :key="image.id"
                class="x-friend-item"
                style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                <template v-if="image.versions && image.versions.length > 0">
                    <div
                        v-if="image.versions[image.versions.length - 1].file.url"
                        class="vrcplus-icon"
                        @click="selectImageGallerySelect(image.versions[image.versions.length - 1].file.url, image.id)">
                        <img
                            :src="image.versions[image.versions.length - 1].file.url"
                            class="avatar"
                            loading="lazy" /></div
                ></template>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
    import { Close, Refresh, Upload } from '@element-plus/icons-vue';
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
