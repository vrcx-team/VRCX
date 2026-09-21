import { computed, ref, unref, watch } from 'vue';

import { database } from '../../../../services/database';
import { parseLocation } from '../../../../shared/utils';

function parseMaxAgeMinutes(value) {
    const minutes = Number(value);
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return null;
    }
    return minutes;
}

/**
 * Resolves the instance the player shown in the user dialog was last seen in, so
 * it can still be shown while their location is hidden. `maxAgeMinutes` caps how
 * old that instance may be, measured from when it stopped being current; '0'
 * means no limit.
 *
 * @param {object} options
 * @param {import('vue').Ref<object> | object} options.userDialog
 * @param {import('vue').Ref<object> | object} options.currentUser
 * @param {import('vue').Ref<boolean> | boolean} options.isEnabled
 * @param {import('vue').Ref<string> | string} [options.maxAgeMinutes]
 * @returns {{
 *     lastKnownLocation: import('vue').Ref<object | null>;
 *     isLoading: import('vue').Ref<boolean>;
 * }}
 */
export function useLastKnownLocation({ userDialog, currentUser, isEnabled, maxAgeMinutes }) {
    const lastKnownLocation = ref(null);
    const isLoading = ref(false);

    const shouldLookup = computed(() => {
        const user = unref(userDialog);
        if (!unref(isEnabled) || !user?.visible || user.loading || !user.id) {
            return false;
        }
        if (user.id === unref(currentUser)?.id) {
            return false;
        }
        return Boolean(user.$location) && !user.$location.isRealInstance;
    });

    async function load() {
        if (!shouldLookup.value) {
            lastKnownLocation.value = null;
            return;
        }

        const user = unref(userDialog);
        isLoading.value = true;
        try {
            const row = await database.getLastKnownGPSLocation({
                id: user.id,
                displayName: user.ref?.displayName || ''
            });
            if (!row || !parseLocation(row.location).isRealInstance) {
                lastKnownLocation.value = null;
                return;
            }
            lastKnownLocation.value = {
                location: row.location,
                $location: parseLocation(row.location),
                worldName: row.worldName,
                lastSeenAt: Date.parse(row.createdAt) || 0
            };
        } catch (err) {
            lastKnownLocation.value = null;
            console.error('Failed to resolve last known location:', err);
        } finally {
            isLoading.value = false;
        }
    }

    const visibleLocation = computed(() => {
        const found = lastKnownLocation.value;
        const limit = parseMaxAgeMinutes(unref(maxAgeMinutes));
        if (!found || limit === null) {
            return found;
        }
        return Date.now() - found.lastSeenAt > limit * 60 * 1000 ? null : found;
    });

    watch(
        () => [unref(isEnabled), unref(userDialog)?.id, unref(userDialog)?.visible, unref(userDialog)?.$location?.tag],
        load,
        { immediate: true }
    );

    return { lastKnownLocation: visibleLocation, isLoading };
}

export { parseMaxAgeMinutes };
