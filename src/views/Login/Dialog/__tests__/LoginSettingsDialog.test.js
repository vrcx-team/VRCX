import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

const mocks = vi.hoisted(() => ({
    loginForm: null,
    enableCustomEndpoint: null,
    toggleCustomEndpoint: vi.fn(),
    restartVRCX: vi.fn(),
    setProxyServer: vi.fn(),
    authStore: null,
    vrcxStore: null
}));

vi.mock('pinia', () => ({
    storeToRefs: (store) => store
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    })
}));

vi.mock('../../../../stores', () => ({
    useAuthStore: () => mocks.authStore,
    useVRCXUpdaterStore: () => ({
        restartVRCX: (...args) => mocks.restartVRCX(...args)
    }),
    useVrcxStore: () => mocks.vrcxStore
}));

vi.mock('../../../../services/appConfig', () => ({
    AppDebug: {
        endpointDomainVrchat: 'api.vrchat.cloud',
        websocketDomainVrchat: 'pipeline.vrchat.cloud'
    }
}));

vi.mock('@/components/ui/dialog', () => ({
    Dialog: {
        props: ['open'],
        emits: ['update:open'],
        template:
            '<div data-testid="dialog-root">' +
            '<button data-testid="open-dialog" @click="$emit(\'update:open\', true)">open</button>' +
            '<slot />' +
            '</div>'
    },
    DialogTrigger: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' },
    DialogFooter: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/field', () => ({
    Field: { template: '<div><slot /></div>' },
    FieldContent: { template: '<div><slot /></div>' },
    FieldGroup: { template: '<div><slot /></div>' },
    FieldLabel: { template: '<label><slot /></label>' }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template: '<button @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/checkbox', () => ({
    Checkbox: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template:
            '<button data-testid="toggle-custom-endpoint" @click="$emit(\'update:modelValue\', !modelValue)">toggle</button>'
    }
}));

vi.mock('@/components/ui/input-group', () => ({
    InputGroupField: {
        props: ['id', 'modelValue'],
        emits: ['update:modelValue'],
        template:
            '<input :id="id" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
    }
}));

vi.mock('lucide-vue-next', () => ({
    Settings: { template: '<span />' }
}));

import LoginSettingsDialog from '../LoginSettingsDialog.vue';

function mountDialog() {
    return mount(LoginSettingsDialog, {
        global: {
            stubs: {
                TooltipWrapper: { template: '<div><slot /></div>' }
            }
        }
    });
}

function clickButtonByText(wrapper, text) {
    const button = wrapper
        .findAll('button')
        .find((node) => node.text().trim() === text);
    if (!button) {
        throw new Error(`Cannot find button with text: ${text}`);
    }
    return button.trigger('click');
}

describe('LoginSettingsDialog.vue', () => {
    beforeEach(() => {
        mocks.loginForm = ref({ endpoint: '', websocket: '' });
        mocks.enableCustomEndpoint = ref(false);
        mocks.toggleCustomEndpoint.mockReset();
        mocks.restartVRCX.mockReset();
        mocks.setProxyServer.mockReset();

        mocks.vrcxStore = {
            proxyServer: 'http://proxy.local:7890',
            setProxyServer: (...args) => mocks.setProxyServer(...args)
        };
        mocks.setProxyServer.mockImplementation((value) => {
            mocks.vrcxStore.proxyServer = value;
        });
        mocks.authStore = {
            loginForm: mocks.loginForm,
            enableCustomEndpoint: mocks.enableCustomEndpoint,
            toggleCustomEndpoint: (...args) =>
                mocks.toggleCustomEndpoint(...args)
        };

        globalThis.VRCXStorage = {
            Set: vi.fn().mockResolvedValue(undefined),
            Save: vi.fn().mockResolvedValue(undefined)
        };
    });

    test('loads proxy value when dialog opens', async () => {
        const wrapper = mountDialog();

        await wrapper.get('[data-testid="open-dialog"]').trigger('click');
        await nextTick();

        expect(wrapper.get('#login-settings-proxy').element.value).toBe(
            'http://proxy.local:7890'
        );
    });

    test('toggles custom endpoint and shows endpoint inputs', async () => {
        const wrapper = mountDialog();

        await wrapper
            .get('[data-testid="toggle-custom-endpoint"]')
            .trigger('click');
        await nextTick();

        expect(mocks.toggleCustomEndpoint).toHaveBeenCalledTimes(1);
    });

    test('saves proxy and closes', async () => {
        const wrapper = mountDialog();

        await wrapper.get('[data-testid="open-dialog"]').trigger('click');
        await wrapper
            .get('#login-settings-proxy')
            .setValue('http://127.0.0.1:8080');
        await clickButtonByText(wrapper, 'prompt.proxy_settings.close');

        expect(mocks.setProxyServer).toHaveBeenCalledWith(
            'http://127.0.0.1:8080'
        );
        expect(globalThis.VRCXStorage.Set).toHaveBeenCalledWith(
            'VRCX_ProxyServer',
            'http://127.0.0.1:8080'
        );
        expect(globalThis.VRCXStorage.Save).toHaveBeenCalledTimes(1);
        expect(mocks.restartVRCX).not.toHaveBeenCalled();
    });

    test('saves proxy and restarts app', async () => {
        const wrapper = mountDialog();

        await wrapper.get('[data-testid="open-dialog"]').trigger('click');
        await wrapper
            .get('#login-settings-proxy')
            .setValue('http://192.168.0.2:3128');
        await clickButtonByText(wrapper, 'prompt.proxy_settings.restart');

        expect(mocks.setProxyServer).toHaveBeenCalledWith(
            'http://192.168.0.2:3128'
        );
        expect(globalThis.VRCXStorage.Save).toHaveBeenCalledTimes(1);
        expect(mocks.restartVRCX).toHaveBeenCalledWith(false);
    });
});
