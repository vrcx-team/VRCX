/* eslint-disable  pretty-import/sort-import-groups */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
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
vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal();
    const i18n = actual.createI18n({
        locale: 'en',
        fallbackLocale: 'en',
        legacy: false,
        missingWarn: false,
        fallbackWarn: false,
        messages: { en }
    });
    return {
        ...actual,
        useI18n: () => i18n.global
    };
});

import { useModalStore } from '../modal';

describe('useModalStore', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useModalStore();
    });

    describe('confirm', () => {
        test('opens dialog and resolves ok:true on handleOk', async () => {
            const promise = store.confirm({
                title: 'Delete?',
                description: 'Are you sure?'
            });

            expect(store.alertOpen).toBe(true);
            expect(store.alertMode).toBe('confirm');
            expect(store.alertTitle).toBe('Delete?');
            expect(store.alertDescription).toBe('Are you sure?');

            store.handleOk();

            const result = await promise;
            expect(result.ok).toBe(true);
            expect(result.reason).toBe('ok');
            expect(store.alertOpen).toBe(false);
        });

        test('resolves ok:false on handleCancel', async () => {
            const promise = store.confirm({
                title: 'Test',
                description: 'desc'
            });
            store.handleCancel();

            const result = await promise;
            expect(result.ok).toBe(false);
            expect(result.reason).toBe('cancel');
            expect(store.alertOpen).toBe(false);
        });

        test('resolves ok:false with reason dismiss on handleDismiss', async () => {
            const promise = store.confirm({
                title: 'Test',
                description: 'desc'
            });
            store.handleDismiss();

            const result = await promise;
            expect(result.ok).toBe(false);
            expect(result.reason).toBe('dismiss');
        });

        test('does not dismiss when dismissible is false', async () => {
            const promise = store.confirm({
                title: 'Test',
                description: 'desc',
                dismissible: false
            });

            expect(store.alertDismissible).toBe(false);
            store.handleDismiss();
            expect(store.alertOpen).toBe(true);

            store.handleCancel();
            await promise;
        });

        test('uses custom confirmText and cancelText', () => {
            store.confirm({
                title: 'T',
                description: 'D',
                confirmText: 'Yes',
                cancelText: 'No'
            });

            expect(store.alertOkText).toBe('Yes');
            expect(store.alertCancelText).toBe('No');

            store.handleCancel();
        });

        test('replaces previous dialog with reason replaced', async () => {
            const first = store.confirm({
                title: 'First',
                description: 'first desc'
            });
            const second = store.confirm({
                title: 'Second',
                description: 'second desc'
            });

            const firstResult = await first;
            expect(firstResult.ok).toBe(false);
            expect(firstResult.reason).toBe('replaced');

            expect(store.alertTitle).toBe('Second');
            expect(store.alertOpen).toBe(true);

            store.handleOk();
            const secondResult = await second;
            expect(secondResult.ok).toBe(true);
        });
    });

    describe('alert', () => {
        test('opens in alert mode with only ok button text', () => {
            store.alert({
                title: 'Notice',
                description: 'Something happened'
            });

            expect(store.alertMode).toBe('alert');
            expect(store.alertCancelText).toBe('');
            expect(store.alertOpen).toBe(true);

            store.handleOk();
        });

        test('handleCancel resolves as ok for alert mode', async () => {
            const promise = store.alert({
                title: 'Notice',
                description: 'desc'
            });
            store.handleCancel();

            const result = await promise;
            expect(result.ok).toBe(true);
            expect(result.reason).toBe('ok');
        });

        test('handleDismiss resolves as ok for alert mode', async () => {
            const promise = store.alert({
                title: 'Notice',
                description: 'desc'
            });
            store.handleDismiss();

            const result = await promise;
            expect(result.ok).toBe(true);
            expect(result.reason).toBe('ok');
        });
    });

    describe('prompt', () => {
        test('opens prompt dialog with input value', () => {
            store.prompt({
                title: 'Enter name',
                description: 'New name',
                inputValue: 'default'
            });

            expect(store.promptOpen).toBe(true);
            expect(store.promptTitle).toBe('Enter name');
            expect(store.promptInputValue).toBe('default');

            store.handlePromptCancel('');
        });

        test('resolves with value on handlePromptOk', async () => {
            const promise = store.prompt({
                title: 'T',
                description: 'D'
            });

            store.handlePromptOk('myValue');

            const result = await promise;
            expect(result.ok).toBe(true);
            expect(result.reason).toBe('ok');
            expect(result.value).toBe('myValue');
            expect(store.promptOpen).toBe(false);
        });

        test('resolves with value on handlePromptCancel', async () => {
            const promise = store.prompt({
                title: 'T',
                description: 'D',
                inputValue: 'initial'
            });

            store.handlePromptCancel('initial');

            const result = await promise;
            expect(result.ok).toBe(false);
            expect(result.reason).toBe('cancel');
            expect(result.value).toBe('initial');
        });

        test('sets pattern and errorMessage', () => {
            store.prompt({
                title: 'T',
                description: 'D',
                pattern: /^\d+$/,
                errorMessage: 'Numbers only'
            });

            expect(store.promptPattern).toEqual(/^\d+$/);
            expect(store.promptErrorMessage).toBe('Numbers only');

            store.handlePromptCancel('');
        });

        test('replaces previous prompt with reason replaced', async () => {
            const first = store.prompt({
                title: 'First',
                description: 'D',
                inputValue: 'a'
            });
            const second = store.prompt({
                title: 'Second',
                description: 'D',
                inputValue: 'b'
            });

            const firstResult = await first;
            expect(firstResult.ok).toBe(false);
            expect(firstResult.reason).toBe('replaced');
            expect(firstResult.value).toBe('a');

            store.handlePromptOk('b');
            const secondResult = await second;
            expect(secondResult.ok).toBe(true);
        });
    });

    describe('no-op when no pending', () => {
        test('handleOk does nothing without pending dialog', () => {
            store.handleOk();
            expect(store.alertOpen).toBe(false);
        });

        test('handlePromptOk does nothing without pending prompt', () => {
            store.handlePromptOk('test');
            expect(store.promptOpen).toBe(false);
        });

        test('handleOtpOk does nothing without pending otp', () => {
            store.handleOtpOk('123456');
            expect(store.otpOpen).toBe(false);
        });
    });

    describe('otpPrompt', () => {
        test('opens otp dialog with correct mode and text', () => {
            store.otpPrompt({
                title: 'TOTP Verification',
                description: 'Enter your 6-digit code',
                mode: 'totp',
                confirmText: 'Verify',
                cancelText: 'Use recovery code'
            });

            expect(store.otpOpen).toBe(true);
            expect(store.otpTitle).toBe('TOTP Verification');
            expect(store.otpDescription).toBe('Enter your 6-digit code');
            expect(store.otpMode).toBe('totp');
            expect(store.otpOkText).toBe('Verify');
            expect(store.otpCancelText).toBe('Use recovery code');

            store.handleOtpCancel('');
        });

        test('resolves with value on handleOtpOk', async () => {
            const promise = store.otpPrompt({
                title: 'T',
                description: 'D',
                mode: 'totp'
            });

            store.handleOtpOk('123456');

            const result = await promise;
            expect(result.ok).toBe(true);
            expect(result.reason).toBe('ok');
            expect(result.value).toBe('123456');
            expect(store.otpOpen).toBe(false);
        });

        test('resolves ok:false on handleOtpCancel', async () => {
            const promise = store.otpPrompt({
                title: 'T',
                description: 'D',
                mode: 'emailOtp'
            });

            store.handleOtpCancel('123');

            const result = await promise;
            expect(result.ok).toBe(false);
            expect(result.reason).toBe('cancel');
            expect(result.value).toBe('123');
            expect(store.otpOpen).toBe(false);
        });

        test('resolves ok:false on handleOtpDismiss when dismissible', async () => {
            const promise = store.otpPrompt({
                title: 'T',
                description: 'D',
                mode: 'totp'
            });

            store.handleOtpDismiss('');

            const result = await promise;
            expect(result.ok).toBe(false);
            expect(result.reason).toBe('dismiss');
        });

        test('does not dismiss when dismissible is false', async () => {
            const promise = store.otpPrompt({
                title: 'T',
                description: 'D',
                mode: 'totp',
                dismissible: false
            });

            expect(store.otpDismissible).toBe(false);
            store.handleOtpDismiss('');
            expect(store.otpOpen).toBe(true);

            store.handleOtpCancel('');
            await promise;
        });

        test('sets otp mode correctly', () => {
            store.otpPrompt({
                title: 'T',
                description: 'D',
                mode: 'otp'
            });

            expect(store.otpMode).toBe('otp');

            store.handleOtpCancel('');
        });

        test('defaults mode to totp when not specified', () => {
            store.otpPrompt({
                title: 'T',
                description: 'D'
            });

            expect(store.otpMode).toBe('totp');

            store.handleOtpCancel('');
        });

        test('replaces previous otp dialog with reason replaced', async () => {
            const first = store.otpPrompt({
                title: 'First',
                description: 'D',
                mode: 'totp'
            });
            const second = store.otpPrompt({
                title: 'Second',
                description: 'D',
                mode: 'emailOtp'
            });

            const firstResult = await first;
            expect(firstResult.ok).toBe(false);
            expect(firstResult.reason).toBe('replaced');
            expect(firstResult.value).toBe('');

            expect(store.otpTitle).toBe('Second');
            expect(store.otpMode).toBe('emailOtp');
            expect(store.otpOpen).toBe(true);

            store.handleOtpOk('654321');
            const secondResult = await second;
            expect(secondResult.ok).toBe(true);
            expect(secondResult.value).toBe('654321');
        });

        test('uses default button text from i18n', () => {
            store.otpPrompt({
                title: 'T',
                description: 'D',
                mode: 'totp'
            });

            expect(store.otpOkText).toBe(en.dialog.alertdialog.confirm);
            expect(store.otpCancelText).toBe(en.dialog.alertdialog.cancel);

            store.handleOtpCancel('');
        });
    });
});
