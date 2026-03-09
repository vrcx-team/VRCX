const SECOND = 1000;

export const entityQueryPolicies = Object.freeze({
    user: Object.freeze({
        staleTime: 20 * SECOND,
        gcTime: 90 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    avatar: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    world: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    group: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    groupCollection: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    worldCollection: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    friendList: Object.freeze({
        staleTime: 20 * SECOND,
        gcTime: 90 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    favoriteCollection: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    galleryCollection: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    inventoryCollection: Object.freeze({
        staleTime: 20 * SECOND,
        gcTime: 120 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    fileObject: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    })
});

/**
 * @param {'user'|'avatar'|'world'|'group'|'groupCollection'|'worldCollection'|'friendList'|'favoriteCollection'|'galleryCollection'|'inventoryCollection'|'fileObject'} entity
 * @returns {{staleTime: number, gcTime: number, retry: number, refetchOnWindowFocus: boolean}}
 */
export function getEntityQueryPolicy(entity) {
    return entityQueryPolicies[entity];
}

/**
 * @param {{staleTime: number, gcTime: number, retry: number, refetchOnWindowFocus: boolean}} policy
 * @returns {{staleTime: number, gcTime: number, retry: number, refetchOnWindowFocus: boolean}}
 */
export function toQueryOptions(policy) {
    return {
        staleTime: policy.staleTime,
        gcTime: policy.gcTime,
        retry: policy.retry,
        refetchOnWindowFocus: policy.refetchOnWindowFocus
    };
}
