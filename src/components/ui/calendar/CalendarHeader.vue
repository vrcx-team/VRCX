<script setup>
    import { CalendarHeader, useForwardProps } from 'reka-ui';
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
    <CalendarHeader
        data-slot="calendar-header"
        :class="cn('flex justify-center pt-1 relative items-center w-full px-8', props.class)"
        v-bind="forwardedProps">
        <slot />
    </CalendarHeader>
</template>
