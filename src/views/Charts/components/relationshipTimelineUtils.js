function clampPercent(value) {
    return Math.min(100, Math.max(0, value));
}

function relationshipScore(totalTime, joinCount) {
    // Keep this aligned with the chart tooltip/description logic:
    // each shared join is weighted as an additional 1 minute of relationship time.
    return totalTime + joinCount * 60000;
}

function dayToBucket(day, firstDay, bucketDays) {
    return Math.floor((day - firstDay) / bucketDays);
}

function bucketLabel(bucketIdx, firstDay, bucketDays) {
    const startDay = firstDay + bucketIdx * bucketDays;
    const endDay = startDay + bucketDays - 1;
    const start = new Date(startDay * 86400000).toISOString().slice(0, 10);
    if (bucketDays === 1) return start;
    const end = new Date(endDay * 86400000).toISOString().slice(0, 10);
    return `${start}~${end}`;
}

function computeZoomRange(bucketCount, persistedRange = null, defaultUnits) {
    if (
        persistedRange &&
        Number.isFinite(persistedRange.start) &&
        Number.isFinite(persistedRange.end)
    ) {
        return {
            start: clampPercent(persistedRange.start),
            end: clampPercent(persistedRange.end)
        };
    }
    if (!bucketCount || bucketCount <= defaultUnits) {
        return { start: 0, end: 100 };
    }
    return {
        start: ((bucketCount - defaultUnits) / bucketCount) * 100,
        end: 100
    };
}

function aggregateFriendDaysToBuckets(friendDaysMap, bucketDays) {
    if (!friendDaysMap?.size) return null;

    let firstDay = Infinity;
    let lastDay = -Infinity;
    for (const entry of friendDaysMap.values()) {
        for (const day of entry.days.keys()) {
            if (day < firstDay) firstDay = day;
            if (day > lastDay) lastDay = day;
        }
    }
    if (!isFinite(firstDay)) return null;

    const bucketCount = dayToBucket(lastDay, firstDay, bucketDays) + 1;
    const perFriendBuckets = new Map();
    const bucketEntries = Array.from({ length: bucketCount }, () => []);
    const bucketTotals = Array.from({ length: bucketCount }, () => 0);

    for (const [userId, entry] of friendDaysMap.entries()) {
        const bucketMap = new Map();
        for (const [day, val] of entry.days.entries()) {
            const bucketIdx = dayToBucket(day, firstDay, bucketDays);
            const score = relationshipScore(val.totalTime, val.joinCount);
            const prev = bucketMap.get(bucketIdx) || 0;
            bucketMap.set(bucketIdx, prev + score);
        }
        perFriendBuckets.set(userId, {
            userId,
            displayName: entry.displayName,
            buckets: bucketMap
        });
        for (const [bucketIdx, score] of bucketMap.entries()) {
            bucketEntries[bucketIdx].push({ userId, score });
            bucketTotals[bucketIdx] += score;
        }
    }

    const xLabels = Array.from({ length: bucketCount }, (_, i) =>
        bucketLabel(i, firstDay, bucketDays)
    );

    return {
        bucketCount,
        xLabels,
        perFriendBuckets,
        bucketEntries,
        bucketTotals
    };
}

function buildPerBucketTopNPercentageSeries({
    aggregation,
    friendCount,
    showOthers,
    resolveDisplayName,
    othersName,
    colorPalette
}) {
    if (!aggregation) return null;

    const { bucketCount, xLabels, perFriendBuckets, bucketEntries, bucketTotals } = aggregation;
    if (!bucketCount) return null;

    const topN = Math.max(1, Math.min(friendCount, perFriendBuckets.size));
    const unionFriendIds = new Set();
    const friendRawDataMap = new Map();
    const friendSelectedTotals = new Map();
    const othersRawData = Array.from({ length: bucketCount }, () => 0);
    const totalsPerBucket = Array.from({ length: bucketCount }, () => 0);

    for (let bucketIdx = 0; bucketIdx < bucketCount; bucketIdx++) {
        const sortedEntries = [...bucketEntries[bucketIdx]].sort((a, b) => b.score - a.score);
        const topEntries = sortedEntries.slice(0, topN);
        let topSum = 0;
        for (const item of topEntries) {
            topSum += item.score;
            unionFriendIds.add(item.userId);
            if (!friendRawDataMap.has(item.userId)) {
                friendRawDataMap.set(item.userId, Array.from({ length: bucketCount }, () => 0));
            }
            friendRawDataMap.get(item.userId)[bucketIdx] = item.score;
            friendSelectedTotals.set(
                item.userId,
                (friendSelectedTotals.get(item.userId) || 0) + item.score
            );
        }
        const othersScore = bucketTotals[bucketIdx] - topSum;
        if (othersScore > 0) {
            othersRawData[bucketIdx] = othersScore;
        }
        totalsPerBucket[bucketIdx] = topSum + (showOthers ? othersRawData[bucketIdx] : 0);
    }

    const friendOrder = [...unionFriendIds].sort((a, b) => {
        const scoreDiff = (friendSelectedTotals.get(b) || 0) - (friendSelectedTotals.get(a) || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return a.localeCompare(b);
    });

    const toPercent = (value, bucketIdx) => {
        const total = totalsPerBucket[bucketIdx];
        if (!total) return 0;
        return parseFloat(((value / total) * 100).toFixed(2));
    };

    const series = [];
    const includeOthers = showOthers && othersRawData.some((value) => value > 0);
    if (includeOthers) {
        series.push({
            name: othersName,
            type: 'line',
            stack: 'total',
            areaStyle: { opacity: 0.7 },
            lineStyle: { width: 0 },
            smooth: true,
            symbol: 'none',
            color: '#aaaaaa',
            emphasis: {
                focus: 'series',
                areaStyle: { opacity: 0.95 }
            },
            blur: { areaStyle: { opacity: 0.3 } },
            data: othersRawData.map((value, bucketIdx) => toPercent(value, bucketIdx))
        });
    }

    for (let orderIdx = friendOrder.length - 1; orderIdx >= 0; orderIdx--) {
        const userId = friendOrder[orderIdx];
        const friendInfo = perFriendBuckets.get(userId);
        const colorIdx = orderIdx % colorPalette.length;
        const displayName = resolveDisplayName(userId, friendInfo?.displayName);
        series.push({
            name: displayName,
            type: 'line',
            stack: 'total',
            areaStyle: { opacity: 0.7 },
            lineStyle: { width: 0 },
            smooth: true,
            symbol: 'none',
            color: colorPalette[colorIdx],
            emphasis: {
                focus: 'series',
                areaStyle: { opacity: 0.95 }
            },
            blur: { areaStyle: { opacity: 0.3 } },
            data: friendRawDataMap
                .get(userId)
                .map((value, bucketIdx) => toPercent(value, bucketIdx))
        });
    }

    return { xLabels, series, bucketCount };
}

export {
    aggregateFriendDaysToBuckets,
    buildPerBucketTopNPercentageSeries,
    computeZoomRange,
    relationshipScore
};
