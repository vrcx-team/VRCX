<script setup>
    import { RangeCalendarNext, useForwardProps } from 'reka-ui';
    import { ChevronRight } from 'lucide-vue-next';
    import { buttonVariants } from '@/components/ui/button';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        nextPage: { type: Function, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <RangeCalendarNext
        data-slot="range-calendar-next-button"
        :class="
            cn(
                buttonVariants({ variant: 'outline' }),
                'absolute right-1',
                'size-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                props.class
            )
        "
        v-bind="forwardedProps">
        <slot>
            <ChevronRight class="size-4" />
        </slot>
    </RangeCalendarNext>
</template>
