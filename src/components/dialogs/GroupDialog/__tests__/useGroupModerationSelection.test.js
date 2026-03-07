import { describe, expect, test } from 'vitest';

import { useGroupModerationSelection } from '../useGroupModerationSelection';

function createTables() {
    return {
        members: { data: [] },
        bans: { data: [] },
        invites: { data: [] },
        joinRequests: { data: [] },
        blocked: { data: [] }
    };
}

describe('useGroupModerationSelection', () => {
    describe('setSelectedUsers', () => {
        test('adds a user to selection', () => {
            const tables = createTables();
            const { selectedUsers, selectedUsersArray, setSelectedUsers } =
                useGroupModerationSelection(tables);

            setSelectedUsers('usr_1', { userId: 'usr_1', name: 'Alice' });

            expect(selectedUsers['usr_1']).toEqual({
                userId: 'usr_1',
                name: 'Alice'
            });
            expect(selectedUsersArray.value).toHaveLength(1);
        });

        test('ignores null user', () => {
            const tables = createTables();
            const { selectedUsersArray, setSelectedUsers } =
                useGroupModerationSelection(tables);

            setSelectedUsers('usr_1', null);

            expect(selectedUsersArray.value).toHaveLength(0);
        });

        test('adds multiple users', () => {
            const tables = createTables();
            const { selectedUsersArray, setSelectedUsers } =
                useGroupModerationSelection(tables);

            setSelectedUsers('usr_1', { userId: 'usr_1', name: 'Alice' });
            setSelectedUsers('usr_2', { userId: 'usr_2', name: 'Bob' });

            expect(selectedUsersArray.value).toHaveLength(2);
        });
    });

    describe('deselectedUsers', () => {
        test('removes a specific user', () => {
            const tables = createTables();
            const {
                selectedUsers,
                selectedUsersArray,
                setSelectedUsers,
                deselectedUsers
            } = useGroupModerationSelection(tables);

            setSelectedUsers('usr_1', { userId: 'usr_1', name: 'Alice' });
            setSelectedUsers('usr_2', { userId: 'usr_2', name: 'Bob' });
            deselectedUsers('usr_1');

            expect(selectedUsers['usr_1']).toBeUndefined();
            expect(selectedUsersArray.value).toHaveLength(1);
            expect(selectedUsersArray.value[0].name).toBe('Bob');
        });

        test('removes all users when isAll=true', () => {
            const tables = createTables();
            const { selectedUsersArray, setSelectedUsers, deselectedUsers } =
                useGroupModerationSelection(tables);

            setSelectedUsers('usr_1', { userId: 'usr_1', name: 'Alice' });
            setSelectedUsers('usr_2', { userId: 'usr_2', name: 'Bob' });
            deselectedUsers(null, true);

            expect(selectedUsersArray.value).toHaveLength(0);
        });
    });

    describe('onSelectionChange', () => {
        test('selects user when row.$selected is true', () => {
            const tables = createTables();
            const { selectedUsersArray, onSelectionChange } =
                useGroupModerationSelection(tables);

            onSelectionChange({
                userId: 'usr_1',
                name: 'Alice',
                $selected: true
            });

            expect(selectedUsersArray.value).toHaveLength(1);
        });

        test('deselects user when row.$selected is false', () => {
            const tables = createTables();
            const { selectedUsersArray, setSelectedUsers, onSelectionChange } =
                useGroupModerationSelection(tables);

            setSelectedUsers('usr_1', { userId: 'usr_1', name: 'Alice' });
            onSelectionChange({ userId: 'usr_1', $selected: false });

            expect(selectedUsersArray.value).toHaveLength(0);
        });
    });

    describe('deselectInTables', () => {
        test('deselects specific user in table data', () => {
            const tables = createTables();
            tables.members.data = [
                { userId: 'usr_1', $selected: true },
                { userId: 'usr_2', $selected: true }
            ];
            const { deselectInTables } = useGroupModerationSelection(tables);

            deselectInTables('usr_1');

            expect(tables.members.data[0].$selected).toBe(false);
            expect(tables.members.data[1].$selected).toBe(true);
        });

        test('deselects all users when no userId', () => {
            const tables = createTables();
            tables.members.data = [
                { userId: 'usr_1', $selected: true },
                { userId: 'usr_2', $selected: true }
            ];
            tables.bans.data = [{ userId: 'usr_3', $selected: true }];
            const { deselectInTables } = useGroupModerationSelection(tables);

            deselectInTables();

            expect(tables.members.data[0].$selected).toBe(false);
            expect(tables.members.data[1].$selected).toBe(false);
            expect(tables.bans.data[0].$selected).toBe(false);
        });

        test('handles null table gracefully', () => {
            const tables = createTables();
            tables.members = null;
            const { deselectInTables } = useGroupModerationSelection(tables);

            expect(() => deselectInTables('usr_1')).not.toThrow();
        });
    });

    describe('deleteSelectedUser', () => {
        test('removes user from selection and tables', () => {
            const tables = createTables();
            tables.members.data = [{ userId: 'usr_1', $selected: true }];
            const { selectedUsersArray, setSelectedUsers, deleteSelectedUser } =
                useGroupModerationSelection(tables);

            setSelectedUsers('usr_1', { userId: 'usr_1', name: 'Alice' });
            deleteSelectedUser({ userId: 'usr_1' });

            expect(selectedUsersArray.value).toHaveLength(0);
            expect(tables.members.data[0].$selected).toBe(false);
        });
    });

    describe('clearAllSelected', () => {
        test('clears all selections and table states', () => {
            const tables = createTables();
            tables.members.data = [
                { userId: 'usr_1', $selected: true },
                { userId: 'usr_2', $selected: true }
            ];
            tables.bans.data = [{ userId: 'usr_3', $selected: true }];
            const { selectedUsersArray, setSelectedUsers, clearAllSelected } =
                useGroupModerationSelection(tables);

            setSelectedUsers('usr_1', { userId: 'usr_1' });
            setSelectedUsers('usr_2', { userId: 'usr_2' });
            setSelectedUsers('usr_3', { userId: 'usr_3' });

            clearAllSelected();

            expect(selectedUsersArray.value).toHaveLength(0);
            expect(tables.members.data.every((r) => !r.$selected)).toBe(true);
            expect(tables.bans.data.every((r) => !r.$selected)).toBe(true);
        });
    });

    describe('selectAll', () => {
        test('selects all rows in a table', () => {
            const tables = createTables();
            const tableData = [
                { userId: 'usr_1', $selected: false },
                { userId: 'usr_2', $selected: false }
            ];
            const { selectedUsersArray, selectAll } =
                useGroupModerationSelection(tables);

            selectAll(tableData);

            expect(tableData.every((r) => r.$selected)).toBe(true);
            expect(selectedUsersArray.value).toHaveLength(2);
        });
    });
});
