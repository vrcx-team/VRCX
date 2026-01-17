<script setup>
    import { Primitive } from 'reka-ui';
    import { cn } from '@/lib/utils';

    const props = defineProps({
        as: {
            type: [String, Object, Function],
            default: 'div'
        },
        asChild: {
            type: Boolean,
            default: false
        },
        class: {
            type: [String, Array, Object],
            default: undefined
        }
    });
</script>

<template>
    <Primitive
        data-slot="sidebar-group-label"
        data-sidebar="group-label"
        :as="as"
        :as-child="asChild"
        :class="
            cn(
                'text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
                'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
                props.class
            )
        ">
        <slot />
    </Primitive>
</template>
