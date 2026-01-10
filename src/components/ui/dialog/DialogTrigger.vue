<script setup>
    import { DialogTrigger } from 'reka-ui';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false }
    });
</script>

<template>
    <DialogTrigger data-slot="dialog-trigger" v-bind="props">
        <slot />
    </DialogTrigger>
</template>
