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
    <div data-slot="sidebar-footer" data-sidebar="footer" :class="cn('flex flex-col gap-2 p-2', props.class)">
        <slot />
    </div>
</template>
