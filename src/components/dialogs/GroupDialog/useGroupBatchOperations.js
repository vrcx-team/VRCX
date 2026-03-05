import { ref } from 'vue';
import { toast } from 'vue-sonner';

/**
 * Composable for batch moderation operations with progress tracking.
 * @param {object} deps
 * @param {import('vue').Ref} deps.selectedUsersArray
 * @param {import('vue').Ref} deps.currentUser
 * @param {import('vue').Ref} deps.groupMemberModeration
 * @param {Function} deps.deselectedUsers
 * @param {object} deps.groupRequest
 * @param {Function} deps.handleGroupMemberRoleChange
 * @param {Function} deps.handleGroupMemberProps
 */
export function useGroupBatchOperations(deps) {
    const progressCurrent = ref(0);
    const progressTotal = ref(0);

    /**
     * Generic batch operation runner.
     * @param {object} options
     * @param {Function} options.action - async (user, groupId) => void
     * @param {string} options.logPrefix - e.g. 'Banning'
     * @param {string} options.successMessage - e.g. 'Banned {count} group members'
     * @param {string} options.errorMessage - e.g. 'Failed to ban group member'
     * @param {boolean} [options.skipSelf]
     * @param {Function} [options.onComplete] - called after the loop finishes
     * @returns {Promise<void>}
     */
    async function runBatchOperation({
        action,
        logPrefix,
        successMessage,
        errorMessage,
        skipSelf = true,
        onComplete
    }) {
        const users = [...deps.selectedUsersArray.value];
        const memberCount = users.length;
        const groupId = deps.groupMemberModeration.value.id;
        progressTotal.value = memberCount;
        let allSuccess = true;

        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;

            if (skipSelf && user.userId === deps.currentUser.value.id) continue;

            console.log(`${logPrefix} ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await action(user, groupId);
            } catch (err) {
                console.error(err);
                toast.error(`${errorMessage}: ${err}`);
                allSuccess = false;
            }
        }

        if (allSuccess) {
            toast.success(successMessage.replace('{count}', memberCount));
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        deps.deselectedUsers(null, true);
        if (onComplete) onComplete();
    }

    /**
     *
     * @param callbacks
     */
    async function groupMembersBan(callbacks) {
        await runBatchOperation({
            action: (user, groupId) =>
                deps.groupRequest.banGroupMember({
                    groupId,
                    userId: user.userId
                }),
            logPrefix: 'Banning',
            successMessage: 'Banned {count} group members',
            errorMessage: 'Failed to ban group member',
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param callbacks
     */
    async function groupMembersUnban(callbacks) {
        await runBatchOperation({
            action: (user, groupId) =>
                deps.groupRequest.unbanGroupMember({
                    groupId,
                    userId: user.userId
                }),
            logPrefix: 'Unbanning',
            successMessage: 'Unbanned {count} group members',
            errorMessage: 'Failed to unban group member',
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param callbacks
     */
    async function groupMembersKick(callbacks) {
        await runBatchOperation({
            action: (user, groupId) =>
                deps.groupRequest.kickGroupMember({
                    groupId,
                    userId: user.userId
                }),
            logPrefix: 'Kicking',
            successMessage: 'Kicked {count} group members',
            errorMessage: 'Failed to kick group member',
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param noteValue
     * @param callbacks
     */
    async function groupMembersSaveNote(noteValue, callbacks) {
        await runBatchOperation({
            action: async (user, groupId) => {
                if (user.managerNotes === noteValue) return;
                const args = await deps.groupRequest.setGroupMemberProps(
                    user.userId,
                    groupId,
                    {
                        managerNotes: noteValue
                    }
                );
                deps.handleGroupMemberProps(args);
            },
            logPrefix: 'Setting note for',
            successMessage: 'Saved notes for {count} group members',
            errorMessage: 'Failed to set group member note for',
            skipSelf: false,
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param roleIds
     * @param callbacks
     */
    async function groupMembersRemoveRoles(roleIds, callbacks) {
        const rolesToRemoveSet = new Set(roleIds);
        await runBatchOperation({
            action: async (user, groupId) => {
                const currentRoles = new Set(user.roleIds || []);
                const rolesToRemoveForUser = [];
                rolesToRemoveSet.forEach((roleId) => {
                    if (currentRoles.has(roleId)) {
                        rolesToRemoveForUser.push(roleId);
                    }
                });
                if (!rolesToRemoveForUser.length) return;
                for (const roleId of rolesToRemoveForUser) {
                    const args = await deps.groupRequest.removeGroupMemberRole({
                        groupId,
                        userId: user.userId,
                        roleId
                    });
                    deps.handleGroupMemberRoleChange(args);
                }
            },
            logPrefix: 'Removing roles from',
            successMessage: 'Roles removed',
            errorMessage: 'Failed to remove group member roles',
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param roleIds
     * @param callbacks
     */
    async function groupMembersAddRoles(roleIds, callbacks) {
        const rolesToAddSet = new Set(roleIds);
        await runBatchOperation({
            action: async (user, groupId) => {
                const currentRoles = new Set(user.roleIds || []);
                const rolesToAddForUser = [];
                rolesToAddSet.forEach((roleId) => {
                    if (!currentRoles.has(roleId)) {
                        rolesToAddForUser.push(roleId);
                    }
                });
                if (!rolesToAddForUser.length) return;
                for (const roleId of rolesToAddForUser) {
                    const args = await deps.groupRequest.addGroupMemberRole({
                        groupId,
                        userId: user.userId,
                        roleId
                    });
                    deps.handleGroupMemberRoleChange(args);
                }
            },
            logPrefix: 'Adding roles to',
            successMessage: 'Added group member roles',
            errorMessage: 'Failed to add group member roles',
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param callbacks
     */
    async function groupMembersDeleteSentInvite(callbacks) {
        await runBatchOperation({
            action: (user, groupId) =>
                deps.groupRequest.deleteSentGroupInvite({
                    groupId,
                    userId: user.userId
                }),
            logPrefix: 'Deleting group invite',
            successMessage: 'Deleted {count} group invites',
            errorMessage: 'Failed to delete group invites',
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param callbacks
     */
    async function groupMembersAcceptInviteRequest(callbacks) {
        await runBatchOperation({
            action: (user, groupId) =>
                deps.groupRequest.acceptGroupInviteRequest({
                    groupId,
                    userId: user.userId
                }),
            logPrefix: 'Accepting group join request from',
            successMessage: 'Accepted {count} group join requests',
            errorMessage: 'Failed to accept group join requests',
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param callbacks
     */
    async function groupMembersRejectInviteRequest(callbacks) {
        await runBatchOperation({
            action: (user, groupId) =>
                deps.groupRequest.rejectGroupInviteRequest({
                    groupId,
                    userId: user.userId
                }),
            logPrefix: 'Rejecting group join request from',
            successMessage: 'Rejected {count} group join requests',
            errorMessage: 'Failed to reject group join requests',
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param callbacks
     */
    async function groupMembersBlockJoinRequest(callbacks) {
        await runBatchOperation({
            action: (user, groupId) =>
                deps.groupRequest.blockGroupInviteRequest({
                    groupId,
                    userId: user.userId
                }),
            logPrefix: 'Blocking group join request from',
            successMessage: 'Blocked {count} group join requests',
            errorMessage: 'Failed to block group join requests',
            onComplete: callbacks?.onComplete
        });
    }

    /**
     *
     * @param callbacks
     */
    async function groupMembersDeleteBlockedRequest(callbacks) {
        await runBatchOperation({
            action: (user, groupId) =>
                deps.groupRequest.deleteBlockedGroupRequest({
                    groupId,
                    userId: user.userId
                }),
            logPrefix: 'Deleting blocked group request for',
            successMessage: 'Deleted {count} blocked group requests',
            errorMessage: 'Failed to delete blocked group requests',
            onComplete: callbacks?.onComplete
        });
    }

    return {
        progressCurrent,
        progressTotal,
        groupMembersBan,
        groupMembersUnban,
        groupMembersKick,
        groupMembersSaveNote,
        groupMembersRemoveRoles,
        groupMembersAddRoles,
        groupMembersDeleteSentInvite,
        groupMembersAcceptInviteRequest,
        groupMembersRejectInviteRequest,
        groupMembersBlockJoinRequest,
        groupMembersDeleteBlockedRequest
    };
}
