const groupDialogSortingOptions = [
    {
        name: 'dialog.group.members.sorting.joined_at_desc',
        value: 'joinedAt:desc'
    },
    {
        name: 'dialog.group.members.sorting.joined_at_asc',
        value: 'joinedAt:asc'
    }
];

const FILTER_EVERYONE = {
    name: 'dialog.group.members.filters.everyone',
    id: null
};

const FILTER_NO_ROLE = {
    name: 'dialog.group.members.filters.users_with_no_role',
    id: ''
};

const groupDialogFilterOptions = [FILTER_EVERYONE, FILTER_NO_ROLE];

export {
    groupDialogSortingOptions,
    groupDialogFilterOptions,
    FILTER_EVERYONE,
    FILTER_NO_ROLE
};
