<template>
    <el-dialog class="x-dialog" v-model="fullscreenImageDialog.visible" append-to-body width="97vw">
        <div>
            <div style="margin: 0 0 5px 5px">
                <el-tooltip :content="t('dialog.fullscreen_image.copy_image_to_clipboard')" placement="top">
                    <el-button
                        size="small"
                        :icon="CopyDocument"
                        circle
                        @click="copyImageToClipboard(fullscreenImageDialog.imageUrl)"></el-button>
                </el-tooltip>
                <el-tooltip :content="t('dialog.fullscreen_image.download_and_save_image')" placement="top">
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
                </el-tooltip>
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
    import { Download, CopyDocument } from '@element-plus/icons-vue';

    import Noty from 'noty';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { escapeTag, extractFileId } from '../../shared/utils';
    import { useGalleryStore } from '../../stores';

    const { t } = useI18n();

    const { fullscreenImageDialog } = storeToRefs(useGalleryStore());

    async function copyImageToClipboard(url) {
        if (!url) {
            return;
        }
        const msg = ElMessage({
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
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': await (await fetch(response.data)).blob()
                })
            ]);
            ElMessage({
                message: 'Image copied to clipboard',
                type: 'success'
            });
        } catch (error) {
            console.error('Error downloading image:', error);
            new Noty({
                type: 'error',
                text: escapeTag(`Failed to download image. ${url}`)
            }).show();
        } finally {
            msg.close();
        }
    }

    async function downloadAndSaveImage(url, fileName) {
        if (!url) {
            return;
        }
        const msg = ElMessage({
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
        } finally {
            msg.close();
        }
    }
</script>
