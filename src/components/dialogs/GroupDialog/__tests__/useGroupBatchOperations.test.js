import { ref } from 'vue';
import { describe, expect, test, vi } from 'vitest';

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useGroupBatchOperations } from '../useGroupBatchOperations';

/**
 *
 * @param overrides
 */
function createDeps(overrides = {}) {
    return {
        selectedUsersArray: ref([
            {
                userId: 'usr_1',
                displayName: 'Alice',
                roleIds: ['role_1'],
                managerNotes: ''
            },
            {
                userId: 'usr_2',
                displayName: 'Bob',
                roleIds: ['role_1'],
                managerNotes: ''
            }
        ]),
        currentUser: ref({ id: 'usr_self' }),
        groupMemberModeration: ref({ id: 'grp_test' }),
        deselectedUsers: vi.fn(),
        groupRequest: {
            banGroupMember: vi.fn().mockResolvedValue(undefined),
            unbanGroupMember: vi.fn().mockResolvedValue(undefined),
            kickGroupMember: vi.fn().mockResolvedValue(undefined),
            setGroupMemberProps: vi.fn().mockResolvedValue(undefined),
            removeGroupMemberRole: vi.fn().mockResolvedValue(undefined),
            addGroupMemberRole: vi.fn().mockResolvedValue(undefined),
            deleteSentGroupInvite: vi.fn().mockResolvedValue(undefined),
            acceptGroupInviteRequest: vi.fn().mockResolvedValue(undefined),
            rejectGroupInviteRequest: vi.fn().mockResolvedValue(undefined),
            blockGroupInviteRequest: vi.fn().mockResolvedValue(undefined),
            deleteBlockedGroupRequest: vi.fn().mockResolvedValue(undefined)
        },
        handleGroupMemberRoleChange: vi.fn(),
        handleGroupMemberProps: vi.fn(),
        ...overrides
    };
}

describe('useGroupBatchOperations', () => {
    describe('runBatchOperation (via groupMembersBan)', () => {
        test('calls action for each selected user', async () => {
            const deps = createDeps();
            const { groupMembersBan } = useGroupBatchOperations(deps);

            await groupMembersBan();

            expect(deps.groupRequest.banGroupMember).toHaveBeenCalledTimes(2);
            expect(deps.groupRequest.banGroupMember).toHaveBeenCalledWith({
                groupId: 'grp_test',
                userId: 'usr_1'
            });
            expect(deps.groupRequest.banGroupMember).toHaveBeenCalledWith({
                groupId: 'grp_test',
                userId: 'usr_2'
            });
        });

        test('skips self user', async () => {
            const deps = createDeps({
                selectedUsersArray: ref([
                    {
                        userId: 'usr_self',
                        displayName: 'Self',
                        roleIds: [],
                        managerNotes: ''
                    },
                    {
                        userId: 'usr_1',
                        displayName: 'Alice',
                        roleIds: [],
                        managerNotes: ''
                    }
                ])
            });
            const { groupMembersBan } = useGroupBatchOperations(deps);

            await groupMembersBan();

            expect(deps.groupRequest.banGroupMember).toHaveBeenCalledTimes(1);
            expect(deps.groupRequest.banGroupMember).toHaveBeenCalledWith({
                groupId: 'grp_test',
                userId: 'usr_1'
            });
        });

        test('calls onComplete callback', async () => {
            const deps = createDeps();
            const onComplete = vi.fn();
            const { groupMembersBan } = useGroupBatchOperations(deps);

            await groupMembersBan({ onComplete });

            expect(onComplete).toHaveBeenCalled();
        });

        test('handles errors gracefully', async () => {
            const deps = createDeps();
            deps.groupRequest.banGroupMember
                .mockRejectedValueOnce(new Error('fail'))
                .mockResolvedValueOnce(undefined);
            const { groupMembersBan } = useGroupBatchOperations(deps);

            await groupMembersBan();

            // should still attempt the second user
            expect(deps.groupRequest.banGroupMember).toHaveBeenCalledTimes(2);
        });

        test('tracks progress during operation', async () => {
            const deps = createDeps();
            const { groupMembersBan, progressTotal, progressCurrent } =
                useGroupBatchOperations(deps);

            expect(progressTotal.value).toBe(0);
            const p = groupMembersBan();
            await p;
            // After completion, progress resets to 0
            expect(progressTotal.value).toBe(0);
            expect(progressCurrent.value).toBe(0);
        });
    });

    describe('groupMembersUnban', () => {
        test('calls unbanGroupMember for each user', async () => {
            const deps = createDeps();
            const { groupMembersUnban } = useGroupBatchOperations(deps);

            await groupMembersUnban();

            expect(deps.groupRequest.unbanGroupMember).toHaveBeenCalledTimes(2);
        });
    });

    describe('groupMembersKick', () => {
        test('calls kickGroupMember for each user', async () => {
            const deps = createDeps();
            const { groupMembersKick } = useGroupBatchOperations(deps);

            await groupMembersKick();

            expect(deps.groupRequest.kickGroupMember).toHaveBeenCalledTimes(2);
        });
    });

    describe('groupMembersSaveNote', () => {
        test('calls setGroupMemberProps with note value', async () => {
            const deps = createDeps();
            const { groupMembersSaveNote } = useGroupBatchOperations(deps);

            await groupMembersSaveNote('Test note');

            expect(deps.groupRequest.setGroupMemberProps).toHaveBeenCalledTimes(
                2
            );
            expect(deps.groupRequest.setGroupMemberProps).toHaveBeenCalledWith(
                'usr_1',
                'grp_test',
                {
                    managerNotes: 'Test note'
                }
            );
        });
    });

    describe('groupMembersAddRoles', () => {
        test('calls addGroupMemberRole for each role per user', async () => {
            const deps = createDeps();
            const { groupMembersAddRoles } = useGroupBatchOperations(deps);

            await groupMembersAddRoles(['role_1', 'role_2']);

            // Both users already have role_1, so only role_2 gets added → 2 calls
            expect(deps.groupRequest.addGroupMemberRole).toHaveBeenCalledTimes(
                2
            );
        });
    });

    describe('groupMembersRemoveRoles', () => {
        test('calls removeGroupMemberRole for each role per user', async () => {
            const deps = createDeps();
            const { groupMembersRemoveRoles } = useGroupBatchOperations(deps);

            await groupMembersRemoveRoles(['role_1']);

            expect(
                deps.groupRequest.removeGroupMemberRole
            ).toHaveBeenCalledTimes(2);
        });
    });

    describe('groupMembersDeleteSentInvite', () => {
        test('calls deleteSentGroupInvite for each user', async () => {
            const deps = createDeps();
            const { groupMembersDeleteSentInvite } =
                useGroupBatchOperations(deps);

            await groupMembersDeleteSentInvite();

            expect(
                deps.groupRequest.deleteSentGroupInvite
            ).toHaveBeenCalledTimes(2);
        });
    });

    describe('groupMembersAcceptInviteRequest', () => {
        test('calls acceptGroupInviteRequest for each user', async () => {
            const deps = createDeps();
            const { groupMembersAcceptInviteRequest } =
                useGroupBatchOperations(deps);

            await groupMembersAcceptInviteRequest();

            expect(
                deps.groupRequest.acceptGroupInviteRequest
            ).toHaveBeenCalledTimes(2);
        });
    });

    describe('groupMembersRejectInviteRequest', () => {
        test('calls rejectGroupInviteRequest for each user', async () => {
            const deps = createDeps();
            const { groupMembersRejectInviteRequest } =
                useGroupBatchOperations(deps);

            await groupMembersRejectInviteRequest();

            expect(
                deps.groupRequest.rejectGroupInviteRequest
            ).toHaveBeenCalledTimes(2);
        });
    });

    describe('groupMembersBlockJoinRequest', () => {
        test('calls blockGroupInviteRequest for each user', async () => {
            const deps = createDeps();
            const { groupMembersBlockJoinRequest } =
                useGroupBatchOperations(deps);

            await groupMembersBlockJoinRequest();

            expect(
                deps.groupRequest.blockGroupInviteRequest
            ).toHaveBeenCalledTimes(2);
        });
    });

    describe('groupMembersDeleteBlockedRequest', () => {
        test('calls deleteBlockedGroupRequest for each user', async () => {
            const deps = createDeps();
            const { groupMembersDeleteBlockedRequest } =
                useGroupBatchOperations(deps);

            await groupMembersDeleteBlockedRequest();

            expect(
                deps.groupRequest.deleteBlockedGroupRequest
            ).toHaveBeenCalledTimes(2);
        });
    });
});
