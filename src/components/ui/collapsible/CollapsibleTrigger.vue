<script setup>
    import { CollapsibleTrigger } from 'reka-ui';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false }
    });
</script>

<template>
    <CollapsibleTrigger data-slot="collapsible-trigger" v-bind="props">
        <slot />
    </CollapsibleTrigger>
</template>
