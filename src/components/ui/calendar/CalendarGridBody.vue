<script setup>
    import { CalendarGridBody } from 'reka-ui';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false }
    });
</script>

<template>
    <CalendarGridBody data-slot="calendar-grid-body" v-bind="props">
        <slot />
    </CalendarGridBody>
</template>
