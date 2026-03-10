import { computed, ref } from 'vue';

import {
    groupDialogFilterOptions,
    groupDialogSortingOptions,
    FILTER_EVERYONE,
    FILTER_NO_ROLE
} from '../../../shared/constants';
import { groupRequest, queryRequest } from '../../../api';
import { debounce } from '../../../shared/utils';

import * as workerTimers from 'worker-timers';

/**
 * Composable for managing group member loading, searching, sorting, and filtering.
 * @param {import('vue').Ref} groupDialog - reactive ref to the group dialog state
 * @param {object} deps - external dependencies
 * @param {import('vue').Ref} deps.currentUser - reactive ref to the current user
 * @param {Function} deps.applyGroupMember - function to apply group member data
 * @param {Function} deps.handleGroupMember - function to handle group member updates
 * @param {Function} deps.t - i18n translation function
 * @returns {object} members composable API
 */
export function useGroupMembers(
    groupDialog,
    { currentUser, applyGroupMember, handleGroupMember, t }
) {
    const isGroupMembersDone = ref(false);
    const isGroupMembersLoading = ref(false);

    let loadMoreGroupMembersParams = ref({
        n: 100,
        offset: 0,
        groupId: '',
        sort: '',
        roleId: ''
    });

    const groupDialogMemberSortValue = computed({
        get() {
            return groupDialog.value?.memberSortOrder?.value ?? '';
        },
        set(value) {
            const option = groupDialogSortingOptions.find(
                (item) => item.value === value
            );
            if (option) {
                setGroupMemberSortOrder(option);
            }
        }
    });

    const groupDialogMemberFilterKey = computed({
        get() {
            const filter = groupDialog.value?.memberFilter;
            if (!filter) return null;

            if (filter.id === null) return 'everyone';
            if (filter.id === '') return 'usersWithNoRole';
            return `role:${filter.id}`;
        },
        set(key) {
            if (!key) return;

            if (key === 'everyone') {
                setGroupMemberFilter(FILTER_EVERYONE);
                return;
            }
            if (key === 'usersWithNoRole') {
                setGroupMemberFilter(FILTER_NO_ROLE);
                return;
            }

            if (key.startsWith('role:')) {
                const roleId = key.slice('role:'.length);
                const role = groupDialog.value?.ref?.roles?.find(
                    (r) => r.id === roleId
                );
                if (role) {
                    setGroupMemberFilter(role);
                }
            }
        }
    });

    const groupDialogMemberFilterGroups = computed(() => {
        const filterItems = groupDialogFilterOptions.map((item) => ({
            value:
                item.id === null
                    ? 'everyone'
                    : item.id === ''
                      ? 'usersWithNoRole'
                      : `role:${item.id}`,
            label: t(item.name),
            search: t(item.name)
        }));

        const roleItems = (groupDialog.value?.ref?.roles ?? [])
            .filter((role) => !role.defaultRole)
            .map((role) => ({
                value: `role:${role.id}`,
                label: role.name,
                search: role.name
            }));

        return [
            {
                key: 'filters',
                label: t('dialog.group.members.filter'),
                items: filterItems
            },
            {
                key: 'roles',
                label: 'Roles',
                items: roleItems
            }
        ].filter((group) => group.items.length);
    });

    /**
     *
     */
    function groupMembersSearch() {
        if (groupDialog.value.memberSearch.length < 3) {
            groupDialog.value.memberSearchResults = [];
            isGroupMembersLoading.value = false;
            return;
        }
        debounce(groupMembersSearchDebounced, 200)();
    }

    /**
     *
     */
    function groupMembersSearchDebounced() {
        const D = groupDialog.value;
        const search = D.memberSearch;
        D.memberSearchResults = [];
        if (!search || search.length < 3) {
            return;
        }
        isGroupMembersLoading.value = true;
        groupRequest
            .getGroupMembersSearch({
                groupId: D.id,
                query: search,
                n: 100,
                offset: 0
            })
            .then((args) => {
                for (const json of args.json.results) {
                    handleGroupMember({
                        json,
                        params: {
                            groupId: args.params.groupId
                        }
                    });
                }
                if (D.id === args.params.groupId) {
                    D.memberSearchResults = args.json.results;
                }
            })
            .finally(() => {
                isGroupMembersLoading.value = false;
            });
    }

    /**
     *
     */
    async function getGroupDialogGroupMembers() {
        const D = groupDialog.value;
        D.members = [];
        isGroupMembersDone.value = false;
        loadMoreGroupMembersParams.value = {
            sort: 'joinedAt:desc',
            roleId: '',
            n: 100,
            offset: 0,
            groupId: D.id
        };
        if (D.memberSortOrder.value) {
            loadMoreGroupMembersParams.value.sort = D.memberSortOrder.value;
        }
        if (D.memberFilter.id !== null) {
            loadMoreGroupMembersParams.value.roleId = D.memberFilter.id;
        }
        if (D.inGroup) {
            await queryRequest
                .fetch('groupMember', {
                    groupId: D.id,
                    userId: currentUser.value.id
                })
                .then((args) => {
                    args.ref = applyGroupMember(args.json);
                    if (args.json) {
                        args.json.user = currentUser.value;
                        if (D.memberFilter.id === null) {
                            // when flitered by role don't include self
                            D.members.push(args.json);
                        }
                    }
                    return args;
                });
        }
        await loadMoreGroupMembers();
    }

    /**
     *
     */
    async function loadMoreGroupMembers() {
        if (isGroupMembersDone.value || isGroupMembersLoading.value) {
            return;
        }
        const D = groupDialog.value;
        const params = loadMoreGroupMembersParams.value;
        if (params.roleId === '') {
            delete params.roleId;
        }
        D.memberSearch = '';
        isGroupMembersLoading.value = true;
        await queryRequest
            .fetch('groupMembers', params)
            .finally(() => {
                isGroupMembersLoading.value = false;
            })
            .then((args) => {
                for (const json of args.json) {
                    handleGroupMember({
                        json,
                        params: {
                            groupId: args.params.groupId
                        }
                    });
                }
                for (let i = 0; i < args.json.length; i++) {
                    const member = args.json[i];
                    if (member.userId === currentUser.value.id) {
                        if (
                            D.members.length > 0 &&
                            D.members[0].userId === currentUser.value.id
                        ) {
                            // remove duplicate and keep sort order
                            D.members.splice(0, 1);
                        }
                        break;
                    }
                }
                if (args.json.length < params.n) {
                    isGroupMembersDone.value = true;
                }
                D.members = [...D.members, ...args.json];
                params.offset += params.n;
                return args;
            })
            .catch((err) => {
                isGroupMembersDone.value = true;
                throw err;
            });
    }

    /**
     *
     */
    async function loadAllGroupMembers() {
        if (isGroupMembersLoading.value) {
            return;
        }
        await getGroupDialogGroupMembers();
        while (groupDialog.value.visible && !isGroupMembersDone.value) {
            isGroupMembersLoading.value = true;
            await new Promise((resolve) => {
                workerTimers.setTimeout(resolve, 1000);
            });
            isGroupMembersLoading.value = false;
            await loadMoreGroupMembers();
        }
    }

    /**
     * @param {object} sortOrder
     */
    async function setGroupMemberSortOrder(sortOrder) {
        const D = groupDialog.value;
        if (D.memberSortOrder?.value === sortOrder?.value) {
            return;
        }
        D.memberSortOrder = sortOrder;
        await getGroupDialogGroupMembers();
    }

    /**
     * @param {object} filter
     */
    async function setGroupMemberFilter(filter) {
        const D = groupDialog.value;
        if (D.memberFilter === filter) {
            return;
        }
        D.memberFilter = filter;
        await getGroupDialogGroupMembers();
    }

    return {
        isGroupMembersDone,
        isGroupMembersLoading,
        loadMoreGroupMembersParams,
        groupDialogMemberSortValue,
        groupDialogMemberFilterKey,
        groupDialogMemberFilterGroups,
        groupMembersSearch,
        getGroupDialogGroupMembers,
        loadMoreGroupMembers,
        loadAllGroupMembers,
        setGroupMemberSortOrder,
        setGroupMemberFilter
    };
}
