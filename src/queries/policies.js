const SECOND = 1000;
const MINUTE = 60 * SECOND;

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
        staleTime: 5 * MINUTE,
        gcTime: 30 * MINUTE,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    groupCollection: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    groupCalendarEvent: Object.freeze({
        staleTime: 120 * SECOND,
        gcTime: 600 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    worldCollection: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    favoriteLimits: Object.freeze({
        staleTime: 600 * SECOND,
        gcTime: 1800 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    inventoryCollection: Object.freeze({
        staleTime: 20 * SECOND,
        gcTime: 120 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    avatarGallery: Object.freeze({
        staleTime: 30 * SECOND,
        gcTime: 120 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    fileAnalysis: Object.freeze({
        staleTime: 60 * MINUTE,
        gcTime: 240 * MINUTE,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    worldPersistData: Object.freeze({
        staleTime: 30 * MINUTE,
        gcTime: 120 * MINUTE,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    mutualCounts: Object.freeze({
        staleTime: 15 * MINUTE,
        gcTime: 60 * MINUTE,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    visits: Object.freeze({
        staleTime: 30 * MINUTE,
        gcTime: 120 * MINUTE,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    fileObject: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    avatarStyles: Object.freeze({
        staleTime: 60 * MINUTE,
        gcTime: 240 * MINUTE,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    representedGroup: Object.freeze({
        staleTime: 60 * SECOND,
        gcTime: 300 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    }),
    vrchatCredits: Object.freeze({
        staleTime: 120 * SECOND,
        gcTime: 600 * SECOND,
        retry: 1,
        refetchOnWindowFocus: false
    })
});

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
