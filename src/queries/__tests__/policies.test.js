import { describe, expect, test } from 'vitest';

import {
    entityQueryPolicies,
    getEntityQueryPolicy,
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

        expect(entityQueryPolicies.worldCollection).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });

        expect(entityQueryPolicies.instance).toMatchObject({
            staleTime: 0,
            gcTime: 10000,
            retry: 0,
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

        expect(entityQueryPolicies.fileObject).toMatchObject({
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        });
    });

    test('exposes entity policy lookup', () => {
        expect(getEntityQueryPolicy('user')).toBe(entityQueryPolicies.user);
        expect(getEntityQueryPolicy('avatar')).toBe(entityQueryPolicies.avatar);
        expect(getEntityQueryPolicy('world')).toBe(entityQueryPolicies.world);
        expect(getEntityQueryPolicy('group')).toBe(entityQueryPolicies.group);
        expect(getEntityQueryPolicy('groupCollection')).toBe(
            entityQueryPolicies.groupCollection
        );
        expect(getEntityQueryPolicy('worldCollection')).toBe(
            entityQueryPolicies.worldCollection
        );
        expect(getEntityQueryPolicy('instance')).toBe(
            entityQueryPolicies.instance
        );
        expect(getEntityQueryPolicy('friendList')).toBe(
            entityQueryPolicies.friendList
        );
        expect(getEntityQueryPolicy('favoriteCollection')).toBe(
            entityQueryPolicies.favoriteCollection
        );
        expect(getEntityQueryPolicy('galleryCollection')).toBe(
            entityQueryPolicies.galleryCollection
        );
        expect(getEntityQueryPolicy('inventoryCollection')).toBe(
            entityQueryPolicies.inventoryCollection
        );
        expect(getEntityQueryPolicy('fileObject')).toBe(
            entityQueryPolicies.fileObject
        );
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
