import { computed } from 'vue';

export function useActivityStats(activityData) {
    const totalOnlineTime = computed(() => {
        return activityData.value?.reduce((acc, item) => acc + item.time, 0);
    });

    return {
        totalOnlineTime
    };
}