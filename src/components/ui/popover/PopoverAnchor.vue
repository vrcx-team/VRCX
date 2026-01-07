<script setup>
    import { PopoverAnchor } from 'reka-ui';

    const props = defineProps({
        reference: { type: null, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false }
    });
</script>

<template>
    <PopoverAnchor data-slot="popover-anchor" v-bind="props">
        <slot />
    </PopoverAnchor>
</template>
