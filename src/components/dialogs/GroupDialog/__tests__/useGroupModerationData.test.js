import { reactive, ref } from 'vue';
import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    ,
            locale: require('vue').ref('en')
        }),
    createI18n: () => ({
        global: { t: (key) => key , locale: require('vue').ref('en') },
        install: vi.fn()
    })
}));
vi.mock('../../../../plugins/router', () => {
    const { ref: vRef } = require('vue');
    return {
        router: {
            beforeEach: vi.fn(),
            push: vi.fn(),
            replace: vi.fn(),
            currentRoute: vRef({ path: '/', name: '', meta: {} }),
            isReady: vi.fn().mockResolvedValue(true)
        },
        initRouter: vi.fn()
    };
});
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    const { ref: vRef } = require('vue');
    return {
        ...actual,
        useRouter: vi.fn(() => ({
            push: vi.fn(),
            replace: vi.fn(),
            currentRoute: vRef({ path: '/', name: '', meta: {} })
        }))
    };
});
vi.mock('../../../../plugins/interopApi', () => ({ initInteropApi: vi.fn() }));
vi.mock('../../../../services/database', () => ({
    database: new Proxy(
        {},
        {
            get: (_target, prop) => {
                if (prop === '__esModule') return false;
                return vi.fn().mockResolvedValue(null);
            }
        }
    )
}));
vi.mock('../../../../services/config', () => ({
    default: {
        init: vi.fn(),
        getString: vi.fn().mockImplementation((_k, d) => d ?? '{}'),
        setString: vi.fn(),
        getBool: vi.fn().mockImplementation((_k, d) => d ?? false),
        setBool: vi.fn(),
        getInt: vi.fn().mockImplementation((_k, d) => d ?? 0),
        setInt: vi.fn(),
        getFloat: vi.fn().mockImplementation((_k, d) => d ?? 0),
        setFloat: vi.fn(),
        getObject: vi.fn().mockReturnValue(null),
        setObject: vi.fn(),
        getArray: vi.fn().mockReturnValue([]),
        setArray: vi.fn(),
        remove: vi.fn()
    }
}));
vi.mock('../../../../services/jsonStorage', () => ({ default: vi.fn() }));
vi.mock('../../../../services/watchState', () => ({
    watchState: { isLoggedIn: false }
}));
vi.mock('../../../../services/request', () => ({
    request: vi.fn().mockResolvedValue({ json: {} }),
    processBulk: vi.fn(),
    buildRequestInit: vi.fn(),
    parseResponse: vi.fn(),
    shouldIgnoreError: vi.fn(),
    $throw: vi.fn(),
    failedGetRequests: new Map()
}));
vi.mock('../../../../api', () => ({
    groupRequest: {},
    userRequest: {},
    queryRequest: {
        fetch: vi.fn()
    }
}));

import { useGroupModerationData } from '../useGroupModerationData';
import { queryRequest } from '../../../../api';

function createTables() {
    return {
        members: reactive({ data: [], pageSize: 15 }),
        bans: reactive({ data: [], filters: [{ prop: ['$displayName'], value: '' }], pageSize: 15 }),
        invites: reactive({ data: [], pageSize: 15 }),
        joinRequests: reactive({ data: [], pageSize: 15 }),
        blocked: reactive({ data: [], pageSize: 15 }),
        logs: reactive({ data: [], filters: [{ prop: ['description'], value: '' }], pageSize: 15 })
    };
}

function createDeps(overrides = {}) {
    const tables = createTables();
    return {
        groupMemberModeration: ref({
            id: 'grp_test',
            visible: true,
            groupRef: { memberCount: 10, roles: [] }
        }),
        currentUser: ref({ id: 'usr_self' }),
        applyGroupMember: vi.fn((json) => json),
        handleGroupMember: vi.fn(),
        tables,
        selection: {
            selectedUsers: {},
            setSelectedUsers: vi.fn()
        },
        groupRequest: {
            getGroupBans: vi.fn(),
            getGroupLogs: vi.fn(),
            getGroupInvites: vi.fn(),
            getGroupJoinRequests: vi.fn(),
            getGroupMember: vi.fn(),
            getGroupMembers: vi.fn(),
            getGroupMembersSearch: vi.fn()
        },
        ...overrides
    };
}

describe('useGroupModerationData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryRequest.fetch.mockReset();
    });

    describe('getAllGroupBans', () => {
        test('populates bans table with fetched data', async () => {
            const deps = createDeps();
            const bans = [
                { userId: 'usr_1', user: { displayName: 'Alice' } },
                { userId: 'usr_2', user: { displayName: 'Bob' } }
            ];
            deps.groupRequest.getGroupBans.mockResolvedValue({
                json: bans,
                params: { groupId: 'grp_test' }
            });

            const { getAllGroupBans } = useGroupModerationData(deps);
            await getAllGroupBans('grp_test');

            expect(deps.tables.bans.data).toHaveLength(2);
            expect(deps.groupRequest.getGroupBans).toHaveBeenCalledWith({
                groupId: 'grp_test',
                n: 100,
                offset: 0
            });
        });

        test('paginates through multiple pages', async () => {
            const deps = createDeps();
            const page1 = Array.from({ length: 100 }, (_, i) => ({
                userId: `usr_${i}`,
                user: { displayName: `User${i}` }
            }));
            const page2 = [{ userId: 'usr_100', user: { displayName: 'User100' } }];

            deps.groupRequest.getGroupBans
                .mockResolvedValueOnce({ json: page1, params: { groupId: 'grp_test' } })
                .mockResolvedValueOnce({ json: page2, params: { groupId: 'grp_test' } });

            const { getAllGroupBans } = useGroupModerationData(deps);
            await getAllGroupBans('grp_test');

            expect(deps.tables.bans.data).toHaveLength(101);
            expect(deps.groupRequest.getGroupBans).toHaveBeenCalledTimes(2);
        });

        test('skips data from wrong group', async () => {
            const deps = createDeps();
            deps.groupRequest.getGroupBans.mockResolvedValue({
                json: [{ userId: 'usr_1' }],
                params: { groupId: 'grp_other' }
            });

            const { getAllGroupBans } = useGroupModerationData(deps);
            await getAllGroupBans('grp_test');

            // Should have continued past the mismatched group and eventually exhausted pages
            // The data won't contain the mismatched entry because it was skipped
            expect(deps.tables.bans.data).toHaveLength(0);
        });

        test('handles API error gracefully', async () => {
            const { toast } = await import('vue-sonner');
            const deps = createDeps();
            deps.groupRequest.getGroupBans.mockRejectedValue(new Error('Network error'));

            const { getAllGroupBans, isGroupMembersLoading } = useGroupModerationData(deps);
            await getAllGroupBans('grp_test');

            expect(toast.error).toHaveBeenCalledWith('Failed to get group bans');
            expect(isGroupMembersLoading.value).toBe(false);
        });

        test('stops when dialog is no longer visible', async () => {
            const deps = createDeps();
            const page1 = Array.from({ length: 100 }, (_, i) => ({
                userId: `usr_${i}`
            }));
            deps.groupRequest.getGroupBans
                .mockResolvedValueOnce({ json: page1, params: { groupId: 'grp_test' } })
                .mockImplementation(() => {
                    deps.groupMemberModeration.value.visible = false;
                    return Promise.resolve({ json: [{ userId: 'usr_extra' }], params: { groupId: 'grp_test' } });
                });

            const { getAllGroupBans } = useGroupModerationData(deps);
            await getAllGroupBans('grp_test');

            // Should stop after detecting visible=false
            expect(deps.groupRequest.getGroupBans).toHaveBeenCalledTimes(2);
        });
    });

    describe('getAllGroupLogs', () => {
        test('populates logs table and deduplicates', async () => {
            const deps = createDeps();
            const logs = [
                { id: 'log_1', description: 'event 1' },
                { id: 'log_2', description: 'event 2' },
                { id: 'log_1', description: 'event 1 dup' }
            ];
            deps.groupRequest.getGroupLogs.mockResolvedValue({
                json: { results: logs, hasNext: false },
                params: { groupId: 'grp_test' }
            });

            const { getAllGroupLogs } = useGroupModerationData(deps);
            await getAllGroupLogs('grp_test');

            expect(deps.tables.logs.data).toHaveLength(2);
        });

        test('passes eventTypes filter when provided', async () => {
            const deps = createDeps();
            deps.groupRequest.getGroupLogs.mockResolvedValue({
                json: { results: [], hasNext: false },
                params: { groupId: 'grp_test' }
            });

            const { getAllGroupLogs } = useGroupModerationData(deps);
            await getAllGroupLogs('grp_test', ['group.member.ban', 'group.member.kick']);

            expect(deps.groupRequest.getGroupLogs).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventTypes: ['group.member.ban', 'group.member.kick']
                })
            );
        });
    });

    describe('getAllGroupInvitesAndJoinRequests', () => {
        test('fetches invites, join requests, and blocked in parallel', async () => {
            const deps = createDeps();
            deps.groupRequest.getGroupInvites.mockResolvedValue({
                json: [{ userId: 'usr_inv' }],
                params: { groupId: 'grp_test' }
            });
            deps.groupRequest.getGroupJoinRequests
                .mockResolvedValueOnce({
                    json: [{ userId: 'usr_join' }],
                    params: { groupId: 'grp_test' }
                })
                .mockResolvedValueOnce({
                    json: [{ userId: 'usr_block' }],
                    params: { groupId: 'grp_test' }
                });

            const { getAllGroupInvitesAndJoinRequests } = useGroupModerationData(deps);
            await getAllGroupInvitesAndJoinRequests('grp_test');

            expect(deps.tables.invites.data).toHaveLength(1);
            expect(deps.tables.joinRequests.data).toHaveLength(1);
            expect(deps.tables.blocked.data).toHaveLength(1);
        });
    });

    describe('selectGroupMemberUserId', () => {
        test('parses multiple user IDs from input', async () => {
            const deps = createDeps();
            deps.groupRequest.getGroupMember.mockResolvedValue({
                json: { userId: 'usr_aaaa1111-2222-3333-4444-555566667777', user: { displayName: 'A' } },
                params: {}
            });

            const { selectGroupMemberUserId } = useGroupModerationData(deps);
            await selectGroupMemberUserId(
                'usr_aaaa1111-2222-3333-4444-555566667777 usr_bbbb1111-2222-3333-4444-555566667777'
            );

            expect(deps.groupRequest.getGroupMember).toHaveBeenCalledTimes(2);
        });

        test('falls back to raw input when no usr_ pattern found', async () => {
            const deps = createDeps();
            deps.groupRequest.getGroupMember.mockResolvedValue({
                json: { userId: 'some_input', user: { displayName: 'Test' } },
                params: {}
            });

            const { selectGroupMemberUserId } = useGroupModerationData(deps);
            await selectGroupMemberUserId('some_input');

            expect(deps.groupRequest.getGroupMember).toHaveBeenCalledWith({
                groupId: 'grp_test',
                userId: 'some_input'
            });
        });

        test('does nothing with empty input', async () => {
            const deps = createDeps();
            const { selectGroupMemberUserId } = useGroupModerationData(deps);
            await selectGroupMemberUserId('');

            expect(deps.groupRequest.getGroupMember).not.toHaveBeenCalled();
        });
    });

    describe('addGroupMemberToSelection', () => {
        test('uses group member data when available', async () => {
            const deps = createDeps();
            const member = { userId: 'usr_1', user: { displayName: 'Alice' } };
            deps.groupRequest.getGroupMember.mockResolvedValue({
                json: member,
                params: {}
            });
            deps.applyGroupMember.mockReturnValue(member);

            const { addGroupMemberToSelection } = useGroupModerationData(deps);
            await addGroupMemberToSelection('usr_1');

            expect(deps.selection.setSelectedUsers).toHaveBeenCalledWith('usr_1', member);
            expect(queryRequest.fetch).not.toHaveBeenCalled();
        });

        test('falls back to user API when member has no user object', async () => {
            const deps = createDeps();
            deps.groupRequest.getGroupMember.mockResolvedValue({
                json: { userId: 'usr_1' },
                params: {}
            });
            deps.applyGroupMember.mockReturnValue({ userId: 'usr_1' });
            queryRequest.fetch.mockResolvedValue({
                json: { id: 'usr_1', displayName: 'Alice' }
            });

            const { addGroupMemberToSelection } = useGroupModerationData(deps);
            await addGroupMemberToSelection('usr_1');

            expect(queryRequest.fetch).toHaveBeenCalledWith('user.dialog', { userId: 'usr_1' });
            expect(deps.selection.setSelectedUsers).toHaveBeenCalledWith('usr_1', expect.objectContaining({
                userId: 'usr_1',
                displayName: 'Alice'
            }));
        });
    });

    describe('resetData', () => {
        test('clears all table data and search state', () => {
            const deps = createDeps();
            deps.tables.members.data = [{ userId: 'usr_1' }];
            deps.tables.bans.data = [{ userId: 'usr_2' }];

            const { resetData, memberSearch } = useGroupModerationData(deps);
            memberSearch.value = 'test';
            resetData();

            expect(deps.tables.members.data).toHaveLength(0);
            expect(deps.tables.bans.data).toHaveLength(0);
            expect(deps.tables.invites.data).toHaveLength(0);
            expect(deps.tables.joinRequests.data).toHaveLength(0);
            expect(deps.tables.blocked.data).toHaveLength(0);
            expect(deps.tables.logs.data).toHaveLength(0);
            expect(memberSearch.value).toBe('');
        });
    });

    describe('member search / sort / filter', () => {
        test('groupMembersSearch clears table when search is too short', () => {
            const deps = createDeps();
            deps.tables.members.data = [{ userId: 'usr_1' }];

            const { groupMembersSearch, memberSearch, isGroupMembersLoading } = useGroupModerationData(deps);
            memberSearch.value = 'ab';
            groupMembersSearch();

            expect(deps.tables.members.data).toHaveLength(0);
            expect(isGroupMembersLoading.value).toBe(false);
        });

        test('setGroupMemberSortOrder does nothing when sort is the same', async () => {
            const deps = createDeps();
            deps.groupRequest.getGroupMember.mockResolvedValue({ json: null, params: {} });

            const { setGroupMemberSortOrder, memberSortOrder } = useGroupModerationData(deps);
            const currentSort = memberSortOrder.value;
            await setGroupMemberSortOrder(currentSort);

            // getGroupMember should not have been called since sort didn't change
            expect(deps.groupRequest.getGroupMember).not.toHaveBeenCalled();
        });

        test('setGroupMemberFilter does nothing when filter is the same', async () => {
            const deps = createDeps();

            const { setGroupMemberFilter, memberFilter } = useGroupModerationData(deps);
            const currentFilter = memberFilter.value;
            await setGroupMemberFilter(currentFilter);

            expect(deps.groupRequest.getGroupMember).not.toHaveBeenCalled();
        });
    });

    describe('loadAllGroupMembers', () => {
        test('does nothing when already loading', async () => {
            const deps = createDeps();
            const { loadAllGroupMembers, isGroupMembersLoading } = useGroupModerationData(deps);
            isGroupMembersLoading.value = true;

            await loadAllGroupMembers();

            expect(deps.groupRequest.getGroupMember).not.toHaveBeenCalled();
        });
    });
});
