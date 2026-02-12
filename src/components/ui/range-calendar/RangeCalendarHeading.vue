<script setup>
    import { RangeCalendarHeading, useForwardProps } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    defineSlots();

    const delegatedProps = reactiveOmit(props, 'class');

    const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <RangeCalendarHeading
        v-slot="{ headingValue }"
        data-slot="range-calendar-heading"
        :class="cn('text-sm font-medium', props.class)"
        v-bind="forwardedProps">
        <slot :heading-value>
            {{ headingValue }}
        </slot>
    </RangeCalendarHeading>
</template>
