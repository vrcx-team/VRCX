<script setup>
    import { DialogClose } from 'reka-ui';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false }
    });
</script>

<template>
    <DialogClose data-slot="dialog-close" v-bind="props">
        <slot />
    </DialogClose>
</template>
