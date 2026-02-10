import { computed, reactive, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { createRateLimiter, executeWithBackoff } from '../shared/utils';
import { database } from '../service/database';
import { useFriendStore } from './friend';
import { useUserStore } from './user';
import { userRequest } from '../api';

function createDefaultFetchState() {
    return {
        processedFriends: 0
    };
}

const EMPTY_USER_ID = 'usr_00000000-0000-0000-0000-000000000000';

function normalizeIdentifier(value) {
    if (typeof value === 'string') return value;
    if (value === undefined || value === null) return '';
    return String(value);
}

function isValidMutualIdentifier(value) {
    const identifier = normalizeIdentifier(value);
    return Boolean(identifier && identifier !== EMPTY_USER_ID);
}

export const useChartsStore = defineStore('Charts', () => {
    const friendStore = useFriendStore();
    const userStore = useUserStore();

    const { t } = useI18n();

    const router = useRouter();

    const mutualGraphFetchState = reactive(createDefaultFetchState());
    const mutualGraphStatus = reactive({
        isFetching: false,
        hasFetched: false,
        completionNotified: false,
        friendSignature: 0,
        needsRefetch: false,
        cancelRequested: false
    });

    const friendCount = computed(() => friendStore.friends.size || 0);
    const currentUser = computed(
        () => userStore.currentUser?.value ?? userStore.currentUser
    );
    const isOptOut = computed(() =>
        Boolean(currentUser.value?.hasSharedConnectionsOptOut)
    );

    function showInfoMessage(message, type) {
        const toastFn = toast[type] ?? toast;
        toastFn(message, { duration: 4000 });
    }

    watch(
        () => mutualGraphStatus.isFetching,
        (isFetching) => {
            if (!isFetching) return;
            showInfoMessage(
                t('view.charts.mutual_friend.notifications.start_fetching'),
                'info'
            );
            mutualGraphStatus.completionNotified = false;
        }
    );

    watch(
        () => [mutualGraphStatus.hasFetched, mutualGraphStatus.isFetching],
        ([hasFetched, isFetching]) => {
            if (
                !hasFetched ||
                isFetching ||
                mutualGraphStatus.completionNotified
            )
                return;
            mutualGraphStatus.completionNotified = true;
            toast.success(
                t(
                    'view.charts.mutual_friend.notifications.mutual_friend_graph_ready_title'
                ),
                {
                    description: t(
                        'view.charts.mutual_friend.notifications.mutual_friend_graph_ready_message'
                    ),
                    action: {
                        label: t('common.actions.open'),
                        onClick: () => router.push({ name: 'charts-mutual' })
                    }
                }
            );
        }
    );

    watch(friendCount, (count) => {
        if (
            !mutualGraphStatus.hasFetched ||
            mutualGraphStatus.isFetching ||
            !mutualGraphStatus.friendSignature ||
            mutualGraphStatus.needsRefetch
        ) {
            return;
        }
        if (count !== mutualGraphStatus.friendSignature) {
            mutualGraphStatus.needsRefetch = true;
            showInfoMessage(
                t(
                    'view.charts.mutual_friend.notifications.friend_list_changed_fetch_again'
                ),
                'warning'
            );
        }
    });

    function resetMutualGraphState() {
        Object.assign(mutualGraphFetchState, createDefaultFetchState());
        mutualGraphStatus.isFetching = false;
        mutualGraphStatus.hasFetched = false;
        mutualGraphStatus.completionNotified = false;
        mutualGraphStatus.friendSignature = 0;
        mutualGraphStatus.needsRefetch = false;
        mutualGraphStatus.cancelRequested = false;
    }

    function markMutualGraphLoaded({ notify = true } = {}) {
        mutualGraphStatus.completionNotified = notify ? false : true;
        mutualGraphStatus.hasFetched = true;
    }

    function requestMutualGraphCancel() {
        if (mutualGraphStatus.isFetching)
            mutualGraphStatus.cancelRequested = true;
    }

    async function fetchMutualGraph() {
        if (mutualGraphStatus.isFetching || isOptOut.value) return null;

        if (!friendCount.value) {
            showInfoMessage(
                t('view.charts.mutual_friend.status.no_friends_to_process'),
                'info'
            );
            return null;
        }

        const rateLimiter = createRateLimiter({
            limitPerInterval: 5,
            intervalMs: 1000
        });

        const isCancelled = () => mutualGraphStatus.cancelRequested === true;

        const fetchMutualFriends = async (userId) => {
            const collected = [];
            let offset = 0;

            while (true) {
                if (isCancelled()) break;
                await rateLimiter.wait();
                if (isCancelled()) break;

                const args = await executeWithBackoff(
                    () => {
                        if (isCancelled()) throw new Error('cancelled');
                        return userRequest.getMutualFriends({
                            userId,
                            offset,
                            n: 100
                        });
                    },
                    {
                        maxRetries: 4,
                        baseDelay: 500,
                        shouldRetry: (err) =>
                            err?.status === 429 ||
                            (err?.message || '').includes('429')
                    }
                ).catch((err) => {
                    if ((err?.message || '') === 'cancelled') return null;
                    throw err;
                });

                if (!args || isCancelled()) break;

                collected.push(
                    ...args.json.filter((entry) =>
                        isValidMutualIdentifier(entry?.id)
                    )
                );

                if (args.json.length < 100) break;
                offset += args.json.length;
            }

            return collected;
        };

        mutualGraphStatus.isFetching = true;
        mutualGraphStatus.completionNotified = false;
        mutualGraphStatus.needsRefetch = false;
        mutualGraphStatus.cancelRequested = false;
        mutualGraphStatus.hasFetched = false;
        Object.assign(mutualGraphFetchState, { processedFriends: 0 });

        const friendSnapshot = Array.from(friendStore.friends.values());
        const mutualMap = new Map();

        let cancelled = false;

        try {
            for (let index = 0; index < friendSnapshot.length; index += 1) {
                const friend = friendSnapshot[index];
                if (!friend?.id) continue;

                if (isCancelled()) {
                    cancelled = true;
                    break;
                }

                try {
                    const mutuals = await fetchMutualFriends(friend.id);
                    if (isCancelled()) {
                        cancelled = true;
                        break;
                    }
                    mutualMap.set(friend.id, { friend, mutuals });
                } catch (err) {
                    if ((err?.message || '') === 'cancelled' || isCancelled()) {
                        cancelled = true;
                        break;
                    }
                    console.warn(
                        '[MutualNetworkGraph] Skipping friend due to fetch error',
                        friend.id,
                        err
                    );
                    continue;
                }

                mutualGraphFetchState.processedFriends = index + 1;
                if (mutualGraphStatus.cancelRequested) {
                    cancelled = true;
                    break;
                }
            }

            if (cancelled) {
                mutualGraphStatus.hasFetched = false;
                showInfoMessage(
                    t(
                        'view.charts.mutual_friend.messages.fetch_cancelled_graph_not_updated'
                    ),
                    'warning'
                );
                return null;
            }

            mutualGraphStatus.friendSignature = friendCount.value;
            mutualGraphStatus.needsRefetch = false;

            try {
                const entries = new Map();
                mutualMap.forEach((value, friendId) => {
                    if (!friendId) return;
                    const normalizedFriendId = String(friendId);
                    const collection = Array.isArray(value?.mutuals)
                        ? value.mutuals
                        : [];
                    const ids = [];

                    for (const entry of collection) {
                        const identifier = normalizeIdentifier(entry?.id);
                        if (isValidMutualIdentifier(identifier))
                            ids.push(identifier);
                    }

                    entries.set(normalizedFriendId, ids);
                });
                await database.saveMutualGraphSnapshot(entries);
            } catch (persistErr) {
                console.error(
                    '[MutualNetworkGraph] Failed to cache data',
                    persistErr
                );
            }

            markMutualGraphLoaded({ notify: true });
            return mutualMap;
        } catch (err) {
            console.error('[MutualNetworkGraph] fetch aborted', err);
            return null;
        } finally {
            mutualGraphStatus.isFetching = false;
            mutualGraphStatus.cancelRequested = false;
        }
    }

    return {
        mutualGraphFetchState,
        mutualGraphStatus,
        resetMutualGraphState,
        markMutualGraphLoaded,
        requestMutualGraphCancel,
        fetchMutualGraph
    };
});
