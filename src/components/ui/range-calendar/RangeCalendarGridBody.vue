<script setup>
    import { RangeCalendarGridBody } from 'reka-ui';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false }
    });
</script>

<template>
    <RangeCalendarGridBody data-slot="range-calendar-grid-body" v-bind="props">
        <slot />
    </RangeCalendarGridBody>
</template>
