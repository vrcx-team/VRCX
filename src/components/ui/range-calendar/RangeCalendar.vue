<script setup>
    import { RangeCalendarRoot, useForwardPropsEmits } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    import {
        RangeCalendarCell,
        RangeCalendarCellTrigger,
        RangeCalendarGrid,
        RangeCalendarGridBody,
        RangeCalendarGridHead,
        RangeCalendarGridRow,
        RangeCalendarHeadCell,
        RangeCalendarHeader,
        RangeCalendarHeading,
        RangeCalendarNextButton,
        RangeCalendarPrevButton
    } from '.';

    /** @typedef {import('reka-ui').RangeCalendarRootProps} RangeCalendarRootProps */

    const props = defineProps({
        defaultPlaceholder: { type: null, required: false },
        defaultValue: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['defaultValue']>} */ (Object),
            required: false
        },
        modelValue: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['modelValue']>} */ ([Object, null]),
            required: false
        },
        placeholder: { type: null, required: false },
        allowNonContiguousRanges: { type: Boolean, required: false },
        pagedNavigation: { type: Boolean, required: false },
        preventDeselect: { type: Boolean, required: false },
        maximumDays: { type: Number, required: false },
        weekStartsOn: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['weekStartsOn']>} */ (Number),
            required: false
        },
        weekdayFormat: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['weekdayFormat']>} */ (String),
            required: false
        },
        calendarLabel: { type: String, required: false },
        fixedWeeks: { type: Boolean, required: false },
        maxValue: { type: null, required: false },
        minValue: { type: null, required: false },
        locale: { type: String, required: false },
        numberOfMonths: { type: Number, required: false },
        disabled: { type: Boolean, required: false },
        readonly: { type: Boolean, required: false },
        initialFocus: { type: Boolean, required: false },
        isDateDisabled: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['isDateDisabled']>} */ (Function),
            required: false
        },
        isDateUnavailable: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['isDateUnavailable']>} */ (Function),
            required: false
        },
        isDateHighlightable: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['isDateHighlightable']>} */ (Function),
            required: false
        },
        dir: { type: /** @type {import('vue').PropType<RangeCalendarRootProps['dir']>} */ (String), required: false },
        nextPage: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['nextPage']>} */ (Function),
            required: false
        },
        prevPage: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['prevPage']>} */ (Function),
            required: false
        },
        disableDaysOutsideCurrentView: { type: Boolean, required: false },
        fixedDate: {
            type: /** @type {import('vue').PropType<RangeCalendarRootProps['fixedDate']>} */ (String),
            required: false
        },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const emits = defineEmits([
        'update:modelValue',
        'update:validModelValue',
        'update:placeholder',
        'update:startValue'
    ]);

    const delegatedProps = reactiveOmit(props, 'class');

    const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <RangeCalendarRoot
        v-slot="{ grid, weekDays }"
        data-slot="range-calendar"
        :class="cn('p-3', props.class)"
        v-bind="forwarded">
        <RangeCalendarHeader>
            <RangeCalendarHeading />

            <div class="flex items-center gap-1">
                <RangeCalendarPrevButton />
                <RangeCalendarNextButton />
            </div>
        </RangeCalendarHeader>

        <div class="flex flex-col gap-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
            <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()">
                <RangeCalendarGridHead>
                    <RangeCalendarGridRow>
                        <RangeCalendarHeadCell v-for="day in weekDays" :key="day">
                            {{ day }}
                        </RangeCalendarHeadCell>
                    </RangeCalendarGridRow>
                </RangeCalendarGridHead>
                <RangeCalendarGridBody>
                    <RangeCalendarGridRow
                        v-for="(weekDates, index) in month.rows"
                        :key="`weekDate-${index}`"
                        class="mt-2 w-full">
                        <RangeCalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate">
                            <RangeCalendarCellTrigger :day="weekDate" :month="month.value" />
                        </RangeCalendarCell>
                    </RangeCalendarGridRow>
                </RangeCalendarGridBody>
            </RangeCalendarGrid>
        </div>
    </RangeCalendarRoot>
</template>
