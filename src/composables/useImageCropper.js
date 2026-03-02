import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

const MAX_PREVIEW_SIZE = 800;

export function useImageCropper() {
    const { t } = useI18n();

    const cropperRef = ref(null);
    const cropperImageSrc = ref('');
    const originalImage = ref(null);
    const previewScale = ref(1);

    function resetCropState() {
        cropperImageSrc.value = '';
        originalImage.value = null;
        previewScale.value = 1;
    }

    /**
     * Downscaling for preview
     * @param {File} file
     */
    function loadImageForCrop(file) {
        const r = new FileReader();
        r.onload = () => {
            const img = new Image();
            img.onload = () => {
                originalImage.value = img;
                if (
                    img.width > MAX_PREVIEW_SIZE ||
                    img.height > MAX_PREVIEW_SIZE
                ) {
                    const scale = Math.min(
                        MAX_PREVIEW_SIZE / img.width,
                        MAX_PREVIEW_SIZE / img.height
                    );
                    previewScale.value = scale;
                    const cvs = document.createElement('canvas');
                    cvs.width = Math.round(img.width * scale);
                    cvs.height = Math.round(img.height * scale);
                    const ctx = cvs.getContext('2d');
                    ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
                    cropperImageSrc.value = cvs.toDataURL('image/jpeg', 0.9);
                } else {
                    previewScale.value = 1;
                    // @ts-ignore
                    cropperImageSrc.value = r.result;
                }
            };
            img.onerror = () => {
                resetCropState();
            };
            // @ts-ignore
            img.src = r.result;
        };
        r.onerror = () => {
            resetCropState();
            toast.error(t('message.file.not_image'));
        };
        r.readAsDataURL(file);
    }

    /**
     * @param {File} [originalFile]
     * @returns {Promise<Blob|null>}
     */
    function getCroppedBlob(originalFile) {
        const result = cropperRef.value?.getResult();
        if (!result?.coordinates || !originalImage.value) {
            return Promise.resolve(null);
        }

        const { coordinates } = result;
        const scale = previewScale.value;
        const srcX = Math.round(coordinates.left / scale);
        const srcY = Math.round(coordinates.top / scale);
        const srcW = Math.round(coordinates.width / scale);
        const srcH = Math.round(coordinates.height / scale);

        const img = originalImage.value;
        const noCrop =
            srcX <= 1 &&
            srcY <= 1 &&
            Math.abs(srcW - img.width) <= 1 &&
            Math.abs(srcH - img.height) <= 1;

        // pass no crop
        if (noCrop && originalFile) {
            return Promise.resolve(originalFile);
        }

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = srcW;
        cropCanvas.height = srcH;
        const ctx = cropCanvas.getContext('2d');
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

        return new Promise((resolve) => {
            cropCanvas.toBlob(resolve, 'image/png');
        });
    }

    return {
        cropperRef,
        cropperImageSrc,
        resetCropState,
        loadImageForCrop,
        getCroppedBlob
    };
}
