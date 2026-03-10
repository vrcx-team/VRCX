import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock transitive deps to avoid i18n init errors
vi.mock('vue-sonner', () => ({
    toast: { error: vi.fn() }
}));

vi.mock('../../../services/request', () => ({
    $throw: vi.fn()
}));

vi.mock('../../../services/appConfig', () => ({
    AppDebug: { endpointDomain: 'https://api.vrchat.cloud/api/1' }
}));

vi.mock('../../../shared/utils', () => ({
    extractFileId: vi.fn()
}));

vi.mock('../../../api', () => ({
    imageRequest: {}
}));

import { toast } from 'vue-sonner';
import { withUploadTimeout } from '../imageUpload';
import { handleImageUploadInput } from '../../../coordinators/imageUploadCoordinator';

// ─── withUploadTimeout ───────────────────────────────────────────────

describe('withUploadTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('resolves if promise resolves before timeout', async () => {
        const promise = withUploadTimeout(Promise.resolve('done'));
        await expect(promise).resolves.toBe('done');
    });

    test('rejects with timeout error if promise is too slow', async () => {
        const neverResolves = new Promise(() => {});
        const result = withUploadTimeout(neverResolves);

        vi.advanceTimersByTime(30_000);

        await expect(result).rejects.toThrow('Upload timed out');
    });

    test('resolves if promise finishes just before timeout', async () => {
        const slowPromise = new Promise((resolve) => {
            setTimeout(() => resolve('just in time'), 29_999);
        });
        const result = withUploadTimeout(slowPromise);

        vi.advanceTimersByTime(29_999);

        await expect(result).resolves.toBe('just in time');
    });

    test('rejects if underlying promise rejects', async () => {
        const failingPromise = Promise.reject(new Error('upload failed'));
        await expect(withUploadTimeout(failingPromise)).rejects.toThrow(
            'upload failed'
        );
    });
});

// ─── handleImageUploadInput ──────────────────────────────────────────

describe('handleImageUploadInput', () => {
    const makeFile = (size = 1000, type = 'image/png') => ({
        size,
        type
    });
    const makeEvent = (file) => ({
        target: { files: file ? [file] : [] }
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns null file when no files in event', () => {
        const { file } = handleImageUploadInput({ target: { files: [] } });
        expect(file).toBeNull();
    });

    test('returns null file when event has no target', () => {
        const { file } = handleImageUploadInput({});
        expect(file).toBeNull();
    });

    test('returns file for valid image within size limit', () => {
        const mockFile = makeFile(5000, 'image/png');
        const { file } = handleImageUploadInput(makeEvent(mockFile));
        expect(file).toBe(mockFile);
    });

    test('returns null file when file exceeds maxSize', () => {
        const mockFile = makeFile(20_000_001, 'image/png');
        const { file } = handleImageUploadInput(makeEvent(mockFile));
        expect(file).toBeNull();
    });

    test('shows toast error when file exceeds maxSize and tooLargeMessage provided', () => {
        const mockFile = makeFile(20_000_001, 'image/png');
        handleImageUploadInput(makeEvent(mockFile), {
            tooLargeMessage: 'File too large!'
        });
        expect(toast.error).toHaveBeenCalledWith('File too large!');
    });

    test('supports function as tooLargeMessage', () => {
        const mockFile = makeFile(20_000_001, 'image/png');
        handleImageUploadInput(makeEvent(mockFile), {
            tooLargeMessage: () => 'Dynamic error'
        });
        expect(toast.error).toHaveBeenCalledWith('Dynamic error');
    });

    test('returns null file when file type does not match acceptPattern', () => {
        const mockFile = makeFile(1000, 'text/plain');
        const { file } = handleImageUploadInput(makeEvent(mockFile));
        expect(file).toBeNull();
    });

    test('shows toast error for invalid type when invalidTypeMessage provided', () => {
        const mockFile = makeFile(1000, 'text/plain');
        handleImageUploadInput(makeEvent(mockFile), {
            invalidTypeMessage: 'Wrong type!'
        });
        expect(toast.error).toHaveBeenCalledWith('Wrong type!');
    });

    test('respects custom maxSize', () => {
        const mockFile = makeFile(600, 'image/png');
        const { file } = handleImageUploadInput(makeEvent(mockFile), {
            maxSize: 500
        });
        expect(file).toBeNull();
    });

    test('respects custom acceptPattern as string', () => {
        const mockFile = makeFile(1000, 'video/mp4');
        const { file } = handleImageUploadInput(makeEvent(mockFile), {
            acceptPattern: 'video.*'
        });
        expect(file).toBe(mockFile);
    });

    test('returns clearInput function', () => {
        const mockFile = makeFile(1000, 'image/png');
        const { clearInput } = handleImageUploadInput(makeEvent(mockFile));
        expect(typeof clearInput).toBe('function');
    });

    test('calls onClear callback when clearing', () => {
        const onClear = vi.fn();
        const { clearInput } = handleImageUploadInput(
            { target: { files: [] } },
            { onClear }
        );
        // clearInput is called automatically for empty files, but let's call explicitly
        clearInput();
        expect(onClear).toHaveBeenCalled();
    });

    test('reads files from dataTransfer when target.files absent', () => {
        const mockFile = makeFile(1000, 'image/png');
        const event = { dataTransfer: { files: [mockFile] } };
        const { file } = handleImageUploadInput(event);
        expect(file).toBe(mockFile);
    });
});
