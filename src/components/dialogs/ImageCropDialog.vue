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
                    image-restriction="stencil" />
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
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Cropper } from 'vue-advanced-cropper';
    import { Spinner } from '@/components/ui/spinner';
    import { useI18n } from 'vue-i18n';

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
    // Attention: cropperRef is used
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
                resetCropState();
            }
        }
    );

    function cancelCrop() {
        resetCropState();
        emit('update:open', false);
    }

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
