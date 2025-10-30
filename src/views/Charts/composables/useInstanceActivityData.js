import { nextTick, reactive, ref } from 'vue';

import dayjs from 'dayjs';

import { database } from '../../../service/database';
import { getWorldName } from '../../../shared/utils';

export function useInstanceActivityData() {
    const activityData = ref([]);
    const activityDetailData = ref([]);
    const allDateOfActivity = ref(new Set());
    const worldNameArray = ref([]);

    async function getAllDateOfActivity() {
        const utcDateStrings =
            (await database.getDateOfInstanceActivity()) || [];
        const uniqueDates = new Set();

        for (const utcString of utcDateStrings) {
            const formattedDate = dayjs
                .utc(utcString)
                .tz()
                .format('YYYY-MM-DD');
            uniqueDates.add(formattedDate);
        }

        allDateOfActivity.value = reactive(uniqueDates);
    }

    async function getWorldNameData() {
        worldNameArray.value = await Promise.all(
            activityData.value.map(async (item) => {
                try {
                    return await getWorldName(item.location);
                } catch {
                    console.error(
                        'getWorldName failed location',
                        item.location
                    );
                    return 'Unknown world';
                }
            })
        );
    }

    async function getActivityData(
        selectedDate,
        currentUser,
        friends,
        localFavoriteFriends,
        onActivityDetailReady
    ) {
        const localStartDate = dayjs
            .tz(selectedDate.value)
            .startOf('day')
            .toISOString();
        const localEndDate = dayjs
            .tz(selectedDate.value)
            .endOf('day')
            .toISOString();
        const dbData = await database.getInstanceActivity(
            localStartDate,
            localEndDate
        );

        const transformData = (item) => ({
            ...item,
            joinTime: dayjs(item.created_at).subtract(item.time, 'millisecond'),
            leaveTime: dayjs(item.created_at),
            time: item.time < 0 ? 0 : item.time,
            isFriend:
                item.user_id === currentUser.value.id
                    ? null
                    : friends.value.has(item.user_id),
            isFavorite:
                item.user_id === currentUser.value.id
                    ? null
                    : localFavoriteFriends.value.has(item.user_id)
        });

        activityData.value = dbData.currentUserData.map(transformData);

        const transformAndSort = (arr) => {
            return arr.map(transformData).sort((a, b) => {
                const timeDiff = Math.abs(
                    a.joinTime.diff(b.joinTime, 'second')
                );
                // recording delay, under 3s is considered the same time entry, beautify the chart
                return timeDiff < 3
                    ? a.leaveTime - b.leaveTime
                    : a.joinTime - b.joinTime;
            });
        };

        const filterByLocation = (innerArray, locationSet) => {
            return innerArray.every((innerObject) =>
                locationSet.has(innerObject.location)
            );
        };
        const locationSet = new Set(
            activityData.value.map((item) => item.location)
        );

        const preSplitActivityDetailData = Array.from(
            dbData.detailData.values()
        )
            .map(transformAndSort)
            .filter((innerArray) => filterByLocation(innerArray, locationSet));

        activityDetailData.value = handleSplitActivityDetailData(
            preSplitActivityDetailData,
            currentUser.value.id
        );

        if (activityDetailData.value.length && onActivityDetailReady) {
            nextTick(() => {
                onActivityDetailReady();
            });
        }
    }

    function handleSplitActivityDetailData(activityDetailData, currentUserId) {
        function countTargetIdOccurrences(innerArray, targetId) {
            let count = 0;
            for (const obj of innerArray) {
                if (obj.user_id === targetId) {
                    count++;
                }
            }
            return count;
        }

        function areIntervalsOverlapping(objA, objB) {
            const isObj1EndTimeBeforeObj2StartTime = objA.leaveTime.isBefore(
                objB.joinTime,
                'second'
            );
            const isObj2EndTimeBeforeObj1StartTime = objB.leaveTime.isBefore(
                objA.joinTime,
                'second'
            );
            return !(
                isObj1EndTimeBeforeObj2StartTime ||
                isObj2EndTimeBeforeObj1StartTime
            );
        }

        function buildOverlapGraph(innerArray) {
            const numObjects = innerArray.length;
            const adjacencyList = Array.from({ length: numObjects }, () => []);

            for (let i = 0; i < numObjects; i++) {
                for (let j = i + 1; j < numObjects; j++) {
                    if (areIntervalsOverlapping(innerArray[i], innerArray[j])) {
                        adjacencyList[i].push(j);
                        adjacencyList[j].push(i);
                    }
                }
            }
            return adjacencyList;
        }

        function depthFirstSearch(nodeIndex, visited, graph, component) {
            visited[nodeIndex] = true;
            component.push(nodeIndex);
            for (const neighborIndex of graph[nodeIndex]) {
                if (!visited[neighborIndex]) {
                    depthFirstSearch(neighborIndex, visited, graph, component);
                }
            }
        }

        function findConnectedComponents(graph, numNodes) {
            const visited = new Array(numNodes).fill(false);
            const components = [];

            for (let i = 0; i < numNodes; i++) {
                if (!visited[i]) {
                    const component = [];
                    depthFirstSearch(i, visited, graph, component);
                    components.push(component);
                }
            }
            return components;
        }

        function processOuterArrayWithTargetId(outerArray, targetId) {
            let i = 0;
            while (i < outerArray.length) {
                let currentInnerArray = outerArray[i];
                let targetIdCount = countTargetIdOccurrences(
                    currentInnerArray,
                    targetId
                );
                if (targetIdCount > 1) {
                    let graph = buildOverlapGraph(currentInnerArray);
                    let connectedComponents = findConnectedComponents(
                        graph,
                        currentInnerArray.length
                    );
                    let newInnerArrays = connectedComponents.map(
                        (componentIndices) => {
                            return componentIndices.map(
                                (index) => currentInnerArray[index]
                            );
                        }
                    );
                    outerArray.splice(i, 1, ...newInnerArrays);
                    i += newInnerArrays.length;
                } else {
                    i += 1;
                }
            }
            return outerArray.sort((a, b) => a[0].joinTime - b[0].joinTime);
        }

        return processOuterArrayWithTargetId(activityDetailData, currentUserId);
    }

    return {
        activityData,
        activityDetailData,
        allDateOfActivity,
        worldNameArray,

        getAllDateOfActivity,
        getWorldNameData,
        getActivityData
    };
}
