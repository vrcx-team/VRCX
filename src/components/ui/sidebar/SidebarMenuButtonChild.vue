<script setup>
    import { Primitive } from 'reka-ui';
    import { cn } from '@/lib/utils';

    import { sidebarMenuButtonVariants } from '.';

    const props = defineProps({
        as: {
            type: [String, Object, Function],
            default: 'button'
        },
        asChild: {
            type: Boolean,
            default: false
        },
        variant: {
            type: String,
            default: 'default'
        },
        size: {
            type: String,
            default: 'default'
        },
        isActive: {
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
        data-slot="sidebar-menu-button"
        data-sidebar="menu-button"
        :data-size="size"
        :data-active="isActive"
        :class="cn(sidebarMenuButtonVariants({ variant, size }), props.class)"
        :as="as"
        :as-child="asChild"
        v-bind="$attrs">
        <slot />
    </Primitive>
</template>
