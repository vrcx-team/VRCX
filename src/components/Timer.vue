<template>
    <span>{{ text }}</span>
</template>
<script setup>
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import { timeToText } from '../shared/utils';

    const props = defineProps({
        epoch: {
            type: Number,
            required: true
        }
    });

    const now = ref(Date.now());
    const text = computed(() => {
        return props.epoch ? timeToText(now.value - props.epoch) : '-';
    });

    let timerId = null;
    onMounted(() => {
        timerId = setInterval(() => {
            now.value = Date.now();
        }, 5000);
    });
    onBeforeUnmount(() => {
        clearInterval(timerId);
    });
</script>
