export function useGroupModerationSelection(groupMemberModeration) {
    /**
     * @param {string} userId
     * @param {object} user
     */
    function setSelectedUsers(userId, user) {
        if (!user) return;
        groupMemberModeration.selectedUsers[userId] = user;
        groupMemberModeration.selectedUsersArray = Object.values(
            groupMemberModeration.selectedUsers
        );
    }

    /**
     * @param {string|null} userId
     * @param {boolean} isAll
     */
    function deselectedUsers(userId, isAll = false) {
        if (isAll) {
            for (const id in groupMemberModeration.selectedUsers) {
                if (
                    Object.prototype.hasOwnProperty.call(
                        groupMemberModeration.selectedUsers,
                        id
                    )
                ) {
                    delete groupMemberModeration.selectedUsers[id];
                }
            }
        } else {
            if (
                Object.prototype.hasOwnProperty.call(
                    groupMemberModeration.selectedUsers,
                    userId
                )
            ) {
                delete groupMemberModeration.selectedUsers[userId];
            }
        }
        groupMemberModeration.selectedUsersArray = Object.values(
            groupMemberModeration.selectedUsers
        );
    }

    /**
     * @param {object} row
     */
    function onSelectionChange(row) {
        if (row.$selected && !groupMemberModeration.selectedUsers[row.userId]) {
            setSelectedUsers(row.userId, row);
        } else if (
            !row.$selected &&
            groupMemberModeration.selectedUsers[row.userId]
        ) {
            deselectedUsers(row.userId);
        }
    }

    /**
     * Deselect a user across all tables.
     * @param {string} [userId] - if omitted, deselects all rows in all tables
     */
    function deselectInTables(userId) {
        const allTables = [
            groupMemberModeration.tables.members,
            groupMemberModeration.tables.bans,
            groupMemberModeration.tables.invites,
            groupMemberModeration.tables.joinRequests,
            groupMemberModeration.tables.blocked
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
        setSelectedUsers,
        deselectedUsers,
        onSelectionChange,
        deselectInTables,
        deleteSelectedUser,
        clearAllSelected,
        selectAll
    };
}
