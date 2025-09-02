<template>
    <safe-dialog
        class="x-dialog"
        :visible="visible"
        :title="t('dialog.group_calendar.header')"
        :show-close="false"
        width="90vw"
        height="80vh"
        @close="closeDialog">
        <template #title>
            <div class="dialog-title-container">
                <span>{{ t('dialog.group_calendar.header') }}</span>
                <!-- <el-button @click="toggleViewMode" type="primary" size="small" class="view-toggle-btn">
                    {{ viewMode === 'timeline' ? 'List View' : 'Calendar View' }}
                </el-button> -->
            </div>
        </template>
        <div class="top-content">
            <transition name="el-fade-in-linear" mode="out-in">
                <div v-if="viewMode === 'timeline'" key="timeline" class="timeline-view">
                    <div class="timeline-container">
                        <el-timeline v-if="groupedTimelineEvents.length">
                            <el-timeline-item
                                v-for="(timeGroup, key) of groupedTimelineEvents"
                                :key="key"
                                :timestamp="dayjs(timeGroup.startsAt).format('MM-DD ddd') + ' ' + timeGroup.startTime"
                                placement="top">
                                <div class="time-group-container">
                                    <GroupCalendarEventCard
                                        v-for="value in timeGroup.events"
                                        :key="value.id"
                                        :event="value"
                                        mode="timeline"
                                        :is-following="isEventFollowing(value.id)"
                                        :card-class="{ 'grouped-card': timeGroup.events.length > 1 }" />
                                </div>
                            </el-timeline-item>
                        </el-timeline>
                        <div v-else>No events found</div>
                    </div>

                    <div class="calendar-container">
                        <el-calendar v-model="selectedDay" v-loading="isLoading">
                            <template #dateCell="{ date }">
                                <div class="date">
                                    <div
                                        class="calendar-date-content"
                                        :class="{
                                            'has-events': filteredCalendar[formatDateKey(date)]?.length
                                        }">
                                        {{ dayjs(date).utc().format('D') }}
                                        <div
                                            v-if="filteredCalendar[formatDateKey(date)]?.length"
                                            class="calendar-event-badge"
                                            :class="
                                                followingCalendarDate[formatDateKey(date)]
                                                    ? 'has-following'
                                                    : 'no-following'
                                            ">
                                            {{ filteredCalendar[formatDateKey(date)]?.length }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </el-calendar>
                    </div>
                </div>
                <div v-else key="grid" class="grid-view">
                    <div class="search-container">
                        <el-input
                            v-model="searchQuery"
                            placeholder="Search groups or events..."
                            clearable
                            size="small"
                            prefix-icon="el-icon-search"
                            class="search-input" />
                    </div>

                    <div class="groups-grid" v-loading="isLoading">
                        <div v-if="filteredGroupEvents.length" class="groups-container">
                            <div v-for="group in filteredGroupEvents" :key="group.groupId" class="group-row">
                                <div class="group-header" @click="toggleGroup(group.groupId)">
                                    <i
                                        class="el-icon-arrow-right"
                                        :class="{ rotate: !groupCollapsed[group.groupId] }"></i>
                                    {{ group.groupName }}
                                </div>
                                <div class="events-row" v-show="!groupCollapsed[group.groupId]">
                                    <GroupCalendarEventCard
                                        v-for="event in group.events"
                                        :key="event.id"
                                        :event="event"
                                        mode="grid"
                                        :is-following="isEventFollowing(event.id)"
                                        card-class="grid-card" />
                                </div>
                            </div>
                        </div>
                        <div v-else class="no-events">
                            {{ searchQuery ? 'No matching events found' : 'No events this month' }}
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </safe-dialog>
</template>

<script setup>
    import { ref, watch, computed } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { storeToRefs } from 'pinia';
    import dayjs from 'dayjs';
    import { groupRequest } from '../../../api';
    import { useGroupStore } from '../../../stores';
    import GroupCalendarEventCard from '../components/GroupCalendarEventCard.vue';
    import { replaceBioSymbols } from '../../../shared/utils';

    const { cachedGroups } = storeToRefs(useGroupStore());

    const { t } = useI18n();

    const props = defineProps({
        visible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['close']);

    const calendar = ref([]);
    const followingCalendar = ref([]);
    const selectedDay = ref(new Date());
    const isLoading = ref(false);
    const viewMode = ref('grid');
    const searchQuery = ref('');
    const groupCollapsed = ref({});

    watch(
        () => props.visible,
        async (newVisible) => {
            if (newVisible) {
                selectedDay.value = new Date();
                isLoading.value = true;
                await Promise.all([getCalendarData(), getFollowingCalendarData()])
                    .catch((error) => {
                        console.error('Error fetching calendar data:', error);
                    })
                    .finally(() => {
                        isLoading.value = false;
                    });
            }
        }
    );

    watch(
        () => selectedDay.value,
        async (newDate, oldDate) => {
            if (props.visible && oldDate) {
                const newMonth = dayjs(newDate).format('YYYY-MM');
                const oldMonth = dayjs(oldDate).format('YYYY-MM');

                if (newMonth !== oldMonth) {
                    isLoading.value = true;
                    await Promise.all([getCalendarData(), getFollowingCalendarData()])
                        .catch((error) => {
                            console.error('Error fetching calendar data:', error);
                        })
                        .finally(() => {
                            isLoading.value = false;
                        });
                }
            }
        }
    );

    const groupedByGroupEvents = computed(() => {
        const currentMonth = dayjs(selectedDay.value).month();
        const currentYear = dayjs(selectedDay.value).year();

        const currentMonthEvents = calendar.value.filter((event) => {
            const eventDate = dayjs(event.startsAt);
            return eventDate.month() === currentMonth && eventDate.year() === currentYear;
        });

        const groupMap = new Map();
        currentMonthEvents.forEach((event) => {
            const groupId = event.ownerId;
            if (!groupMap.has(groupId)) {
                groupMap.set(groupId, []);
            }
            groupMap.get(groupId).push(event);
        });

        Array.from(groupMap.values()).forEach((events) => {
            events.sort((a, b) => (dayjs(a.startsAt).isBefore(dayjs(b.startsAt)) ? -1 : 1));
        });

        return Array.from(groupMap.entries()).map(([groupId, events]) => ({
            groupId,
            groupName: getGroupName(events[0]),
            events: events
        }));
    });

    const filteredGroupEvents = computed(() => {
        const hasSearch = searchQuery.value.trim();
        return !hasSearch
            ? groupedByGroupEvents.value
            : groupedByGroupEvents.value.filter((group) => {
                  if (group.groupName.toLowerCase().includes(searchQuery.value.toLowerCase())) return true;

                  return group.events.some(
                      (event) =>
                          event.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          event.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
                  );
              });
    });

    watch(
        [filteredGroupEvents, searchQuery],
        ([groups, search]) => {
            const newCollapsed = { ...groupCollapsed.value };
            let hasChanged = false;
            const hasSearch = search.trim();

            groups.forEach((group) => {
                if (!(group.groupId in newCollapsed)) {
                    newCollapsed[group.groupId] = false;
                    hasChanged = true;
                } else if (hasSearch) {
                    newCollapsed[group.groupId] = false;
                    hasChanged = true;
                }
            });

            if (hasChanged) {
                groupCollapsed.value = newCollapsed;
            }
        },
        { immediate: true }
    );

    const filteredCalendar = computed(() => {
        const result = {};
        calendar.value.forEach((item) => {
            const currentDate = formatDateKey(item.startsAt);
            if (!Array.isArray(result[currentDate])) {
                result[currentDate] = [];
            }
            result[currentDate].push(item);
        });

        Object.values(result).forEach((events) => {
            events.sort((a, b) => dayjs(a.startsAt).diff(dayjs(b.startsAt)));
        });
        return result;
    });

    const followingCalendarDate = computed(() => {
        const result = {};

        const followingIds = new Set(followingCalendar.value.map((item) => item.id));

        calendar.value.forEach((event) => {
            if (followingIds.has(event.id)) {
                const dateKey = formatDateKey(event.startsAt);
                if (!result[dateKey]) {
                    result[dateKey] = [];
                }
                result[dateKey].push(event.id);
            }
        });
        return result;
    });

    const formattedSelectedDay = computed(() => {
        return formatDateKey(selectedDay.value);
    });

    const groupedTimelineEvents = computed(() => {
        const eventsForDay = filteredCalendar.value[formattedSelectedDay.value] || [];
        const timeGroups = {};

        eventsForDay.forEach((event) => {
            const startTimeKey = dayjs(event.startsAt).format('HH:mm');
            if (!timeGroups[startTimeKey]) {
                timeGroups[startTimeKey] = [];
            }
            timeGroups[startTimeKey].push(event);
        });

        return Object.entries(timeGroups)
            .map(([startTime, events]) => ({
                startTime,
                events,
                startsAt: events[0].startsAt,
                hasFollowing: events.some((event) => isEventFollowing(event.id))
            }))
            .sort((a, b) => dayjs(a.startsAt).diff(dayjs(b.startsAt)));
    });

    const formatDateKey = (date) => dayjs(date).format('YYYY-MM-DD');

    function getGroupName(event) {
        if (!event) return '';
        return cachedGroups.value.get(event.ownerId)?.name || '';
    }

    async function getCalendarData() {
        try {
            const response = await groupRequest.getGroupCalendars(dayjs(selectedDay.value).toISOString());
            response.results.forEach((event) => {
                event.title = replaceBioSymbols(event.title);
                event.description = replaceBioSymbols(event.description);
            });
            calendar.value = response.results;
        } catch (error) {
            console.error('Error fetching calendars:', error);
        }
    }

    async function getFollowingCalendarData() {
        try {
            const response = await groupRequest.getFollowingGroupCalendars(dayjs(selectedDay.value).toISOString());
            response.results.forEach((event) => {
                event.title = replaceBioSymbols(event.title);
                event.description = replaceBioSymbols(event.description);
            });
            followingCalendar.value = response.results;
        } catch (error) {
            console.error('Error fetching following calendars:', error);
        }
    }

    function isEventFollowing(eventId) {
        return followingCalendar.value.some((item) => item.id === eventId);
    }

    function toggleViewMode() {
        viewMode.value = viewMode.value === 'timeline' ? 'grid' : 'timeline';
    }

    function toggleGroup(groupId) {
        groupCollapsed.value = {
            ...groupCollapsed.value,
            [groupId]: !groupCollapsed.value[groupId]
        };
    }

    function closeDialog() {
        emit('close');
    }
</script>

<style lang="scss" scoped>
    .x-dialog {
        ::v-deep .el-dialog {
            max-height: 750px;
            .el-dialog__body {
                height: 680px;
            }
        }
        .top-content {
            height: 640px;
            position: relative;
            overflow: hidden;
            .timeline-view {
                .timeline-container {
                    ::v-deep .el-timeline {
                        width: 100%;
                        height: 100%;
                        min-width: 200px;
                        padding-left: 4px;
                        padding-right: 16px;
                        margin-left: 10px;
                        margin-right: 6px;
                        overflow: auto;
                        .el-timeline-item {
                            padding: 0 20px 20px 10px;
                        }
                    }
                    .time-group-container {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        overflow: visible;
                    }
                }
                .calendar-container {
                    .date {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        .calendar-date-content {
                            width: 80%;
                            height: 80%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 8px;
                            font-size: 18px;
                            position: relative;

                            &.has-events {
                                background-color: var(--group-calendar-event-bg, rgba(25, 102, 154, 0.05));
                            }
                            .calendar-event-badge {
                                position: absolute;
                                top: 2px;
                                right: 2px;
                                min-width: 16px;
                                height: 16px;
                                border-radius: 8px;
                                color: #ffffff;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 10px;
                                font-weight: bold;
                                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                                z-index: 10;
                                padding: 0 4px;
                                line-height: 16px;
                                &.has-following {
                                    background-color: var(--group-calendar-badge-following, #67c23a);
                                }
                                &.no-following {
                                    background-color: var(--group-calendar-badge-normal, #409eff);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    .dialog-title-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        .view-toggle-btn {
            font-size: 12px;
            padding: 8px 12px;
        }
    }

    .timeline-view {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        .timeline-container {
            flex: 1;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .calendar-container {
            width: 609px;
            flex-shrink: 0;
        }
    }

    .grid-view {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        .search-container {
            padding: 2px 20px 12px 20px;
            border-bottom: 1px solid #ebeef5;
            display: flex;
            justify-content: flex-end;
            .search-input {
                width: 300px;
            }
        }

        .groups-grid {
            flex: 1;
            overflow-y: auto;
            padding: 16px 20px;
            .groups-container {
                overflow: visible;
                .group-row {
                    margin-bottom: 18px;
                    overflow: visible;
                    .group-header {
                        font-size: 16px;
                        font-weight: bold;
                        color: var(--el-text-color-primary);
                        padding: 4px 12px 10px 12px;
                        cursor: pointer;
                        border-radius: 4px;
                        margin: 0 -12px 10px -12px;
                        display: flex;
                        align-items: center;

                        .el-icon-arrow-right {
                            font-size: 14px;
                            margin-right: 8px;
                            transition: transform 0.3s;
                            color: var(--el-color-primary);
                        }
                    }
                    .events-row {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 16px;
                        overflow: visible;
                    }
                }
            }
            .no-events {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 200px;
                font-size: 16px;
                color: var(--el-text-color-secondary);
            }
        }
    }

    .rotate {
        transform: rotate(90deg);
    }
</style>
