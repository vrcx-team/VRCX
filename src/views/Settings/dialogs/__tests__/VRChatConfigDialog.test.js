import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

// ─── Hoisted mocks ──────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
    openExternalLink: vi.fn(),
    getVRChatResolution: vi.fn((res) => res),
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn()
    },
    appApi: {
        ReadConfigFileSafe: vi.fn().mockResolvedValue(null),
        WriteConfigFile: vi.fn()
    },
    assetBundleManager: {
        DeleteAllCache: vi.fn().mockResolvedValue(undefined)
    },
    sweepVRChatCache: vi.fn(),
    getVRChatCacheSize: vi.fn(),
    folderSelectorDialog: vi.fn().mockResolvedValue(null),
    confirm: vi.fn().mockResolvedValue({ ok: false })
}));

const isVRChatConfigDialogVisible = ref(false);
const VRChatUsedCacheSize = ref('5.2');
const VRChatTotalCacheSize = ref('30');
const VRChatCacheSizeLoading = ref(false);

vi.mock('pinia', () => ({
    storeToRefs: (store) => {
        const result = {};
        for (const key in store) {
            if (store[key] && typeof store[key] === 'object' && '__v_isRef' in store[key]) {
                result[key] = store[key];
            }
        }
        return result;
    },
    defineStore: (id, fn) => fn
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
        locale: require('vue').ref('en')
    })
}));

vi.mock('../../../../stores', () => ({
    useGameStore: () => ({
        VRChatUsedCacheSize,
        VRChatTotalCacheSize,
        VRChatCacheSizeLoading,
        getVRChatCacheSize: mocks.getVRChatCacheSize
    }),
    useAdvancedSettingsStore: () => ({
        isVRChatConfigDialogVisible,
        folderSelectorDialog: mocks.folderSelectorDialog
    }),
    useModalStore: () => ({
        confirm: mocks.confirm
    })
}));

vi.mock('../../../../shared/utils', () => ({
    openExternalLink: (...args) => mocks.openExternalLink(...args),
    getVRChatResolution: (...args) => mocks.getVRChatResolution(...args)
}));

vi.mock('../../../../shared/constants', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        VRChatCameraResolutions: [
            { name: '1920x1080 (1080p)', width: 1920, height: 1080 },
            { name: '3840x2160 (4K)', width: 3840, height: 2160 },
            { name: 'Default', width: 0, height: 0 }
        ],
        VRChatScreenshotResolutions: [
            { name: '1920x1080 (1080p)', width: 1920, height: 1080 },
            { name: '3840x2160 (4K)', width: 3840, height: 2160 },
            { name: 'Default', width: 0, height: 0 }
        ]
    };
});

vi.mock('vue-sonner', () => ({
    toast: mocks.toast
}));

vi.mock('../../../../coordinators/gameCoordinator', () => ({
    runSweepVRChatCacheFlow: (...args) => mocks.sweepVRChatCache(...args)
}));

// Set global mocks for CefSharp-injected APIs
globalThis.AppApi = mocks.appApi;
globalThis.AssetBundleManager = mocks.assetBundleManager;

import VRChatConfigDialog from '../VRChatConfigDialog.vue';

// ─── Helpers ─────────────────────────────────────────────────────────

function mountComponent() {
    return mount(VRChatConfigDialog, {
        global: {
            stubs: {
                Dialog: {
                    props: ['open'],
                    emits: ['update:open'],
                    template: '<div data-testid="dialog" v-if="open"><slot /></div>'
                },
                DialogContent: { template: '<div><slot /></div>' },
                DialogHeader: { template: '<div><slot /></div>' },
                DialogTitle: { template: '<h2><slot /></h2>' },
                DialogFooter: {
                    template: '<div data-testid="footer"><slot /></div>'
                },
                Button: {
                    emits: ['click'],
                    props: ['variant', 'disabled', 'size'],
                    template: '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>'
                },
                InputGroupAction: {
                    props: ['modelValue', 'placeholder', 'size', 'type', 'min', 'max'],
                    emits: ['update:modelValue', 'input'],
                    template:
                        '<div data-testid="input-group"><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value); $emit(\'input\')" /><slot name="actions" /></div>'
                },
                Select: {
                    props: ['modelValue'],
                    emits: ['update:modelValue'],
                    template: '<div data-testid="select"><slot /></div>'
                },
                SelectTrigger: {
                    props: ['size'],
                    template: '<div><slot /></div>'
                },
                SelectValue: {
                    props: ['placeholder'],
                    template: '<span>{{ placeholder }}</span>'
                },
                SelectContent: { template: '<div><slot /></div>' },
                SelectGroup: { template: '<div><slot /></div>' },
                SelectItem: {
                    props: ['value'],
                    template: '<option :value="value"><slot /></option>'
                },
                Checkbox: {
                    props: ['modelValue'],
                    emits: ['update:modelValue'],
                    template:
                        '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
                },
                TooltipWrapper: {
                    props: ['side', 'content'],
                    template: '<div><slot /></div>'
                },
                Spinner: { template: '<span data-testid="spinner" />' },
                RefreshCw: { template: '<span />' },
                FolderOpen: { template: '<span />' }
            }
        }
    });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('VRChatConfigDialog.vue', () => {
    beforeEach(() => {
        isVRChatConfigDialogVisible.value = false;
        VRChatUsedCacheSize.value = '5.2';
        VRChatTotalCacheSize.value = '30';
        VRChatCacheSizeLoading.value = false;
        mocks.appApi.ReadConfigFileSafe.mockResolvedValue(null);
        mocks.confirm.mockResolvedValue({ ok: false });
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('does not render when not visible', () => {
            const wrapper = mountComponent();
            expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
        });
    });
});
