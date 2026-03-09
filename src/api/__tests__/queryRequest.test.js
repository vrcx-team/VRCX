import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockFetchWithEntityPolicy = vi.fn();
const mockGetUser = vi.fn();
const mockGetWorlds = vi.fn();
const mockGetGroupCalendar = vi.fn();

vi.mock('../../queries', () => ({
    entityQueryPolicies: {
        user: { staleTime: 20000, gcTime: 90000, retry: 1, refetchOnWindowFocus: false },
        worldCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        groupCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        avatar: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        world: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        group: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        friendList: { staleTime: 20000, gcTime: 90000, retry: 1, refetchOnWindowFocus: false },
        favoriteCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        galleryCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        inventoryCollection: { staleTime: 20000, gcTime: 120000, retry: 1, refetchOnWindowFocus: false },
        fileObject: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false }
    },
    fetchWithEntityPolicy: (...args) => mockFetchWithEntityPolicy(...args),
    queryKeys: {
        user: (userId) => ['user', userId],
        worldsByUser: (params) => ['worlds', 'user', params.userId, params],
        groupCalendar: (groupId) => ['group', groupId, 'calendar'],
        avatar: (avatarId) => ['avatar', avatarId],
        world: (worldId) => ['world', worldId],
        group: (groupId, includeRoles) => ['group', groupId, Boolean(includeRoles)],
        groupPosts: (params) => ['group', params.groupId, 'posts', params],
        groupMember: (params) => ['group', params.groupId, 'member', params.userId],
        groupMembers: (params) => ['group', params.groupId, 'members', params],
        groupGallery: (params) => ['group', params.groupId, 'gallery', params.galleryId, params],
        groupCalendarEvent: (params) => ['group', params.groupId, 'calendarEvent', params.eventId],
        friends: (params) => ['friends', params],
        favoriteLimits: () => ['favorite', 'limits'],
        favorites: (params) => ['favorite', 'items', params],
        favoriteGroups: (params) => ['favorite', 'groups', params],
        favoriteWorlds: (params) => ['favorite', 'worlds', params],
        favoriteAvatars: (params) => ['favorite', 'avatars', params],
        galleryFiles: (params) => ['gallery', 'files', params],
        prints: (params) => ['gallery', 'prints', params],
        print: (printId) => ['gallery', 'print', printId],
        userInventoryItem: (params) => ['inventory', 'item', params.userId, params.inventoryId],
        inventoryItems: (params) => ['inventory', 'items', params],
        file: (fileId) => ['file', fileId]
    }
}));

vi.mock('../user', () => ({
    default: {
        getUser: (...args) => mockGetUser(...args)
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
        getGroupCalendarEvent: vi.fn()
    }
}));

vi.mock('../avatar', () => ({ default: { getAvatar: vi.fn() } }));
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
    default: { getUserInventoryItem: vi.fn(), getInventoryItems: vi.fn() }
}));
vi.mock('../misc', () => ({ default: { getFile: vi.fn() } }));

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
});
