import { computed, onScopeDispose, ref, unref, watch } from 'vue';

import { instanceRequest } from '../../../../api';
import { database } from '../../../../services/database';
import { parseLocation } from '../../../../shared/utils';
import { getGameLogCreatedAtTs } from '../../../../shared/utils/gameLog';
import { useInstanceStore } from '../../../../stores';

const STALENESS_TICK_MS = 30 * 1000;

function parseMaxAgeMinutes(value) {
    const minutes = Number(value);
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return null;
    }
    return minutes;
}

async function findLastKnownInstance(userRef) {
    if (!userRef || (!userRef.id && !userRef.displayName)) {
        return null;
    }

    const gps = await database.getLastKnownGPSLocation({
        id: userRef.id,
        displayName: userRef.displayName
    });
    if (gps) {
        const location =
            gps.previousLocation && parseLocation(gps.previousLocation).isRealInstance
                ? gps.previousLocation
                : gps.location;
        if (parseLocation(location).isRealInstance) {
            const worldName = gps.worldName || (await database.getWorldNameByLocation(location)) || '';
            return {
                location,
                lastSeenAt: Date.parse(gps.createdAt) || 0,
                worldName
            };
        }
    }

    const instances = await database.getPreviousInstancesByUserId({
        id: userRef.id,
        displayName: userRef.displayName
    });
    if (!instances || typeof instances.values !== 'function') {
        return null;
    }

    // Returned oldest first, so the newest real visit wins.
    let lastKnown = null;
    let lastKnownLastSeenAt = 0;
    for (const instance of instances.values()) {
        if (!parseLocation(instance.location).isRealInstance) {
            continue;
        }
        const lastSeenAt = Number(instance.last_ts) || getGameLogCreatedAtTs(instance);
        if (!lastKnown || lastSeenAt >= lastKnownLastSeenAt) {
            lastKnown = instance;
            lastKnownLastSeenAt = lastSeenAt;
        }
    }

    if (!lastKnown) {
        return null;
    }

    return {
        location: lastKnown.location,
        lastSeenAt: lastKnownLastSeenAt,
        worldName: lastKnown.worldName || ''
    };
}

/**
 * Resolves the last known location of the player shown in the user dialog,
 * while their own location is hidden. `maxAgeMinutes` caps how old that
 * location may be, measured from when it stopped being current.
 *
 * @param {object} options
 * @param {import('vue').Ref<object> | object} options.userDialog
 * @param {import('vue').Ref<object> | object} options.currentUser
 * @param {import('vue').Ref<boolean> | boolean} options.isEnabled
 * @param {import('vue').Ref<string> | string} [options.maxAgeMinutes] - '0' for unlimited
 * @returns {{
 *     lastKnownLocation: import('vue').Ref<object | null>;
 *     isLoading: import('vue').Ref<boolean>;
 * }}
 */
export function useLastKnownLocation({ userDialog, currentUser, isEnabled, maxAgeMinutes }) {
    const instanceStore = useInstanceStore();

    const lastKnownLocation = ref(null);
    const lastKnownInstanceRef = ref(null);
    const isLoading = ref(false);
    const now = ref(Date.now());
    let lookupToken = 0;

    const window = computed(() => parseMaxAgeMinutes(unref(maxAgeMinutes)));

    const shouldLookup = computed(() => {
        if (!unref(isEnabled)) {
            return false;
        }
        const user = unref(userDialog);
        if (!user || !user.visible || user.loading) {
            return false;
        }
        const me = unref(currentUser);
        if (!user.id || user.id === me?.id) {
            return false;
        }
        const $location = user.$location;
        if (!$location) {
            return false;
        }
        return !$location.isRealInstance;
    });

    // Lets a shown location age out while the dialog stays open.
    const stalenessTimer = setInterval(() => {
        now.value = Date.now();
    }, STALENESS_TICK_MS);
    onScopeDispose(() => clearInterval(stalenessTimer));

    function resolveInstanceRef(location) {
        const cached = instanceStore.cachedInstances.get(location);
        if (cached) {
            lastKnownInstanceRef.value = cached;
            return;
        }
        lastKnownInstanceRef.value = null;

        const L = parseLocation(location);
        instanceRequest.getInstance({ worldId: L.worldId, instanceId: L.instanceId }).catch((err) => {
            console.error('Failed to fetch last known instance details:', err);
        });
    }

    async function refresh() {
        const token = ++lookupToken;
        if (!shouldLookup.value) {
            lastKnownLocation.value = null;
            lastKnownInstanceRef.value = null;
            isLoading.value = false;
            return;
        }

        const user = unref(userDialog);
        isLoading.value = true;
        try {
            const lastKnown = await findLastKnownInstance({
                id: user.id,
                displayName: user.ref?.displayName || ''
            });
            if (token !== lookupToken) {
                return;
            }
            if (!lastKnown) {
                lastKnownLocation.value = null;
                lastKnownInstanceRef.value = null;
                return;
            }
            lastKnownLocation.value = {
                location: lastKnown.location,
                $location: parseLocation(lastKnown.location),
                worldName: lastKnown.worldName || '',
                lastSeenAt: lastKnown.lastSeenAt
            };
            resolveInstanceRef(lastKnown.location);
        } catch (err) {
            if (token === lookupToken) {
                lastKnownLocation.value = null;
                lastKnownInstanceRef.value = null;
            }
            console.error('Failed to resolve last known location:', err);
        } finally {
            if (token === lookupToken) {
                isLoading.value = false;
            }
        }
    }

    const freshLocation = computed(() => {
        const location = lastKnownLocation.value;
        if (!location) {
            return null;
        }
        const limit = window.value;
        if (limit === null) {
            return location;
        }
        if (now.value - location.lastSeenAt > limit * 60 * 1000) {
            return null;
        }
        return location;
    });

    const resolvedLastKnownLocation = computed(() => {
        const location = freshLocation.value;
        if (!location) {
            return null;
        }
        return {
            ...location,
            instance: lastKnownInstanceRef.value
        };
    });

    watch(
        () => [
            unref(isEnabled),
            unref(maxAgeMinutes),
            unref(userDialog)?.id,
            unref(userDialog)?.visible,
            unref(userDialog)?.loading,
            unref(userDialog)?.$location?.tag,
            unref(userDialog)?.ref?.$location_at
        ],
        refresh,
        { immediate: true }
    );

    return { lastKnownLocation: resolvedLastKnownLocation, isLoading };
}

export { findLastKnownInstance, parseMaxAgeMinutes };
