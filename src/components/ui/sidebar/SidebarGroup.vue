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
    <div
        data-slot="sidebar-group"
        data-sidebar="group"
        :class="cn('relative flex w-full min-w-0 flex-col p-2', props.class)">
        <slot />
    </div>
</template>
