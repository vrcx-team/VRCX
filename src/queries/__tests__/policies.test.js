import { describe, expect, test } from 'vitest';

import { entityQueryPolicies, toQueryOptions } from '../policies';

describe('query policy configuration', () => {
    test('core entity policies have correct stale/gc times', () => {
        expect(entityQueryPolicies.user).toMatchObject({
            staleTime: 20000,
            gcTime: 90000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.avatar).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.world).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.group).toMatchObject({
            staleTime: 300000,
            gcTime: 1800000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('group sub-resource policies', () => {
        expect(entityQueryPolicies.groupCollection).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.groupCalendarEvent).toMatchObject({
            staleTime: 120000,
            gcTime: 600000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('world collection policy', () => {
        expect(entityQueryPolicies.worldCollection).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('favorite and inventory policies', () => {
        expect(entityQueryPolicies.favoriteLimits).toMatchObject({
            staleTime: 600000,
            gcTime: 1800000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.inventoryCollection).toMatchObject({
            staleTime: 20000,
            gcTime: 120000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('avatar gallery policy has shorter staleTime than avatar entity', () => {
        expect(entityQueryPolicies.avatarGallery).toMatchObject({
            staleTime: 30000,
            gcTime: 120000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.avatarGallery.staleTime).toBeLessThan(
            entityQueryPolicies.avatar.staleTime
        );
    });

    test('file-related policies', () => {
        expect(entityQueryPolicies.fileAnalysis).toMatchObject({
            staleTime: 3600000,
            gcTime: 14400000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.fileObject).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('world persist data policy', () => {
        expect(entityQueryPolicies.worldPersistData).toMatchObject({
            staleTime: 1800000,
            gcTime: 7200000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('user relation policies (mutualCounts, representedGroup)', () => {
        expect(entityQueryPolicies.mutualCounts).toMatchObject({
            staleTime: 900000,
            gcTime: 3600000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.representedGroup).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('visits policy has longer staleTime for slow-changing data', () => {
        expect(entityQueryPolicies.visits).toMatchObject({
            staleTime: 1800000,
            gcTime: 7200000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('avatarStyles policy has very long staleTime for static config data', () => {
        expect(entityQueryPolicies.avatarStyles).toMatchObject({
            staleTime: 3600000,
            gcTime: 14400000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        // Should outlive visits (which is already long-lived)
        expect(entityQueryPolicies.avatarStyles.staleTime).toBeGreaterThan(
            entityQueryPolicies.visits.staleTime
        );
    });

    test('vrchatCredits policy has moderate staleTime for balance data', () => {
        expect(entityQueryPolicies.vrchatCredits).toMatchObject({
            staleTime: 120000,
            gcTime: 600000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('normalizes policy values to query options', () => {
        const options = toQueryOptions(entityQueryPolicies.group);

        expect(options).toEqual({
            staleTime: 300000,
            gcTime: 1800000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('toQueryOptions returns only the four query option fields', () => {
        const options = toQueryOptions(entityQueryPolicies.user);
        const keys = Object.keys(options);

        expect(keys).toEqual([
            'staleTime',
            'gcTime',
            'retry',
            'refetchOnWindowFocus'
        ]);
    });

    test('all policies are frozen and immutable', () => {
        for (const [, policy] of Object.entries(entityQueryPolicies)) {
            expect(Object.isFrozen(policy)).toBe(true);
        }
    });

    test('all policies have refetchOnWindowFocus disabled', () => {
        for (const policy of Object.values(entityQueryPolicies)) {
            expect(policy.refetchOnWindowFocus).toBe(false);
        }
    });

    test('gcTime is always greater than staleTime for all policies', () => {
        for (const [, policy] of Object.entries(entityQueryPolicies)) {
            expect(policy.gcTime).toBeGreaterThan(policy.staleTime);
        }
    });
});
