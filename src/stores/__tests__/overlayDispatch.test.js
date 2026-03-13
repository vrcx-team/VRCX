import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../shared/utils', () => ({
    extractFileId: vi.fn(),
    extractFileVersion: vi.fn()
}));
vi.mock('../../shared/utils/notificationMessage', () => ({
    getNotificationMessage: vi.fn(),
    toNotificationText: vi.fn()
}));

import { extractFileId, extractFileVersion } from '../../shared/utils';
import {
    getNotificationMessage,
    toNotificationText
} from '../../shared/utils/notificationMessage';
import { createOverlayDispatch } from '../notification/overlayDispatch';

function makeDeps(overrides = {}) {
    return {
        getUserIdFromNoty: vi.fn(() => ''),
        queryRequest: {
            fetch: vi.fn().mockResolvedValue({ json: null })
        },
        notificationsSettingsStore: {
            notificationTimeout: 5000
        },
        advancedSettingsStore: {
            notificationOpacity: 80
        },
        appearanceSettingsStore: {
            displayVRCPlusIconsAsAvatar: false
        },
        ...overrides
    };
}

// ─── notyGetImage ────────────────────────────────────────────────────

describe('notyGetImage', () => {
    let deps, dispatch;

    beforeEach(() => {
        vi.clearAllMocks();
        deps = makeDeps();
        dispatch = createOverlayDispatch(deps);
    });

    test('returns thumbnailImageUrl when present', async () => {
        const noty = { thumbnailImageUrl: 'https://thumb.jpg' };
        const result = await dispatch.notyGetImage(noty);
        expect(result).toBe('https://thumb.jpg');
    });

    test('returns details.imageUrl when thumbnailImageUrl absent', async () => {
        const noty = { details: { imageUrl: 'https://detail.jpg' } };
        const result = await dispatch.notyGetImage(noty);
        expect(result).toBe('https://detail.jpg');
    });

    test('returns imageUrl when thumbnailImageUrl and details absent', async () => {
        const noty = { imageUrl: 'https://img.jpg' };
        const result = await dispatch.notyGetImage(noty);
        expect(result).toBe('https://img.jpg');
    });

    test('looks up user currentAvatarThumbnailImageUrl when no image URLs', async () => {
        deps.getUserIdFromNoty.mockReturnValue('usr_abc');
        deps.queryRequest.fetch.mockResolvedValue({
            json: {
                currentAvatarThumbnailImageUrl: 'https://avatar.jpg'
            }
        });
        dispatch = createOverlayDispatch(deps);

        const noty = {};
        const result = await dispatch.notyGetImage(noty);
        expect(result).toBe('https://avatar.jpg');
    });

    test('returns profilePicOverride when available', async () => {
        deps.getUserIdFromNoty.mockReturnValue('usr_abc');
        deps.queryRequest.fetch.mockResolvedValue({
            json: {
                profilePicOverride: 'https://profile.jpg',
                currentAvatarThumbnailImageUrl: 'https://avatar.jpg'
            }
        });
        dispatch = createOverlayDispatch(deps);

        const result = await dispatch.notyGetImage({});
        expect(result).toBe('https://profile.jpg');
    });

    test('returns userIcon when displayVRCPlusIconsAsAvatar is enabled', async () => {
        deps.getUserIdFromNoty.mockReturnValue('usr_abc');
        deps.appearanceSettingsStore.displayVRCPlusIconsAsAvatar = true;
        deps.queryRequest.fetch.mockResolvedValue({
            json: {
                userIcon: 'https://icon.jpg',
                profilePicOverride: 'https://profile.jpg',
                currentAvatarThumbnailImageUrl: 'https://avatar.jpg'
            }
        });
        dispatch = createOverlayDispatch(deps);

        const result = await dispatch.notyGetImage({});
        expect(result).toBe('https://icon.jpg');
    });

    test('returns empty string for grp_ userId', async () => {
        deps.getUserIdFromNoty.mockReturnValue('grp_abc');
        dispatch = createOverlayDispatch(deps);

        const result = await dispatch.notyGetImage({});
        expect(result).toBe('');
        expect(deps.queryRequest.fetch).not.toHaveBeenCalled();
    });

    test('returns empty string when user lookup fails', async () => {
        deps.getUserIdFromNoty.mockReturnValue('usr_abc');
        deps.queryRequest.fetch.mockRejectedValue(new Error('Network error'));
        dispatch = createOverlayDispatch(deps);

        const result = await dispatch.notyGetImage({});
        expect(result).toBe('');
    });

    test('returns empty string when user has no json', async () => {
        deps.getUserIdFromNoty.mockReturnValue('usr_abc');
        deps.queryRequest.fetch.mockResolvedValue({ json: null });
        dispatch = createOverlayDispatch(deps);

        const result = await dispatch.notyGetImage({});
        expect(result).toBe('');
    });
});

// ─── displayDesktopToast ─────────────────────────────────────────────

describe('displayDesktopToast', () => {
    let deps, dispatch;

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.WINDOWS = true;
        globalThis.AppApi = { DesktopNotification: vi.fn() };
        deps = makeDeps();
        dispatch = createOverlayDispatch(deps);
    });

    test('calls desktopNotification with message from getNotificationMessage', () => {
        getNotificationMessage.mockReturnValue({
            title: 'Friend Online',
            body: 'Alice is online'
        });

        dispatch.displayDesktopToast({}, 'some message', 'img.jpg');

        expect(getNotificationMessage).toHaveBeenCalled();
        expect(AppApi.DesktopNotification).toHaveBeenCalledWith(
            'Friend Online',
            'Alice is online',
            'img.jpg'
        );
    });

    test('does nothing when getNotificationMessage returns null', () => {
        getNotificationMessage.mockReturnValue(null);

        dispatch.displayDesktopToast({}, 'some message', 'img.jpg');

        expect(AppApi.DesktopNotification).not.toHaveBeenCalled();
    });
});

// ─── notySaveImage ───────────────────────────────────────────────────

describe('notySaveImage', () => {
    let deps, dispatch;

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.AppApi = {
            GetImage: vi.fn().mockResolvedValue('/local/path.jpg')
        };
        deps = makeDeps();
        dispatch = createOverlayDispatch(deps);
    });

    test('returns saved image path from fileId/fileVersion extraction', async () => {
        extractFileId.mockReturnValue('file_123');
        extractFileVersion.mockReturnValue('v1');

        const noty = {
            thumbnailImageUrl: 'https://api.vrchat.cloud/file_123/v1'
        };
        const result = await dispatch.notySaveImage(noty);

        expect(AppApi.GetImage).toHaveBeenCalledWith(
            'https://api.vrchat.cloud/file_123/v1',
            'file_123',
            'v1'
        );
        expect(result).toBe('/local/path.jpg');
    });

    test('falls back to URL-derived fileId for http URLs without fileId', async () => {
        extractFileId.mockReturnValue('');
        extractFileVersion.mockReturnValue('');

        const noty = {
            thumbnailImageUrl:
                'https://cdn.example.com/1416226261.thumbnail-500.png'
        };
        const result = await dispatch.notySaveImage(noty);

        expect(AppApi.GetImage).toHaveBeenCalledWith(
            'https://cdn.example.com/1416226261.thumbnail-500.png',
            '1416226261',
            '1416226261.thumbnail-500.png'
        );
        expect(result).toBe('/local/path.jpg');
    });

    test('returns empty string when no image URL is found', async () => {
        extractFileId.mockReturnValue('');
        extractFileVersion.mockReturnValue('');
        deps.getUserIdFromNoty.mockReturnValue('');
        dispatch = createOverlayDispatch(deps);

        const noty = {};
        const result = await dispatch.notySaveImage(noty);

        expect(result).toBe('');
    });
});

// ─── displayXSNotification ──────────────────────────────────────────

describe('displayXSNotification', () => {
    let deps, dispatch;

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.AppApi = { XSNotification: vi.fn() };
        deps = makeDeps();
        dispatch = createOverlayDispatch(deps);
    });

    test('calls XSNotification with formatted text', () => {
        getNotificationMessage.mockReturnValue({
            title: 'Title',
            body: 'Body'
        });
        toNotificationText.mockReturnValue('Title: Body');

        dispatch.displayXSNotification({ type: 'friendOnline' }, 'msg', 'img');

        expect(toNotificationText).toHaveBeenCalledWith(
            'Title',
            'Body',
            'friendOnline'
        );
        expect(AppApi.XSNotification).toHaveBeenCalledWith(
            'VRCX',
            'Title: Body',
            5, // 5000ms / 1000
            0.8, // 80 / 100
            'img'
        );
    });

    test('does nothing when getNotificationMessage returns null', () => {
        getNotificationMessage.mockReturnValue(null);

        dispatch.displayXSNotification({}, 'msg', 'img');

        expect(AppApi.XSNotification).not.toHaveBeenCalled();
    });
});
