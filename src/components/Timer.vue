<template>
    <span>{{ text }}</span>
</template>
<script setup>
    import { useNow } from '@vueuse/core';
    import { computed } from 'vue';

    import { timeToText } from '../shared/utils';

    const props = defineProps({
        epoch: {
            type: Number,
            required: true
        }
    });

    const now = useNow({ interval: 15000 });
    const text = computed(() => {
        return props.epoch ? timeToText(now.value - props.epoch) : '-';
    });
</script>
