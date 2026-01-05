<script setup>
    import { PaginationFirst, useForwardProps } from 'reka-ui';
    import { ChevronLeftIcon } from 'lucide-vue-next';
    import { buttonVariants } from '@/components/ui/button';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        size: { type: null, required: false, default: 'default' },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class', 'size');
    const forwarded = useForwardProps(delegatedProps);
</script>

<template>
    <PaginationFirst
        data-slot="pagination-first"
        :class="cn(buttonVariants({ variant: 'ghost', size }), 'text-[13px] gap-1 px-2.5 sm:pr-2.5', props.class)"
        v-bind="forwarded">
        <slot>
            <ChevronLeftIcon />
            <span class="hidden sm:block">First</span>
        </slot>
    </PaginationFirst>
</template>
