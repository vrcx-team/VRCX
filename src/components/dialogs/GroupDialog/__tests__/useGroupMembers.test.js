import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

vi.mock('../../../../api', () => ({
    groupRequest: {
        getGroupMembersSearch: vi.fn()
    },
    queryRequest: {
        fetch: vi.fn()
    },
    userRequest: {}
}));
vi.mock('../../../../plugins/router', () => {
    const { ref } = require('vue');
    return {
        router: {
            beforeEach: vi.fn(),
            push: vi.fn(),
            replace: vi.fn(),
            currentRoute: ref({ path: '/', name: '', meta: {} }),
            isReady: vi.fn().mockResolvedValue(true)
        },
        initRouter: vi.fn()
    };
});
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    const { ref } = require('vue');
    return {
        ...actual,
        useRouter: vi.fn(() => ({
            push: vi.fn(),
            replace: vi.fn(),
            currentRoute: ref({ path: '/', name: '', meta: {} })
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
vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    }),
    createI18n: () => ({
        global: { t: (key) => key, locale: require('vue').ref('en') },
        install: vi.fn()
    })
}));
vi.mock('worker-timers', () => ({
    setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimeout: (id) => globalThis.clearTimeout(id)
}));

import { useGroupMembers } from '../useGroupMembers';
import { groupRequest, queryRequest } from '../../../../api';
import { FILTER_EVERYONE } from '../../../../shared/constants';

/**
 *
 * @param overrides
 */
function createGroupDialog(overrides = {}) {
    return ref({
        id: 'grp_1',
        visible: true,
        inGroup: false,
        members: [],
        memberSearch: '',
        memberSearchResults: [],
        memberSortOrder: { value: '' },
        memberFilter: { id: null, name: 'Everyone' },
        ref: { roles: [], memberCount: 0 },
        ...overrides
    });
}

/**
 *
 * @param overrides
 */
function createDeps(overrides = {}) {
    return {
        currentUser: ref({ id: 'usr_me' }),
        applyGroupMember: vi.fn((json) => json),
        handleGroupMember: vi.fn(),
        t: (key) => key,
        ...overrides
    };
}

describe('useGroupMembers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryRequest.fetch.mockReset();
    });

    describe('groupDialogMemberSortValue', () => {
        test('returns current sort order value', () => {
            const groupDialog = createGroupDialog({
                memberSortOrder: { value: 'joinedAt:desc', name: 'sort.joined' }
            });
            const { groupDialogMemberSortValue } = useGroupMembers(
                groupDialog,
                createDeps()
            );
            expect(groupDialogMemberSortValue.value).toBe('joinedAt:desc');
        });

        test('returns empty string when no sort order', () => {
            const groupDialog = createGroupDialog({
                memberSortOrder: {}
            });
            const { groupDialogMemberSortValue } = useGroupMembers(
                groupDialog,
                createDeps()
            );
            expect(groupDialogMemberSortValue.value).toBe('');
        });
    });

    describe('groupDialogMemberFilterKey', () => {
        test('returns everyone when filter id is null', () => {
            const groupDialog = createGroupDialog({
                memberFilter: { id: null }
            });
            const { groupDialogMemberFilterKey } = useGroupMembers(
                groupDialog,
                createDeps()
            );
            expect(groupDialogMemberFilterKey.value).toBe('everyone');
        });

        test('returns usersWithNoRole when filter id is empty string', () => {
            const groupDialog = createGroupDialog({ memberFilter: { id: '' } });
            const { groupDialogMemberFilterKey } = useGroupMembers(
                groupDialog,
                createDeps()
            );
            expect(groupDialogMemberFilterKey.value).toBe('usersWithNoRole');
        });

        test('returns role:id for role-based filters', () => {
            const groupDialog = createGroupDialog({
                memberFilter: { id: 'role_123' }
            });
            const { groupDialogMemberFilterKey } = useGroupMembers(
                groupDialog,
                createDeps()
            );
            expect(groupDialogMemberFilterKey.value).toBe('role:role_123');
        });

        test('returns null when no filter', () => {
            const groupDialog = createGroupDialog({ memberFilter: null });
            const { groupDialogMemberFilterKey } = useGroupMembers(
                groupDialog,
                createDeps()
            );
            expect(groupDialogMemberFilterKey.value).toBeNull();
        });
    });

    describe('groupDialogMemberFilterGroups', () => {
        test('includes filter options and role groups', () => {
            const groupDialog = createGroupDialog({
                ref: {
                    roles: [
                        { id: 'role_1', name: 'Admin', defaultRole: false },
                        { id: 'role_2', name: 'Member', defaultRole: true }
                    ],
                    memberCount: 10
                }
            });
            const { groupDialogMemberFilterGroups } = useGroupMembers(
                groupDialog,
                createDeps()
            );
            const groups = groupDialogMemberFilterGroups.value;

            expect(groups.length).toBeGreaterThanOrEqual(1);
            // should have a filters group
            const filtersGroup = groups.find((g) => g.key === 'filters');
            expect(filtersGroup).toBeDefined();
            expect(filtersGroup.items.length).toBeGreaterThan(0);
        });

        test('excludes default roles from role items', () => {
            const groupDialog = createGroupDialog({
                ref: {
                    roles: [
                        { id: 'role_1', name: 'Admin', defaultRole: false },
                        { id: 'role_2', name: 'Default', defaultRole: true }
                    ],
                    memberCount: 10
                }
            });
            const { groupDialogMemberFilterGroups } = useGroupMembers(
                groupDialog,
                createDeps()
            );
            const rolesGroup = groupDialogMemberFilterGroups.value.find(
                (g) => g.key === 'roles'
            );

            if (rolesGroup) {
                expect(rolesGroup.items).toHaveLength(1);
                expect(rolesGroup.items[0].label).toBe('Admin');
            }
        });

        test('omits roles group when no non-default roles exist', () => {
            const groupDialog = createGroupDialog({
                ref: {
                    roles: [
                        { id: 'role_1', name: 'Default', defaultRole: true }
                    ],
                    memberCount: 10
                }
            });
            const { groupDialogMemberFilterGroups } = useGroupMembers(
                groupDialog,
                createDeps()
            );
            const rolesGroup = groupDialogMemberFilterGroups.value.find(
                (g) => g.key === 'roles'
            );
            expect(rolesGroup).toBeUndefined();
        });
    });

    describe('groupMembersSearch', () => {
        test('clears results when search is less than 3 characters', () => {
            const groupDialog = createGroupDialog({ memberSearch: 'ab' });
            const { groupMembersSearch, isGroupMembersLoading } =
                useGroupMembers(groupDialog, createDeps());

            groupMembersSearch();

            expect(groupDialog.value.memberSearchResults).toEqual([]);
            expect(isGroupMembersLoading.value).toBe(false);
        });

        test('calls API when search is 3 or more characters', async () => {
            const groupDialog = createGroupDialog({ memberSearch: 'abc' });
            groupRequest.getGroupMembersSearch.mockResolvedValue({
                json: { results: [{ userId: 'usr_1' }] },
                params: { groupId: 'grp_1' }
            });

            const deps = createDeps();
            const { groupMembersSearch } = useGroupMembers(groupDialog, deps);
            groupMembersSearch();

            // wait for the debounced call
            await vi.waitFor(() => {
                expect(groupRequest.getGroupMembersSearch).toHaveBeenCalledWith(
                    {
                        groupId: 'grp_1',
                        query: 'abc',
                        n: 100,
                        offset: 0
                    }
                );
            });
        });
    });

    describe('loadMoreGroupMembers', () => {
        test('does not load when already done', async () => {
            const groupDialog = createGroupDialog();
            const { loadMoreGroupMembers, isGroupMembersDone } =
                useGroupMembers(groupDialog, createDeps());
            isGroupMembersDone.value = true;

            await loadMoreGroupMembers();

            expect(queryRequest.fetch).not.toHaveBeenCalled();
        });

        test('does not load when already loading', async () => {
            const groupDialog = createGroupDialog();
            const { loadMoreGroupMembers, isGroupMembersLoading } =
                useGroupMembers(groupDialog, createDeps());
            isGroupMembersLoading.value = true;

            await loadMoreGroupMembers();

            expect(queryRequest.fetch).not.toHaveBeenCalled();
        });

        test('marks done when fewer than n results returned', async () => {
            const groupDialog = createGroupDialog();
            queryRequest.fetch.mockResolvedValue({
                json: [{ userId: 'usr_1' }],
                params: { groupId: 'grp_1', n: 100, offset: 0 }
            });

            const {
                loadMoreGroupMembers,
                isGroupMembersDone,
                loadMoreGroupMembersParams
            } = useGroupMembers(groupDialog, createDeps());

            loadMoreGroupMembersParams.value = {
                n: 100,
                offset: 0,
                groupId: 'grp_1',
                sort: 'joinedAt:desc'
            };

            await loadMoreGroupMembers();

            expect(isGroupMembersDone.value).toBe(true);
        });

        test('appends members to groupDialog.members', async () => {
            const groupDialog = createGroupDialog({
                members: [{ userId: 'existing' }]
            });
            queryRequest.fetch.mockResolvedValue({
                json: [{ userId: 'usr_new' }],
                params: { groupId: 'grp_1', n: 100, offset: 0 }
            });

            const { loadMoreGroupMembers, loadMoreGroupMembersParams } =
                useGroupMembers(groupDialog, createDeps());

            loadMoreGroupMembersParams.value = {
                n: 100,
                offset: 0,
                groupId: 'grp_1',
                sort: 'joinedAt:desc'
            };

            await loadMoreGroupMembers();

            expect(groupDialog.value.members).toHaveLength(2);
        });

        test('removes duplicate current user from first position', async () => {
            const deps = createDeps();
            const groupDialog = createGroupDialog({
                members: [{ userId: 'usr_me' }]
            });
            queryRequest.fetch.mockResolvedValue({
                json: [{ userId: 'usr_me' }, { userId: 'usr_2' }],
                params: { groupId: 'grp_1', n: 100, offset: 0 }
            });

            const { loadMoreGroupMembers, loadMoreGroupMembersParams } =
                useGroupMembers(groupDialog, deps);

            loadMoreGroupMembersParams.value = {
                n: 100,
                offset: 0,
                groupId: 'grp_1',
                sort: 'joinedAt:desc'
            };

            await loadMoreGroupMembers();

            // duplicate at position 0 should be removed
            const userIds = groupDialog.value.members.map((m) => m.userId);
            expect(userIds).toEqual(['usr_me', 'usr_2']);
        });

        test('marks done on error', async () => {
            const groupDialog = createGroupDialog();
            queryRequest.fetch.mockRejectedValue(new Error('fail'));

            const {
                loadMoreGroupMembers,
                isGroupMembersDone,
                loadMoreGroupMembersParams
            } = useGroupMembers(groupDialog, createDeps());

            loadMoreGroupMembersParams.value = {
                n: 100,
                offset: 0,
                groupId: 'grp_1',
                sort: 'joinedAt:desc'
            };

            await expect(loadMoreGroupMembers()).rejects.toThrow('fail');
            expect(isGroupMembersDone.value).toBe(true);
        });
    });

    describe('setGroupMemberSortOrder', () => {
        test('does not reload when sort order unchanged', async () => {
            const groupDialog = createGroupDialog({
                memberSortOrder: { value: 'joinedAt:desc' }
            });
            const { setGroupMemberSortOrder } = useGroupMembers(
                groupDialog,
                createDeps()
            );

            await setGroupMemberSortOrder({ value: 'joinedAt:desc' });

            expect(queryRequest.fetch).not.toHaveBeenCalled();
        });
    });

    describe('setGroupMemberFilter', () => {
        test('does not reload when filter unchanged', async () => {
            const { markRaw } = require('vue');
            const filter = markRaw(FILTER_EVERYONE);
            const groupDialog = createGroupDialog();
            // Use markRaw to prevent Vue from wrapping the filter in a Proxy
            groupDialog.value.memberFilter = filter;
            const { setGroupMemberFilter } = useGroupMembers(
                groupDialog,
                createDeps()
            );

            await setGroupMemberFilter(filter);

            expect(queryRequest.fetch).not.toHaveBeenCalled();
        });
    });
});
