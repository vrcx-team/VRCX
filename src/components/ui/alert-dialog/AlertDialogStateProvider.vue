<script setup>
    import { provide, toRef } from 'vue';

    import { ALERT_DIALOG_OPEN_INJECTION_KEY } from './context';

    const props = defineProps({
        open: { type: Boolean, required: true }
    });

    provide(ALERT_DIALOG_OPEN_INJECTION_KEY, toRef(props, 'open'));
</script>

<template>
    <slot />
</template>
