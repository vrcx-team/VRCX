import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequest = vi.fn();
const mockFetchWithEntityPolicy = vi.fn();
const mockInvalidateQueries = vi.fn().mockResolvedValue();
const mockApplyUser = vi.fn((json) => json);

vi.mock('../../service/request', () => ({
    request: (...args) => mockRequest(...args)
}));

vi.mock('../../stores/user', () => ({
    useUserStore: () => ({
        applyUser: (...args) => mockApplyUser(...args)
    })
}));

vi.mock('../../queries', () => ({
    entityQueryPolicies: {
        friendList: {
            staleTime: 20000,
            gcTime: 90000,
            retry: 1,
            refetchOnWindowFocus: false
        }
    },
    fetchWithEntityPolicy: (...args) => mockFetchWithEntityPolicy(...args),
    queryClient: {
        invalidateQueries: (...args) => mockInvalidateQueries(...args)
    },
    queryKeys: {
        friends: (params) => ['friends', params]
    }
}));

import friendRequest from '../friend';

describe('friend query sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('getCachedFriends uses query policy wrapper', async () => {
        mockFetchWithEntityPolicy.mockResolvedValue({
            data: {
                json: [{ id: 'usr_1', displayName: 'A' }],
                params: { n: 50, offset: 0 }
            },
            cache: true
        });

        const args = await friendRequest.getCachedFriends({ n: 50, offset: 0 });

        expect(mockFetchWithEntityPolicy).toHaveBeenCalled();
        expect(args.cache).toBe(true);
        expect(args.json[0].id).toBe('usr_1');
    });

    test('friend mutations invalidate active friends queries', async () => {
        mockRequest.mockResolvedValue({ ok: true });

        await friendRequest.sendFriendRequest({ userId: 'usr_1' });
        await friendRequest.cancelFriendRequest({ userId: 'usr_1' });
        await friendRequest.deleteFriend({ userId: 'usr_1' });

        expect(mockInvalidateQueries).toHaveBeenCalledTimes(3);
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
            queryKey: ['friends'],
            refetchType: 'active'
        });
    });
});
