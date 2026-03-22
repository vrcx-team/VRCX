export function buildHeatmapOption({
    data,
    rawBuckets,
    dayLabels,
    hourLabels,
    weekStartsOn,
    isDarkMode,
    emptyColor,
    scaleColors,
    unitLabel
}) {
    return {
        tooltip: {
            confine: true,
            position: 'top',
            formatter: (params) => {
                const [hour, dayIndex] = params.data;
                const originalDay = (dayIndex + weekStartsOn) % 7;
                const slot = originalDay * 24 + hour;
                const minutes = Math.round(rawBuckets[slot] || 0);
                return `${dayLabels[dayIndex]} ${hourLabels[hour]}<br/><b>${minutes}</b> ${unitLabel}`;
            }
        },
        grid: {
            top: 6,
            left: 42,
            right: 16,
            bottom: 32
        },
        xAxis: {
            type: 'category',
            data: hourLabels,
            splitArea: { show: false },
            axisLabel: {
                interval: 2,
                fontSize: 10
            },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'category',
            data: dayLabels,
            inverse: true,
            splitArea: { show: false },
            axisLabel: {
                fontSize: 11
            },
            axisTick: { show: false }
        },
        visualMap: {
            min: 0,
            max: 1,
            calculable: false,
            show: false,
            type: 'piecewise',
            dimension: 2,
            pieces: [
                { min: 0, max: 0, color: emptyColor },
                { gt: 0, lte: 0.2, color: scaleColors[0] },
                { gt: 0.2, lte: 0.4, color: scaleColors[1] },
                { gt: 0.4, lte: 0.6, color: scaleColors[2] },
                { gt: 0.6, lte: 0.8, color: scaleColors[3] },
                { gt: 0.8, lte: 1, color: scaleColors[4] }
            ]
        },
        series: [
            {
                type: 'heatmap',
                data,
                emphasis: {
                    itemStyle: {
                        borderColor: isDarkMode ? 'hsl(220, 15%, 18%)' : 'hsl(210, 18%, 78%)',
                        borderWidth: 1.5,
                        opacity: 0.92
                    }
                },
                itemStyle: {
                    borderWidth: 1.5,
                    borderColor: isDarkMode ? 'hsl(220, 15%, 8%)' : 'hsl(0, 0%, 100%)',
                    borderRadius: 2
                }
            }
        ],
        backgroundColor: 'transparent'
    };
}

export function toHeatmapSeriesData(normalizedBuckets, weekStartsOn) {
    const data = [];
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const slot = day * 24 + hour;
            const displayDay = (day - weekStartsOn + 7) % 7;
            data.push([hour, displayDay, normalizedBuckets[slot]]);
        }
    }
    return data;
}
