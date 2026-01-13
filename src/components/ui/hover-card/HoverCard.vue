<script setup>
    import { HoverCardRoot, useForwardPropsEmits } from 'reka-ui';

    const props = defineProps({
        defaultOpen: { type: Boolean, required: false },
        open: { type: Boolean, required: false },
        openDelay: { type: Number, required: false },
        closeDelay: { type: Number, required: false }
    });
    const emits = defineEmits(['update:open']);

    const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
    <HoverCardRoot v-slot="slotProps" data-slot="hover-card" v-bind="forwarded">
        <slot v-bind="slotProps" />
    </HoverCardRoot>
</template>
