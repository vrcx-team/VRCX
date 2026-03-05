<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: {
            type: [Boolean, null, String, Object, Array],
            required: false,
            skipCheck: true
        }
    });
</script>

<template>
    <kbd data-slot="kbd-group" :class="cn('inline-flex items-center gap-1', props.class)">
        <slot />
    </kbd>
</template>
