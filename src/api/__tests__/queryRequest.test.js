import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockFetchWithEntityPolicy = vi.fn();
const mockGetUser = vi.fn();
const mockGetWorlds = vi.fn();
const mockGetGroupCalendar = vi.fn();

vi.mock('../../queries', () => ({
    queryClient: {
        invalidateQueries: vi.fn().mockResolvedValue(undefined)
    },
    entityQueryPolicies: {
        user: { staleTime: 20000, gcTime: 90000, retry: 1, refetchOnWindowFocus: false },
        worldCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        groupCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        groupCalendarCollection: { staleTime: 120000, gcTime: 600000, retry: 1, refetchOnWindowFocus: false },
        groupFollowingCalendarCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        groupFeaturedCalendarCollection: { staleTime: 300000, gcTime: 900000, retry: 1, refetchOnWindowFocus: false },
        groupCalendarEvent: { staleTime: 120000, gcTime: 600000, retry: 1, refetchOnWindowFocus: false },
        avatar: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        avatarCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        avatarGallery: { staleTime: 30000, gcTime: 120000, retry: 1, refetchOnWindowFocus: false },
        world: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        group: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        friendList: { staleTime: 20000, gcTime: 90000, retry: 1, refetchOnWindowFocus: false },
        favoriteCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        galleryCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        inventoryCollection: { staleTime: 20000, gcTime: 120000, retry: 1, refetchOnWindowFocus: false },
        inventoryObject: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        fileAnalysis: { staleTime: 120000, gcTime: 600000, retry: 1, refetchOnWindowFocus: false },
        worldPersistData: { staleTime: 120000, gcTime: 600000, retry: 1, refetchOnWindowFocus: false },
        mutualCounts: { staleTime: 120000, gcTime: 600000, retry: 1, refetchOnWindowFocus: false },
        visits: { staleTime: 300000, gcTime: 900000, retry: 1, refetchOnWindowFocus: false },
        fileObject: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false }
    },
    fetchWithEntityPolicy: (...args) => mockFetchWithEntityPolicy(...args),
    queryKeys: {
        user: (userId) => ['user', userId],
        avatars: (params) => ['avatar', 'list', params],
        worldsByUser: (params) => ['worlds', 'user', params.userId, params],
        groupCalendar: (groupId) => ['group', groupId, 'calendar'],
        groupCalendars: (params) => ['group', 'calendar', params],
        followingGroupCalendars: (params) => ['group', 'calendar', 'following', params],
        featuredGroupCalendars: (params) => ['group', 'calendar', 'featured', params],
        avatar: (avatarId) => ['avatar', avatarId],
        world: (worldId) => ['world', worldId],
        group: (groupId, includeRoles) => ['group', groupId, Boolean(includeRoles)],
        groupPosts: (params) => ['group', params.groupId, 'posts', params],
        groupMember: (params) => ['group', params.groupId, 'member', params.userId],
        groupMembers: (params) => ['group', params.groupId, 'members', params],
        groupGallery: (params) => ['group', params.groupId, 'gallery', params.galleryId, params],
        groupCalendarEvent: (params) => ['group', params.groupId, 'calendarEvent', params.eventId],
        avatarGallery: (avatarId) => ['avatar', avatarId, 'gallery'],
        friends: (params) => ['friends', params],
        favoriteLimits: () => ['favorite', 'limits'],
        favorites: (params) => ['favorite', 'items', params],
        favoriteGroups: (params) => ['favorite', 'groups', params],
        favoriteWorlds: (params) => ['favorite', 'worlds', params],
        favoriteAvatars: (params) => ['favorite', 'avatars', params],
        galleryFiles: (params) => ['gallery', 'files', params],
        prints: (params) => ['gallery', 'prints', params],
        print: (printId) => ['gallery', 'print', printId],
        inventoryItem: (inventoryId) => ['inventory', 'item', inventoryId],
        userInventoryItem: (params) => ['inventory', 'item', params.userId, params.inventoryId],
        inventoryItems: (params) => ['inventory', 'items', params],
        inventoryTemplate: (inventoryTemplateId) => ['inventory', 'template', inventoryTemplateId],
        fileAnalysis: (params) => ['analysis', params.fileId, Number(params.version), String(params.variant || '')],
        worldPersistData: (worldId) => ['world', worldId, 'persistData'],
        mutualCounts: (userId) => ['user', userId, 'mutualCounts'],
        visits: () => ['visits'],
        file: (fileId) => ['file', fileId]
    }
}));

vi.mock('../user', () => ({
    default: {
        getUser: (...args) => mockGetUser(...args),
        getMutualCounts: vi.fn()
    }
}));

vi.mock('../world', () => ({
    default: {
        getWorlds: (...args) => mockGetWorlds(...args),
        getWorld: vi.fn()
    }
}));

vi.mock('../group', () => ({
    default: {
        getGroupCalendar: (...args) => mockGetGroupCalendar(...args),
        getGroup: vi.fn(),
        getGroupPosts: vi.fn(),
        getGroupMember: vi.fn(),
        getGroupMembers: vi.fn(),
        getGroupGallery: vi.fn(),
        getGroupCalendarEvent: vi.fn(),
        getGroupCalendars: vi.fn(),
        getFollowingGroupCalendars: vi.fn(),
        getFeaturedGroupCalendars: vi.fn()
    }
}));

vi.mock('../avatar', () => ({
    default: { getAvatar: vi.fn(), getAvatarGallery: vi.fn(), getAvatars: vi.fn() }
}));
vi.mock('../friend', () => ({ default: { getFriends: vi.fn() } }));
vi.mock('../favorite', () => ({
    default: {
        getFavoriteLimits: vi.fn(),
        getFavorites: vi.fn(),
        getFavoriteGroups: vi.fn(),
        getFavoriteWorlds: vi.fn(),
        getFavoriteAvatars: vi.fn()
    }
}));
vi.mock('../vrcPlusIcon', () => ({ default: { getFileList: vi.fn() } }));
vi.mock('../vrcPlusImage', () => ({
    default: { getPrints: vi.fn(), getPrint: vi.fn() }
}));
vi.mock('../inventory', () => ({
    default: {
        getUserInventoryItem: vi.fn(),
        getInventoryItem: vi.fn(),
        getInventoryItems: vi.fn(),
        getInventoryTemplate: vi.fn()
    }
}));
vi.mock('../misc', () => ({
    default: {
        getFile: vi.fn(),
        getFileAnalysis: vi.fn(),
        getVisits: vi.fn(),
        hasWorldPersistData: vi.fn()
    }
}));

import queryRequest from '../queryRequest';

describe('queryRequest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('routes user fetch through policy wrapper and returns cache marker', async () => {
        const data = { json: { id: 'usr_1' }, params: { userId: 'usr_1' } };
        mockGetUser.mockResolvedValue(data);
        mockFetchWithEntityPolicy.mockImplementation(async ({ queryFn }) => ({
            data: await queryFn(),
            cache: true
        }));

        const args = await queryRequest.fetch('user', { userId: 'usr_1' });

        expect(mockFetchWithEntityPolicy).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['user', 'usr_1']
            })
        );
        expect(args.cache).toBe(true);
        expect(args.json.id).toBe('usr_1');
    });

    test('uses same queryKey for user and user.dialog callers', async () => {
        const data = { json: { id: 'usr_1' }, params: { userId: 'usr_1' } };
        mockGetUser.mockResolvedValue(data);
        mockFetchWithEntityPolicy.mockImplementation(async ({ queryFn }) => ({
            data: await queryFn(),
            cache: false
        }));

        await queryRequest.fetch('user', { userId: 'usr_1' });
        await queryRequest.fetch('user.dialog', { userId: 'usr_1' });

        const baseCall = mockFetchWithEntityPolicy.mock.calls[0][0];
        const dialogCall = mockFetchWithEntityPolicy.mock.calls[1][0];
        expect(baseCall.queryKey).toEqual(['user', 'usr_1']);
        expect(dialogCall.queryKey).toEqual(baseCall.queryKey);
    });

    test('applies staleTime zero for user.force', async () => {
        const data = { json: { id: 'usr_2' }, params: { userId: 'usr_2' } };
        mockGetUser.mockResolvedValue(data);
        mockFetchWithEntityPolicy.mockImplementation(async ({ queryFn }) => ({
            data: await queryFn(),
            cache: false
        }));

        await queryRequest.fetch('user.force', { userId: 'usr_2' });

        expect(mockFetchWithEntityPolicy).toHaveBeenCalledWith(
            expect.objectContaining({
                policy: expect.objectContaining({ staleTime: 0 }),
                label: 'user.force'
            })
        );
    });

    test('applies staleTime 60000 for user.dialog', async () => {
        const data = { json: { id: 'usr_3' }, params: { userId: 'usr_3' } };
        mockGetUser.mockResolvedValue(data);
        mockFetchWithEntityPolicy.mockImplementation(async ({ queryFn }) => ({
            data: await queryFn(),
            cache: false
        }));

        await queryRequest.fetch('user.dialog', { userId: 'usr_3' });

        expect(mockFetchWithEntityPolicy).toHaveBeenCalledWith(
            expect.objectContaining({
                policy: expect.objectContaining({ staleTime: 60_000 }),
                label: 'user.dialog'
            })
        );
    });

    test('supports worldsByUser option routing', async () => {
        const params = {
            userId: 'usr_me',
            n: 50,
            offset: 0,
            sort: 'updated',
            order: 'descending',
            user: 'me',
            releaseStatus: 'all',
            option: 'featured'
        };
        mockGetWorlds.mockResolvedValue({ json: [], params });
        mockFetchWithEntityPolicy.mockImplementation(async ({ queryFn }) => ({
            data: await queryFn(),
            cache: false
        }));

        await queryRequest.fetch('worldsByUser', params);

        expect(mockGetWorlds).toHaveBeenCalledWith(params, 'featured');
        expect(mockFetchWithEntityPolicy).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['worlds', 'user', 'usr_me', params]
            })
        );
    });

    test('supports groupCalendar resource shape', async () => {
        mockGetGroupCalendar.mockResolvedValue({
            json: { results: [] },
            params: { groupId: 'grp_1' }
        });
        mockFetchWithEntityPolicy.mockImplementation(async ({ queryFn }) => ({
            data: await queryFn(),
            cache: false
        }));

        await queryRequest.fetch('groupCalendar', { groupId: 'grp_1' });

        expect(mockGetGroupCalendar).toHaveBeenCalledWith('grp_1');
        expect(mockFetchWithEntityPolicy).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['group', 'grp_1', 'calendar']
            })
        );
    });

    test('throws on unknown resource', async () => {
        await expect(
            // @ts-expect-error verifying runtime guard
            queryRequest.fetch('missing_resource', {})
        ).rejects.toThrow('Unknown query resource');
    });

    test('throws on unknown caller variant', async () => {
        await expect(
            // @ts-expect-error verifying runtime guard
            queryRequest.fetch('user.unknown', { userId: 'usr_1' })
        ).rejects.toThrow('Unknown query resource: user.unknown');
    });
});
