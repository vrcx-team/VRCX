<script setup>
    import { CalendarHeading, useForwardProps } from 'reka-ui';
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
    <CalendarHeading
        v-slot="{ headingValue }"
        data-slot="calendar-heading"
        :class="cn('text-sm font-medium', props.class)"
        v-bind="forwardedProps">
        <slot :heading-value>
            {{ headingValue }}
        </slot>
    </CalendarHeading>
</template>
