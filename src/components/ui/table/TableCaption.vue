<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <caption data-slot="table-caption" :class="cn('text-muted-foreground mt-4 text-sm', props.class)">
        <slot />
    </caption>
</template>
