import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequest = vi.fn();
const mockInvalidateQueries = vi.fn().mockResolvedValue();
const mockApplyUser = vi.fn((json) => json);

vi.mock('../../services/request', () => ({
    request: (...args) => mockRequest(...args)
}));

vi.mock('../../stores/user', () => ({
    useUserStore: () => ({
        applyUser: (...args) => mockApplyUser(...args)
    })
}));

vi.mock('../../coordinators/userCoordinator', () => ({
    applyUser: (...args) => mockApplyUser(...args)
}));

vi.mock('../../queries', () => ({
    queryClient: {
        invalidateQueries: (...args) => mockInvalidateQueries(...args)
    },
    entityQueryPolicies: {
        user: {},
        avatar: {},
        world: {},
        worldCollection: {}
    }
}));

import friendRequest from '../friend';

describe('friend query sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
