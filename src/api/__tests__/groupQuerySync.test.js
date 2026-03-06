import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequest = vi.fn();
const mockFetchWithEntityPolicy = vi.fn();
const mockInvalidateQueries = vi.fn().mockResolvedValue();
const mockApplyGroup = vi.fn((json) => json);

vi.mock('../../service/request', () => ({
    request: (...args) => mockRequest(...args)
}));

vi.mock('../../stores', () => ({
    useGroupStore: () => ({
        applyGroup: (...args) => mockApplyGroup(...args)
    }),
    useUserStore: () => ({
        currentUser: { id: 'usr_me' }
    })
}));

vi.mock('../../query', () => ({
    entityQueryPolicies: {
        group: {
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        },
        groupCollection: {
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        }
    },
    fetchWithEntityPolicy: (...args) => mockFetchWithEntityPolicy(...args),
    queryClient: {
        invalidateQueries: (...args) => mockInvalidateQueries(...args)
    },
    queryKeys: {
        group: (groupId, includeRoles) => ['group', groupId, Boolean(includeRoles)],
        groupPosts: (params) => ['group', params.groupId, 'posts', params],
        groupMember: (params) => ['group', params.groupId, 'member', params.userId],
        groupMembers: (params) => ['group', params.groupId, 'members', params],
        groupGallery: (params) => ['group', params.groupId, 'gallery', params.galleryId, params],
        groupCalendar: (groupId) => ['group', groupId, 'calendar'],
        groupCalendarEvent: (params) => ['group', params.groupId, 'calendarEvent', params.eventId]
    }
}));

import groupRequest from '../group';

describe('group query sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('cached group resources use fetchWithEntityPolicy', async () => {
        mockFetchWithEntityPolicy.mockResolvedValue({
            data: { json: [], params: { groupId: 'grp_1', n: 100, offset: 0 } },
            cache: true
        });

        const a = await groupRequest.getCachedGroupMembers({
            groupId: 'grp_1',
            n: 100,
            offset: 0,
            sort: 'joinedAt:desc'
        });
        const b = await groupRequest.getCachedGroupGallery({
            groupId: 'grp_1',
            galleryId: 'gal_1',
            n: 100,
            offset: 0
        });

        expect(mockFetchWithEntityPolicy).toHaveBeenCalledTimes(2);
        expect(a.cache && b.cache).toBe(true);
    });

    test('group mutations invalidate scoped active group queries', async () => {
        mockRequest.mockResolvedValue({ ok: true });

        await groupRequest.setGroupRepresentation('grp_1', {
            isRepresenting: true
        });
        await groupRequest.deleteGroupPost({
            groupId: 'grp_1',
            postId: 'post_1'
        });
        await groupRequest.setGroupMemberProps('usr_me', 'grp_1', {
            visibility: 'visible'
        });

        expect(mockInvalidateQueries).toHaveBeenCalledTimes(3);
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
            queryKey: ['group', 'grp_1'],
            refetchType: 'active'
        });
    });
});
