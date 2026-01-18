<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: {
            type: [String, Array, Object],
            default: undefined
        }
    });
</script>

<template>
    <ul data-slot="sidebar-menu" data-sidebar="menu" :class="cn('flex w-full min-w-0 flex-col gap-1', props.class)">
        <slot />
    </ul>
</template>
