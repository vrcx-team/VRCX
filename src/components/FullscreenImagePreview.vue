<template>
    <Dialog v-model:open="open">
        <DialogPortal :to="portalTo">
            <RekaDialogOverlay class="fixed inset-0 bg-background/80 backdrop-blur-sm" @click="closeDialog" />

            <RekaDialogContent
                class="fixed inset-0 p-6 sm:p-10 border-0 bg-transparent shadow-none outline-none"
                @open-auto-focus.prevent
                @close-auto-focus.prevent>
                <div ref="viewerEl" class="relative h-full w-full overflow-hidden select-none">
                    <!-- toolbar -->
                    <div
                        class="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-md bg-background/70 backdrop-blur px-2 py-1 border">
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8"
                            :disabled="!imageUrl"
                            @click="copyImageToClipboard(imageUrl)"
                            aria-label="Copy">
                            <Copy class="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8"
                            :disabled="!imageUrl"
                            @click="downloadAndSaveImage(imageUrl, fullscreenImageDialog.fileName)"
                            aria-label="Download">
                            <Download class="h-4 w-4" />
                        </Button>

                        <div class="mx-1 h-5 w-px bg-border" />

                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8"
                            @click="zoomOutCenter"
                            aria-label="Zoom out">
                            <ZoomOut class="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" class="h-8 w-8" @click="zoomInCenter" aria-label="Zoom in">
                            <ZoomIn class="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8"
                            @click="rotateCW"
                            aria-label="Rotate clockwise">
                            <RotateCw class="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            class="h-8 w-8"
                            @click="rotateCCW"
                            aria-label="Rotate counterclockwise">
                            <RotateCcw class="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="icon" class="h-8 w-8" @click="resetTransform" aria-label="Reset">
                            <RefreshCcw class="h-4 w-4" />
                        </Button>

                        <div class="mx-1 h-5 w-px bg-border" />

                        <Button variant="ghost" size="icon" class="h-8 w-8" @click="closeDialog" aria-label="Close">
                            <X class="h-4 w-4" />
                        </Button>
                    </div>

                    <div
                        class="h-full w-full flex items-center justify-center"
                        @wheel="onWheel"
                        @pointerdown="onPointerDown"
                        @pointermove="onPointerMove"
                        @pointerup="onPointerUp"
                        @pointercancel="onPointerUp">
                        <img
                            v-if="imageUrl"
                            :src="imageUrl"
                            class="max-h-full max-w-full x-viewer-img"
                            :style="transformStyle"
                            draggable="false" />
                    </div>
                </div>
            </RekaDialogContent>
        </DialogPortal>
    </Dialog>
</template>

<script setup>
    import { Copy, Download, RefreshCcw, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-vue-next';
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { DialogContent as RekaDialogContent, DialogOverlay as RekaDialogOverlay, DialogPortal } from 'reka-ui';
    import { Button } from '@/components/ui/button';
    import { Dialog } from '@/components/ui/dialog';
    import { acquireModalPortalLayer } from '@/lib/modalPortalLayers';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';

    import Noty from 'noty';

    import { escapeTag, extractFileId } from '../shared/utils';
    import { useGalleryStore } from '../stores';

    const galleryStore = useGalleryStore();
    const { fullscreenImageDialog } = storeToRefs(galleryStore);

    const viewerEl = ref(null);
    const portalLayer = acquireModalPortalLayer();
    const portalTo = portalLayer.element;

    const scale = ref(1);
    const rotate = ref(0); // deg
    const tx = ref(0);
    const ty = ref(0);

    const isDragging = ref(false);
    const dragStartX = ref(0);
    const dragStartY = ref(0);
    const startTx = ref(0);
    const startTy = ref(0);

    const imageUrl = computed(() => fullscreenImageDialog.value.imageUrl || '');

    const open = computed({
        get: () => fullscreenImageDialog.value.visible,
        set: (v) => {
            fullscreenImageDialog.value.visible = v;
        }
    });

    function clamp(n, min, max) {
        return Math.min(max, Math.max(min, n));
    }
    function degToRad(deg) {
        return (deg * Math.PI) / 180;
    }

    function resetTransform() {
        scale.value = 1;
        rotate.value = 0;
        tx.value = 0;
        ty.value = 0;
    }

    function closeDialog() {
        open.value = false;
    }

    function zoomAtCenter(factor) {
        const el = viewerEl.value;
        if (!el) {
            scale.value = clamp(scale.value * factor, 0.1, 10);
            return;
        }

        scale.value = clamp(scale.value * factor, 0.1, 10);
    }

    function zoomInCenter() {
        zoomAtCenter(1.2);
    }
    function zoomOutCenter() {
        zoomAtCenter(1 / 1.2);
    }

    function rotateCW() {
        rotate.value = (rotate.value + 90) % 360;
    }
    function rotateCCW() {
        rotate.value = (rotate.value - 90 + 360) % 360;
    }

    function zoomAtPointer(e, factor) {
        const el = viewerEl.value;
        if (!el) return;

        const rect = el.getBoundingClientRect();

        // mouse in container space
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // container center
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const oldScale = scale.value;
        const newScale = clamp(oldScale * factor, 0.1, 10);

        const r = degToRad(rotate.value);
        const cos = Math.cos(r);
        const sin = Math.sin(r);

        // vector from transformed center (includes current translation)
        const vx = mx - cx - tx.value;
        const vy = my - cy - ty.value;

        // inverse rotate + unscale => local point
        const ux = (vx * cos + vy * sin) / oldScale;
        const uy = (-vx * sin + vy * cos) / oldScale;

        // forward rotate + scale => new vector
        const v2x = (ux * cos - uy * sin) * newScale;
        const v2y = (ux * sin + uy * cos) * newScale;

        // keep pointer anchored
        tx.value = mx - cx - v2x;
        ty.value = my - cy - v2y;
        scale.value = newScale;
    }

    function onWheel(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        zoomAtPointer(e, factor);
    }

    function onPointerDown(e) {
        if (e.button !== 0) return;
        isDragging.value = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        dragStartX.value = e.clientX;
        dragStartY.value = e.clientY;
        startTx.value = tx.value;
        startTy.value = ty.value;
    }

    function onPointerMove(e) {
        if (!isDragging.value) return;
        const dx = e.clientX - dragStartX.value;
        const dy = e.clientY - dragStartY.value;
        tx.value = startTx.value + dx;
        ty.value = startTy.value + dy;
    }

    function onPointerUp(e) {
        if (!isDragging.value) return;
        isDragging.value = false;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    }

    const transformStyle = computed(() => ({
        transform: `translate(${tx.value}px, ${ty.value}px) scale(${scale.value}) rotate(${rotate.value}deg)`,
        transformOrigin: 'center center'
    }));

    watch(
        () => open.value,
        (v) => {
            if (v) {
                portalLayer.bringToFront();
                resetTransform();
            }
        }
    );

    onBeforeUnmount(() => {
        portalLayer.release();
    });

    watch(
        () => imageUrl.value,
        (url) => {
            if (!url || !open.value) return;
            resetTransform();
        }
    );

    function onKeydown(e) {
        if (!open.value) return;
        if (e.key === '+' || e.key === '=') zoomInCenter();
        else if (e.key === '-' || e.key === '_') zoomOutCenter();
        else if (e.key.toLowerCase() === 'r') rotateCW();
        else if (e.key === '0') resetTransform();
    }
    onMounted(() => window.addEventListener('keydown', onKeydown));
    onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

    async function copyImageToClipboard(url) {
        if (!url) return;
        const msg = toast.info('Downloading image...');
        try {
            const response = await webApiService.execute({ url, method: 'GET' });
            if (response.status !== 200 || !String(response.data).startsWith('data:image/png')) {
                throw new Error(`Error: ${response.data}`);
            }
            const blob = await (await fetch(response.data)).blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            toast.success('Image copied to clipboard');
        } catch (error) {
            console.error('Error downloading image:', error);
            new Noty({ type: 'error', text: escapeTag(`Failed to download image. ${url}`) }).show();
        } finally {
            toast.dismiss(msg);
        }
    }

    async function downloadAndSaveImage(url, fileName) {
        if (!url) return;
        const msg = toast.info('Downloading image...');
        try {
            const response = await webApiService.execute({ url, method: 'GET' });
            if (response.status !== 200 || !String(response.data).startsWith('data:image/png')) {
                throw new Error(`Error: ${response.data}`);
            }

            const link = document.createElement('a');
            link.href = response.data;

            const fileId = extractFileId(url);
            let name = fileName;
            if (!name && fileId) name = `${fileId}.png`;
            if (!name) name = `${url.split('/').pop()}.png`;
            if (!name) name = 'image.png';

            link.setAttribute('download', name);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading image:', error);
            new Noty({ type: 'error', text: escapeTag(`Failed to download image. ${url}`) }).show();
        } finally {
            toast.dismiss(msg);
        }
    }
</script>

<style scoped>
    .x-viewer-img {
        will-change: transform;
        cursor: grab;
        user-select: none;
    }
    .x-viewer-img:active {
        cursor: grabbing;
    }
</style>
