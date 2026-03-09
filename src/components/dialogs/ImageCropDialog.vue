<template>
    <Dialog
        :open="open"
        @update:open="
            (v) => {
                if (!v) cancelCrop();
            }
        ">
        <DialogContent class="x-dialog sm:max-w-212.5">
            <DialogHeader>
                <DialogTitle>{{ title }}</DialogTitle>
            </DialogHeader>

            <div v-if="cropperImageSrc" class="mt-4">
                <Cropper
                    ref="cropperRef"
                    class="h-100 max-h-full"
                    :src="cropperImageSrc"
                    :stencil-props="{ aspectRatio, movable: !loading, resizable: !loading }"
                    :move-image="!loading"
                    :resize-image="!loading"
                    :image-restriction="freeMode ? 'none' : 'stencil'"
                    @change="onCropperChange" />

                <!-- Toolbar -->
                <div class="flex items-center justify-center gap-1 mt-3">
                    <TooltipWrapper :content="t('dialog.image_crop.rotate_left')">
                        <Button
                            size="icon-sm"
                            variant="outline"
                            class="rounded-full h-8 w-8"
                            :disabled="loading"
                            @click="cropperRef?.rotate(-90)">
                            <RotateCcw class="h-4 w-4" />
                        </Button>
                    </TooltipWrapper>
                    <TooltipWrapper :content="t('dialog.image_crop.rotate_right')">
                        <Button
                            size="icon-sm"
                            variant="outline"
                            class="rounded-full h-8 w-8"
                            :disabled="loading"
                            @click="cropperRef?.rotate(90)">
                            <RotateCw class="h-4 w-4" />
                        </Button>
                    </TooltipWrapper>

                    <div class="w-px h-5 bg-border mx-1" />

                    <TooltipWrapper :content="t('dialog.image_crop.flip_h')">
                        <Button
                            size="icon-sm"
                            variant="outline"
                            class="rounded-full h-8 w-8"
                            :disabled="loading"
                            @click="cropperRef?.flip(true, false)">
                            <FlipHorizontal class="h-4 w-4" />
                        </Button>
                    </TooltipWrapper>
                    <TooltipWrapper :content="t('dialog.image_crop.flip_v')">
                        <Button
                            size="icon-sm"
                            variant="outline"
                            class="rounded-full h-8 w-8"
                            :disabled="loading"
                            @click="cropperRef?.flip(false, true)">
                            <FlipVertical class="h-4 w-4" />
                        </Button>
                    </TooltipWrapper>

                    <div class="w-px h-5 bg-border mx-1" />

                    <TooltipWrapper :content="t('dialog.image_crop.zoom_out')">
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            class="rounded-full h-7 w-7"
                            :disabled="loading"
                            @click="cropperRef?.zoom(0.8)">
                            <ZoomOut class="h-3.5 w-3.5" />
                        </Button>
                    </TooltipWrapper>
                    <Slider
                        v-model="zoomSliderValue"
                        :min="0"
                        :max="100"
                        :step="1"
                        :disabled="loading"
                        class="w-28"
                        @value-commit="onZoomCommit" />
                    <TooltipWrapper :content="t('dialog.image_crop.zoom_in')">
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            class="rounded-full h-7 w-7"
                            :disabled="loading"
                            @click="cropperRef?.zoom(1.2)">
                            <ZoomIn class="h-3.5 w-3.5" />
                        </Button>
                    </TooltipWrapper>

                    <div class="w-px h-5 bg-border mx-1" />

                    <TooltipWrapper
                        :content="freeMode ? t('dialog.image_crop.mode_fit') : t('dialog.image_crop.mode_free')">
                        <Button
                            size="icon-sm"
                            :variant="freeMode ? 'default' : 'outline'"
                            class="rounded-full h-8 w-8"
                            :disabled="loading"
                            @click="freeMode = !freeMode">
                            <Expand v-if="freeMode" class="h-4 w-4" />
                            <Frame v-else class="h-4 w-4" />
                        </Button>
                    </TooltipWrapper>

                    <TooltipWrapper :content="t('dialog.image_crop.reset')">
                        <Button
                            size="icon-sm"
                            variant="outline"
                            class="rounded-full h-8 w-8"
                            :disabled="loading"
                            @click="handleReset">
                            <RefreshCw class="h-4 w-4" />
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>

            <DialogFooter>
                <template v-if="cropperImageSrc">
                    <Button variant="secondary" size="sm" :disabled="loading" @click="cancelCrop">
                        {{ t('dialog.change_content_image.cancel') }}
                    </Button>
                    <Button size="sm" :disabled="loading" @click="onConfirmCrop">
                        <Spinner v-if="loading" />
                        {{ loading ? t('message.upload.loading') : t('dialog.gallery_icons.crop_image') }}
                    </Button>
                </template>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import {
        Expand,
        FlipHorizontal,
        FlipVertical,
        Frame,
        RefreshCw,
        RotateCcw,
        RotateCw,
        ZoomIn,
        ZoomOut
    } from 'lucide-vue-next';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Cropper } from 'vue-advanced-cropper';
    import { Slider } from '@/components/ui/slider';
    import { Spinner } from '@/components/ui/spinner';
    import { useI18n } from 'vue-i18n';

    import TooltipWrapper from '@/components/ui/tooltip/TooltipWrapper.vue';

    import { useImageCropper } from '../../composables/useImageCropper';

    import 'vue-advanced-cropper/dist/style.css';

    const { t } = useI18n();

    const props = defineProps({
        open: {
            type: Boolean,
            required: true
        },
        title: {
            type: String,
            default: ''
        },
        aspectRatio: {
            type: Number,
            default: 4 / 3
        },
        file: {
            type: [File, null],
            default: null
        }
    });

    const emit = defineEmits(['update:open', 'confirm']);

    const loading = ref(false);
    const freeMode = ref(false);

    const zoomSliderValue = ref([50]);
    const lastZoomRatio = ref(1);

    const MIN_ZOOM_RATIO = 0.3;
    const MAX_ZOOM_RATIO = 5;
    const LOG_MIN = Math.log(MIN_ZOOM_RATIO);
    const LOG_MAX = Math.log(MAX_ZOOM_RATIO);

    const { cropperRef, cropperImageSrc, resetCropState, loadImageForCrop, getCroppedBlob } = useImageCropper();

    watch(
        () => props.file,
        (file) => {
            if (file) {
                loadImageForCrop(file);
            }
        }
    );

    watch(
        () => props.open,
        (open) => {
            if (!open) {
                loading.value = false;
                freeMode.value = false;
                zoomSliderValue.value = [50];
                lastZoomRatio.value = 1;
                resetCropState();
            }
        }
    );

    /**
     * @param result
     */
    function onCropperChange(result) {
        if (!result.visibleArea || !result.image) return;
        const ratio = result.image.width / result.visibleArea.width;
        lastZoomRatio.value = ratio;
        const normalized = ((Math.log(ratio) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
        zoomSliderValue.value = [Math.max(0, Math.min(100, Math.round(normalized)))];
    }

    /**
     * @param value
     */
    function onZoomCommit(value) {
        const target = value[0];
        const targetRatio = Math.exp(LOG_MIN + (target / 100) * (LOG_MAX - LOG_MIN));
        const factor = targetRatio / lastZoomRatio.value;
        cropperRef.value?.zoom(factor);
    }

    /**
     *
     */
    function handleReset() {
        freeMode.value = false;
        cropperRef.value?.reset();
        zoomSliderValue.value = [50];
        lastZoomRatio.value = 1;
    }

    /**
     *
     */
    function cancelCrop() {
        resetCropState();
        emit('update:open', false);
    }

    /**
     *
     */
    async function onConfirmCrop() {
        loading.value = true;
        try {
            const blob = await getCroppedBlob(props.file);
            if (!blob) {
                loading.value = false;
                return;
            }
            emit('confirm', blob);
        } catch {
            loading.value = false;
        }
    }
</script>
