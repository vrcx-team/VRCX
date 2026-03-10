import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

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
            if (
                store[key] &&
                typeof store[key] === 'object' &&
                '__v_isRef' in store[key]
            ) {
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

/**
 *
 */
function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 *
 */
function mountComponent() {
    return mount(VRChatConfigDialog, {
        global: {
            stubs: {
                Dialog: {
                    props: ['open'],
                    emits: ['update:open'],
                    template:
                        '<div data-testid="dialog" v-if="open"><slot /></div>'
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
                    template:
                        '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>'
                },
                InputGroupAction: {
                    props: [
                        'modelValue',
                        'placeholder',
                        'size',
                        'type',
                        'min',
                        'max'
                    ],
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

        test('renders dialog content when visible', async () => {
            isVRChatConfigDialogVisible.value = true;
            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();

            expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
            expect(wrapper.text()).toContain('dialog.config_json.header');
        });

        test('renders descriptions', async () => {
            isVRChatConfigDialogVisible.value = true;
            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();

            expect(wrapper.text()).toContain('dialog.config_json.description1');
            expect(wrapper.text()).toContain('dialog.config_json.description2');
        });

        test('renders cache size info', async () => {
            isVRChatConfigDialogVisible.value = true;
            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();

            expect(wrapper.text()).toContain('dialog.config_json.cache_size');
            expect(wrapper.text()).toContain('5.2');
            expect(wrapper.text()).toContain('GB');
        });

        test('renders config items', async () => {
            isVRChatConfigDialogVisible.value = true;
            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();

            expect(wrapper.text()).toContain(
                'dialog.config_json.max_cache_size'
            );
            expect(wrapper.text()).toContain(
                'dialog.config_json.cache_expiry_delay'
            );
            expect(wrapper.text()).toContain(
                'dialog.config_json.fpv_steadycam_fov'
            );
        });

        test('renders resolution selectors', async () => {
            isVRChatConfigDialogVisible.value = true;
            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();

            expect(wrapper.text()).toContain(
                'dialog.config_json.camera_resolution'
            );
            expect(wrapper.text()).toContain(
                'dialog.config_json.spout_resolution'
            );
            expect(wrapper.text()).toContain(
                'dialog.config_json.screenshot_resolution'
            );
        });

        test('renders checkbox options', async () => {
            isVRChatConfigDialogVisible.value = true;
            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();

            expect(wrapper.text()).toContain(
                'dialog.config_json.picture_sort_by_date'
            );
            expect(wrapper.text()).toContain(
                'dialog.config_json.disable_discord_presence'
            );
        });

        test('renders footer buttons', async () => {
            isVRChatConfigDialogVisible.value = true;
            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();

            expect(wrapper.text()).toContain('dialog.config_json.vrchat_docs');
            expect(wrapper.text()).toContain('dialog.config_json.cancel');
            expect(wrapper.text()).toContain('dialog.config_json.save');
        });
    });

    describe('config loading', () => {
        test('reads config file when dialog opens', async () => {
            mocks.appApi.ReadConfigFileSafe.mockResolvedValue(
                JSON.stringify({ cache_size: 50 })
            );

            mountComponent();
            isVRChatConfigDialogVisible.value = true;
            await flushPromises();
            await nextTick();
            await flushPromises();

            expect(mocks.appApi.ReadConfigFileSafe).toHaveBeenCalled();
        });
    });

    describe('save logic', () => {
        test('calls AppApi.WriteConfigFile on save', async () => {
            mocks.appApi.ReadConfigFileSafe.mockResolvedValue(
                JSON.stringify({ cache_size: 50 })
            );
            isVRChatConfigDialogVisible.value = true;

            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();
            await flushPromises();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.config_json.save'));
            await saveBtn.trigger('click');

            expect(mocks.appApi.WriteConfigFile).toHaveBeenCalled();
        });

        test('removes empty string values before saving', async () => {
            mocks.appApi.ReadConfigFileSafe.mockResolvedValue(
                JSON.stringify({ cache_directory: '', cache_size: 50 })
            );
            isVRChatConfigDialogVisible.value = true;

            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();
            await flushPromises();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.config_json.save'));
            await saveBtn.trigger('click');

            const savedJson = JSON.parse(
                mocks.appApi.WriteConfigFile.mock.calls[0][0]
            );
            expect(savedJson).not.toHaveProperty('cache_directory');
        });

        test('closes dialog after save', async () => {
            mocks.appApi.ReadConfigFileSafe.mockResolvedValue(
                JSON.stringify({})
            );
            isVRChatConfigDialogVisible.value = true;

            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();
            await flushPromises();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.config_json.save'));
            await saveBtn.trigger('click');

            expect(isVRChatConfigDialogVisible.value).toBe(false);
        });
    });

    describe('cache operations', () => {
        test('delete cache button triggers confirm dialog', async () => {
            isVRChatConfigDialogVisible.value = true;

            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();
            await flushPromises();

            const deleteBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.config_json.delete_cache')
                );
            expect(deleteBtn).toBeTruthy();
            await deleteBtn.trigger('click');

            expect(mocks.confirm).toHaveBeenCalled();
        });

        test('confirming delete calls AssetBundleManager.DeleteAllCache', async () => {
            mocks.confirm.mockResolvedValue({ ok: true });
            isVRChatConfigDialogVisible.value = true;

            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();
            await flushPromises();

            const deleteBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.config_json.delete_cache')
                );
            await deleteBtn.trigger('click');
            await flushPromises();

            expect(mocks.assetBundleManager.DeleteAllCache).toHaveBeenCalled();
            expect(mocks.toast.success).toHaveBeenCalledWith(
                'message.cache.deleted'
            );
        });

        test('sweep cache button calls sweepVRChatCache', async () => {
            isVRChatConfigDialogVisible.value = true;

            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();
            await flushPromises();

            const sweepBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.config_json.sweep_cache')
                );
            expect(sweepBtn).toBeTruthy();
            await sweepBtn.trigger('click');

            expect(mocks.sweepVRChatCache).toHaveBeenCalled();
        });
    });

    describe('close behavior', () => {
        test('clicking cancel closes dialog', async () => {
            mocks.appApi.ReadConfigFileSafe.mockResolvedValue(
                JSON.stringify({})
            );
            isVRChatConfigDialogVisible.value = true;

            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();
            await flushPromises();

            const cancelBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.config_json.cancel'));
            await cancelBtn.trigger('click');

            expect(isVRChatConfigDialogVisible.value).toBe(false);
        });
    });

    describe('external links', () => {
        test('clicking VRChat docs opens external link', async () => {
            isVRChatConfigDialogVisible.value = true;

            const wrapper = mountComponent();
            await flushPromises();
            await nextTick();
            await flushPromises();

            const docsBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.config_json.vrchat_docs')
                );
            await docsBtn.trigger('click');

            expect(mocks.openExternalLink).toHaveBeenCalledWith(
                'https://docs.vrchat.com/docs/configuration-file'
            );
        });
    });
});
