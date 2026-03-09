import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

// ─── Hoisted mocks ──────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
    openExternalLink: vi.fn(),
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn()
    },
    setBioLanguage: vi.fn(),
    translateText: vi.fn().mockResolvedValue('Bonjour le monde'),
    fetchAvailableModels: vi.fn().mockResolvedValue([]),
    setTranslationApiKey: vi.fn().mockResolvedValue(undefined),
    setTranslationApiType: vi.fn().mockResolvedValue(undefined),
    setTranslationApiEndpoint: vi.fn().mockResolvedValue(undefined),
    setTranslationApiModel: vi.fn().mockResolvedValue(undefined),
    setTranslationApiPrompt: vi.fn().mockResolvedValue(undefined)
}));

const bioLanguage = ref('en');
const translationApiKey = ref('');
const translationApiType = ref('google');
const translationApiEndpoint = ref('');
const translationApiModel = ref('');
const translationApiPrompt = ref('');

vi.mock('pinia', () => ({
    storeToRefs: () => ({
        bioLanguage,
        translationApiKey,
        translationApiType,
        translationApiEndpoint,
        translationApiModel,
        translationApiPrompt
    }),
    defineStore: (id, fn) => fn
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
        locale: require('vue').ref('en')
    })
}));

vi.mock('../../../../stores', () => ({
    useAdvancedSettingsStore: () => ({
        setBioLanguage: mocks.setBioLanguage,
        translateText: mocks.translateText,
        fetchAvailableModels: mocks.fetchAvailableModels,
        setTranslationApiKey: mocks.setTranslationApiKey,
        setTranslationApiType: mocks.setTranslationApiType,
        setTranslationApiEndpoint: mocks.setTranslationApiEndpoint,
        setTranslationApiModel: mocks.setTranslationApiModel,
        setTranslationApiPrompt: mocks.setTranslationApiPrompt
    })
}));

vi.mock('../../../../shared/utils', () => ({
    openExternalLink: (...args) => mocks.openExternalLink(...args)
}));

vi.mock('vue-sonner', () => ({
    toast: mocks.toast
}));

vi.mock('../../../../localization', () => ({
    getLanguageName: (code) => `Language_${code}`,
    languageCodes: ['en', 'ja', 'ko', 'zh-CN', 'fr']
}));

import TranslationApiDialog from '../TranslationApiDialog.vue';

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 *
 */
function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 *
 * @param propsOverrides
 */
function mountComponent(propsOverrides = {}) {
    return mount(TranslationApiDialog, {
        props: {
            isTranslationApiDialogVisible: true,
            ...propsOverrides
        },
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
                InputGroupField: {
                    props: [
                        'modelValue',
                        'type',
                        'showPassword',
                        'placeholder',
                        'clearable'
                    ],
                    emits: ['update:modelValue'],
                    template:
                        '<input data-testid="input-field" :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
                },
                InputGroupTextareaField: {
                    props: ['modelValue', 'rows', 'clearable'],
                    emits: ['update:modelValue'],
                    template:
                        '<textarea data-testid="textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>'
                },
                Select: {
                    props: ['modelValue'],
                    emits: ['update:modelValue'],
                    template:
                        '<select data-testid="select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>'
                },
                SelectTrigger: {
                    props: ['size'],
                    template: '<div><slot /></div>'
                },
                SelectValue: {
                    props: ['placeholder', 'textValue'],
                    template: '<span>{{ placeholder }}</span>'
                },
                SelectContent: { template: '<div><slot /></div>' },
                SelectGroup: { template: '<div><slot /></div>' },
                SelectItem: {
                    props: ['value', 'textValue'],
                    template: '<option :value="value"><slot /></option>'
                },
                FieldGroup: {
                    template: '<div data-testid="field-group"><slot /></div>'
                },
                Field: { template: '<div data-testid="field"><slot /></div>' },
                FieldLabel: { template: '<label><slot /></label>' },
                FieldContent: { template: '<div><slot /></div>' }
            }
        }
    });
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('TranslationApiDialog.vue', () => {
    beforeEach(() => {
        bioLanguage.value = 'en';
        translationApiKey.value = '';
        translationApiType.value = 'google';
        translationApiEndpoint.value = '';
        translationApiModel.value = '';
        translationApiPrompt.value = '';
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        test('renders dialog title', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('dialog.translation_api.header');
        });

        test('renders bio language selector', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain(
                'view.settings.appearance.appearance.bio_language'
            );
        });

        test('renders language options', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('Language_en');
            expect(wrapper.text()).toContain('Language_ja');
        });

        test('renders API type selector', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('dialog.translation_api.mode');
        });

        test('renders google and openai options', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain(
                'dialog.translation_api.mode_google'
            );
            expect(wrapper.text()).toContain(
                'dialog.translation_api.mode_openai'
            );
        });

        test('does not render when not visible', () => {
            const wrapper = mountComponent({
                isTranslationApiDialogVisible: false
            });
            expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
        });

        test('renders save button', () => {
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('dialog.translation_api.save');
        });
    });

    describe('google mode', () => {
        test('shows API key field in google mode', () => {
            translationApiType.value = 'google';
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain(
                'dialog.translation_api.description'
            );
        });

        test('shows guide button in google mode', () => {
            translationApiType.value = 'google';
            const wrapper = mountComponent();
            expect(wrapper.text()).toContain('dialog.translation_api.guide');
        });

        test('clicking guide button opens external link', async () => {
            translationApiType.value = 'google';
            const wrapper = mountComponent();

            const guideBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.translation_api.guide'));
            await guideBtn.trigger('click');

            expect(mocks.openExternalLink).toHaveBeenCalledWith(
                'https://translatepress.com/docs/automatic-translation/generate-google-api-key/'
            );
        });

        test('does not show openai-specific fields', () => {
            translationApiType.value = 'google';
            const wrapper = mountComponent();
            expect(wrapper.text()).not.toContain(
                'dialog.translation_api.openai.endpoint'
            );
            expect(wrapper.text()).not.toContain(
                'dialog.translation_api.openai.model'
            );
        });
    });

    describe('openai mode', () => {
        test('shows endpoint, api key, model, and prompt fields', async () => {
            translationApiType.value = 'openai';
            const wrapper = mountComponent();
            await nextTick();

            expect(wrapper.text()).toContain(
                'dialog.translation_api.openai.endpoint'
            );
            expect(wrapper.text()).toContain(
                'dialog.translation_api.openai.api_key'
            );
            expect(wrapper.text()).toContain(
                'dialog.translation_api.openai.model'
            );
            expect(wrapper.text()).toContain(
                'dialog.translation_api.openai.prompt_optional'
            );
        });

        test('shows test button in openai mode', async () => {
            translationApiType.value = 'openai';
            const wrapper = mountComponent();
            await nextTick();

            expect(wrapper.text()).toContain('dialog.translation_api.test');
        });

        test('does not show guide button in openai mode', async () => {
            translationApiType.value = 'openai';
            const wrapper = mountComponent();
            await nextTick();

            expect(wrapper.text()).not.toContain(
                'dialog.translation_api.guide'
            );
        });

        test('shows fetch models button', async () => {
            translationApiType.value = 'openai';
            const wrapper = mountComponent();
            await nextTick();

            expect(wrapper.text()).toContain(
                'dialog.translation_api.fetch_models'
            );
        });
    });

    describe('save logic', () => {
        test('saves all config values on save in google mode', async () => {
            translationApiType.value = 'google';
            translationApiKey.value = 'test-key';
            const wrapper = mountComponent();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.translation_api.save'));
            await saveBtn.trigger('click');
            await flushPromises();

            expect(mocks.setTranslationApiType).toHaveBeenCalledWith('google');
            expect(mocks.setTranslationApiKey).toHaveBeenCalled();
            expect(mocks.toast.success).toHaveBeenCalledWith(
                'dialog.translation_api.msg_settings_saved'
            );
        });

        test('warns if openai endpoint/model are empty on save', async () => {
            translationApiType.value = 'openai';
            translationApiEndpoint.value = '';
            translationApiModel.value = '';
            const wrapper = mountComponent();
            await nextTick();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.translation_api.save'));
            await saveBtn.trigger('click');
            await flushPromises();

            expect(mocks.toast.warning).toHaveBeenCalledWith(
                'dialog.translation_api.msg_fill_endpoint_model'
            );
            expect(mocks.setTranslationApiType).not.toHaveBeenCalled();
        });

        test('emits close event after successful save', async () => {
            translationApiType.value = 'google';
            const wrapper = mountComponent();

            const saveBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.translation_api.save'));
            await saveBtn.trigger('click');
            await flushPromises();

            expect(
                wrapper.emitted('update:isTranslationApiDialogVisible')
            ).toBeTruthy();
            expect(
                wrapper.emitted('update:isTranslationApiDialogVisible')[0]
            ).toEqual([false]);
        });
    });

    describe('test translation', () => {
        test('calls translateText with test parameters in openai mode', async () => {
            translationApiType.value = 'openai';
            translationApiEndpoint.value =
                'https://api.openai.com/v1/chat/completions';
            translationApiModel.value = 'gpt-4';
            const wrapper = mountComponent();
            await nextTick();

            const testBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.translation_api.test'));
            await testBtn.trigger('click');
            await flushPromises();

            expect(mocks.translateText).toHaveBeenCalledWith(
                'Hello world',
                'fr',
                expect.objectContaining({
                    type: 'openai'
                })
            );
            expect(mocks.toast.success).toHaveBeenCalledWith(
                'dialog.translation_api.msg_test_success'
            );
        });

        test('shows error toast when test fails', async () => {
            translationApiType.value = 'openai';
            translationApiEndpoint.value =
                'https://api.openai.com/v1/chat/completions';
            translationApiModel.value = 'gpt-4';
            mocks.translateText.mockRejectedValue(new Error('fail'));
            const wrapper = mountComponent();
            await nextTick();

            const testBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.translation_api.test'));
            await testBtn.trigger('click');
            await flushPromises();

            expect(mocks.toast.error).toHaveBeenCalledWith(
                'dialog.translation_api.msg_test_failed'
            );
        });

        test('warns when endpoint/model are missing before test', async () => {
            translationApiType.value = 'openai';
            translationApiEndpoint.value = '';
            translationApiModel.value = '';
            const wrapper = mountComponent();
            await nextTick();

            const testBtn = wrapper
                .findAll('button')
                .find((b) => b.text().includes('dialog.translation_api.test'));
            await testBtn.trigger('click');
            await flushPromises();

            expect(mocks.toast.warning).toHaveBeenCalledWith(
                'dialog.translation_api.msg_fill_endpoint_model'
            );
        });
    });

    describe('fetch models', () => {
        test('fetches models and shows success toast', async () => {
            translationApiType.value = 'openai';
            translationApiEndpoint.value =
                'https://api.openai.com/v1/chat/completions';
            mocks.fetchAvailableModels.mockResolvedValue([
                'gpt-4',
                'gpt-3.5-turbo'
            ]);
            const wrapper = mountComponent();
            await nextTick();

            const fetchBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.translation_api.fetch_models')
                );
            await fetchBtn.trigger('click');
            await flushPromises();

            expect(mocks.fetchAvailableModels).toHaveBeenCalled();
            expect(mocks.toast.success).toHaveBeenCalledWith(
                expect.stringContaining(
                    'dialog.translation_api.msg_models_fetched'
                )
            );
        });

        test('warns when no models found', async () => {
            translationApiType.value = 'openai';
            translationApiEndpoint.value =
                'https://api.openai.com/v1/chat/completions';
            mocks.fetchAvailableModels.mockResolvedValue([]);
            const wrapper = mountComponent();
            await nextTick();

            const fetchBtn = wrapper
                .findAll('button')
                .find((b) =>
                    b.text().includes('dialog.translation_api.fetch_models')
                );
            await fetchBtn.trigger('click');
            await flushPromises();

            expect(mocks.toast.warning).toHaveBeenCalledWith(
                'dialog.translation_api.msg_no_models_found'
            );
        });
    });

    describe('form loading', () => {
        test('loads form values from store when dialog opens', async () => {
            translationApiType.value = 'openai';
            translationApiEndpoint.value = 'https://custom.api/v1';
            translationApiModel.value = 'custom-model';
            translationApiKey.value = 'sk-test';
            translationApiPrompt.value = 'Translate precisely';

            const wrapper = mountComponent();
            await nextTick();

            // openai mode fields should be visible
            expect(wrapper.text()).toContain(
                'dialog.translation_api.openai.endpoint'
            );
        });
    });
});
