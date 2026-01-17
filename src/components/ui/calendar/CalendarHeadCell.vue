<script setup>
    import { CalendarHeadCell, useForwardProps } from 'reka-ui';
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
    <CalendarHeadCell
        data-slot="calendar-head-cell"
        :class="cn('text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]', props.class)"
        v-bind="forwardedProps">
        <slot />
    </CalendarHeadCell>
</template>
