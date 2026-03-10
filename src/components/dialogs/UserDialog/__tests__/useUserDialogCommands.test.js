import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useUserDialogCommands } from '../useUserDialogCommands';

// Mock external modules
vi.mock('../../../../api', () => ({
    favoriteRequest: {
        deleteFavorite: vi.fn()
    },
    friendRequest: {
        sendFriendRequest: vi.fn(),
        cancelFriendRequest: vi.fn(),
        deleteFriend: vi.fn()
    },
    miscRequest: {
        reportUser: vi.fn()
    },
    notificationRequest: {
        sendRequestInvite: vi.fn(() => Promise.resolve({})),
        sendInvite: vi.fn(() => Promise.resolve({})),
        acceptFriendRequestNotification: vi.fn(() => Promise.resolve({})),
        hideNotification: vi.fn(() => Promise.resolve({}))
    },
    playerModerationRequest: {
        sendPlayerModeration: vi.fn(),
        deletePlayerModeration: vi.fn()
    },
    worldRequest: {}
}));

vi.mock('../../../../shared/utils', () => ({
    copyToClipboard: vi.fn(),
    parseLocation: vi.fn(() => ({ worldId: 'wrld_test', tag: 'wrld_test~123' }))
}));

vi.mock('../../../../services/database', () => ({
    database: {
        addFriendLogHistory: vi.fn()
    }
}));

// Import mocks after vi.mock
const { copyToClipboard } = await import('../../../../shared/utils');
const {
    favoriteRequest,
    friendRequest,
    notificationRequest,
    playerModerationRequest,
    miscRequest
} = await import('../../../../api');
const { database } = await import('../../../../services/database');

function createMockUserDialog() {
    return ref({
        visible: true,
        id: 'usr_test123',
        ref: {
            displayName: 'TestUser',
            currentAvatarImageUrl: 'https://example.com/avatar.png',
            fallbackAvatar: 'avtr_fallback',
            location: 'wrld_test~123'
        },
        $avatarInfo: { ownerId: 'usr_owner' },
        isFriend: true,
        isBlock: false,
        isMute: false,
        isInteractOff: false,
        isMuteChat: false,
        isShowAvatar: false,
        isHideAvatar: false,
        outgoingRequest: false,
        incomingRequest: false
    });
}

function createMockDeps(overrides = {}) {
    return {
        t: vi.fn((key) => key),
        toast: Object.assign(vi.fn(), {
            success: vi.fn(),
            error: vi.fn()
        }),
        modalStore: {
            confirm: vi.fn(() => Promise.resolve({ ok: true }))
        },
        currentUser: ref({ id: 'usr_current', isBoopingEnabled: true }),
        cachedUsers: new Map([
            ['usr_test123', { id: 'usr_test123', displayName: 'TestUser' }]
        ]),
        friendLogTable: ref({ data: [] }),
        lastLocation: ref({ location: 'wrld_test~123' }),
        lastLocationDestination: ref('wrld_dest~456'),
        inviteGroupDialog: ref({ groupId: '', userId: '', visible: false }),
        showUserDialog: vi.fn(),
        showFavoriteDialog: vi.fn(),
        showAvatarDialog: vi.fn(),
        showAvatarAuthorDialog: vi.fn(),
        showModerateGroupDialog: vi.fn(),
        showSendBoopDialog: vi.fn(),
        showGalleryPage: vi.fn(),
        getFriendRequest: vi.fn(() => ''),
        handleFriendDelete: vi.fn(),
        applyPlayerModeration: vi.fn((json) => json),
        handlePlayerModerationDelete: vi.fn(),
        refreshInviteMessageTableData: vi.fn(),
        clearInviteImageUpload: vi.fn(),
        instanceStore: {
            showPreviousInstancesListDialog: vi.fn()
        },
        useNotificationStore: vi.fn(() => ({
            handleNotificationAccept: vi.fn(),
            handleNotificationHide: vi.fn()
        })),
        ...overrides
    };
}

describe('useUserDialogCommands', () => {
    let userDialog;
    let deps;

    beforeEach(() => {
        vi.clearAllMocks();
        userDialog = createMockUserDialog();
        deps = createMockDeps();
    });

    describe('userDialogCommand — direct commands', () => {
        it('should not execute when dialog is not visible', () => {
            userDialog.value.visible = false;
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Refresh');
            expect(deps.showUserDialog).not.toHaveBeenCalled();
        });

        it('Refresh: should reset id and reopen dialog', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Refresh');
            expect(userDialog.value.id).toBe('');
            expect(deps.showUserDialog).toHaveBeenCalledWith('usr_test123');
        });

        it('Share: should copy user URL', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Share');
            expect(copyToClipboard).toHaveBeenCalledWith(
                'https://vrchat.com/home/user/usr_test123',
                'User URL copied to clipboard'
            );
        });

        it('Add Favorite: should call showFavoriteDialog', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Add Favorite');
            expect(deps.showFavoriteDialog).toHaveBeenCalledWith(
                'friend',
                'usr_test123'
            );
        });

        it('Show Avatar Author: should call showAvatarAuthorDialog', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Show Avatar Author');
            expect(deps.showAvatarAuthorDialog).toHaveBeenCalledWith(
                'usr_test123',
                'usr_owner',
                'https://example.com/avatar.png'
            );
        });

        it('Show Fallback Avatar Details: should call showAvatarDialog with fallback', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Show Fallback Avatar Details');
            expect(deps.showAvatarDialog).toHaveBeenCalledWith('avtr_fallback');
        });

        it('Show Fallback Avatar Details: should toast error when no fallback', () => {
            userDialog.value.ref.fallbackAvatar = null;
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Show Fallback Avatar Details');
            expect(deps.toast.error).toHaveBeenCalledWith(
                'No fallback avatar set'
            );
        });

        it('Send Boop: should call showSendBoopDialog', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Send Boop');
            expect(deps.showSendBoopDialog).toHaveBeenCalledWith('usr_test123');
        });

        it('Group Moderation: should call showModerateGroupDialog', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Group Moderation');
            expect(deps.showModerateGroupDialog).toHaveBeenCalledWith(
                'usr_test123'
            );
        });

        it('Manage Gallery: should hide dialog and show gallery', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Manage Gallery');
            expect(userDialog.value.visible).toBe(false);
            expect(deps.showGalleryPage).toHaveBeenCalled();
        });

        it('Previous Instances: should call instanceStore', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Previous Instances');
            expect(
                deps.instanceStore.showPreviousInstancesListDialog
            ).toHaveBeenCalledWith('user', userDialog.value.ref);
        });

        it('Invite To Group: should set invite group dialog state', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Invite To Group');
            expect(deps.inviteGroupDialog.value.groupId).toBe('');
            expect(deps.inviteGroupDialog.value.userId).toBe('usr_test123');
            expect(deps.inviteGroupDialog.value.visible).toBe(true);
        });
    });

    describe('userDialogCommand — string callback commands', () => {
        it('should delegate string-type commands to registered callbacks', () => {
            const showSocialStatusDialog = vi.fn();
            const { userDialogCommand, registerCallbacks } =
                useUserDialogCommands(userDialog, deps);
            registerCallbacks({ showSocialStatusDialog });
            userDialogCommand('Edit Social Status');
            expect(showSocialStatusDialog).toHaveBeenCalled();
        });

        it('should not throw when callback is not registered', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            expect(() => userDialogCommand('Edit Bio')).not.toThrow();
        });
    });

    describe('userDialogCommand — confirmed commands', () => {
        it('Delete Favorite: should confirm then delete', async () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Delete Favorite');
            await vi.waitFor(() => {
                expect(deps.modalStore.confirm).toHaveBeenCalled();
            });
            await vi.waitFor(() => {
                expect(favoriteRequest.deleteFavorite).toHaveBeenCalledWith({
                    objectId: 'usr_test123'
                });
            });
        });

        it('confirmed command should not execute when user cancels', async () => {
            deps.modalStore.confirm = vi.fn(() =>
                Promise.resolve({ ok: false })
            );
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Delete Favorite');
            await vi.waitFor(() => {
                expect(deps.modalStore.confirm).toHaveBeenCalled();
            });
            expect(favoriteRequest.deleteFavorite).not.toHaveBeenCalled();
        });

        it('Send Friend Request: should confirm then send', async () => {
            friendRequest.sendFriendRequest.mockResolvedValue({
                params: { userId: 'usr_test123' },
                json: { success: true }
            });
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Send Friend Request');
            await vi.waitFor(() => {
                expect(friendRequest.sendFriendRequest).toHaveBeenCalledWith({
                    userId: 'usr_test123'
                });
            });
        });

        it('Cancel Friend Request: should confirm then cancel', async () => {
            friendRequest.cancelFriendRequest.mockResolvedValue({
                params: { userId: 'usr_test123' },
                json: {}
            });
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Cancel Friend Request');
            await vi.waitFor(() => {
                expect(friendRequest.cancelFriendRequest).toHaveBeenCalledWith({
                    userId: 'usr_test123'
                });
            });
        });

        it('Moderation Block: should confirm then send moderation', async () => {
            playerModerationRequest.sendPlayerModeration.mockResolvedValue({
                json: {
                    targetUserId: 'usr_test123',
                    sourceUserId: 'usr_current',
                    type: 'block'
                }
            });
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Moderation Block');
            await vi.waitFor(() => {
                expect(
                    playerModerationRequest.sendPlayerModeration
                ).toHaveBeenCalledWith({
                    moderated: 'usr_test123',
                    type: 'block'
                });
            });
        });

        it('Moderation Unblock: should confirm then delete moderation', async () => {
            playerModerationRequest.deletePlayerModeration.mockResolvedValue(
                {}
            );
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Moderation Unblock');
            await vi.waitFor(() => {
                expect(
                    playerModerationRequest.deletePlayerModeration
                ).toHaveBeenCalledWith({
                    moderated: 'usr_test123',
                    type: 'block'
                });
            });
        });

        it('Report Hacking: should confirm then report', async () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Report Hacking');
            await vi.waitFor(() => {
                expect(miscRequest.reportUser).toHaveBeenCalledWith({
                    userId: 'usr_test123',
                    contentType: 'user',
                    reason: 'behavior-hacking',
                    type: 'report'
                });
            });
        });

        it('Unfriend: should confirm then delete friend', async () => {
            friendRequest.deleteFriend.mockResolvedValue({});
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Unfriend');
            await vi.waitFor(() => {
                expect(friendRequest.deleteFriend).toHaveBeenCalledWith(
                    { userId: 'usr_test123' },
                    'dialog.user.actions.unfriend_success_msg'
                );
            });
        });
    });

    describe('invite dialog state', () => {
        it('Request Invite Message: should open send invite request dialog', () => {
            const {
                userDialogCommand,
                sendInviteRequestDialogVisible,
                sendInviteDialog
            } = useUserDialogCommands(userDialog, deps);
            userDialogCommand('Request Invite Message');
            expect(sendInviteRequestDialogVisible.value).toBe(true);
            expect(sendInviteDialog.value.userId).toBe('usr_test123');
            expect(deps.refreshInviteMessageTableData).toHaveBeenCalledWith(
                'request'
            );
            expect(deps.clearInviteImageUpload).toHaveBeenCalled();
        });
    });

    describe('handleSendFriendRequest (internal)', () => {
        it('should add friend log and update dialog state on success', async () => {
            friendRequest.sendFriendRequest.mockResolvedValue({
                params: { userId: 'usr_test123' },
                json: { success: true }
            });
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Send Friend Request');
            await vi.waitFor(() => {
                expect(database.addFriendLogHistory).toHaveBeenCalled();
            });
            expect(userDialog.value.isFriend).toBe(true);
        });

        it('should set outgoingRequest when not success', async () => {
            friendRequest.sendFriendRequest.mockResolvedValue({
                params: { userId: 'usr_test123' },
                json: { success: false }
            });
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Send Friend Request');
            await vi.waitFor(() => {
                expect(database.addFriendLogHistory).toHaveBeenCalled();
            });
            expect(userDialog.value.outgoingRequest).toBe(true);
        });
    });

    describe('handleSendPlayerModeration (internal)', () => {
        it('should update isBlock when moderation type is block', async () => {
            deps.applyPlayerModeration = vi.fn(() => ({
                targetUserId: 'usr_test123',
                sourceUserId: 'usr_current',
                type: 'block'
            }));
            playerModerationRequest.sendPlayerModeration.mockResolvedValue({
                json: {
                    targetUserId: 'usr_test123',
                    sourceUserId: 'usr_current',
                    type: 'block'
                }
            });
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Moderation Block');
            await vi.waitFor(() => {
                expect(userDialog.value.isBlock).toBe(true);
            });
        });

        it('should update isMute when moderation type is mute', async () => {
            deps.applyPlayerModeration = vi.fn(() => ({
                targetUserId: 'usr_test123',
                sourceUserId: 'usr_current',
                type: 'mute'
            }));
            playerModerationRequest.sendPlayerModeration.mockResolvedValue({
                json: {
                    targetUserId: 'usr_test123',
                    sourceUserId: 'usr_current',
                    type: 'mute'
                }
            });
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            userDialogCommand('Moderation Mute');
            await vi.waitFor(() => {
                expect(userDialog.value.isMute).toBe(true);
            });
        });
    });

    describe('unknown command', () => {
        it('should do nothing for unknown commands', () => {
            const { userDialogCommand } = useUserDialogCommands(
                userDialog,
                deps
            );
            expect(() => userDialogCommand('NonExistentCommand')).not.toThrow();
            expect(deps.modalStore.confirm).not.toHaveBeenCalled();
        });
    });
});
