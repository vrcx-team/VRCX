import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequest = vi.fn();
const mockFetchWithEntityPolicy = vi.fn();
const mockInvalidateQueries = vi.fn().mockResolvedValue();
const mockHandleFavoriteAdd = vi.fn();
const mockHandleFavoriteDelete = vi.fn();
const mockHandleFavoriteGroupClear = vi.fn();

vi.mock('../../service/request', () => ({
    request: (...args) => mockRequest(...args)
}));

vi.mock('../../stores', () => ({
    useFavoriteStore: () => ({
        handleFavoriteAdd: (...args) => mockHandleFavoriteAdd(...args),
        handleFavoriteDelete: (...args) => mockHandleFavoriteDelete(...args),
        handleFavoriteGroupClear: (...args) =>
            mockHandleFavoriteGroupClear(...args)
    }),
    useUserStore: () => ({
        currentUser: { id: 'usr_me' }
    })
}));

vi.mock('../../queries', () => ({
    entityQueryPolicies: {
        favoriteCollection: {
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
        favoriteLimits: () => ['favorite', 'limits'],
        favorites: (params) => ['favorite', 'items', params],
        favoriteGroups: (params) => ['favorite', 'groups', params],
        favoriteWorlds: (params) => ['favorite', 'worlds', params],
        favoriteAvatars: (params) => ['favorite', 'avatars', params]
    }
}));

import favoriteRequest from '../favorite';

describe('favorite query sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('cached favorite reads go through fetchWithEntityPolicy', async () => {
        mockFetchWithEntityPolicy.mockResolvedValue({
            data: { json: [], params: { n: 300, offset: 0 } },
            cache: true
        });

        const args = await favoriteRequest.getCachedFavorites({
            n: 300,
            offset: 0
        });

        expect(mockFetchWithEntityPolicy).toHaveBeenCalled();
        expect(args.cache).toBe(true);
    });

    test('favorite mutations invalidate active favorite queries', async () => {
        mockRequest.mockResolvedValue({ ok: true });

        await favoriteRequest.addFavorite({ type: 'world', favoriteId: 'wrld_1' });
        await favoriteRequest.deleteFavorite({ objectId: 'fav_1' });
        await favoriteRequest.saveFavoriteGroup({
            type: 'world',
            group: 'worlds1',
            displayName: 'Worlds'
        });
        await favoriteRequest.clearFavoriteGroup({
            type: 'world',
            group: 'worlds1'
        });

        expect(mockInvalidateQueries).toHaveBeenCalledTimes(4);
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
            queryKey: ['favorite'],
            refetchType: 'active'
        });
    });
});
