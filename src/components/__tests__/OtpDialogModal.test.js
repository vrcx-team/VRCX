/* eslint-disable  pretty-import/sort-import-groups */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

import en from '../../localization/en.json';

vi.mock('../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../plugin/router', () => ({
    router: {
        beforeEach: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
        currentRoute: ref({ path: '/', name: '', meta: {} }),
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
            currentRoute: ref({ path: '/', name: '', meta: {} })
        }))
    };
});
vi.mock('../../plugin/interopApi', () => ({ initInteropApi: vi.fn() }));
vi.mock('../../service/database', () => ({
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
vi.mock('../../service/config', () => ({
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
vi.mock('../../service/jsonStorage', () => ({ default: vi.fn() }));
vi.mock('../../service/watchState', () => ({
    watchState: { isLoggedIn: false }
}));

import OtpDialogModal from '../ui/dialog/OtpDialogModal.vue';
import { useModalStore } from '../../stores/modal';

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    fallbackWarn: false,
    messages: { en }
});

// Stubs: render children directly so we can inspect DOM without real reka-ui portals
const stubs = {
    Dialog: {
        template: '<div class="dialog-stub" v-if="open"><slot /></div>',
        props: ['open']
    },
    DialogContent: {
        template: '<div class="dialog-content-stub"><slot /></div>'
    },
    DialogHeader: { template: '<div class="dialog-header"><slot /></div>' },
    DialogTitle: { template: '<span class="dialog-title"><slot /></span>' },
    DialogDescription: {
        template: '<span class="dialog-description"><slot /></span>'
    },
    DialogFooter: { template: '<div class="dialog-footer"><slot /></div>' },
    InputOTP: {
        name: 'InputOTP',
        template:
            '<div class="input-otp-stub"><input :data-maxlength="maxlength" :inputmode="inputmode" /><slot /></div>',
        props: ['maxlength', 'inputmode', 'modelValue', 'pasteTransformer'],
        emits: ['update:modelValue', 'complete']
    },
    InputOTPGroup: { template: '<div class="otp-group"><slot /></div>' },
    InputOTPSlot: {
        template: '<div class="otp-slot" :data-index="index"></div>',
        props: ['index']
    },
    InputOTPSeparator: { template: '<div class="otp-separator">-</div>' }
};

function mountOtpDialog(storeOverrides = {}) {
    const pinia = createTestingPinia({
        stubActions: false,
        initialState: {
            Modal: storeOverrides
        }
    });
    return mount(OtpDialogModal, {
        global: {
            plugins: [i18n, pinia],
            stubs
        }
    });
}

describe('OtpDialogModal.vue', () => {
    let store;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('visibility', () => {
        test('does not render when otpOpen is false', () => {
            const wrapper = mountOtpDialog({ otpOpen: false });
            store = useModalStore();
            expect(wrapper.find('.dialog-stub').exists()).toBe(false);
        });

        test('renders dialog when otpOpen is true', () => {
            const wrapper = mountOtpDialog({ otpOpen: true });
            store = useModalStore();
            expect(wrapper.find('.dialog-stub').exists()).toBe(true);
        });
    });

    describe('title and description', () => {
        test('displays title and description from store', () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpTitle: 'Enter TOTP Code',
                otpDescription: 'Check your authenticator app'
            });
            store = useModalStore();
            expect(wrapper.find('.dialog-title').text()).toBe(
                'Enter TOTP Code'
            );
            expect(wrapper.find('.dialog-description').text()).toBe(
                'Check your authenticator app'
            );
        });
    });

    describe('mode rendering', () => {
        test('renders 6 slots for totp mode', () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpMode: 'totp'
            });
            store = useModalStore();
            const otpInput = wrapper.find('.input-otp-stub');
            expect(otpInput.exists()).toBe(true);
            expect(otpInput.find('input').attributes('data-maxlength')).toBe(
                '6'
            );
            expect(otpInput.find('input').attributes('inputmode')).toBe(
                'numeric'
            );
            const slots = wrapper.findAll('.otp-slot');
            expect(slots).toHaveLength(6);
            expect(wrapper.find('.otp-separator').exists()).toBe(false);
        });

        test('renders 6 slots for emailOtp mode', () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpMode: 'emailOtp'
            });
            store = useModalStore();
            const otpInput = wrapper.find('.input-otp-stub');
            expect(otpInput.exists()).toBe(true);
            expect(otpInput.find('input').attributes('data-maxlength')).toBe(
                '6'
            );
            expect(otpInput.find('input').attributes('inputmode')).toBe(
                'numeric'
            );
            const slots = wrapper.findAll('.otp-slot');
            expect(slots).toHaveLength(6);
        });

        test('renders 8 slots with separator for otp (recovery) mode', () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpMode: 'otp'
            });
            store = useModalStore();
            const otpInput = wrapper.find('.input-otp-stub');
            expect(otpInput.exists()).toBe(true);
            expect(otpInput.find('input').attributes('data-maxlength')).toBe(
                '8'
            );
            expect(otpInput.find('input').attributes('inputmode')).toBe('text');
            const slots = wrapper.findAll('.otp-slot');
            expect(slots).toHaveLength(8);
            expect(wrapper.find('.otp-separator').exists()).toBe(true);
        });

        test('does not render otp input when mode is totp', () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpMode: 'totp'
            });
            store = useModalStore();
            // Should not have the 8-slot recovery code input
            const inputs = wrapper.findAll('.input-otp-stub');
            expect(inputs).toHaveLength(1);
            expect(inputs[0].find('input').attributes('data-maxlength')).toBe(
                '6'
            );
        });
    });

    describe('button text', () => {
        test('displays ok and cancel text from store', () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpOkText: 'Verify',
                otpCancelText: 'Use Recovery'
            });
            store = useModalStore();
            const buttons = wrapper.findAll('button');
            const cancelBtn = buttons.find((b) => b.text() === 'Use Recovery');
            const okBtn = buttons.find((b) => b.text() === 'Verify');
            expect(cancelBtn).toBeTruthy();
            expect(okBtn).toBeTruthy();
        });
    });

    describe('cancel button', () => {
        test('calls handleOtpCancel when cancel button is clicked', async () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpOkText: 'Verify',
                otpCancelText: 'Cancel'
            });
            store = useModalStore();
            const spy = vi.spyOn(store, 'handleOtpCancel');

            const cancelBtn = wrapper
                .findAll('button')
                .find((b) => b.text() === 'Cancel');
            await cancelBtn.trigger('click');

            expect(spy).toHaveBeenCalledWith('');
        });
    });

    describe('submit', () => {
        test('does not call handleOtpOk on form submit when value is empty', async () => {
            const wrapper = mountOtpDialog({
                otpOpen: true
            });
            store = useModalStore();
            const spy = vi.spyOn(store, 'handleOtpOk');

            await wrapper.find('form').trigger('submit');
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('complete event', () => {
        test('calls handleOtpOk when InputOTP emits complete', async () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpMode: 'totp'
            });
            store = useModalStore();
            const spy = vi.spyOn(store, 'handleOtpOk');

            const otpInput = wrapper.findComponent({ name: 'InputOTP' });
            otpInput.vm.$emit('complete', '123456');
            await wrapper.vm.$nextTick();

            expect(spy).toHaveBeenCalledWith('123456');
        });
    });

    describe('value reset', () => {
        test('resets otpValue when dialog opens', async () => {
            const wrapper = mountOtpDialog({
                otpOpen: false,
                otpMode: 'totp'
            });
            store = useModalStore();

            // Simulate opening: the watcher clears the value
            store.otpOpen = true;
            await wrapper.vm.$nextTick();
            // Wait for the watcher + nextTick inside it
            await wrapper.vm.$nextTick();

            // Dialog should now be visible and InputOTP should have empty modelValue
            const otpInput = wrapper.findComponent({ name: 'InputOTP' });
            expect(otpInput.exists()).toBe(true);
            expect(otpInput.props('modelValue')).toBe('');
        });
    });

    describe('paste transformer', () => {
        test('recovery code InputOTP has pasteTransformer that strips non-alphanumeric chars', () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpMode: 'otp'
            });
            store = useModalStore();
            const otpInput = wrapper.findComponent({ name: 'InputOTP' });
            const transformer = otpInput.props('pasteTransformer');
            expect(transformer).toBeTypeOf('function');
            expect(transformer('abcd-1234')).toBe('abcd1234');
            expect(transformer('ab-cd-12-34')).toBe('abcd1234');
            expect(transformer('abcd1234')).toBe('abcd1234');
        });

        test('totp InputOTP does not have pasteTransformer', () => {
            const wrapper = mountOtpDialog({
                otpOpen: true,
                otpMode: 'totp'
            });
            store = useModalStore();
            const otpInput = wrapper.findComponent({ name: 'InputOTP' });
            expect(otpInput.props('pasteTransformer')).toBeUndefined();
        });
    });
});
