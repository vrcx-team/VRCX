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
    <div data-slot="sidebar-group-content" data-sidebar="group-content" :class="cn('w-full text-sm', props.class)">
        <slot />
    </div>
</template>
