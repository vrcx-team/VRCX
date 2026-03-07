import { queryClient } from './client';
import { queryKeys } from './keys';
import { toQueryOptions } from './policies';

const RECENCY_FIELDS = [
    'updated_at',
    'updatedAt',
    'last_activity',
    'last_login',
    'memberCountSyncedAt',
    '$location_at',
    '$lastFetch',
    '$fetchedAt',
    'created_at',
    'createdAt'
];

function getComparableEntity(data) {
    if (!data || typeof data !== 'object') {
        return null;
    }
    if (data.ref && typeof data.ref === 'object') {
        return data.ref;
    }
    if (data.json && typeof data.json === 'object' && !Array.isArray(data.json)) {
        return data.json;
    }
    return data;
}

function parseTimestamp(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value !== '') {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return null;
}

function getRecencyTimestamp(data) {
    const comparable = getComparableEntity(data);
    if (!comparable) {
        return null;
    }

    for (const field of RECENCY_FIELDS) {
        const ts = parseTimestamp(comparable[field]);
        if (ts !== null) {
            return ts;
        }
    }

    return null;
}

function shouldReplaceCurrent(currentData, nextData) {
    if (typeof currentData === 'undefined') {
        return true;
    }

    const currentTs = getRecencyTimestamp(currentData);
    const nextTs = getRecencyTimestamp(nextData);

    if (currentTs !== null && nextTs !== null) {
        return nextTs >= currentTs;
    }

    if (currentTs !== null && nextTs === null) {
        return false;
    }

    return true;
}

/**
 * @param {{queryKey: unknown[], nextData: any}} options
 */
export function patchQueryDataWithRecency({ queryKey, nextData }) {
    queryClient.setQueryData(queryKey, (currentData) => {
        if (!shouldReplaceCurrent(currentData, nextData)) {
            return currentData;
        }
        return nextData;
    });
}

/**
 * @param {{queryKey: unknown[], policy: {staleTime: number, gcTime: number, retry: number, refetchOnWindowFocus: boolean}, queryFn: () => Promise<any>}} options
 * @returns {Promise<{data: any, cache: boolean}>}
 */
export async function fetchWithEntityPolicy({ queryKey, policy, queryFn }) {
    const queryState = queryClient.getQueryState(queryKey);
    const isFresh =
        Boolean(queryState?.dataUpdatedAt) &&
        policy.staleTime > 0 &&
        Date.now() - queryState.dataUpdatedAt < policy.staleTime;

    const data = await queryClient.fetchQuery({
        queryKey,
        queryFn,
        ...toQueryOptions(policy)
    });

    return {
        data,
        cache: isFresh
    };
}

/**
 * @param {unknown[]} queryKey
 * @returns {Promise<void>}
 */
export async function refetchActiveEntityQuery(queryKey) {
    await queryClient.invalidateQueries({
        queryKey,
        exact: true,
        refetchType: 'active'
    });
}

/**
 * @param {{queryKey: unknown[], nextData: any}} options
 * @returns {Promise<void>}
 */
export async function patchAndRefetchActiveQuery({ queryKey, nextData }) {
    patchQueryDataWithRecency({ queryKey, nextData });
    await refetchActiveEntityQuery(queryKey);
}

/**
 * @param {object} ref
 */
export function patchUserFromEvent(ref) {
    if (!ref?.id) return;
    patchQueryDataWithRecency({
        queryKey: queryKeys.user(ref.id),
        nextData: {
            cache: false,
            json: ref,
            params: { userId: ref.id },
            ref
        }
    });
}

/**
 * @param {object} ref
 */
export function patchAvatarFromEvent(ref) {
    if (!ref?.id) return;
    patchQueryDataWithRecency({
        queryKey: queryKeys.avatar(ref.id),
        nextData: {
            cache: false,
            json: ref,
            params: { avatarId: ref.id },
            ref
        }
    });
}

/**
 * @param {object} ref
 */
export function patchWorldFromEvent(ref) {
    if (!ref?.id) return;
    patchQueryDataWithRecency({
        queryKey: queryKeys.world(ref.id),
        nextData: {
            cache: false,
            json: ref,
            params: { worldId: ref.id },
            ref
        }
    });
}

/**
 * @param {object} ref
 */
export function patchGroupFromEvent(ref) {
    if (!ref?.id) return;

    const nextData = {
        cache: false,
        json: ref,
        params: { groupId: ref.id },
        ref
    };

    patchQueryDataWithRecency({
        queryKey: queryKeys.group(ref.id, false),
        nextData
    });

    patchQueryDataWithRecency({
        queryKey: queryKeys.group(ref.id, true),
        nextData
    });
}

/**
 * @param {object} ref
 */
export function patchInstanceFromEvent(ref) {
    if (!ref?.id) return;

    const [worldId, instanceId] = String(ref.id).split(':');
    if (!worldId || !instanceId) return;

    patchQueryDataWithRecency({
        queryKey: queryKeys.instance(worldId, instanceId),
        nextData: {
            cache: false,
            json: ref,
            params: { worldId, instanceId },
            ref
        }
    });
}

export const _entityCacheInternals = {
    getRecencyTimestamp,
    shouldReplaceCurrent
};
