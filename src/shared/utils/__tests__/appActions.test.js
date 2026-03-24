import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    },
    searchStore: {
        directAccessParse: vi.fn()
    },
    modalStore: {
        confirm: vi.fn()
    },
    i18n: {
        global: {
            t: vi.fn(() => 'copy failed')
        }
    }
}));

vi.mock('vue-sonner', () => ({
    toast: mocks.toast
}));

vi.mock('../../../stores', () => ({
    useSearchStore: () => mocks.searchStore,
    useModalStore: () => mocks.modalStore
}));

vi.mock('../../../plugins/i18n', () => ({
    i18n: mocks.i18n
}));

import {
    copyToClipboard,
    downloadAndSaveJson,
    openDiscordProfile,
    openExternalLink,
    openFolderGeneric
} from '../appActions';

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('appActions utils', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        vi.clearAllMocks();
        mocks.searchStore.directAccessParse.mockReturnValue(false);
        mocks.modalStore.confirm.mockResolvedValue({ ok: false });
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: vi.fn().mockResolvedValue(undefined)
            }
        });
        globalThis.AppApi = {
            OpenLink: vi.fn(),
            OpenDiscordProfile: vi.fn().mockResolvedValue(undefined),
            OpenFolderAndSelectItem: vi.fn()
        };
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    test('downloadAndSaveJson returns early for invalid params', () => {
        downloadAndSaveJson('', { a: 1 });
        downloadAndSaveJson('name', null);
        expect(document.querySelectorAll('a[download]').length).toBe(0);
    });

    test('downloadAndSaveJson creates and clicks download link', () => {
        const appendSpy = vi.spyOn(document.body, 'appendChild');
        const removeSpy = vi.spyOn(document.body, 'removeChild');

        downloadAndSaveJson('profile', { id: 1 });

        expect(appendSpy).toHaveBeenCalledTimes(1);
        expect(removeSpy).toHaveBeenCalledTimes(1);
        appendSpy.mockRestore();
        removeSpy.mockRestore();
    });

    test('copyToClipboard shows success toast', async () => {
        copyToClipboard('hello', 'copied');
        await flushPromises();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
        expect(mocks.toast.success).toHaveBeenCalledWith('copied');
    });

    test('copyToClipboard shows translated error toast on failure', async () => {
        navigator.clipboard.writeText.mockRejectedValue(new Error('denied'));
        copyToClipboard('hello');
        await flushPromises();
        await flushPromises();
        expect(mocks.toast.error).toHaveBeenCalledWith('copy failed');
    });

    test('openExternalLink returns early when direct access parse succeeds', async () => {
        mocks.searchStore.directAccessParse.mockReturnValue(true);
        openExternalLink('vrcx://user/usr_1');
        await flushPromises();
        expect(mocks.modalStore.confirm).not.toHaveBeenCalled();
        expect(AppApi.OpenLink).not.toHaveBeenCalled();
    });

    test('openExternalLink copies link when confirm is canceled', async () => {
        mocks.modalStore.confirm.mockResolvedValue({
            ok: false,
            reason: 'cancel'
        });
        openExternalLink('https://example.com');
        await flushPromises();
        await flushPromises();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            'https://example.com'
        );
    });

    test('openExternalLink opens link when confirmed', async () => {
        mocks.modalStore.confirm.mockResolvedValue({ ok: true });
        openExternalLink('https://example.com');
        await flushPromises();
        expect(AppApi.OpenLink).toHaveBeenCalledWith('https://example.com');
    });

    test('openDiscordProfile validates empty discord id', () => {
        openDiscordProfile('');
        expect(mocks.toast.error).toHaveBeenCalledWith(
            'No Discord ID provided!'
        );
    });

    test('openDiscordProfile shows error toast when api fails', async () => {
        AppApi.OpenDiscordProfile.mockRejectedValue(new Error('fail'));
        openDiscordProfile('123');
        await flushPromises();
        expect(mocks.toast.error).toHaveBeenCalledWith(
            'Failed to open Discord profile!'
        );
    });

    test('openFolderGeneric delegates to AppApi', () => {
        openFolderGeneric('/tmp/a.txt');
        expect(AppApi.OpenFolderAndSelectItem).toHaveBeenCalledWith(
            '/tmp/a.txt',
            true
        );
    });
});
