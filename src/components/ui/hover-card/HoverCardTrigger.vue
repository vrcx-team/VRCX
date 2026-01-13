<script setup>
    import { HoverCardTrigger } from 'reka-ui';

    const props = defineProps({
        reference: { type: null, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false }
    });
</script>

<template>
    <HoverCardTrigger data-slot="hover-card-trigger" v-bind="props">
        <slot />
    </HoverCardTrigger>
</template>
