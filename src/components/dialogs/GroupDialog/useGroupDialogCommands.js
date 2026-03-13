import { copyToClipboard } from '../../../shared/utils';

/**
 * Composable for GroupDialog command dispatch.
 * Uses a command map pattern consistent with Avatar/World/User dialogs.
 * @param {import('vue').Ref} groupDialog - reactive ref to the group dialog state
 * @param {object} deps - external dependencies
 * @param deps.t
 * @param deps.modalStore
 * @param deps.currentUser
 * @param deps.showGroupDialog
 * @param deps.leaveGroupPrompt
 * @param deps.setGroupVisibility
 * @param deps.setGroupSubscription
 * @param deps.showGroupMemberModerationDialog
 * @param deps.showInviteGroupDialog
 * @param deps.showGroupPostEditDialog
 * @param deps.groupRequest
 * @returns {object} command composable API
 */
export function useGroupDialogCommands(
    groupDialog,
    {
        t,
        modalStore,
        currentUser,
        showGroupDialog,
        leaveGroupPrompt,
        setGroupVisibility,
        setGroupSubscription,
        showGroupMemberModerationDialog,
        showInviteGroupDialog,
        showGroupPostEditDialog,
        groupRequest
    }
) {
    // --- Command map ---
    // Direct commands: function
    // Confirmed commands: { confirm: () => ({title, description, ...}), handler: fn }

    /**
     *
     */
    function buildCommandMap() {
        const D = () => groupDialog.value;

        return {
            // --- Direct commands ---
            Share: () => {
                copyToClipboard(D().ref.$url);
            },
            'Create Post': () => {
                showGroupPostEditDialog(D().id, null);
            },
            'Moderation Tools': () => {
                showGroupMemberModerationDialog(D().id);
            },
            'Invite To Group': () => {
                showInviteGroupDialog(D().id, '');
            },
            Refresh: () => {
                showGroupDialog(D().id, { forceRefresh: true });
            },
            'Leave Group': () => {
                leaveGroupPrompt(D().id);
            },
            'Visibility Everyone': () => {
                setGroupVisibility(D().id, 'visible');
            },
            'Visibility Friends': () => {
                setGroupVisibility(D().id, 'friends');
            },
            'Visibility Hidden': () => {
                setGroupVisibility(D().id, 'hidden');
            },
            'Subscribe To Announcements': () => {
                setGroupSubscription(D().id, true);
            },
            'Unsubscribe To Announcements': () => {
                setGroupSubscription(D().id, false);
            },

            // --- Confirmed commands ---
            'Block Group': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.block_group'),
                    destructive: true
                }),
                handler: (id) => {
                    groupRequest.blockGroup({ groupId: id }).then((args) => {
                        if (
                            groupDialog.value.visible &&
                            groupDialog.value.id === args.params.groupId
                        ) {
                            showGroupDialog(args.params.groupId);
                        }
                    });
                }
            },
            'Unblock Group': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.unblock_group')
                }),
                handler: (id) => {
                    groupRequest
                        .unblockGroup({
                            groupId: id,
                            userId: currentUser.value.id
                        })
                        .then((args) => {
                            if (
                                groupDialog.value.visible &&
                                groupDialog.value.id === args.params.groupId
                            ) {
                                showGroupDialog(args.params.groupId);
                            }
                        });
                }
            }
        };
    }

    const commandMap = buildCommandMap();

    /**
     * Dispatch a group dialog command.
     * @param {string} command
     */
    function groupDialogCommand(command) {
        const D = groupDialog.value;
        if (D.visible === false) {
            return;
        }

        const entry = commandMap[command];

        if (!entry) {
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
        groupDialogCommand
    };
}
