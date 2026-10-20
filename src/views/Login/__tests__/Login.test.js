import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';

vi.mock('../../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../../plugins/router', () => ({
    router: {
        beforeEach: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
        currentRoute: ref({ path: '/login', name: 'login', meta: {} }),
        isReady: vi.fn().mockResolvedValue(true)
    },
    initRouter: vi.fn()
}));
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: vi.fn(() => ({
            push: vi.fn(),
            replace: vi.fn(),
            currentRoute: ref({ path: '/login', name: 'login', meta: {} })
        })),
        useRoute: vi.fn(() => ({ query: {} }))
    };
});
vi.mock('../../../plugins/interopApi', () => ({ initInteropApi: vi.fn() }));
vi.mock('../../../services/database', () => ({
    database: new Proxy(
        {},
        {
            get: (_target, prop) => {
                if (prop === '__esModule') return false;
                return vi.fn().mockResolvedValue(null);
            }
        }
    )
}));
vi.mock('../../../services/config', () => ({
    default: {
        init: vi.fn(),
        getString: vi.fn().mockImplementation((_k, d) => d ?? '{}'),
        setString: vi.fn(),
        getBool: vi.fn().mockImplementation((_k, d) => d ?? false),
        setBool: vi.fn(),
        getInt: vi.fn().mockImplementation((_k, d) => d ?? 0),
        setInt: vi.fn(),
        getFloat: vi.fn().mockImplementation((_k, d) => d ?? 0),
        setFloat: vi.fn(),
        getObject: vi.fn().mockReturnValue(null),
        setObject: vi.fn(),
        getArray: vi.fn().mockReturnValue([]),
        setArray: vi.fn(),
        remove: vi.fn()
    }
}));
vi.mock('../../../services/jsonStorage', () => ({ default: vi.fn() }));
vi.mock('../../../services/webapi', () => ({
    default: {
        execute: vi.fn().mockResolvedValue({
            status: 200,
            data: JSON.stringify({
                page: { updated_at: '2026-10-14T00:00:00Z' },
                status: { description: 'All Systems Operational' },
                incidents: []
            })
        }),
        beginExternalLogin: vi.fn(),
        openExternalLogin: vi.fn().mockResolvedValue(true),
        cancelExternalLogin: vi.fn().mockResolvedValue(undefined),
        getExternalLoginState: vi.fn(),
        commitExternalLogin: vi.fn()
    }
}));
vi.mock('../../../services/watchState', () => ({
    watchState: {
        isLoggedIn: false,
        isFriendsLoaded: false,
        isFavoritesLoaded: false
    }
}));
vi.mock('vee-validate', () => ({
    Field: {
        name: 'VeeField',
        props: ['name'],
        setup(_props, { slots }) {
            return () =>
                slots.default?.({
                    field: { value: '', onChange: () => {}, onBlur: () => {} },
                    errors: []
                });
        }
    },
    useForm: vi.fn(() => ({
        handleSubmit: (fn) => fn,
        resetForm: vi.fn(),
        values: {}
    }))
}));
vi.mock('@vee-validate/zod', () => ({ toTypedSchema: vi.fn((s) => s) }));

import Login from '../Login.vue';
import en from '../../../localization/en.json';
import webApiService from '../../../services/webapi';
import { useAuthStore } from '../../../stores/auth';
import ExternalLogin from '../components/ExternalLogin.vue';
import ProviderLogo from '../components/ProviderLogo.vue';

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    fallbackWarn: false,
    messages: { en }
});

const stubs = {
    LoginSettingsDialog: { template: '<div class="login-settings-stub" />' },
    TooltipWrapper: {
        template: '<span><slot /></span>',
        props: ['side', 'content']
    },
    DropdownMenu: { template: '<div class="dropdown-stub"><slot /></div>' },
    DropdownMenuTrigger: {
        template: '<span><slot /></span>',
        props: ['asChild']
    },
    DropdownMenuContent: { template: '<div><slot /></div>' },
    DropdownMenuCheckboxItem: {
        template: '<div><slot /></div>',
        props: ['modelValue']
    },
    Button: {
        template: '<button :type="type || \'button\'" :id="id"><slot /></button>',
        props: ['type', 'variant', 'size', 'id']
    },
    Checkbox: { template: '<input type="checkbox" />', props: ['modelValue'] },
    Field: { template: '<div><slot /></div>' },
    FieldContent: { template: '<div><slot /></div>' },
    FieldError: { template: '<span />', props: ['errors'] },
    FieldGroup: { template: '<div><slot /></div>' },
    FieldLabel: { template: '<label><slot /></label>', props: ['for'] },
    InputGroupField: {
        template: '<input :id="id" :value="modelValue" :placeholder="placeholder" />',
        props: ['id', 'modelValue', 'type', 'autocomplete', 'name', 'placeholder', 'ariaInvalid', 'clearable'],
        emits: ['update:modelValue', 'blur']
    },
    ArrowBigDownDash: { template: '<span />' },
    Languages: { template: '<span />' },
    Trash2: { template: '<span />' }
};

/**
 * @param storeOverrides
 */
const mountedLogins = [];
afterEach(() => {
    for (const wrapper of mountedLogins.splice(0)) if (wrapper.exists()) wrapper.unmount();
});

function mountLogin(storeOverrides = {}) {
    const pinia = createTestingPinia({
        stubActions: false,
        initialState: {
            Auth: {
                loginForm: {
                    loading: false,
                    username: '',
                    password: '',
                    endpoint: '',
                    websocket: '',
                    saveCredentials: false,
                    lastUserLoggedIn: ''
                },
                ...storeOverrides
            }
        }
    });
    const wrapper = mount(Login, {
        attachTo: document.body,
        global: {
            plugins: [i18n, pinia],
            stubs
        }
    });
    mountedLogins.push(wrapper);
    return wrapper;
}

describe('Login.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('form rendering', () => {
        test('shows all six icon buttons including QR login without an experimental setting', () => {
            const wrapper = mountLogin();
            expect(wrapper.findAll('[data-provider]').map((button) => button.attributes('data-provider'))).toEqual([
                'steam',
                'meta',
                'google',
                'apple',
                'discord',
                'device'
            ]);
            expect(wrapper.get('[data-provider="device"]').attributes('aria-label')).toBe(
                en.view.login.external.qr_button
            );
            expect(wrapper.findAll('[data-provider]').every((button) => button.text() === '')).toBe(true);
            expect(wrapper.findAll('[data-provider]').every((button) => !!button.attributes('aria-label'))).toBe(true);
            expect(wrapper.findAll('[data-testid="save-login-data"]')).toHaveLength(1);
            expect(wrapper.text()).not.toContain('Remember this browser session');
            wrapper.unmount();
        });

        test.each([false, true])(
            'uses the shared save-login-data checkbox (%s) when automatically signing in',
            async (remember) => {
                const wrapper = mountLogin({
                    loginForm: {
                        loading: false,
                        username: 'existing',
                        password: 'existing-password',
                        saveCredentials: remember
                    }
                });
                const store = useAuthStore();
                vi.spyOn(store, 'prepareExternalLogin').mockResolvedValue(undefined);
                const complete = vi.spyOn(store, 'completeExternalLogin').mockResolvedValue(undefined);
                webApiService.beginExternalLogin.mockResolvedValue({
                    status: 'waiting',
                    provider: 'google',
                    operationId: 'preview'
                });
                webApiService.commitExternalLogin.mockResolvedValue({ id: 'usr_test', displayName: 'Test' });
                await wrapper.get('[data-provider="google"]').trigger('click');
                await flushPromises();
                expect(wrapper.get('#login-form').isVisible()).toBe(false);
                expect(wrapper.findAll('[data-provider]')).toHaveLength(0);
                expect(wrapper.find('[data-testid="auth-emblem"]').exists()).toBe(true);
                expect(wrapper.findComponent(ProviderLogo).props('provider')).toBe('google');
                const external = wrapper.findComponent(ExternalLogin);
                webApiService.getExternalLoginState.mockResolvedValue({
                    status: 'ready',
                    user: { id: 'usr_test', displayName: 'Test' }
                });
                await external.vm.$.setupState.controller.refresh();
                await flushPromises();
                expect(complete).toHaveBeenCalledWith(expect.objectContaining({ id: 'usr_test' }), 'google', remember);
                wrapper.unmount();
            }
        );

        test('cancelling pending authorization restores password form and provider buttons', async () => {
            const wrapper = mountLogin();
            vi.spyOn(useAuthStore(), 'prepareExternalLogin').mockResolvedValue(undefined);
            webApiService.beginExternalLogin.mockResolvedValue({
                status: 'waiting',
                provider: 'steam',
                operationId: 'preview'
            });
            await wrapper.get('[data-provider="steam"]').trigger('click');
            await flushPromises();
            expect(wrapper.get('#login-form').isVisible()).toBe(false);
            await wrapper.get('[data-testid="cancel-external-login"]').trigger('click');
            await flushPromises();
            expect(wrapper.get('#login-form').isVisible()).toBe(true);
            expect(wrapper.findAll('[data-provider]')).toHaveLength(6);
            expect(wrapper.find('[role="status"]').exists()).toBe(false);
            expect(wrapper.text()).not.toContain('Login cancelled');
            wrapper.unmount();
        });

        test('QR login displays the scannable image and the same cancel action', async () => {
            const wrapper = mountLogin();
            vi.spyOn(useAuthStore(), 'prepareExternalLogin').mockResolvedValue(undefined);
            webApiService.beginExternalLogin.mockResolvedValue({
                status: 'waiting',
                provider: 'device',
                operationId: 'qr-test',
                verificationUrl: 'https://example.com/test-qr'
            });
            await wrapper.get('[data-provider="device"]').trigger('click');
            await flushPromises();
            await vi.waitFor(() => expect(wrapper.find('img[alt="VRChat mobile login QR code"]').exists()).toBe(true));
            expect(webApiService.openExternalLogin).not.toHaveBeenCalled();
            expect(wrapper.get('[data-testid="cancel-external-login"]').text()).toBe('Cancel login');
            expect(wrapper.text()).not.toContain('experimental');
            expect(wrapper.get('#login-form').isVisible()).toBe(false);
        });
        test('renders username and password input fields', () => {
            const wrapper = mountLogin();
            const usernameInput = wrapper.find('#login-form-username');
            const passwordInput = wrapper.find('#login-form-password');
            expect(usernameInput.exists()).toBe(true);
            expect(passwordInput.exists()).toBe(true);
        });

        test('renders a login submit button', () => {
            const wrapper = mountLogin();
            const form = wrapper.find('#login-form');
            expect(form.exists()).toBe(true);
            const submitBtn = form.find('button[type="submit"]');
            expect(submitBtn.exists()).toBe(true);
        });

        test('renders a register button', () => {
            const wrapper = mountLogin();
            const buttons = wrapper.findAll('button');
            const registerBtn = buttons.find((b) => b.text() === en.view.login.register);
            expect(registerBtn).toBeTruthy();
        });

        test('renders save credentials checkbox', () => {
            const wrapper = mountLogin();
            const checkbox = wrapper.find('input[type="checkbox"]');
            expect(checkbox.exists()).toBe(true);
        });
    });

    describe('saved accounts section', () => {
        test('does not render saved accounts when credentials are empty', () => {
            const wrapper = mountLogin();
            const divider = wrapper.find('.x-vertical-divider');
            expect(divider.exists()).toBe(false);
        });
    });

    describe('legal notice', () => {
        test('renders legal notice section', () => {
            const wrapper = mountLogin();
            const legalNotice = wrapper.find('.x-legal-notice-container');
            expect(legalNotice.exists()).toBe(true);
        });
    });

    describe('login settings', () => {
        test('renders LoginSettingsDialog stub', () => {
            const wrapper = mountLogin();
            expect(wrapper.find('.login-settings-stub').exists()).toBe(true);
        });
    });
});
