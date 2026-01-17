<script setup>
    import { CalendarGridRow, useForwardProps } from 'reka-ui';
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
    <CalendarGridRow data-slot="calendar-grid-row" :class="cn('flex', props.class)" v-bind="forwardedProps">
        <slot />
    </CalendarGridRow>
</template>
