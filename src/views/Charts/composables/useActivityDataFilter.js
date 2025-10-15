import { computed } from 'vue';

export function useActivityDataFilter(
    activityDetailData,
    isDetailVisible,
    isSoloInstanceVisible,
    isNoFriendInstanceVisible
) {
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
        filteredActivityDetailData
    };
}
