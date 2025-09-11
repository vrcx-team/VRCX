export function isDetailDataFiltered(
    detailData,
    isSoloInstanceVisible,
    isNoFriendInstanceVisible
) {
    if (!detailData) return false;

    if (!isSoloInstanceVisible && detailData.length <= 1) {
        return true;
    }

    if (
        !isNoFriendInstanceVisible &&
        detailData.length > 1 &&
        !detailData.some((item) => item.isFriend)
    ) {
        return true;
    }

    return false;
}

export function findMatchingDetailData(
    activityItem,
    activityDetailData,
    currentUser
) {
    if (!activityItem || !currentUser) return null;

    return activityDetailData.find((arr) => {
        const sameLocation = arr[0]?.location === activityItem.location;
        const sameJoinTime = arr
            .find((item) => item.user_id === currentUser.id)
            ?.joinTime.isSame(activityItem.joinTime);
        return sameLocation && sameJoinTime;
    });
}

export function generateYAxisLabel(worldName, isFiltered, maxLength = 20) {
    const truncatedName =
        worldName.length > maxLength
            ? `${worldName.slice(0, maxLength)}...`
            : worldName;
    return isFiltered
        ? `{filtered|${truncatedName}}`
        : `{normal|${truncatedName}}`;
}

export function formatWorldName(worldName, maxLength = 20) {
    return worldName.length > maxLength
        ? `${worldName.slice(0, maxLength)}...`
        : worldName;
}

export function useChartHelpers() {
    return {
        isDetailDataFiltered,
        findMatchingDetailData,
        generateYAxisLabel,
        formatWorldName
    };
}
