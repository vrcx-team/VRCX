import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
    _entityCacheInternals,
    fetchWithEntityPolicy,
    patchAndRefetchActiveQuery,
    patchUserFromEvent,
    patchQueryDataWithRecency
} from '../entityCache';
import { queryClient } from '../client';

describe('entity query cache helpers', () => {
    beforeEach(() => {
        queryClient.clear();
        vi.restoreAllMocks();
    });

    test('reports cache hit for fresh data', async () => {
        const queryKey = ['user', 'usr_1'];
        let callCount = 0;

        const policy = {
            staleTime: 20000,
            gcTime: 90000,
            retry: 1,
            refetchOnWindowFocus: false
        };

        const queryFn = vi.fn(async () => {
            callCount++;
            return {
                json: { id: 'usr_1', updated_at: '2026-01-01T00:00:00.000Z' },
                params: { userId: 'usr_1' },
                ref: { id: 'usr_1', updated_at: '2026-01-01T00:00:00.000Z' }
            };
        });

        const first = await fetchWithEntityPolicy({ queryKey, policy, queryFn });
        const second = await fetchWithEntityPolicy({ queryKey, policy, queryFn });

        expect(first.cache).toBe(false);
        expect(second.cache).toBe(true);
        expect(callCount).toBe(1);
    });

    test('always refetches when staleTime is zero (instance strategy)', async () => {
        const queryKey = ['instance', 'wrld_1', '12345'];
        let callCount = 0;

        const policy = {
            staleTime: 0,
            gcTime: 10000,
            retry: 0,
            refetchOnWindowFocus: false
        };

        const queryFn = vi.fn(async () => {
            callCount++;
            return {
                json: {
                    id: 'wrld_1:12345',
                    $fetchedAt: new Date().toJSON()
                },
                params: { worldId: 'wrld_1', instanceId: '12345' },
                ref: {
                    id: 'wrld_1:12345',
                    $fetchedAt: new Date().toJSON()
                }
            };
        });

        await fetchWithEntityPolicy({ queryKey, policy, queryFn });
        await fetchWithEntityPolicy({ queryKey, policy, queryFn });

        expect(callCount).toBe(2);
    });

    test('does not overwrite newer data with older payload', () => {
        const queryKey = ['world', 'wrld_1'];

        patchQueryDataWithRecency({
            queryKey,
            nextData: {
                ref: { id: 'wrld_1', updated_at: '2026-01-01T00:00:00.000Z' }
            }
        });

        patchQueryDataWithRecency({
            queryKey,
            nextData: {
                ref: { id: 'wrld_1', updated_at: '2025-01-01T00:00:00.000Z' }
            }
        });

        const cached = queryClient.getQueryData(queryKey);
        expect(cached.ref.updated_at).toBe('2026-01-01T00:00:00.000Z');
    });

    test('patch and refetch invalidates only active queries for that key', async () => {
        const invalidateSpy = vi
            .spyOn(queryClient, 'invalidateQueries')
            .mockResolvedValue();

        const queryKey = ['avatar', 'avtr_1'];
        await patchAndRefetchActiveQuery({
            queryKey,
            nextData: {
                ref: { id: 'avtr_1', updated_at: '2026-01-01T00:00:00.000Z' }
            }
        });

        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey,
            exact: true,
            refetchType: 'active'
        });
    });

    test('internal recency guard prefers same-or-newer timestamps', () => {
        const newer = {
            ref: { id: 'usr_1', updated_at: '2026-02-01T00:00:00.000Z' }
        };
        const older = {
            ref: { id: 'usr_1', updated_at: '2026-01-01T00:00:00.000Z' }
        };

        expect(_entityCacheInternals.shouldReplaceCurrent(older, newer)).toBe(
            true
        );
        expect(_entityCacheInternals.shouldReplaceCurrent(newer, older)).toBe(
            false
        );
    });

    test('internal completeness guard requires params + entity identifier', () => {
        expect(_entityCacheInternals.hasCompleteEntityData(undefined)).toBe(
            false
        );
        expect(_entityCacheInternals.hasCompleteEntityData({})).toBe(false);
        expect(
            _entityCacheInternals.hasCompleteEntityData({
                params: {}
            })
        ).toBe(false);
        expect(
            _entityCacheInternals.hasCompleteEntityData({
                params: { userId: 'usr_1' }
            })
        ).toBe(true);
    });

    test('patchUserFromEvent skips placeholder cache entries', () => {
        const queryKey = ['user', 'usr_1'];
        queryClient.setQueryData(queryKey, {
            params: {}
        });

        patchUserFromEvent({
            id: 'usr_1',
            displayName: 'Alice'
        });

        expect(queryClient.getQueryData(queryKey)).toEqual({
            params: {}
        });
    });

    test('patchUserFromEvent patches when query has complete data', () => {
        const queryKey = ['user', 'usr_1'];
        queryClient.setQueryData(queryKey, {
            params: { userId: 'usr_1' },
            ref: { id: 'usr_1', displayName: 'Old' },
            json: { id: 'usr_1', displayName: 'Old' }
        });

        patchUserFromEvent({
            id: 'usr_1',
            displayName: 'New'
        });

        const data = queryClient.getQueryData(queryKey);
        expect(data.ref.displayName).toBe('New');
    });
});
