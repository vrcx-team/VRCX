<template>
    <el-dialog
        class="x-dialog"
        :model-value="visible"
        :title="t('dialog.group_calendar.header')"
        width="90vw"
        height="80vh"
        @close="closeDialog">
        <template #header>
            <div class="dialog-title-container">
                <span>{{ t('dialog.group_calendar.header') }}</span>
                <Button size="sm" variant="outline" @click="toggleViewMode" class="view-toggle-btn">
                    {{
                        viewMode === 'timeline'
                            ? t('dialog.group_calendar.list_view')
                            : t('dialog.group_calendar.calendar_view')
                    }}
                </Button>
            </div>
            <div class="featured-switch">
                <span class="featured-switch-text">{{ t('dialog.group_calendar.featured_events') }}</span>
                <Switch v-model="showFeaturedEvents" @update:modelValue="toggleFeaturedEvents" />
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
                                        :card-class="{ 'grouped-card': timeGroup.events.length > 1 }"
                                        @update-following-calendar-data="updateFollowingCalendarData"
                                        @click-action="showGroupDialog(value.ownerId)" />
                                </div>
                            </el-timeline-item>
                        </el-timeline>
                        <div v-else>{{ t('dialog.group_calendar.no_events') }}</div>
                    </div>

                    <div class="calendar-container">
                        <el-calendar v-model="selectedDay" v-loading="isLoading">
                            <template #date-cell="{ data }">
                                <div class="date">
                                    <div
                                        class="calendar-date-content"
                                        :class="{
                                            'has-events': filteredCalendar[formatDateKey(data.date)]?.length
                                        }">
                                        {{ dayjs(data.date).format('D') }}
                                        <div
                                            v-if="filteredCalendar[formatDateKey(data.date)]?.length"
                                            class="calendar-event-badge"
                                            :class="
                                                followingCalendarDate[formatDateKey(data.date)]
                                                    ? 'has-following'
                                                    : 'no-following'
                                            ">
                                            {{ filteredCalendar[formatDateKey(data.date)]?.length }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </el-calendar>
                    </div>
                </div>
                <div v-else key="grid" class="grid-view">
                    <div class="search-container">
                        <InputGroupSearch
                            v-model="searchQuery"
                            size="sm"
                            :placeholder="t('dialog.group_calendar.search_placeholder')"
                            class="search-input" />
                    </div>

                    <div class="groups-grid" v-loading="isLoading">
                        <div v-if="filteredGroupEvents.length" class="groups-container">
                            <div v-for="group in filteredGroupEvents" :key="group.groupId" class="group-row">
                                <div class="group-header" @click="toggleGroup(group.groupId)">
                                    <el-icon
                                        class="el-icon-arrow-right rotation-transition"
                                        :class="{ rotate: !groupCollapsed[group.groupId] }"
                                        ><ArrowRight
                                    /></el-icon>
                                    {{ group.groupName }}
                                </div>
                                <div class="events-row" v-show="!groupCollapsed[group.groupId]">
                                    <GroupCalendarEventCard
                                        v-for="event in group.events"
                                        :key="event.id"
                                        :event="event"
                                        mode="grid"
                                        :is-following="isEventFollowing(event.id)"
                                        @update-following-calendar-data="updateFollowingCalendarData"
                                        @click-action="showGroupDialog(event.ownerId)"
                                        card-class="grid-card" />
                                </div>
                            </div>
                        </div>
                        <div v-else class="no-events">
                            {{
                                searchQuery
                                    ? t('dialog.group_calendar.search_no_matching')
                                    : t('dialog.group_calendar.search_no_this_month')
                            }}
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </el-dialog>
</template>

<script setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { ArrowRight } from '@element-plus/icons-vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupSearch } from '@/components/ui/input-group';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { formatDateFilter, getGroupName, replaceBioSymbols } from '../../../shared/utils';
    import { Switch } from '../../../components/ui/switch';
    import { groupRequest } from '../../../api';
    import { processBulk } from '../../../service/request';
    import { useGroupStore } from '../../../stores';

    import GroupCalendarEventCard from '../components/GroupCalendarEventCard.vue';
    import configRepository from '../../../service/config';

    const { applyGroupEvent, showGroupDialog } = useGroupStore();

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
    const featuredCalendar = ref([]);
    const selectedDay = ref(new Date());
    const isLoading = ref(false);
    const viewMode = ref('timeline');
    const searchQuery = ref('');
    const groupCollapsed = ref({});
    const showFeaturedEvents = ref(false);
    const groupNamesCache = new Map();

    onMounted(async () => {
        showFeaturedEvents.value = await configRepository.getBool('VRCX_groupCalendarShowFeaturedEvents', false);
    });

    function toggleFeaturedEvents() {
        configRepository.setBool('VRCX_groupCalendarShowFeaturedEvents', showFeaturedEvents.value);
        updateCalenderData();
    }

    watch(
        () => props.visible,
        async (newVisible) => {
            if (newVisible) {
                selectedDay.value = new Date();
                updateCalenderData();
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
                    updateCalenderData();
                }
            }
        }
    );

    async function updateCalenderData() {
        isLoading.value = true;
        let fetchPromises = [getCalendarData(), getFollowingCalendarData()];
        if (showFeaturedEvents.value) {
            fetchPromises.push(getFeaturedCalendarData());
        }
        await Promise.all(fetchPromises)
            .catch((error) => {
                console.error('Error fetching calendar data:', error);
            })
            .finally(() => {
                isLoading.value = false;
            });
    }

    const groupedByGroupEvents = computed(() => {
        const currentMonth = dayjs(selectedDay.value).month();
        const currentYear = dayjs(selectedDay.value).year();

        let currentMonthEvents = calendar.value.filter((event) => {
            const eventDate = dayjs(event.startsAt);
            return eventDate.month() === currentMonth && eventDate.year() === currentYear;
        });
        if (showFeaturedEvents.value) {
            const featuredMonthEvents = featuredCalendar.value.filter((event) => {
                const eventDate = dayjs(event.startsAt);
                return eventDate.month() === currentMonth && eventDate.year() === currentYear;
            });
            currentMonthEvents = currentMonthEvents.concat(featuredMonthEvents);
        }

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
            groupName: groupNamesCache.get(groupId),
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
        if (showFeaturedEvents.value) {
            featuredCalendar.value.forEach((item) => {
                const currentDate = formatDateKey(item.startsAt);
                if (!Array.isArray(result[currentDate])) {
                    result[currentDate] = [];
                }
                result[currentDate].push(item);
            });
        }

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
            const startTimeKey = formatDateFilter(event.startsAt, 'time');
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

    const formatDateKey = (date) => formatDateFilter(date, 'date');

    function getGroupNameFromCache(groupId) {
        if (!groupNamesCache.has(groupId)) {
            getGroupName(groupId).then((name) => {
                groupNamesCache.set(groupId, name);
            });
        }
    }

    async function getCalendarData() {
        calendar.value = [];
        try {
            await processBulk({
                fn: groupRequest.getGroupCalendars,
                N: -1,
                params: {
                    n: 100,
                    offset: 0,
                    date: dayjs(selectedDay.value).format('YYYY-MM-DDTHH:mm:ss[Z]') // this need to be local time because UTC time may cause month shift
                },
                handle(args) {
                    args.results.forEach((event) => {
                        event.title = replaceBioSymbols(event.title);
                        event.description = replaceBioSymbols(event.description);
                        applyGroupEvent(event);
                        getGroupNameFromCache(event.ownerId);
                    });
                    calendar.value.push(...args.results);
                }
            });
        } catch (error) {
            console.error('Error fetching calendars:', error);
        }
    }

    async function getFollowingCalendarData() {
        followingCalendar.value = [];
        try {
            await processBulk({
                fn: groupRequest.getFollowingGroupCalendars,
                N: -1,
                params: {
                    n: 100,
                    offset: 0,
                    date: dayjs(selectedDay.value).format('YYYY-MM-DDTHH:mm:ss[Z]')
                },
                handle(args) {
                    args.results.forEach((event) => {
                        applyGroupEvent(event);
                        getGroupNameFromCache(event.ownerId);
                    });
                    followingCalendar.value.push(...args.results);
                }
            });
        } catch (error) {
            console.error('Error fetching following calendars:', error);
        }
    }

    async function getFeaturedCalendarData() {
        featuredCalendar.value = [];
        try {
            await processBulk({
                fn: groupRequest.getFeaturedGroupCalendars,
                N: -1,
                params: {
                    n: 100,
                    offset: 0,
                    date: dayjs(selectedDay.value).format('YYYY-MM-DDTHH:mm:ss[Z]')
                },
                handle(args) {
                    args.results.forEach((event) => {
                        applyGroupEvent(event);
                        getGroupNameFromCache(event.ownerId);
                    });
                    featuredCalendar.value.push(...args.results);
                }
            });
        } catch (error) {
            console.error('Error fetching featured calendars:', error);
        }
    }

    function updateFollowingCalendarData(updatedEvent) {
        const index = followingCalendar.value.findIndex((item) => item.id === updatedEvent.id);
        if (index !== -1) {
            followingCalendar.value.splice(index, 1);
        }
        if (updatedEvent.userInterest?.isFollowing) {
            followingCalendar.value.push(updatedEvent);
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

<style scoped>
    .x-dialog {
        :deep(.el-dialog) {
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
                    :deep(.el-timeline) {
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
                                background-color: var(
                                    --group-calendar-event-bg,
                                    color-mix(in oklch, var(--el-color-primary) 10%, transparent)
                                );
                            }
                            .calendar-event-badge {
                                position: absolute;
                                top: 2px;
                                right: 2px;
                                min-width: 16px;
                                height: 16px;
                                border-radius: 8px;
                                color: var(--el-color-white, #fff);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 10px;
                                font-weight: bold;
                                box-shadow: var(--el-box-shadow-lighter);
                                z-index: 10;
                                padding: 0 4px;
                                line-height: 16px;
                                &.has-following {
                                    background-color: var(--group-calendar-badge-following, var(--el-color-success));
                                }
                                &.no-following {
                                    background-color: var(--group-calendar-badge-normal, var(--el-color-primary));
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

    .featured-switch {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
        .featured-switch-text {
            font-size: 13px;
            margin-right: 5px;
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
            height: 100%;
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
            border-bottom: 1px solid var(--el-border-color-lighter);
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

    .rotation-transition {
        transition: transform 0.2s ease-in-out;
    }
</style>
