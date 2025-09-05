const groupDialogSortingOptions = {
    joinedAtDesc: {
        name: 'dialog.group.members.sorting.joined_at_desc',
        value: 'joinedAt:desc'
    },
    joinedAtAsc: {
        name: 'dialog.group.members.sorting.joined_at_asc',
        value: 'joinedAt:asc'
    }
};

const groupDialogFilterOptions = {
    everyone: {
        name: 'dialog.group.members.filters.everyone',
        id: null
    },
    usersWithNoRole: {
        name: 'dialog.group.members.filters.users_with_no_role',
        id: ''
    }
};
export { groupDialogSortingOptions, groupDialogFilterOptions };
