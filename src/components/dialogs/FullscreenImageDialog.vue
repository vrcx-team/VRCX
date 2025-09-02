<template>
    <el-dialog class="x-dialog" v-model="fullscreenImageDialog.visible" append-to-body width="97vw">
        <div>
            <div style="margin: 0 0 5px 5px">
                <el-button
                    size="small"
                    :icon="Sort"
                    circle
                    @click="copyImageUrl(fullscreenImageDialog.imageUrl)"></el-button>
                <el-button
                    type="default"
                    size="small"
                    :icon="Download"
                    circle
                    style="margin-left: 5px"
                    :disabled="!fullscreenImageDialog.imageUrl.startsWith('http')"
                    @click="
                        downloadAndSaveImage(fullscreenImageDialog.imageUrl, fullscreenImageDialog.fileName)
                    "></el-button>
            </div>
            <img
                :src="fullscreenImageDialog.imageUrl"
                style="width: 100%; height: 85vh; object-fit: contain"
                loading="lazy" />
        </div>
    </el-dialog>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { Sort, Download } from '@element-plus/icons-vue';

    import Noty from 'noty';
    import { storeToRefs } from 'pinia';
    import { copyToClipboard, escapeTag, extractFileId } from '../../shared/utils';
    import { useGalleryStore } from '../../stores';

    const { fullscreenImageDialog } = storeToRefs(useGalleryStore());

    function copyImageUrl(imageUrl) {
        copyToClipboard(imageUrl, 'ImageUrl copied to clipboard');
    }

    async function downloadAndSaveImage(url, fileName) {
        if (!url) {
            return;
        }
        ElMessage({
            message: 'Downloading image...',
            type: 'info'
        });
        try {
            const response = await webApiService.execute({
                url,
                method: 'GET'
            });
            if (response.status !== 200 || !response.data.startsWith('data:image/png')) {
                throw new Error(`Error: ${response.data}`);
            }
            const link = document.createElement('a');
            link.href = response.data;
            const fileId = extractFileId(url);
            if (!fileName && fileId) {
                fileName = `${fileId}.png`;
            }
            if (!fileName) {
                fileName = `${url.split('/').pop()}.png`;
            }
            if (!fileName) {
                fileName = 'image.png';
            }
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading image:', error);
            new Noty({
                type: 'error',
                text: escapeTag(`Failed to download image. ${url}`)
            }).show();
        }
    }
</script>
