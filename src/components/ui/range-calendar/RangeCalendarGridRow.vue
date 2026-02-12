<script setup>
    import { RangeCalendarGridRow, useForwardProps } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <RangeCalendarGridRow data-slot="range-calendar-grid-row" :class="cn('flex', props.class)" v-bind="forwardedProps">
        <slot />
    </RangeCalendarGridRow>
</template>
