import { computed } from 'vue';

export function useActivityDataProcessor(
    activityData,
    activityDetailData,
    isDetailVisible,
    isSoloInstanceVisible,
    isNoFriendInstanceVisible
) {
    const totalOnlineTime = computed(() => {
        return activityData.value?.reduce((acc, item) => acc + item.time, 0);
    });

    const filteredActivityDetailData = computed(() => {
        if (!isDetailVisible.value) {
            return [];
        }
        let result = [...activityDetailData.value];
        if (!isSoloInstanceVisible.value) {
            result = result.filter((arr) => arr.length > 1);
        }
        if (!isNoFriendInstanceVisible.value) {
            result = result.filter((arr) => {
                // solo instance
                if (arr.length === 1) {
                    return true;
                }
                return arr.some((item) => item.isFriend);
            });
        }
        return result;
    });

    return {
        totalOnlineTime,
        filteredActivityDetailData
    };
}
