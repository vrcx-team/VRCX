import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequest = vi.fn();
const mockPatchAndRefetchActiveQuery = vi.fn(() => Promise.resolve());
const mockFetchWithEntityPolicy = vi.fn();

const mockApplyCurrentUser = vi.fn((json) => ({ id: json.id || 'usr_me', ...json }));
const mockApplyUser = vi.fn((json) => ({ ...json }));
const mockApplyWorld = vi.fn((json) => ({ ...json }));

vi.mock('../../service/request', () => ({
    request: (...args) => mockRequest(...args)
}));

vi.mock('../../stores', () => ({
    useUserStore: () => ({
        currentUser: { id: 'usr_me' },
        applyCurrentUser: mockApplyCurrentUser,
        applyUser: mockApplyUser
    }),
    useWorldStore: () => ({
        applyWorld: mockApplyWorld
    })
}));

vi.mock('../../queries', () => ({
    entityQueryPolicies: {
        user: { staleTime: 20000, gcTime: 90000, retry: 1, refetchOnWindowFocus: false },
        avatar: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        world: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        worldCollection: { staleTime: 60000, gcTime: 300000, retry: 1, refetchOnWindowFocus: false },
        instance: { staleTime: 0, gcTime: 10000, retry: 0, refetchOnWindowFocus: false }
    },
    fetchWithEntityPolicy: (...args) => mockFetchWithEntityPolicy(...args),
    patchAndRefetchActiveQuery: (...args) =>
        mockPatchAndRefetchActiveQuery(...args),
    queryKeys: {
        user: (userId) => ['user', userId],
        avatar: (avatarId) => ['avatar', avatarId],
        world: (worldId) => ['world', worldId],
        worldsByUser: (params) => ['worlds', 'user', params.userId, params],
        instance: (worldId, instanceId) => ['instance', worldId, instanceId]
    }
}));

import avatarRequest from '../avatar';
import userRequest from '../user';
import worldRequest from '../world';

describe('entity mutation query sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('saveCurrentUser patches and refetches active user query', async () => {
        mockRequest.mockResolvedValue({ id: 'usr_me', status: 'active' });

        await userRequest.saveCurrentUser({ status: 'active' });

        expect(mockPatchAndRefetchActiveQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['user', 'usr_me']
            })
        );
    });

    test('saveAvatar patches and refetches active avatar query', async () => {
        mockRequest.mockResolvedValue({ id: 'avtr_1', name: 'Avatar' });

        await avatarRequest.saveAvatar({ id: 'avtr_1', name: 'Avatar' });

        expect(mockPatchAndRefetchActiveQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['avatar', 'avtr_1']
            })
        );
    });

    test('saveWorld patches and refetches active world query', async () => {
        mockRequest.mockResolvedValue({ id: 'wrld_1', name: 'World' });

        await worldRequest.saveWorld({ id: 'wrld_1', name: 'World' });

        expect(mockPatchAndRefetchActiveQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['world', 'wrld_1']
            })
        );
    });

    test('getCachedWorlds uses policy wrapper for world list data', async () => {
        mockFetchWithEntityPolicy.mockResolvedValue({
            data: {
                json: [{ id: 'wrld_1' }],
                params: { userId: 'usr_me', n: 50, offset: 0 }
            },
            cache: true
        });

        const args = await worldRequest.getCachedWorlds({
            userId: 'usr_me',
            n: 50,
            offset: 0,
            sort: 'updated',
            order: 'descending',
            user: 'me',
            releaseStatus: 'all'
        });

        expect(mockFetchWithEntityPolicy).toHaveBeenCalled();
        expect(args.cache).toBe(true);
    });
});
