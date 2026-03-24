import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    resetCropState: vi.fn(),
    loadImageForCrop: vi.fn(),
    getCroppedBlob: vi.fn(async () => new Blob(['x'], { type: 'image/png' })),
    cropperRef: { value: null },
    cropperImageSrc: { value: 'blob://img' }
}));

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('../../composables/useImageCropper', () => ({
    useImageCropper: () => ({
        cropperRef: mocks.cropperRef,
        cropperImageSrc: mocks.cropperImageSrc,
        resetCropState: (...a) => mocks.resetCropState(...a),
        loadImageForCrop: (...a) => mocks.loadImageForCrop(...a),
        getCroppedBlob: (...a) => mocks.getCroppedBlob(...a)
    })
}));
vi.mock('@/components/ui/dialog', () => ({
    Dialog: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' },
    DialogFooter: { template: '<div><slot /></div>' }
}));
vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="btn" @click="$emit(\'click\')"><slot /></button>'
    }
}));
vi.mock('@/components/ui/slider', () => ({
    Slider: { emits: ['value-commit'], template: '<div />' }
}));
vi.mock('@/components/ui/spinner', () => ({
    Spinner: { template: '<div />' }
}));
vi.mock('@/components/ui/tooltip/TooltipWrapper.vue', () => ({
    default: { template: '<div><slot /></div>' }
}));
vi.mock('vue-advanced-cropper', () => ({
    Cropper: { emits: ['change'], template: '<div />' }
}));
vi.mock(
    'lucide-vue-next',
    () => new Proxy({}, { get: () => ({ template: '<i />' }) })
);

import ImageCropDialog from '../ImageCropDialog.vue';

describe('ImageCropDialog.vue', () => {
    it('renders crop dialog title', () => {
        const wrapper = mount(ImageCropDialog, {
            props: { open: true, title: 'Crop', aspectRatio: 1, file: null }
        });
        expect(wrapper.text()).toContain('Crop');
    });
});
