import { describe, expect, test, vi } from 'vitest';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import en from '../../localization/en.json';

vi.mock('@/stores', async () => {
    const { useModalStore } = await import('@/stores/modal');
    return { useModalStore };
});

import AlertDialogModal from '../ui/alert-dialog/AlertDialogModal.vue';
import { useModalStore } from '../../stores/modal';

const i18n = createI18n({
    locale: 'en',
    legacy: false,
    messages: { en }
});

describe('AlertDialogModal.vue', () => {
    test('handles the configured cancel shortcut', async () => {
        const pinia = createPinia();
        const wrapper = mount(AlertDialogModal, {
            attachTo: document.body,
            global: { plugins: [i18n, pinia] }
        });
        const store = useModalStore(pinia);
        const result = store.confirm({
            title: 'Open External Link',
            description: 'https://example.com',
            confirmText: 'Open',
            cancelText: 'Copy',
            cancelShortcut: 'c'
        });
        await nextTick();
        await nextTick();

        const action = [...document.body.querySelectorAll('button')].find((button) => button.textContent === 'Open');
        expect(action).toBeTruthy();
        action.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'c',
                ctrlKey: true,
                bubbles: true,
                cancelable: true
            })
        );

        await expect(result).resolves.toEqual({ ok: false, reason: 'cancel' });
        wrapper.unmount();
    });
});
