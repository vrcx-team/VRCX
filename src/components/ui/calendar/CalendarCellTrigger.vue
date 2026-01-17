<script setup>
    import { CalendarCellTrigger, useForwardProps } from 'reka-ui';
    import { buttonVariants } from '@/components/ui/button';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        day: { type: null, required: true },
        month: { type: null, required: true },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false, default: 'button' },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <CalendarCellTrigger
        data-slot="calendar-cell-trigger"
        :class="
            cn(
                buttonVariants({ variant: 'ghost' }),
                'size-8 p-0 font-normal aria-selected:opacity-100 cursor-default',
                '[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground',
                // Selected
                'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:opacity-100 data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[selected]:focus:bg-primary data-[selected]:focus:text-primary-foreground',
                // Disabled
                'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
                // Unavailable
                'data-[unavailable]:text-destructive-foreground data-[unavailable]:line-through',
                // Outside months
                'data-[outside-view]:text-muted-foreground',
                props.class
            )
        "
        v-bind="forwardedProps">
        <slot />
    </CalendarCellTrigger>
</template>
