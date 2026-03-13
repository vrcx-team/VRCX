import { ref } from 'vue';

import {
    favoriteRequest,
    friendRequest,
    miscRequest,
    notificationRequest,
    playerModerationRequest,
    queryRequest
} from '../../../api';
import { copyToClipboard, parseLocation } from '../../../shared/utils';
import { database } from '../../../services/database';

/**
 * Composable for UserDialog command dispatch.
 * Uses a command map pattern instead of if-else/switch-case chains.
 * @param {import('vue').Ref} userDialog - reactive ref to the user dialog state
 * @param {object} deps - external dependencies
 * @param deps.t
 * @param deps.toast
 * @param deps.modalStore
 * @param deps.currentUser
 * @param deps.cachedUsers
 * @param deps.friendLogTable
 * @param deps.lastLocation
 * @param deps.lastLocationDestination
 * @param deps.inviteGroupDialog
 * @param deps.showUserDialog
 * @param deps.showFavoriteDialog
 * @param deps.showAvatarDialog
 * @param deps.showAvatarAuthorDialog
 * @param deps.showModerateGroupDialog
 * @param deps.showSendBoopDialog
 * @param deps.showGalleryPage
 * @param deps.getFriendRequest
 * @param deps.handleFriendDelete
 * @param deps.applyPlayerModeration
 * @param deps.handlePlayerModerationDelete
 * @param deps.refreshInviteMessageTableData
 * @param deps.clearInviteImageUpload
 * @param deps.instanceStore
 * @param deps.useNotificationStore
 * @returns {object} command composable API
 */
export function useUserDialogCommands(
    userDialog,
    {
        t,
        toast,
        modalStore,
        currentUser,
        cachedUsers,
        friendLogTable,
        lastLocation,
        lastLocationDestination,
        inviteGroupDialog,
        showUserDialog,
        showFavoriteDialog,
        showAvatarDialog,
        showAvatarAuthorDialog,
        showModerateGroupDialog,
        showSendBoopDialog,
        showGalleryPage,
        getFriendRequest,
        handleFriendDelete,
        applyPlayerModeration,
        handlePlayerModerationDelete,
        refreshInviteMessageTableData,
        clearInviteImageUpload,
        instanceStore,
        useNotificationStore
    }
) {
    // --- Invite dialog state ---
    const sendInviteDialogVisible = ref(false);
    const sendInviteDialog = ref({
        messageSlot: {},
        userId: '',
        params: {}
    });
    const sendInviteRequestDialogVisible = ref(false);

    // --- Internal helpers ---

    /**
     * @param {object} args
     */
    function handleSendFriendRequest(args) {
        const ref = cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        const friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'FriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        };
        friendLogTable.value.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);

        const D = userDialog.value;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        if (args.json.success) {
            D.isFriend = true;
        } else {
            D.outgoingRequest = true;
        }
    }

    /**
     * @param {object} args
     */
    function handleCancelFriendRequest(args) {
        const ref = cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        const friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'CancelFriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        };
        friendLogTable.value.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);
        const D = userDialog.value;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        D.outgoingRequest = false;
    }

    /**
     * @param {object} args
     */
    function handleSendPlayerModeration(args) {
        const ref = applyPlayerModeration(args.json);
        const D = userDialog.value;
        if (
            D.visible === false ||
            (ref.targetUserId !== D.id &&
                ref.sourceUserId !== currentUser.value.id)
        ) {
            return;
        }
        if (ref.type === 'block') {
            D.isBlock = true;
        } else if (ref.type === 'mute') {
            D.isMute = true;
        } else if (ref.type === 'interactOff') {
            D.isInteractOff = true;
        } else if (ref.type === 'muteChat') {
            D.isMuteChat = true;
        }
        toast.success(t('message.user.moderated'));
    }

    /**
     * @param {string} userId
     * @param {number} type
     */
    function setPlayerModeration(userId, type) {
        const D = userDialog.value;
        AppApi.SetVRChatUserModeration(currentUser.value.id, userId, type).then(
            (result) => {
                if (result) {
                    if (type === 4) {
                        D.isShowAvatar = false;
                        D.isHideAvatar = true;
                    } else if (type === 5) {
                        D.isShowAvatar = true;
                        D.isHideAvatar = false;
                    } else {
                        D.isShowAvatar = false;
                        D.isHideAvatar = false;
                    }
                } else {
                    toast.error(t('message.avatar.change_moderation_failed'));
                }
            }
        );
    }

    /**
     * @param {object} params
     * @param {string} userId
     */
    function showSendInviteDialogFn(params, userId) {
        sendInviteDialog.value = {
            params,
            userId,
            messageSlot: {}
        };
        refreshInviteMessageTableData('message');
        clearInviteImageUpload();
        sendInviteDialogVisible.value = true;
    }

    /**
     * @param {object} params
     * @param {string} userId
     */
    function showSendInviteRequestDialogFn(params, userId) {
        sendInviteDialog.value = {
            params,
            userId,
            messageSlot: {}
        };
        refreshInviteMessageTableData('request');
        clearInviteImageUpload();
        sendInviteRequestDialogVisible.value = true;
    }

    // --- Command map ---
    // Direct commands: function
    // Confirmed commands: { confirm: () => ({title, description, ...}), handler: fn }

    /**
     *
     */
    function buildCommandMap() {
        const D = () => userDialog.value;

        return {
            // --- Direct commands ---
            Refresh: () => {
                const userId = D().id;
                D().id = '';
                showUserDialog(userId);
            },
            Share: () => {
                copyToClipboard(
                    `https://vrchat.com/home/user/${D().id}`,
                    'User URL copied to clipboard'
                );
            },
            'Add Favorite': () => {
                showFavoriteDialog('friend', D().id);
            },
            'Edit Social Status': 'showSocialStatusDialog',
            'Edit Language': 'showLanguageDialog',
            'Edit Bio': 'showBioDialog',
            'Edit Pronouns': 'showPronounsDialog',
            'Request Invite': () => {
                notificationRequest
                    .sendRequestInvite(
                        {
                            platform: 'standalonewindows'
                        },
                        D().id
                    )
                    .then((args) => {
                        toast('Request invite sent');
                        return args;
                    });
            },
            'Invite Message': () => {
                const L = parseLocation(lastLocation.value.location);
                queryRequest
                    .fetch('world', {
                        worldId: L.worldId
                    })
                    .then((args) => {
                        showSendInviteDialogFn(
                            {
                                instanceId: lastLocation.value.location,
                                worldId: lastLocation.value.location,
                                worldName: args.ref.name
                            },
                            D().id
                        );
                    });
            },
            'Request Invite Message': () => {
                showSendInviteRequestDialogFn(
                    {
                        platform: 'standalonewindows'
                    },
                    D().id
                );
            },
            Invite: () => {
                let currentLocation = lastLocation.value.location;
                if (lastLocation.value.location === 'traveling') {
                    currentLocation = lastLocationDestination.value;
                }
                const L = parseLocation(currentLocation);
                queryRequest
                    .fetch('world', {
                        worldId: L.worldId
                    })
                    .then((args) => {
                        notificationRequest
                            .sendInvite(
                                {
                                    instanceId: L.tag,
                                    worldId: L.tag,
                                    worldName: args.ref.name
                                },
                                D().id
                            )
                            .then((_args) => {
                                toast(t('message.invite.sent'));
                                return _args;
                            });
                    });
            },
            'Show Avatar Author': () => {
                const { currentAvatarImageUrl } = D().ref;
                showAvatarAuthorDialog(
                    D().id,
                    D().$avatarInfo.ownerId,
                    currentAvatarImageUrl
                );
            },
            'Show Fallback Avatar Details': () => {
                const { fallbackAvatar } = D().ref;
                if (fallbackAvatar) {
                    showAvatarDialog(fallbackAvatar);
                } else {
                    toast.error('No fallback avatar set');
                }
            },
            'Previous Instances': () => {
                instanceStore.showPreviousInstancesListDialog('user', D().ref);
            },
            'Manage Gallery': () => {
                userDialog.value.visible = false;
                showGalleryPage();
            },
            'Invite To Group': () => {
                inviteGroupDialog.value.groupId = '';
                inviteGroupDialog.value.userId = D().id;
                inviteGroupDialog.value.visible = true;
            },
            'Send Boop': () => {
                showSendBoopDialog(D().id);
            },
            'Group Moderation': () => {
                showModerateGroupDialog(D().id);
            },
            'Hide Avatar': () => {
                if (D().isHideAvatar) {
                    setPlayerModeration(D().id, 0);
                } else {
                    setPlayerModeration(D().id, 4);
                }
            },
            'Show Avatar': () => {
                if (D().isShowAvatar) {
                    setPlayerModeration(D().id, 0);
                } else {
                    setPlayerModeration(D().id, 5);
                }
            },
            'Edit Note Memo': 'showEditNoteAndMemoDialog',

            // --- Confirmed commands ---
            'Delete Favorite': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.delete_favorite')
                    })
                }),
                handler: (userId) => {
                    favoriteRequest.deleteFavorite({
                        objectId: userId
                    });
                }
            },
            'Accept Friend Request': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.accept_friend_request')
                    })
                }),
                handler: async (userId) => {
                    const key = getFriendRequest(userId);
                    if (key === '') {
                        const args = await friendRequest.sendFriendRequest({
                            userId
                        });
                        handleSendFriendRequest(args);
                    } else {
                        notificationRequest
                            .acceptFriendRequestNotification({
                                notificationId: key
                            })
                            .then((args) => {
                                useNotificationStore().handleNotificationAccept(
                                    args
                                );
                            })
                            .catch((err) => {
                                if (
                                    err &&
                                    err.message &&
                                    err.message.includes('404')
                                ) {
                                    useNotificationStore().handleNotificationHide(
                                        key
                                    );
                                }
                            });
                    }
                }
            },
            'Decline Friend Request': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.decline_friend_request')
                    })
                }),
                handler: async (userId) => {
                    const key = getFriendRequest(userId);
                    if (key === '') {
                        const args = await friendRequest.cancelFriendRequest({
                            userId
                        });
                        handleCancelFriendRequest(args);
                    } else {
                        notificationRequest
                            .hideNotification({
                                notificationId: key
                            })
                            .then(() => {
                                useNotificationStore().handleNotificationHide(
                                    key
                                );
                            });
                    }
                }
            },
            'Cancel Friend Request': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.cancel_friend_request')
                    })
                }),
                handler: async (userId) => {
                    const args = await friendRequest.cancelFriendRequest({
                        userId
                    });
                    handleCancelFriendRequest(args);
                }
            },
            'Send Friend Request': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.send_friend_request')
                    })
                }),
                handler: async (userId) => {
                    const args = await friendRequest.sendFriendRequest({
                        userId
                    });
                    handleSendFriendRequest(args);
                }
            },
            'Moderation Unblock': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.moderation_unblock')
                    })
                }),
                handler: async (userId) => {
                    const args =
                        await playerModerationRequest.deletePlayerModeration({
                            moderated: userId,
                            type: 'block'
                        });
                    handlePlayerModerationDelete(args);
                }
            },
            'Moderation Block': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.moderation_block')
                    }),
                    destructive: true
                }),
                handler: async (userId) => {
                    const args =
                        await playerModerationRequest.sendPlayerModeration({
                            moderated: userId,
                            type: 'block'
                        });
                    handleSendPlayerModeration(args);
                }
            },
            'Moderation Unmute': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.moderation_unmute')
                    })
                }),
                handler: async (userId) => {
                    const args =
                        await playerModerationRequest.deletePlayerModeration({
                            moderated: userId,
                            type: 'mute'
                        });
                    handlePlayerModerationDelete(args);
                }
            },
            'Moderation Mute': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.moderation_mute')
                    }),
                    destructive: true
                }),
                handler: async (userId) => {
                    const args =
                        await playerModerationRequest.sendPlayerModeration({
                            moderated: userId,
                            type: 'mute'
                        });
                    handleSendPlayerModeration(args);
                }
            },
            'Moderation Enable Avatar Interaction': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t(
                            'dialog.user.actions.moderation_enable_avatar_interaction'
                        )
                    })
                }),
                handler: async (userId) => {
                    const args =
                        await playerModerationRequest.deletePlayerModeration({
                            moderated: userId,
                            type: 'interactOff'
                        });
                    handlePlayerModerationDelete(args);
                }
            },
            'Moderation Disable Avatar Interaction': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t(
                            'dialog.user.actions.moderation_disable_avatar_interaction'
                        )
                    }),
                    destructive: true
                }),
                handler: async (userId) => {
                    const args =
                        await playerModerationRequest.sendPlayerModeration({
                            moderated: userId,
                            type: 'interactOff'
                        });
                    handleSendPlayerModeration(args);
                }
            },
            'Moderation Enable Chatbox': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t(
                            'dialog.user.actions.moderation_enable_chatbox'
                        )
                    })
                }),
                handler: async (userId) => {
                    const args =
                        await playerModerationRequest.deletePlayerModeration({
                            moderated: userId,
                            type: 'muteChat'
                        });
                    handlePlayerModerationDelete(args);
                }
            },
            'Moderation Disable Chatbox': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t(
                            'dialog.user.actions.moderation_disable_chatbox'
                        )
                    }),
                    destructive: true
                }),
                handler: async (userId) => {
                    const args =
                        await playerModerationRequest.sendPlayerModeration({
                            moderated: userId,
                            type: 'muteChat'
                        });
                    handleSendPlayerModeration(args);
                }
            },
            'Report Hacking': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.report_hacking')
                    })
                }),
                handler: (userId) => {
                    miscRequest.reportUser({
                        userId,
                        contentType: 'user',
                        reason: 'behavior-hacking',
                        type: 'report'
                    });
                }
            },
            Unfriend: {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.user.actions.unfriend')
                    }),
                    destructive: true
                }),
                handler: async (userId) => {
                    const args = await friendRequest.deleteFriend(
                        {
                            userId
                        },
                        t('dialog.user.actions.unfriend_success_msg')
                    );
                    handleFriendDelete(args);
                }
            }
        };
    }

    const commandMap = buildCommandMap();

    // Callbacks for string-type commands (delegated to component)
    let componentCallbacks = {};

    /**
     * Register component-level callbacks for string-type commands.
     * These are simple dialog openers that stay in the component.
     * @param {object} callbacks
     */
    function registerCallbacks(callbacks) {
        componentCallbacks = callbacks;
    }

    /**
     * Dispatch a user dialog command.
     * @param {string} command
     */
    function userDialogCommand(command) {
        const D = userDialog.value;
        if (D.visible === false) {
            return;
        }

        const entry = commandMap[command];

        if (!entry) {
            return;
        }

        // String entry => delegate to component callback
        if (typeof entry === 'string') {
            const cb = componentCallbacks[entry];
            if (cb) {
                cb();
            }
            return;
        }

        // Direct function
        if (typeof entry === 'function') {
            entry();
            return;
        }

        // Confirmed command
        if (entry.confirm) {
            modalStore
                .confirm(entry.confirm())
                .then(({ ok }) => {
                    if (ok) {
                        entry.handler(D.id);
                    }
                })
                .catch(() => {});
        }
    }

    return {
        sendInviteDialogVisible,
        sendInviteDialog,
        sendInviteRequestDialogVisible,
        userDialogCommand,
        registerCallbacks
    };
}
