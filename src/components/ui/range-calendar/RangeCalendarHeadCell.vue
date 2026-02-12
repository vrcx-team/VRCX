<script setup>
    import { RangeCalendarHeadCell, useForwardProps } from 'reka-ui';
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
    <RangeCalendarHeadCell
        data-slot="range-calendar-head-cell"
        :class="cn('w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground', props.class)"
        v-bind="forwardedProps">
        <slot />
    </RangeCalendarHeadCell>
</template>
