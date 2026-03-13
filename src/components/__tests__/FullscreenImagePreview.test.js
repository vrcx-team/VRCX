import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    dialog: {
        value: {
            visible: true,
            imageUrl: 'https://example.com/a.png',
            fileName: 'a.png'
        }
    }
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('@/stores/settings/general', () => ({
    useGeneralSettingsStore: () => ({
        disableGpuAcceleration: { value: false }
    })
}));
vi.mock('../../stores', () => ({
    useGalleryStore: () => ({
        fullscreenImageDialog: mocks.dialog,
        showFullscreenImageDialog: vi.fn()
    })
}));
vi.mock('@/lib/modalPortalLayers', () => ({
    acquireModalPortalLayer: () => ({
        element: 'body',
        bringToFront: vi.fn(),
        release: vi.fn()
    })
}));
vi.mock('@/lib/utils', () => ({ cn: (...a) => a.filter(Boolean).join(' ') }));
vi.mock('../../shared/utils', () => ({
    escapeTag: (s) => s,
    extractFileId: () => 'f1'
}));
vi.mock('vue-sonner', () => ({
    toast: {
        info: vi.fn(() => 'id'),
        success: vi.fn(),
        error: vi.fn(),
        dismiss: vi.fn()
    }
}));
vi.mock('@/components/ui/dialog', () => ({
    Dialog: { template: '<div><slot /></div>' }
}));
vi.mock('reka-ui', () => ({
    DialogPortal: { template: '<div><slot /></div>' },
    DialogOverlay: { template: '<div><slot /></div>' },
    DialogContent: {
        emits: ['click'],
        template: '<div @click="$emit(\'click\')"><slot /></div>'
    }
}));
vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button :aria-label="$attrs[\'aria-label\']" @click="$emit(\'click\')"><slot /></button>'
    }
}));
vi.mock('lucide-vue-next', () => ({
    Copy: { template: '<i />' },
    Download: { template: '<i />' },
    RefreshCcw: { template: '<i />' },
    RotateCcw: { template: '<i />' },
    RotateCw: { template: '<i />' },
    X: { template: '<i />' },
    ZoomIn: { template: '<i />' },
    ZoomOut: { template: '<i />' }
}));

import FullscreenImagePreview from '../FullscreenImagePreview.vue';

describe('FullscreenImagePreview.vue', () => {
    it('closes dialog when close button clicked', async () => {
        const wrapper = mount(FullscreenImagePreview);

        await wrapper.get('button[aria-label="Close"]').trigger('click');

        expect(mocks.dialog.value.visible).toBe(false);
    });
});
