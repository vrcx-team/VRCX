import { ref } from 'vue';
import { toast } from 'vue-sonner';

import { debounce } from '../../../shared/utils';
import { queryRequest } from '../../../api';

import * as workerTimers from 'worker-timers';

/**
 * Composable for group moderation data fetching, member management,
 * searching, sorting and filtering.
 * @param {object} deps
 * @param {import('vue').Ref} deps.groupMemberModeration - store ref
 * @param {import('vue').Ref} deps.currentUser - store ref
 * @param {Function} deps.applyGroupMember - store action
 * @param {Function} deps.handleGroupMember - store action
 * @param {object} deps.tables - reactive table data objects
 * @param {object} deps.tables.members
 * @param {object} deps.tables.bans
 * @param {object} deps.tables.invites
 * @param {object} deps.tables.joinRequests
 * @param {object} deps.tables.blocked
 * @param {object} deps.tables.logs
 * @param {object} deps.selection - from useGroupModerationSelection
 * @param {object} deps.selection.selectedUsers
 * @param {Function} deps.selection.setSelectedUsers
 * @param {object} deps.groupRequest - API module
 */
export function useGroupModerationData(deps) {
    const {
        groupMemberModeration,
        currentUser,
        applyGroupMember,
        handleGroupMember,
        tables,
        selection,
        groupRequest
    } = deps;

    const isGroupMembersLoading = ref(false);
    const isGroupMembersDone = ref(false);
    const memberFilter = ref({
        id: null,
        name: 'dialog.group.members.filters.everyone'
    });
    const memberSortOrder = ref({
        id: '',
        name: 'dialog.group.members.sorting.joined_at_desc',
        value: 'joinedAt:desc'
    });
    const memberSearch = ref('');
    const members = ref([]);
    const loadMoreGroupMembersParams = ref({
        n: 100,
        offset: 0,
        groupId: '',
        sort: 'joinedAt:desc',
        roleId: ''
    });

    // ── Members ──────────────────────────────────────────────────

    /**
     *
     */
    async function getGroupMembers() {
        members.value = [];
        isGroupMembersDone.value = false;
        loadMoreGroupMembersParams.value = {
            sort: 'joinedAt:desc',
            roleId: '',
            n: 100,
            offset: 0,
            groupId: groupMemberModeration.value.id
        };
        if (memberSortOrder.value.value) {
            loadMoreGroupMembersParams.value.sort = memberSortOrder.value.value;
        }
        if (memberFilter.value.id !== null) {
            loadMoreGroupMembersParams.value.roleId = memberFilter.value.id;
        }
        await groupRequest
            .getGroupMember({
                groupId: groupMemberModeration.value.id,
                userId: currentUser.value.id
            })
            .then((args) => {
                args.ref = applyGroupMember(args.json);
                if (args.json) {
                    args.json.user = currentUser.value;
                    if (memberFilter.value.id === null) {
                        members.value.push(args.json);
                    }
                }
                return args;
            });
        await loadMoreGroupMembers();
    }

    /**
     *
     */
    async function loadMoreGroupMembers() {
        if (isGroupMembersDone.value || isGroupMembersLoading.value) {
            return;
        }
        const params = loadMoreGroupMembersParams.value;
        if (params.roleId === '') {
            delete params.roleId;
        }
        memberSearch.value = '';
        isGroupMembersLoading.value = true;
        await groupRequest
            .getGroupMembers(params)
            .finally(() => {
                isGroupMembersLoading.value = false;
            })
            .then((args) => {
                for (const json of args.json) {
                    handleGroupMember({
                        json,
                        params: { groupId: args.params.groupId }
                    });
                }
                for (let i = 0; i < args.json.length; i++) {
                    const member = args.json[i];
                    if (member.userId === currentUser.value.id) {
                        if (
                            members.value.length > 0 &&
                            members.value[0].userId === currentUser.value.id
                        ) {
                            members.value.splice(0, 1);
                        }
                        break;
                    }
                }
                if (args.json.length < params.n) {
                    isGroupMembersDone.value = true;
                }
                members.value = [...members.value, ...args.json];
                tables.members.data = members.value.map((member) => ({
                    ...member,
                    $selected: Boolean(selection.selectedUsers[member.userId])
                }));
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
        await getGroupMembers();
        while (
            groupMemberModeration.value.visible &&
            !isGroupMembersDone.value
        ) {
            isGroupMembersLoading.value = true;
            await new Promise((resolve) => {
                workerTimers.setTimeout(resolve, 1000);
            });
            isGroupMembersLoading.value = false;
            await loadMoreGroupMembers();
        }
    }

    /**
     *
     * @param sortOrder
     */
    async function setGroupMemberSortOrder(sortOrder) {
        if (memberSortOrder.value === sortOrder) {
            return;
        }
        memberSortOrder.value = sortOrder;
        await getGroupMembers();
    }

    /**
     *
     * @param filter
     */
    async function setGroupMemberFilter(filter) {
        if (memberFilter.value === filter) {
            return;
        }
        memberFilter.value = filter;
        await getGroupMembers();
    }

    /**
     *
     */
    function groupMembersSearch() {
        if (memberSearch.value.length < 3) {
            tables.members.data = [];
            isGroupMembersLoading.value = false;
            return;
        }
        isGroupMembersLoading.value = true;
        debounce(groupMembersSearchDebounced, 200)();
    }

    /**
     *
     */
    function groupMembersSearchDebounced() {
        const groupId = groupMemberModeration.value.id;
        const search = memberSearch.value;
        tables.members.data = [];
        if (memberSearch.value.length < 3) {
            return;
        }
        isGroupMembersLoading.value = true;
        groupRequest
            .getGroupMembersSearch({
                groupId,
                query: search,
                n: 100,
                offset: 0
            })
            .then((args) => {
                for (const json of args.json.results) {
                    handleGroupMember({
                        json,
                        params: { groupId: args.params.groupId }
                    });
                }
                if (groupId === args.params.groupId) {
                    tables.members.data = args.json.results.map((member) => ({
                        ...member,
                        $selected: Boolean(
                            selection.selectedUsers[member.userId]
                        )
                    }));
                }
            })
            .finally(() => {
                isGroupMembersLoading.value = false;
            });
    }

    // ── Bans ─────────────────────────────────────────────────────

    /**
     *
     * @param groupId
     */
    async function getAllGroupBans(groupId) {
        tables.bans.data = [];
        const params = { groupId, n: 100, offset: 0 };
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        const fetchedBans = [];
        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupBans(params);
                if (args && args.json) {
                    if (
                        groupMemberModeration.value.id !== args.params.groupId
                    ) {
                        continue;
                    }
                    args.json.forEach((json) => {
                        const ref = applyGroupMember(json);
                        fetchedBans.push(ref);
                    });
                    if (args.json.length < params.n) {
                        break;
                    }
                    params.offset += params.n;
                } else {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            tables.bans.data = fetchedBans;
        } catch {
            toast.error('Failed to get group bans');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    // ── Invites / Join Requests / Blocked ────────────────────────

    /**
     *
     * @param groupId
     */
    async function getAllGroupInvites(groupId) {
        tables.invites.data = [];
        const params = { groupId, n: 100, offset: 0 };
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        let newData = [];
        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupInvites(params);
                if (args) {
                    if (
                        groupMemberModeration.value.id !== args.params.groupId
                    ) {
                        return;
                    }
                    for (const json of args.json) {
                        const ref = applyGroupMember(json);
                        newData.push(ref);
                    }
                }
                params.offset += params.n;
                if (args.json.length < params.n) {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            tables.invites.data = newData;
        } catch {
            toast.error('Failed to get group invites');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    /**
     *
     * @param groupId
     */
    async function getAllGroupJoinRequests(groupId) {
        tables.joinRequests.data = [];
        const params = { groupId, n: 100, offset: 0, blocked: false };
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        let newData = [];
        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupJoinRequests(params);
                if (groupMemberModeration.value.id !== args.params.groupId) {
                    return;
                }
                for (const json of args.json) {
                    const ref = applyGroupMember(json);
                    newData.push(ref);
                }
                params.offset += params.n;
                if (args.json.length < params.n) {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            tables.joinRequests.data = newData;
        } catch {
            toast.error('Failed to get group join requests');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    /**
     *
     * @param groupId
     */
    async function getAllGroupBlockedRequests(groupId) {
        tables.blocked.data = [];
        const params = { groupId, n: 100, offset: 0, blocked: true };
        const count = 50; // 5000
        isGroupMembersLoading.value = true;
        let newData = [];
        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupJoinRequests(params);
                if (groupMemberModeration.value.id !== args.params.groupId) {
                    return;
                }
                for (const json of args.json) {
                    const ref = applyGroupMember(json);
                    newData.push(ref);
                }
                params.offset += params.n;
                if (args.json.length < params.n) {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            tables.blocked.data = newData;
        } catch {
            toast.error('Failed to get group join requests');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    /**
     *
     * @param groupId
     */
    async function getAllGroupInvitesAndJoinRequests(groupId) {
        try {
            await Promise.all([
                getAllGroupInvites(groupId),
                getAllGroupJoinRequests(groupId),
                getAllGroupBlockedRequests(groupId)
            ]);
        } catch (error) {
            console.error('Error fetching group invites/requests:', error);
        }
    }

    // ── Logs ─────────────────────────────────────────────────────

    /**
     *
     * @param groupId
     * @param eventTypes
     */
    async function getAllGroupLogs(groupId, eventTypes = []) {
        tables.logs.data = [];
        const params = { groupId, n: 100, offset: 0 };
        if (eventTypes.length) {
            params.eventTypes = eventTypes;
        }
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        let newData = [];
        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupLogs(params);
                if (args) {
                    if (
                        groupMemberModeration.value.id !== args.params.groupId
                    ) {
                        continue;
                    }
                    for (const json of args.json.results) {
                        const existsInData = newData.some(
                            (dataItem) => dataItem.id === json.id
                        );
                        if (!existsInData) {
                            newData.push(json);
                        }
                    }
                }
                params.offset += params.n;
                if (!args.json.hasNext) {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            tables.logs.data = newData;
        } catch {
            toast.error('Failed to get group logs');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    // ── User Selection ───────────────────────────────────────────

    /**
     *
     * @param userId
     */
    async function addGroupMemberToSelection(userId) {
        const D = groupMemberModeration.value;
        let member = {};
        const memberArgs = await groupRequest.getGroupMember({
            groupId: D.id,
            userId
        });
        if (memberArgs && memberArgs.json) {
            member = applyGroupMember(memberArgs.json);
        }
        if (member && member.user) {
            selection.setSelectedUsers(member.userId, member);
            return;
        }
        const userArgs = await queryRequest.fetch('user.dialog', { userId });
        member.userId = userArgs.json.id;
        member.user = userArgs.json;
        member.displayName = userArgs.json.displayName;
        selection.setSelectedUsers(member.userId, member);
    }

    /**
     *
     * @param userIdInput
     */
    async function selectGroupMemberUserId(userIdInput) {
        if (!userIdInput) return;
        const regexUserId =
            /usr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
        let match;
        const userIdList = new Set();
        while ((match = regexUserId.exec(userIdInput)) !== null) {
            userIdList.add(match[0]);
        }
        if (userIdList.size === 0) {
            userIdList.add(userIdInput);
        }
        const promises = [];
        userIdList.forEach((userId) => {
            promises.push(addGroupMemberToSelection(userId));
        });
        await Promise.allSettled(promises);
    }

    // ── Reset ────────────────────────────────────────────────────

    /**
     *
     */
    function resetData() {
        tables.members.data = [];
        tables.bans.data = [];
        tables.invites.data = [];
        tables.joinRequests.data = [];
        tables.blocked.data = [];
        tables.logs.data = [];
        memberSearch.value = '';
        members.value = [];
        isGroupMembersDone.value = false;
    }

    return {
        isGroupMembersLoading,
        isGroupMembersDone,
        memberFilter,
        memberSortOrder,
        memberSearch,
        members,
        loadAllGroupMembers,
        getGroupMembers,
        setGroupMemberSortOrder,
        setGroupMemberFilter,
        groupMembersSearch,
        selectGroupMemberUserId,
        addGroupMemberToSelection,
        getAllGroupBans,
        getAllGroupLogs,
        getAllGroupInvites,
        getAllGroupJoinRequests,
        getAllGroupBlockedRequests,
        getAllGroupInvitesAndJoinRequests,
        resetData
    };
}
