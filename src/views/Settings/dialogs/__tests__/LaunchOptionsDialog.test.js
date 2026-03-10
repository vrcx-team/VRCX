import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

// ─── Hoisted mocks (accessible inside vi.mock factories) ─────────────

const mocks = vi.hoisted(() => ({
    configRepository: {
        getString: vi.fn().mockResolvedValue(''),
        setString: vi.fn()
    },
    openExternalLink: vi.fn(),
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn()
    }
}));

const isLaunchOptionsDialogVisible = ref(true);

vi.mock('pinia', () => ({
    storeToRefs: () => ({ isLaunchOptionsDialogVisible }),
    defineStore: (id, fn) => fn
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    ,
            locale: require('vue').ref('en')
        })
}));

vi.mock('../../../../stores', () => ({
    useLaunchStore: () => ({})
}));

vi.mock('../../../../services/config', () => ({
    default: mocks.configRepository
}));

vi.mock('../../../../shared/utils', () => ({
    openExternalLink: (...args) => mocks.openExternalLink(...args)
}));

vi.mock('vue-sonner', () => ({
    toast: mocks.toast
}));

import LaunchOptionsDialog from '../LaunchOptionsDialog.vue';

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
    return mount(LaunchOptionsDialog, {
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
                    props: ['variant', 'disabled'],
                    template:
                        '<button @click="$emit(\'click\')" :disabled="disabled"><slot /></button>'
                },
                InputGroupTextareaField: {
                    props: [
                        'modelValue',
                        'placeholder',
                        'rows',
                        'autosize',
                        'inputClass',
                        'spellcheck'
                    ],
                    emits: ['update:modelValue'],
                    template:
                        '<textarea data-testid="textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>'
                },
                Badge: { template: '<span><slot /></span>' }
            }
        }
    });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('LaunchOptionsDialog.vue', () => {
    beforeEach(() => {
        isLaunchOptionsDialogVisible.value = true;
        mocks.configRepository.getString.mockResolvedValue('');
        vi.clearAllMocks();
        globalThis.LINUX = false;
    });

    describe('rendering', () => {
        test('renders dialog title', async () => {
            const wrapper = mountComponent();
            await flushPromises();
            expect(wrapper.text()).toContain('dialog.launch_options.header');
        });

        test('renders description and example args', async () => {
            const wrapper = mountComponent();
            await flushPromises();
            expect(wrapper.text()).toContain(
                'dialog.launch_options.description'
            );
            expect(wrapper.text()).toContain('--fps=144');
            expect(wrapper.text()).toContain('--enable-debug-gui');
        });

        test('renders save button', async () => {
            const wrapper = mountComponent();
            await flushPromises();
            expect(wrapper.text()).toContain('dialog.launch_options.save');
        });

        test('renders VRChat docs and Unity manual buttons', async () => {
            const wrapper = mountComponent();
            await flushPromises();
            expect(wrapper.text()).toContain(
                'dialog.launch_options.vrchat_docs'
            );
            expect(wrapper.text()).toContain(
                'dialog.launch_options.unity_manual'
            );
        });

        test('renders path override section when not Linux', async () => {
            globalThis.LINUX = false;
            const wrapper = mountComponent();
            await flushPromises();
            expect(wrapper.text()).toContain(
                'dialog.launch_options.path_override'
            );
        });

        test('hides path override section on Linux', async () => {
            globalThis.LINUX = true;
            const wrapper = mountComponent();
            await flushPromises();
            expect(wrapper.text()).not.toContain(
                'dialog.launch_options.path_override'
            );
        });

        test('does not render when not visible', () => {
            isLaunchOptionsDialogVisible.value = false;
            const wrapper = mountComponent();
            expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
        });
    });

    describe('initialization', () => {
        test('loads launch arguments from configRepository on mount', async () => {
            mocks.configRepository.getString.mockImplementation((key) => {
                if (key === 'launchArguments')
                    return Promise.resolve('--fps=90');
                if (key === 'vrcLaunchPathOverride')
                    return Promise.resolve('C:\\VRChat');
                return Promise.resolve('');
            });

            mountComponent();
            await flushPromises();

            expect(mocks.configRepository.getString).toHaveBeenCalledWith(
                'launchArguments'
            );
            expect(mocks.configRepository.getString).toHaveBeenCalledWith(
                'vrcLaunchPathOverride'
            );
        });

        test('clears null/string-null vrcLaunchPathOverride values', async () => {
            mocks.configRepository.getString.mockImplementation((key) => {
                if (key === 'vrcLaunchPathOverride')
                    return Promise.resolve('null');
                return Promise.resolve('');
            });

            mountComponent();
            await flushPromises();

            expect(mocks.configRepository.setString).toHaveBeenCalledWith(
                'vrcLaunchPathOverride',
                ''
            );
        });
    });

    describe('save logic', () => {
        test('normalizes whitespace in launch arguments on save', async () => {
            mocks.configRepository.getString.mockImplementation((key) => {
                if (key === 'launchArguments')
                    return Promise.resolve('--fps=90   --debug  ');
                return Promise.resolve('');
            });

            const wrapper = mountComponent();
            await flushPromises();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.launch_options.save'));
            await saveBtn.trigger('click');

            expect(mocks.configRepository.setString).toHaveBeenCalledWith(
                'launchArguments',
                '--fps=90 --debug'
            );
        });

        test('shows error toast for invalid .exe path', async () => {
            mocks.configRepository.getString.mockImplementation((key) => {
                if (key === 'launchArguments') return Promise.resolve('');
                if (key === 'vrcLaunchPathOverride')
                    return Promise.resolve('C:\\VRChat\\VRChat.exe');
                return Promise.resolve('');
            });

            const wrapper = mountComponent();
            await flushPromises();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.launch_options.save'));
            await saveBtn.trigger('click');

            expect(mocks.toast.error).toHaveBeenCalledWith(
                'message.launch.invalid_path'
            );
        });

        test('accepts valid launch.exe path', async () => {
            mocks.configRepository.getString.mockImplementation((key) => {
                if (key === 'launchArguments') return Promise.resolve('');
                if (key === 'vrcLaunchPathOverride')
                    return Promise.resolve('C:\\VRChat\\launch.exe');
                return Promise.resolve('');
            });

            const wrapper = mountComponent();
            await flushPromises();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.launch_options.save'));
            await saveBtn.trigger('click');

            expect(mocks.toast.error).not.toHaveBeenCalled();
            expect(mocks.toast.success).toHaveBeenCalled();
        });

        test('closes dialog after successful save', async () => {
            const wrapper = mountComponent();
            await flushPromises();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.launch_options.save'));
            await saveBtn.trigger('click');

            expect(isLaunchOptionsDialogVisible.value).toBe(false);
        });
    });

    describe('external links', () => {
        test('clicking VRChat docs button opens external link', async () => {
            const wrapper = mountComponent();
            await flushPromises();

            const docsBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.launch_options.vrchat_docs')
                );
            await docsBtn.trigger('click');

            expect(mocks.openExternalLink).toHaveBeenCalledWith(
                'https://docs.vrchat.com/docs/launch-options'
            );
        });

        test('clicking Unity manual button opens external link', async () => {
            const wrapper = mountComponent();
            await flushPromises();

            const unityBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.launch_options.unity_manual')
                );
            await unityBtn.trigger('click');

            expect(mocks.openExternalLink).toHaveBeenCalledWith(
                'https://docs.unity3d.com/Manual/CommandLineArguments.html'
            );
        });
    });
});
