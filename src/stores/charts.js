import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { useFriendStore } from './friend';

function createDefaultFetchState() {
    return {
        processedFriends: 0
    };
}

function createDefaultPayload() {
    return {
        nodes: [],
        links: []
    };
}

export const useChartsStore = defineStore('Charts', () => {
    const friendStore = useFriendStore();

    const { t } = useI18n();

    const activeTab = ref('instance');
    const mutualGraphPayload = ref(createDefaultPayload());
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

    function showInfoMessage(message, type) {
        const toastFn = toast[type] ?? toast;
        toastFn(message, { duration: 4000 });
    }

    watch(
        () => mutualGraphStatus.isFetching,
        (isFetching, wasFetching) => {
            if (isFetching) {
                showInfoMessage(
                    t('view.charts.mutual_friend.notifications.start_fetching'),
                    'info'
                );
                mutualGraphStatus.completionNotified = false;
            } else if (
                wasFetching &&
                mutualGraphStatus.hasFetched &&
                !mutualGraphStatus.completionNotified
            ) {
                mutualGraphStatus.completionNotified = true;
                toast.success(
                    t(
                        'view.charts.mutual_friend.notifications.mutual_friend_graph_ready_title'
                    ),
                    {
                        description: t(
                            'view.charts.mutual_friend.notifications.mutual_friend_graph_ready_message'
                        )
                    }
                );
            }
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
        mutualGraphPayload.value = createDefaultPayload();
        Object.assign(mutualGraphFetchState, createDefaultFetchState());
        mutualGraphStatus.isFetching = false;
        mutualGraphStatus.hasFetched = false;
        mutualGraphStatus.completionNotified = false;
        mutualGraphStatus.friendSignature = 0;
        mutualGraphStatus.needsRefetch = false;
        mutualGraphStatus.cancelRequested = false;
    }

    return {
        activeTab,
        mutualGraphPayload,
        mutualGraphFetchState,
        mutualGraphStatus,
        resetMutualGraphState
    };
});
