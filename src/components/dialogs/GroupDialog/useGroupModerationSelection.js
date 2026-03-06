import { reactive, ref } from 'vue';

/**
 * Composable for managing selected users across all moderation tables.
 * @param {object} tables - reactive table objects with `.data` arrays
 * @param {object} tables.members
 * @param {object} tables.bans
 * @param {object} tables.invites
 * @param {object} tables.joinRequests
 * @param {object} tables.blocked
 */
export function useGroupModerationSelection(tables) {
    const selectedUsers = reactive({});
    const selectedUsersArray = ref([]);

    /**
     * @param {string} userId
     * @param {object} user
     */
    function setSelectedUsers(userId, user) {
        if (!user) return;
        selectedUsers[userId] = user;
        selectedUsersArray.value = Object.values(selectedUsers);
    }

    /**
     * @param {string|null} userId
     * @param {boolean} isAll
     */
    function deselectedUsers(userId, isAll = false) {
        if (isAll) {
            for (const id in selectedUsers) {
                if (Object.prototype.hasOwnProperty.call(selectedUsers, id)) {
                    delete selectedUsers[id];
                }
            }
        } else {
            if (Object.prototype.hasOwnProperty.call(selectedUsers, userId)) {
                delete selectedUsers[userId];
            }
        }
        selectedUsersArray.value = Object.values(selectedUsers);
    }

    /**
     * @param {object} row
     */
    function onSelectionChange(row) {
        if (row.$selected && !selectedUsers[row.userId]) {
            setSelectedUsers(row.userId, row);
        } else if (!row.$selected && selectedUsers[row.userId]) {
            deselectedUsers(row.userId);
        }
    }

    /**
     * Deselect a user across all tables.
     * @param {string} [userId] - if omitted, deselects all rows in all tables
     */
    function deselectInTables(userId) {
        const allTables = [
            tables.members,
            tables.bans,
            tables.invites,
            tables.joinRequests,
            tables.blocked
        ];
        for (const table of allTables) {
            if (!table?.data) continue;
            if (userId) {
                const row = table.data.find((item) => item.userId === userId);
                if (row) {
                    row.$selected = false;
                }
            } else {
                table.data.forEach((row) => {
                    if (row.$selected) {
                        row.$selected = false;
                    }
                });
            }
        }
    }

    /**
     * @param {object} user
     */
    function deleteSelectedUser(user) {
        deselectedUsers(user.userId);
        deselectInTables(user.userId);
    }

    /**
     *
     */
    function clearAllSelected() {
        deselectedUsers(null, true);
        deselectInTables();
    }

    /**
     * Select all rows in a given table data array.
     * @param {Array} tableData
     */
    function selectAll(tableData) {
        tableData.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    return {
        selectedUsers,
        selectedUsersArray,
        setSelectedUsers,
        deselectedUsers,
        onSelectionChange,
        deselectInTables,
        deleteSelectedUser,
        clearAllSelected,
        selectAll
    };
}
