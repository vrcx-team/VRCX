<script setup>
    import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
    import { reactiveOmit } from '@vueuse/core';

    import { useSidebar } from './utils';

    import SidebarMenuButtonChild from './SidebarMenuButtonChild.vue';

    defineOptions({
        inheritAttrs: false
    });

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
        tooltip: {
            type: [String, Object, Function],
            default: undefined
        },
        class: {
            type: [String, Array, Object],
            default: undefined
        }
    });

    const { isMobile, state } = useSidebar();

    const delegatedProps = reactiveOmit(props, 'tooltip');
</script>

<template>
    <SidebarMenuButtonChild v-if="!tooltip" v-bind="{ ...delegatedProps, ...$attrs }">
        <slot />
    </SidebarMenuButtonChild>

    <Tooltip v-else>
        <TooltipTrigger as-child>
            <SidebarMenuButtonChild v-bind="{ ...delegatedProps, ...$attrs }">
                <slot />
            </SidebarMenuButtonChild>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" :hidden="state !== 'collapsed' || isMobile">
            <template v-if="typeof tooltip === 'string'">
                {{ tooltip }}
            </template>
            <component :is="tooltip" v-else />
        </TooltipContent>
    </Tooltip>
</template>
