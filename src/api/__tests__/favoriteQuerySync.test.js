import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequest = vi.fn();
const mockInvalidateQueries = vi.fn().mockResolvedValue();
const mockHandleFavoriteAdd = vi.fn();
const mockHandleFavoriteDelete = vi.fn();
const mockHandleFavoriteGroupClear = vi.fn();

vi.mock('../../services/request', () => ({
    request: (...args) => mockRequest(...args)
}));

vi.mock('../../stores', () => ({
    useUserStore: () => ({
        currentUser: { id: 'usr_me' }
    })
}));

vi.mock('../../coordinators/favoriteCoordinator', () => ({
    handleFavoriteAdd: (...args) => mockHandleFavoriteAdd(...args),
    handleFavoriteDelete: (...args) => mockHandleFavoriteDelete(...args),
    handleFavoriteGroupClear: (...args) => mockHandleFavoriteGroupClear(...args)
}));

vi.mock('../../queries', () => ({
    queryClient: {
        invalidateQueries: (...args) => mockInvalidateQueries(...args)
    }
}));

import favoriteRequest from '../favorite';

describe('favorite query sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('favorite mutations invalidate active favorite queries', async () => {
        mockRequest.mockResolvedValue({ ok: true });

        await favoriteRequest.addFavorite({
            type: 'world',
            favoriteId: 'wrld_1'
        });
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
