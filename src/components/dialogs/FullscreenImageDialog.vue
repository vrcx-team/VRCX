<template>
    <safe-dialog
        ref="fullscreenImageDialog"
        class="x-dialog"
        :visible.sync="fullscreenImageDialog.visible"
        append-to-body
        top="1vh"
        width="97vw">
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
                    @click="
                        downloadAndSaveImage(fullscreenImageDialog.imageUrl, fullscreenImageDialog.fileName)
                    "></el-button>
            </div>
            <img v-lazy="fullscreenImageDialog.imageUrl" style="width: 100%; height: 85vh; object-fit: contain" />
        </div>
    </safe-dialog>
</template>

<script setup>
    import { getCurrentInstance } from 'vue';
    import utils from '../../classes/utils';
    import { copyToClipboard, extractFileId } from '../../composables/shared/utils';
    import webApiService from '../../service/webapi';
    import Noty from 'noty';

    const { proxy } = getCurrentInstance();
    const { $message } = proxy;

    defineProps({
        fullscreenImageDialog: {
            type: Object,
            default: () => ({})
        }
    });

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
        } catch {
            new Noty({
                type: 'error',
                text: utils.escapeTag(`Failed to download image. ${url}`)
            }).show();
        }
    }
</script>
