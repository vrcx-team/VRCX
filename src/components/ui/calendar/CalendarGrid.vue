<script setup>
    import { CalendarGrid, useForwardProps } from 'reka-ui';
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
    <CalendarGrid
        data-slot="calendar-grid"
        :class="cn('w-full border-collapse space-x-1', props.class)"
        v-bind="forwardedProps">
        <slot />
    </CalendarGrid>
</template>
