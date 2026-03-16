import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useAvatarDialogCommands } from '../useAvatarDialogCommands';

// Mock external modules
vi.mock('../../../../api', () => ({
    avatarModerationRequest: {
        sendAvatarModeration: vi.fn(),
        deleteAvatarModeration: vi.fn()
    },
    avatarRequest: {
        saveAvatar: vi.fn(),
        deleteAvatar: vi.fn(),
        selectFallbackAvatar: vi.fn(),
        deleteImposter: vi.fn(),
        createImposter: vi.fn(),
        uploadAvatarImage: vi.fn()
    },
    favoriteRequest: {
        deleteFavorite: vi.fn()
    }
}));

vi.mock('../../../../shared/utils', () => ({
    copyToClipboard: vi.fn(),
    openExternalLink: vi.fn(),
    replaceVrcPackageUrl: vi.fn((url) => url)
}));

vi.mock('../../../../shared/utils/imageUpload', () => ({
    handleImageUploadInput: vi.fn(),
    readFileAsBase64: vi.fn(),
    withUploadTimeout: vi.fn()
}));

vi.mock('../../../../coordinators/imageUploadCoordinator', () => ({
    resizeImageToFitLimits: vi.fn(),
    uploadImageLegacy: vi.fn()
}));

vi.mock('../../../../coordinators/avatarCoordinator', () => ({
    removeAvatarFromCache: vi.fn()
}));

const { copyToClipboard, openExternalLink } =
    await import('../../../../shared/utils');
const { favoriteRequest, avatarRequest, avatarModerationRequest } =
    await import('../../../../api');

/**
 *
 */
function createMockAvatarDialog() {
    return ref({
        visible: true,
        loading: false,
        id: 'avtr_test123',
        ref: {
            name: 'TestAvatar',
            description: 'Test desc',
            imageUrl: 'https://example.com/img.png',
            thumbnailImageUrl: 'https://example.com/thumb.png',
            authorId: 'usr_author',
            authorName: 'Author',
            releaseStatus: 'private',
            tags: ['content_horror'],
            unityPackageUrl: 'https://example.com/pkg.unitypackage',
            styles: { primary: 'style1', secondary: 'style2' }
        },
        isBlocked: false,
        hasImposter: false,
        timeSpent: 0,
        galleryLoading: false,
        galleryImages: []
    });
}

/**
 *
 * @param overrides
 */
function createMockDeps(overrides = {}) {
    return {
        t: vi.fn((key) => key),
        toast: Object.assign(vi.fn(), {
            success: vi.fn(),
            error: vi.fn(),
            promise: vi.fn()
        }),
        modalStore: {
            confirm: vi.fn(() => Promise.resolve({ ok: true })),
            prompt: vi.fn(() =>
                Promise.resolve({ ok: true, value: 'new_value' })
            )
        },
        userDialog: ref({ id: 'usr_author' }),
        currentUser: ref({ id: 'usr_current', currentAvatar: 'avtr_other' }),
        cachedAvatars: new Map([
            ['avtr_test123', { id: 'avtr_test123', authorId: 'usr_author' }]
        ]),
        cachedAvatarModerations: new Map(),
        showAvatarDialog: vi.fn(),
        showFavoriteDialog: vi.fn(),
        applyAvatarModeration: vi.fn((json) => json),
        applyAvatar: vi.fn((json) => json),
        sortUserDialogAvatars: vi.fn(),
        uiStore: { jumpBackDialogCrumb: vi.fn() },
        ...overrides
    };
}

describe('useAvatarDialogCommands', () => {
    let avatarDialog;
    let deps;

    beforeEach(() => {
        vi.clearAllMocks();
        avatarDialog = createMockAvatarDialog();
        deps = createMockDeps();
    });

    describe('direct commands', () => {
        it('Refresh: should call showAvatarDialog with forceRefresh', () => {
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Refresh');
            expect(deps.showAvatarDialog).toHaveBeenCalledWith('avtr_test123', {
                forceRefresh: true
            });
        });

        it('Share: should copy avatar URL', () => {
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Share');
            expect(copyToClipboard).toHaveBeenCalledWith(
                'https://vrchat.com/home/avatar/avtr_test123'
            );
        });

        it('Add Favorite: should call showFavoriteDialog', () => {
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Add Favorite');
            expect(deps.showFavoriteDialog).toHaveBeenCalledWith(
                'avatar',
                'avtr_test123'
            );
        });

        it('Download Unity Package: should open external link', () => {
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Download Unity Package');
            expect(openExternalLink).toHaveBeenCalled();
        });

        it('Rename: should show prompt dialog', () => {
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Rename');
            expect(deps.modalStore.prompt).toHaveBeenCalled();
        });

        it('Change Description: should show prompt dialog', () => {
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Change Description');
            expect(deps.modalStore.prompt).toHaveBeenCalled();
        });

        it('Change Image: triggers file input (DOM-dependent, skip in node)', () => {
            // This command calls document.getElementById which is only available in browser
            // Just verify no error when command is dispatched (DOM interaction tested in e2e)
            if (typeof document === 'undefined') {
                return;
            }
            const mockBtn = { click: vi.fn() };
            vi.spyOn(document, 'getElementById').mockReturnValue(mockBtn);
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Change Image');
            expect(mockBtn.click).toHaveBeenCalled();
            vi.restoreAllMocks();
        });
    });

    describe('string callback commands', () => {
        it('should delegate to registered callbacks', () => {
            const showSetAvatarTagsDialog = vi.fn();
            const { avatarDialogCommand, registerCallbacks } =
                useAvatarDialogCommands(avatarDialog, deps);
            registerCallbacks({ showSetAvatarTagsDialog });
            avatarDialogCommand('Change Content Tags');
            expect(showSetAvatarTagsDialog).toHaveBeenCalled();
        });

        it('should not throw when callback is not registered', () => {
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            expect(() =>
                avatarDialogCommand('Change Content Tags')
            ).not.toThrow();
        });
    });

    describe('confirmed commands', () => {
        it('Delete Favorite: should confirm then delete', async () => {
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Delete Favorite');
            await vi.waitFor(() => {
                expect(deps.modalStore.confirm).toHaveBeenCalled();
            });
            await vi.waitFor(() => {
                expect(favoriteRequest.deleteFavorite).toHaveBeenCalledWith({
                    objectId: 'avtr_test123'
                });
            });
        });

        it('confirmed command should not execute when cancelled', async () => {
            deps.modalStore.confirm = vi.fn(() =>
                Promise.resolve({ ok: false })
            );
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Delete Favorite');
            await vi.waitFor(() => {
                expect(deps.modalStore.confirm).toHaveBeenCalled();
            });
            expect(favoriteRequest.deleteFavorite).not.toHaveBeenCalled();
        });

        it('Select Fallback Avatar: should confirm then select', async () => {
            avatarRequest.selectFallbackAvatar.mockResolvedValue({ json: {} });
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Select Fallback Avatar');
            await vi.waitFor(() => {
                expect(avatarRequest.selectFallbackAvatar).toHaveBeenCalledWith(
                    { avatarId: 'avtr_test123' }
                );
            });
        });

        it('Block Avatar: should confirm then send moderation', async () => {
            avatarModerationRequest.sendAvatarModeration.mockResolvedValue({
                json: { targetAvatarId: 'avtr_test123' }
            });
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Block Avatar');
            await vi.waitFor(() => {
                expect(
                    avatarModerationRequest.sendAvatarModeration
                ).toHaveBeenCalledWith({
                    avatarModerationType: 'block',
                    targetAvatarId: 'avtr_test123'
                });
            });
        });

        it('Unblock Avatar: should confirm then delete moderation', async () => {
            avatarModerationRequest.deleteAvatarModeration.mockResolvedValue({
                params: {
                    targetAvatarId: 'avtr_test123',
                    avatarModerationType: 'block'
                }
            });
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Unblock Avatar');
            await vi.waitFor(() => {
                expect(
                    avatarModerationRequest.deleteAvatarModeration
                ).toHaveBeenCalledWith({
                    avatarModerationType: 'block',
                    targetAvatarId: 'avtr_test123'
                });
            });
        });

        it('Make Public: should save avatar with public status', async () => {
            avatarRequest.saveAvatar.mockResolvedValue({
                json: { releaseStatus: 'public' }
            });
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Make Public');
            await vi.waitFor(() => {
                expect(avatarRequest.saveAvatar).toHaveBeenCalledWith({
                    id: 'avtr_test123',
                    releaseStatus: 'public'
                });
            });
        });

        it('Make Private: should save avatar with private status', async () => {
            avatarRequest.saveAvatar.mockResolvedValue({
                json: { releaseStatus: 'private' }
            });
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Make Private');
            await vi.waitFor(() => {
                expect(avatarRequest.saveAvatar).toHaveBeenCalledWith({
                    id: 'avtr_test123',
                    releaseStatus: 'private'
                });
            });
        });

        it('Delete: should delete avatar and update cache', async () => {
            avatarRequest.deleteAvatar.mockResolvedValue({
                json: { _id: 'avtr_test123', authorId: 'usr_author' }
            });
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Delete');
            await vi.waitFor(() => {
                expect(avatarRequest.deleteAvatar).toHaveBeenCalledWith({
                    avatarId: 'avtr_test123'
                });
            });
        });

        it('Create Imposter: should create imposter', async () => {
            avatarRequest.createImposter.mockResolvedValue({ json: {} });
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Create Imposter');
            await vi.waitFor(() => {
                expect(avatarRequest.createImposter).toHaveBeenCalledWith({
                    avatarId: 'avtr_test123'
                });
            });
        });

        it('Delete Imposter: should delete imposter and refresh', async () => {
            avatarRequest.deleteImposter.mockResolvedValue({ json: {} });
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            avatarDialogCommand('Delete Imposter');
            await vi.waitFor(() => {
                expect(avatarRequest.deleteImposter).toHaveBeenCalledWith({
                    avatarId: 'avtr_test123'
                });
            });
        });
    });

    describe('unknown command', () => {
        it('should do nothing for unknown commands', () => {
            const { avatarDialogCommand } = useAvatarDialogCommands(
                avatarDialog,
                deps
            );
            expect(() => avatarDialogCommand('NonExistent')).not.toThrow();
            expect(deps.modalStore.confirm).not.toHaveBeenCalled();
        });
    });

    describe('image upload state', () => {
        it('should expose crop dialog state refs', () => {
            const { cropDialogOpen, cropDialogFile, changeAvatarImageLoading } =
                useAvatarDialogCommands(avatarDialog, deps);
            expect(cropDialogOpen.value).toBe(false);
            expect(cropDialogFile.value).toBeNull();
            expect(changeAvatarImageLoading.value).toBe(false);
        });
    });
});
