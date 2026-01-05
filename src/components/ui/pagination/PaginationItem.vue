<script setup>
    import { PaginationListItem } from 'reka-ui';
    import { buttonVariants } from '@/components/ui/button';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        value: { type: Number, required: true },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        size: { type: null, required: false, default: 'icon' },
        class: { type: null, required: false },
        isActive: { type: Boolean, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class', 'size', 'isActive');
</script>

<template>
    <PaginationListItem
        data-slot="pagination-item"
        v-bind="delegatedProps"
        :class="
            cn(
                buttonVariants({
                    variant: isActive ? 'outline' : 'ghost',
                    size
                }),
                'text-[13px]',
                props.class
            )
        ">
        <slot />
    </PaginationListItem>
</template>
