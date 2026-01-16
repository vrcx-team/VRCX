<script setup>
    import {
        CalendarCell,
        CalendarCellTrigger,
        CalendarGrid,
        CalendarGridBody,
        CalendarGridHead,
        CalendarGridRow,
        CalendarHeadCell,
        CalendarHeader,
        CalendarHeading,
        CalendarNextButton,
        CalendarPrevButton
    } from '@/components/ui/calendar';
    import { computed, ref, watch } from 'vue';
    import { fromDate, getLocalTimeZone } from '@internationalized/date';
    import { CalendarRoot } from 'reka-ui';
    import { toDate } from 'reka-ui/date';

    import dayjs from 'dayjs';

    const props = defineProps({
        modelValue: {
            type: Date,
            required: true
        },
        isLoading: {
            type: Boolean,
            default: false
        },
        eventsByDate: {
            type: Object,
            default: () => ({})
        },
        followingByDate: {
            type: Object,
            default: () => ({})
        }
    });

    const emit = defineEmits(['update:modelValue']);

    const timeZone = getLocalTimeZone();

    const internalValue = ref(fromDate(props.modelValue ?? new Date(), timeZone));
    const placeholder = ref(fromDate(props.modelValue ?? new Date(), timeZone));

    watch(
        () => props.modelValue,
        (next) => {
            if (!next) return;
            internalValue.value = fromDate(next, timeZone);
            placeholder.value = fromDate(next, timeZone);
        }
    );

    const selectedDayKey = computed(() => dayjs(props.modelValue).format('YYYY-MM-DD'));

    function toKey(dateValue) {
        return dayjs(toDate(dateValue, timeZone)).format('YYYY-MM-DD');
    }

    function eventCountFor(dateValue) {
        const key = toKey(dateValue);
        return props.eventsByDate?.[key]?.length ?? 0;
    }

    function hasFollowingFor(dateValue) {
        const key = toKey(dateValue);
        return Boolean(props.followingByDate?.[key]);
    }

    function onUpdateModelValue(next) {
        if (!next) return;
        internalValue.value = next;
        const asDate = toDate(next, timeZone);
        placeholder.value = next;
        emit('update:modelValue', asDate);
    }

    function onUpdatePlaceholder(next) {
        if (!next) return;
        placeholder.value = next;
        internalValue.value = next;
        emit('update:modelValue', toDate(next, timeZone));
    }

    function dayLabel(dateValue) {
        return dayjs(toDate(dateValue, timeZone)).format('D');
    }
</script>

<template>
    <div class="group-calendar-month">
        <CalendarRoot
            v-slot="{ grid, weekDays }"
            :model-value="internalValue"
            @update:modelValue="onUpdateModelValue"
            :placeholder="placeholder"
            @update:placeholder="onUpdatePlaceholder"
            :prevent-deselect="true"
            class="p-4">
            <CalendarHeader class="pt-0">
                <nav class="flex items-center gap-1 absolute top-0 inset-x-0 justify-between">
                    <CalendarPrevButton class="size-9" />
                    <CalendarNextButton class="size-9" />
                </nav>
                <div class="flex items-center justify-center">
                    <CalendarHeading class="text-base" />
                </div>
            </CalendarHeader>

            <div class="flex flex-col gap-y-4 mt-6">
                <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full">
                    <CalendarGridHead>
                        <CalendarGridRow>
                            <CalendarHeadCell v-for="day in weekDays" :key="day" class="text-sm">
                                {{ day }}
                            </CalendarHeadCell>
                        </CalendarGridRow>
                    </CalendarGridHead>
                    <CalendarGridBody>
                        <CalendarGridRow
                            v-for="(weekDates, index) in month.rows"
                            :key="`weekDate-${index}`"
                            class="mt-2 w-full">
                            <CalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate">
                                <CalendarCellTrigger
                                    :day="weekDate"
                                    :month="month.value"
                                    class="size-12 cursor-pointer">
                                    <div class="date">
                                        <div
                                            class="calendar-date-content"
                                            :class="{
                                                'has-events': eventCountFor(weekDate) > 0,
                                                'is-selected': toKey(weekDate) === selectedDayKey
                                            }">
                                            {{ dayLabel(weekDate) }}
                                            <div
                                                v-if="eventCountFor(weekDate) > 0"
                                                class="calendar-event-badge"
                                                :class="hasFollowingFor(weekDate) ? 'has-following' : 'no-following'">
                                                {{ eventCountFor(weekDate) }}
                                            </div>
                                            <!-- <div
                                                v-if="eventCountFor(weekDate) > 0"
                                                class="calendar-event-dot"
                                                aria-hidden="true" /> -->
                                        </div>
                                    </div>
                                </CalendarCellTrigger>
                            </CalendarCell>
                        </CalendarGridRow>
                    </CalendarGridBody>
                </CalendarGrid>
            </div>
        </CalendarRoot>
    </div>
</template>

<style scoped>
    .group-calendar-month {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: flex-start;
    }

    .date {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .calendar-date-content {
        width: 80%;
        height: 80%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        font-size: 18px;
        position: relative;
    }

    .calendar-date-content.has-events {
    }

    .calendar-event-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 14px;
        height: 14px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        z-index: 10;
        padding: 0 5px;
        line-height: 14px;
    }

    .calendar-event-badge.has-following {
    }

    .calendar-event-badge.no-following {
    }

    .calendar-event-dot {
        position: absolute;
        left: 50%;
        bottom: 4px;
        transform: translateX(-50%);
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background-color: var(--group-calendar-event-dot, #ef4444);
        z-index: 5;
        pointer-events: none;
    }
</style>
