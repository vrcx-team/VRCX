import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const mocks = vi.hoisted(() => ({
    copyToClipboard: vi.fn(),
    openLink: vi.fn()
}));

vi.mock('@/stores', async () => {
    const { useExternalLinkStore } = await import('@/stores/externalLink');
    return { useExternalLinkStore };
});

vi.mock('@/shared/utils/appActions', () => ({
    copyToClipboard: (...args) => mocks.copyToClipboard(...args)
}));

import OpenExternalLinkDialog from '../dialogs/OpenExternalLinkDialog.vue';
import { useExternalLinkStore } from '../../stores/externalLink';

let wrapper;

async function showDialog(link = 'https://example.com') {
    const pinia = createPinia();
    wrapper = mount(OpenExternalLinkDialog, {
        attachTo: document.body,
        global: { plugins: [pinia] }
    });
    const store = useExternalLinkStore(pinia);
    store.showExternalLinkDialog(link);
    await nextTick();
    await nextTick();
    return store;
}

function findButton(label) {
    return [...document.body.querySelectorAll('button')].find((button) => button.textContent === label);
}

describe('OpenExternalLinkDialog.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.AppApi = { OpenLink: mocks.openLink };
    });

    afterEach(() => {
        wrapper?.unmount();
        wrapper = undefined;
        document.body.innerHTML = '';
    });

    test('shows the current link with Open as the default action', async () => {
        await showDialog('https://example.com/path');

        expect(document.body.textContent).toContain('https://example.com/path');
        expect(document.activeElement).toBe(findButton('Open'));
    });

    test('Escape dismisses without copying or opening', async () => {
        const store = await showDialog();

        findButton('Open').dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
                cancelable: true
            })
        );
        await nextTick();

        expect(store.externalLinkDialog.visible).toBe(false);
        expect(mocks.copyToClipboard).not.toHaveBeenCalled();
        expect(mocks.openLink).not.toHaveBeenCalled();
    });

    test('Copy copies the link and closes the dialog', async () => {
        const store = await showDialog();

        findButton('Copy').click();
        await nextTick();

        expect(mocks.copyToClipboard).toHaveBeenCalledWith('https://example.com', 'Link copied to clipboard!');
        expect(store.externalLinkDialog.visible).toBe(false);
        expect(mocks.openLink).not.toHaveBeenCalled();
    });

    test('Ctrl+C uses the same copy action', async () => {
        const store = await showDialog();
        const openButton = findButton('Open');

        openButton.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'c',
                bubbles: true,
                cancelable: true
            })
        );
        expect(mocks.copyToClipboard).not.toHaveBeenCalled();
        expect(store.externalLinkDialog.visible).toBe(true);

        const shortcutEvent = () =>
            new KeyboardEvent('keydown', {
                key: 'c',
                ctrlKey: true,
                bubbles: true,
                cancelable: true
            });
        openButton.dispatchEvent(shortcutEvent());
        openButton.dispatchEvent(shortcutEvent());
        await nextTick();

        expect(mocks.copyToClipboard).toHaveBeenCalledOnce();
        expect(mocks.copyToClipboard).toHaveBeenCalledWith('https://example.com', 'Link copied to clipboard!');
        expect(store.externalLinkDialog.visible).toBe(false);
    });

    test('Open opens the link and closes the dialog', async () => {
        const store = await showDialog();

        findButton('Open').click();
        await nextTick();

        expect(mocks.openLink).toHaveBeenCalledWith('https://example.com');
        expect(store.externalLinkDialog.visible).toBe(false);
        expect(mocks.copyToClipboard).not.toHaveBeenCalled();
    });
});
