<script setup>
    import { MoreHorizontal } from 'lucide-vue-next';
    import { PaginationEllipsis } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <PaginationEllipsis
        data-slot="pagination-ellipsis"
        v-bind="delegatedProps"
        :class="cn('flex size-9 items-center justify-center text-[13px]', props.class)">
        <slot>
            <MoreHorizontal class="size-4" />
            <span class="sr-only">More pages</span>
        </slot>
    </PaginationEllipsis>
</template>
