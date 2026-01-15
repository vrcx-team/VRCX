<script setup>
    import { DialogRoot, useForwardPropsEmits } from 'reka-ui';

    import DialogStateProvider from './DialogStateProvider.vue';

    const props = defineProps({
        open: { type: Boolean, required: false },
        defaultOpen: { type: Boolean, required: false },
        modal: { type: Boolean, required: false }
    });
    const emits = defineEmits(['update:open']);

    const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
    <DialogRoot v-slot="slotProps" data-slot="dialog" v-bind="forwarded">
        <DialogStateProvider :open="slotProps.open">
            <slot v-bind="slotProps" />
        </DialogStateProvider>
    </DialogRoot>
</template>
