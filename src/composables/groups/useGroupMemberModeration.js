import { reactive, ref } from 'vue';
import configRepository from '../../repository/config';

function useModerationTable() {
    const groupInvitesModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 25, 50, 100]
        }
    });
    const groupJoinRequestsModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 25, 50, 100]
        }
    });
    const groupBlockedModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 25, 50, 100]
        }
    });
    const groupLogsModerationTable = reactive({
        data: [],
        filters: [{ prop: ['description'], value: '' }],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 25, 50, 100]
        }
    });
    const groupBansModerationTable = reactive({
        data: [],
        filters: [{ prop: ['$displayName'], value: '' }],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 25, 50, 100]
        }
    });
    const groupMemberModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 25, 50, 100]
        }
    });

    async function initializePageSize() {
        try {
            const tablePageSize = await configRepository.getInt(
                'VRCX_tablePageSize',
                15
            );
            groupMemberModerationTable.pageSize = tablePageSize;
            groupBansModerationTable.pageSize = tablePageSize;
            groupLogsModerationTable.pageSize = tablePageSize;
            groupInvitesModerationTable.pageSize = tablePageSize;
            groupJoinRequestsModerationTable.pageSize = tablePageSize;
            groupBlockedModerationTable.pageSize = tablePageSize;
        } catch (error) {
            console.error('Failed to initialize table page size:', error);
        }
    }

    function deselectGroupMember(userId) {
        const deselectInTable = (tableData) => {
            if (userId) {
                const row = tableData.find((item) => item.userId === userId);
                if (row) {
                    row.$selected = false;
                }
            } else {
                tableData.forEach((row) => {
                    if (row.$selected) {
                        row.$selected = false;
                    }
                });
            }
        };

        deselectInTable(groupMemberModerationTable.data);
        deselectInTable(groupBansModerationTable.data);
        deselectInTable(groupInvitesModerationTable.data);
        deselectInTable(groupJoinRequestsModerationTable.data);
        deselectInTable(groupBlockedModerationTable.data);
    }

    return {
        groupInvitesModerationTable,
        groupJoinRequestsModerationTable,
        groupBlockedModerationTable,
        groupLogsModerationTable,
        groupBansModerationTable,
        groupMemberModerationTable,
        initializePageSize,
        deselectGroupMember
    };
}

function useSelectedUsers() {
    const selectedUsers = reactive({});
    // computed not working here hmm
    const selectedUsersArray = ref([]);

    function groupMemberModerationTableSelectionChange(row) {
        if (row.$selected && !selectedUsers[row.userId]) {
            setSelectedUsers(row.userId, row);
        } else if (!row.$selected && selectedUsers[row.userId]) {
            deselectedUsers(row.userId);
        }
    }

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

    function setSelectedUsers(usersId, user) {
        if (!user) {
            return;
        }
        selectedUsers[usersId] = user;
        selectedUsersArray.value = Object.values(selectedUsers);
    }
    return {
        selectedUsers,
        selectedUsersArray,
        groupMemberModerationTableSelectionChange,
        deselectedUsers,
        setSelectedUsers
    };
}

export { useModerationTable, useSelectedUsers };
