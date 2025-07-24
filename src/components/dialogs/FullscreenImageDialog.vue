<template>
    <safe-dialog class="x-dialog" :visible.sync="fullscreenImageDialog.visible" append-to-body top="1vh" width="97vw">
        <div>
            <div style="margin: 0 0 5px 5px">
                <el-button
                    size="mini"
                    icon="el-icon-s-order"
                    circle
                    @click="copyImageUrl(fullscreenImageDialog.imageUrl)"></el-button>
                <el-button
                    type="default"
                    size="mini"
                    icon="el-icon-download"
                    circle
                    style="margin-left: 5px"
                    :disabled="!fullscreenImageDialog.imageUrl.startsWith('http')"
                    @click="
                        downloadAndSaveImage(fullscreenImageDialog.imageUrl, fullscreenImageDialog.fileName)
                    "></el-button>
            </div>
            <img v-lazy="fullscreenImageDialog.imageUrl" style="width: 100%; height: 85vh; object-fit: contain" />
        </div>
    </safe-dialog>
</template>

<script setup>
    import Noty from 'noty';
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance } from 'vue';
    import { copyToClipboard, escapeTag, extractFileId } from '../../shared/utils';
    import { useGalleryStore } from '../../stores';

    const { proxy } = getCurrentInstance();
    const { $message } = proxy;

    const { fullscreenImageDialog } = storeToRefs(useGalleryStore());

    function copyImageUrl(imageUrl) {
        copyToClipboard(imageUrl, 'ImageUrl copied to clipboard');
    }

    async function downloadAndSaveImage(url, fileName) {
        if (!url) {
            return;
        }
        $message({
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
