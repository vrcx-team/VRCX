import { describe, expect, test } from 'vitest';

import {
    entityQueryPolicies,
    toQueryOptions
} from '../policies';

describe('query policy configuration', () => {
    test('matches the finalized cache strategy', () => {
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
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.groupCollection).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(entityQueryPolicies.groupCalendarCollection).toMatchObject({
            staleTime: 120000,
            gcTime: 600000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(
            entityQueryPolicies.groupFollowingCalendarCollection
        ).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(entityQueryPolicies.groupFeaturedCalendarCollection).toMatchObject({
            staleTime: 300000,
            gcTime: 900000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(entityQueryPolicies.groupCalendarEvent).toMatchObject({
            staleTime: 120000,
            gcTime: 600000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.worldCollection).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.friendList).toMatchObject({
            staleTime: 20000,
            gcTime: 90000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.favoriteCollection).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.galleryCollection).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.inventoryCollection).toMatchObject({
            staleTime: 20000,
            gcTime: 120000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(entityQueryPolicies.inventoryObject).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(entityQueryPolicies.avatarGallery).toMatchObject({
            staleTime: 30000,
            gcTime: 120000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(entityQueryPolicies.fileAnalysis).toMatchObject({
            staleTime: 120000,
            gcTime: 600000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(entityQueryPolicies.worldPersistData).toMatchObject({
            staleTime: 120000,
            gcTime: 600000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(entityQueryPolicies.mutualCounts).toMatchObject({
            staleTime: 120000,
            gcTime: 600000,
            retry: 1,
            refetchOnWindowFocus: false
        });
        expect(entityQueryPolicies.visits).toMatchObject({
            staleTime: 300000,
            gcTime: 900000,
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

    test('normalizes policy values to query options', () => {
        const options = toQueryOptions(entityQueryPolicies.group);

        expect(options).toEqual({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });
});
