import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useGroupDialogCommands } from '../useGroupDialogCommands';

vi.mock('../../../../shared/utils', () => ({
    copyToClipboard: vi.fn()
}));

const { copyToClipboard } = await import('../../../../shared/utils');

function createGroupDialog(overrides = {}) {
    return ref({
        visible: true,
        id: 'grp_123',
        ref: {
            $url: 'https://vrchat.com/home/group/grp_123'
        },
        ...overrides
    });
}

function createDeps(overrides = {}) {
    return {
        t: vi.fn((key) => key),
        modalStore: {
            confirm: vi.fn().mockResolvedValue({ ok: true })
        },
        currentUser: ref({ id: 'usr_current' }),
        showGroupDialog: vi.fn(),
        leaveGroupPrompt: vi.fn(),
        setGroupVisibility: vi.fn(),
        setGroupSubscription: vi.fn(),
        showGroupMemberModerationDialog: vi.fn(),
        showInviteGroupDialog: vi.fn(),
        showGroupPostEditDialog: vi.fn(),
        groupRequest: {
            blockGroup: vi.fn().mockResolvedValue({
                params: { groupId: 'grp_123' }
            }),
            unblockGroup: vi.fn().mockResolvedValue({
                params: { groupId: 'grp_123' }
            })
        },
        ...overrides
    };
}

describe('useGroupDialogCommands', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns early when dialog is not visible', () => {
        const groupDialog = createGroupDialog({ visible: false });
        const deps = createDeps();
        const { groupDialogCommand } = useGroupDialogCommands(
            groupDialog,
            deps
        );

        groupDialogCommand('Refresh');
        expect(deps.showGroupDialog).not.toHaveBeenCalled();
    });

    it('Share copies group URL', () => {
        const groupDialog = createGroupDialog();
        const deps = createDeps();
        const { groupDialogCommand } = useGroupDialogCommands(
            groupDialog,
            deps
        );

        groupDialogCommand('Share');
        expect(copyToClipboard).toHaveBeenCalledWith(
            'https://vrchat.com/home/group/grp_123'
        );
    });

    it('Invite To Group dispatches invite callback', () => {
        const groupDialog = createGroupDialog();
        const deps = createDeps();
        const { groupDialogCommand } = useGroupDialogCommands(
            groupDialog,
            deps
        );

        groupDialogCommand('Invite To Group');
        expect(deps.showInviteGroupDialog).toHaveBeenCalledWith('grp_123', '');
    });

    it('Refresh calls showGroupDialog with forceRefresh', () => {
        const groupDialog = createGroupDialog();
        const deps = createDeps();
        const { groupDialogCommand } = useGroupDialogCommands(
            groupDialog,
            deps
        );

        groupDialogCommand('Refresh');
        expect(deps.showGroupDialog).toHaveBeenCalledWith('grp_123', {
            forceRefresh: true
        });
    });

    it('Block Group confirms and calls blockGroup', async () => {
        const groupDialog = createGroupDialog();
        const deps = createDeps();
        const { groupDialogCommand } = useGroupDialogCommands(
            groupDialog,
            deps
        );

        groupDialogCommand('Block Group');
        await vi.waitFor(() => {
            expect(deps.modalStore.confirm).toHaveBeenCalled();
            expect(deps.groupRequest.blockGroup).toHaveBeenCalledWith({
                groupId: 'grp_123'
            });
            expect(deps.showGroupDialog).toHaveBeenCalledWith('grp_123');
        });
    });

    it('Unblock Group confirms and calls unblockGroup', async () => {
        const groupDialog = createGroupDialog();
        const deps = createDeps();
        const { groupDialogCommand } = useGroupDialogCommands(
            groupDialog,
            deps
        );

        groupDialogCommand('Unblock Group');
        await vi.waitFor(() => {
            expect(deps.modalStore.confirm).toHaveBeenCalled();
            expect(deps.groupRequest.unblockGroup).toHaveBeenCalledWith({
                groupId: 'grp_123',
                userId: 'usr_current'
            });
            expect(deps.showGroupDialog).toHaveBeenCalledWith('grp_123');
        });
    });

    it('does not run confirmed action when confirmation is cancelled', async () => {
        const groupDialog = createGroupDialog();
        const deps = createDeps({
            modalStore: {
                confirm: vi.fn().mockResolvedValue({ ok: false })
            }
        });
        const { groupDialogCommand } = useGroupDialogCommands(
            groupDialog,
            deps
        );

        groupDialogCommand('Block Group');
        await vi.waitFor(() => {
            expect(deps.modalStore.confirm).toHaveBeenCalled();
        });
        expect(deps.groupRequest.blockGroup).not.toHaveBeenCalled();
    });
});
