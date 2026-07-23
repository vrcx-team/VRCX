<script setup>
    import { RangeCalendarCell, useForwardProps } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        date: { type: null, required: true },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <RangeCalendarCell
        data-slot="range-calendar-cell"
        :class="
            cn(
                'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:bg-accent first:[&:has([data-selected])]:rounded-s-md last:[&:has([data-selected])]:rounded-e-md [&:has([data-selected][data-selection-end])]:rounded-e-md [&:has([data-selected][data-selection-start])]:rounded-s-md',
                props.class
            )
        "
        v-bind="forwardedProps">
        <slot />
    </RangeCalendarCell>
</template>
