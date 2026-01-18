<script setup>
    import { CalendarGridHead } from 'reka-ui';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });
</script>

<template>
    <CalendarGridHead data-slot="calendar-grid-head" v-bind="props">
        <slot />
    </CalendarGridHead>
</template>
