<script setup>
    import { CollapsibleContent } from 'reka-ui';

    const props = defineProps({
        forceMount: { type: Boolean, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false }
    });
</script>

<template>
    <CollapsibleContent data-slot="collapsible-content" v-bind="props">
        <slot />
    </CollapsibleContent>
</template>
