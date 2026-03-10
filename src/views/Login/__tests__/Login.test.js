import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
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
        template:
            '<button :type="type || \'button\'" :id="id"><slot /></button>',
        props: ['type', 'variant', 'size', 'id']
    },
    Checkbox: { template: '<input type="checkbox" />', props: ['modelValue'] },
    Field: { template: '<div><slot /></div>' },
    FieldContent: { template: '<div><slot /></div>' },
    FieldError: { template: '<span />', props: ['errors'] },
    FieldGroup: { template: '<div><slot /></div>' },
    FieldLabel: { template: '<label><slot /></label>', props: ['for'] },
    InputGroupField: {
        template:
            '<input :id="id" :value="modelValue" :placeholder="placeholder" />',
        props: [
            'id',
            'modelValue',
            'type',
            'autocomplete',
            'name',
            'placeholder',
            'ariaInvalid',
            'clearable'
        ],
        emits: ['update:modelValue', 'blur']
    },
    ArrowBigDownDash: { template: '<span />' },
    Languages: { template: '<span />' },
    Trash2: { template: '<span />' }
};

/**
 *
 * @param storeOverrides
 */
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
    return mount(Login, {
        global: {
            plugins: [i18n, pinia],
            stubs
        }
    });
}

describe('Login.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('form rendering', () => {
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
            const registerBtn = buttons.find(
                (b) => b.text() === en.view.login.register
            );
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
