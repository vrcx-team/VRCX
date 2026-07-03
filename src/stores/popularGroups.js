import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import {
    aggregateFriendGroups,
    createRateLimiter,
    executeWithBackoff
} from '../shared/utils';
import { database } from '../services/database';
import { useFriendStore } from './friend';
import { useGroupStore } from './group';
import { groupRequest } from '../api';

function createDefaultFetchState() {
    return {
        processedFriends: 0
    };
}

function normalizeIdentifier(value) {
    if (typeof value === 'string') return value;
    if (value === undefined || value === null) return '';
    return String(value);
}

export const usePopularGroupsStore = defineStore('PopularGroups', () => {
    const friendStore = useFriendStore();
    const groupStore = useGroupStore();

    const { t } = useI18n();
    const router = useRouter();

    const fetchState = reactive(createDefaultFetchState());
    const status = reactive({
        isFetching: false,
        hasFetched: false,
        completionNotified: false,
        friendSignature: 0,
        needsRefetch: false,
        cancelRequested: false
    });

    const groupRanking = ref([]);
    const lastFetchedAt = ref(null);
    const skippedFriendCount = ref(0);

    const friendCount = computed(() => friendStore.friends.size || 0);

    function showInfoMessage(message, type) {
        const toastFn = toast[type] ?? toast;
        toastFn(message, { duration: 4000 });
    }

    watch(friendCount, (count) => {
        if (
            !status.hasFetched ||
            status.isFetching ||
            !status.friendSignature ||
            status.needsRefetch
        ) {
            return;
        }
        if (count !== status.friendSignature) {
            status.needsRefetch = true;
            showInfoMessage(
                t('view.charts.popular_groups.notifications.friend_list_changed'),
                'warning'
            );
        }
    });

    function resetState() {
        Object.assign(fetchState, createDefaultFetchState());
        status.isFetching = false;
        status.hasFetched = false;
        status.completionNotified = false;
        status.friendSignature = 0;
        status.needsRefetch = false;
        status.cancelRequested = false;
        groupRanking.value = [];
        lastFetchedAt.value = null;
        skippedFriendCount.value = 0;
    }

    function requestCancel() {
        if (status.isFetching) {
            status.cancelRequested = true;
        }
    }

    function buildRanking(links, groups) {
        const joinedGroupIds = new Set(groupStore.currentUserGroups.keys());
        groupRanking.value = aggregateFriendGroups(links, groups, {
            joinedGroupIds
        });
    }

    async function loadFromDatabase() {
        try {
            const snapshot = await database.getFriendGroupsSnapshot();
            buildRanking(snapshot.links, snapshot.groups);
            skippedFriendCount.value = Array.from(
                snapshot.meta.values()
            ).filter((meta) => meta.unavailable).length;
            if (snapshot.links.size > 0 || snapshot.groups.size > 0) {
                status.hasFetched = true;
                status.completionNotified = true;
            }
        } catch (err) {
            console.error('[PopularGroups] Failed to load cached data', err);
        }
    }

    async function fetchFriendGroups() {
        if (status.isFetching) {
            return null;
        }

        if (!friendCount.value) {
            showInfoMessage(
                t('view.charts.popular_groups.status.no_friends_to_process'),
                'info'
            );
            return null;
        }

        const rateLimiter = createRateLimiter({
            limitPerInterval: 5,
            intervalMs: 1000
        });
        const isCancelled = () => status.cancelRequested === true;

        status.isFetching = true;
        status.completionNotified = false;
        status.needsRefetch = false;
        status.cancelRequested = false;
        Object.assign(fetchState, { processedFriends: 0 });

        showInfoMessage(
            t('view.charts.popular_groups.notifications.start_fetching'),
            'info'
        );

        const friendSnapshot = Array.from(friendStore.friends.values());
        const links = new Map();
        const groupInfo = new Map();
        const metaEntries = new Map();
        let skipped = 0;
        let cancelled = false;

        try {
            for (let index = 0; index < friendSnapshot.length; index += 1) {
                const friend = friendSnapshot[index];
                if (!friend?.id) continue;

                if (isCancelled()) {
                    cancelled = true;
                    break;
                }

                await rateLimiter.wait();
                if (isCancelled()) {
                    cancelled = true;
                    break;
                }

                try {
                    const args = await executeWithBackoff(
                        () => {
                            if (isCancelled()) throw new Error('cancelled');
                            return groupRequest.getGroups({ userId: friend.id });
                        },
                        {
                            maxRetries: 4,
                            baseDelay: 500,
                            shouldRetry: (err) =>
                                err?.status === 429 ||
                                (err?.message || '').includes('429')
                        }
                    );

                    const groupIds = [];
                    for (const group of args.json || []) {
                        // The `users/{userId}/groups` endpoint returns list items where
                        // `id` is the group *membership* ID (gmem_...) and `groupId` is
                        // the actual group ID (grp_...). Using `id` here would pass a
                        // membership ID to getGroup()/showGroupDialog() and 404.
                        const groupId = normalizeIdentifier(
                            group?.groupId || group?.id
                        );
                        if (!groupId) continue;
                        groupIds.push(groupId);
                        groupInfo.set(groupId, {
                            name: group.name || '',
                            shortCode: group.shortCode || '',
                            discriminator: group.discriminator || '',
                            iconUrl: group.iconUrl || '',
                            bannerUrl: group.bannerUrl || '',
                            memberCount: Number(group.memberCount) || 0,
                            ownerId: group.ownerId || ''
                        });
                    }
                    links.set(friend.id, groupIds);
                    metaEntries.set(friend.id, { unavailable: false });
                } catch (err) {
                    if ((err?.message || '') === 'cancelled' || isCancelled()) {
                        cancelled = true;
                        break;
                    }
                    const statusCode = err?.status;
                    if (statusCode === 403 || statusCode === 404) {
                        metaEntries.set(friend.id, { unavailable: true });
                        skipped += 1;
                    } else {
                        console.warn(
                            '[PopularGroups] Skipping friend due to fetch error',
                            friend.id,
                            err
                        );
                    }
                }

                fetchState.processedFriends = index + 1;
                if (status.cancelRequested) {
                    cancelled = true;
                    break;
                }
            }

            if (cancelled) {
                status.hasFetched = groupRanking.value.length > 0;
                showInfoMessage(
                    t('view.charts.popular_groups.messages.fetch_cancelled'),
                    'warning'
                );
                return null;
            }

            status.friendSignature = friendCount.value;
            status.needsRefetch = false;
            skippedFriendCount.value = skipped;

            // Write meta first so saveFriendGroupsSnapshot's DELETE uses
            // up-to-date unavailable flags to decide what to preserve.
            if (metaEntries.size > 0) {
                await database.bulkUpsertFriendGroupsMeta(metaEntries);
            }

            try {
                await database.saveFriendGroupsSnapshot(links, groupInfo);
            } catch (persistErr) {
                console.error('[PopularGroups] Failed to cache data', persistErr);
            }

            buildRanking(links, groupInfo);
            lastFetchedAt.value = new Date().toISOString();
            status.hasFetched = true;
            status.completionNotified = true;

            toast.success(
                t('view.charts.popular_groups.notifications.ready_title'),
                {
                    description: t(
                        'view.charts.popular_groups.notifications.ready_message'
                    ),
                    action: {
                        label: t('common.actions.open'),
                        onClick: () =>
                            router.push({ name: 'charts-popular-groups' })
                    }
                }
            );

            return groupRanking.value;
        } catch (err) {
            console.error('[PopularGroups] fetch aborted', err);
            return null;
        } finally {
            status.isFetching = false;
            status.cancelRequested = false;
        }
    }

    return {
        fetchState,
        status,
        groupRanking,
        lastFetchedAt,
        skippedFriendCount,
        friendCount,
        resetState,
        requestCancel,
        loadFromDatabase,
        fetchFriendGroups
    };
});
