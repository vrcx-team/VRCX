<template>
    <div
        v-if="fullscreenImageDialog.visible"
        class="fullscreen-image-overlay"
        :style="{ zIndex: overlayZIndex }"
        @click.self="closeDialog">
        <el-image
            v-if="fullscreenImageDialog.imageUrl"
            ref="imageRef"
            class="fullscreen-image"
            :src="fullscreenImageDialog.imageUrl"
            :preview-src-list="[fullscreenImageDialog.imageUrl]"
            :z-index="100000"
            fit="contain"
            preview-teleported
            hide-on-click-modal
            :initial-index="0"
            @load="handleImageLoad"
            @close="closeDialog">
            <template #toolbar="{ actions }">
                <el-icon @click="copyImageToClipboard(fullscreenImageDialog.imageUrl)" class="toolbar-icon">
                    <CopyDocument />
                </el-icon>
                <el-icon
                    @click="downloadAndSaveImage(fullscreenImageDialog.imageUrl, fullscreenImageDialog.fileName)"
                    class="toolbar-icon">
                    <Download />
                </el-icon>
                <el-icon @click="actions('zoomOut')" class="toolbar-icon"><ZoomOut /></el-icon>
                <el-icon @click="actions('zoomIn')" class="toolbar-icon"><ZoomIn /></el-icon>
                <el-icon @click="actions('clockwise')" class="toolbar-icon"><RefreshRight /></el-icon>
                <el-icon @click="actions('anticlockwise')" class="toolbar-icon"><RefreshLeft /></el-icon>
            </template>
        </el-image>
    </div>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { Download, CopyDocument, ZoomIn, ZoomOut, RefreshRight, RefreshLeft } from '@element-plus/icons-vue';

    import Noty from 'noty';
    import { storeToRefs } from 'pinia';
    import { escapeTag, extractFileId } from '../shared/utils';
    import { useGalleryStore } from '../stores';

    import { ref, nextTick, watch } from 'vue';

    import { getNextDialogIndex } from '../shared/utils/base/ui';

    const galleryStore = useGalleryStore();
    const { fullscreenImageDialog } = storeToRefs(galleryStore);

    const imageRef = ref();
    const overlayZIndex = ref(4000);

    function showPreview() {
        nextTick(() => {
            imageRef.value?.showPreview?.();
        });
    }

    function handleImageLoad() {
        showPreview();
    }

    watch(
        () => fullscreenImageDialog.value.visible,
        (visible) => {
            if (!visible) {
                return;
            }
            overlayZIndex.value = Math.max(getNextDialogIndex(), 4000);
            showPreview();
        }
    );

    watch(
        () => fullscreenImageDialog.value.imageUrl,
        (url) => {
            if (!url || !fullscreenImageDialog.value.visible) {
                return;
            }
            showPreview();
        }
    );

    function closeDialog() {
        fullscreenImageDialog.value.visible = false;
    }

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

<style scoped lang="scss">
    .toolbar-icon:hover {
        opacity: 1;
    }
    .toolbar-icon {
        cursor: pointer;
        opacity: 0.8;
    }
    .fullscreen-image-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        box-sizing: border-box;
    }
    .fullscreen-image {
        max-width: 100%;
        max-height: 100%;
    }
    :deep(.el-image__preview) {
        display: none;
    }
</style>
