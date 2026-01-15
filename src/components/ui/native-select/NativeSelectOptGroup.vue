<!-- @fallthroughAttributes true -->
<!-- @strictTemplates true -->

<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <optgroup data-slot="native-select-optgroup" :class="cn('bg-popover text-popover-foreground', props.class)">
        <slot />
    </optgroup>
</template>
