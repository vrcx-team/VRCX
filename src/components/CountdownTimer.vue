<template>
    <span>{{ text }}</span>
</template>

<script setup>
    import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import * as workerTimers from 'worker-timers';
    import { timeToText } from '../shared/utils';

    const props = defineProps({
        datetime: { type: String, default: '' },
        hours: { type: Number, default: 1 }
    });

    const text = ref('');

    function update() {
        const epoch = new Date(props.datetime).getTime() + 1000 * 60 * 60 * props.hours - Date.now();
        text.value = epoch >= 0 ? timeToText(epoch) : '-';
    }

    watch(() => props.datetime, update);

    onMounted(() => {
        update();
    });

    const timer = workerTimers.setInterval(update, 5000);

    onBeforeUnmount(() => {
        workerTimers.clearInterval(timer);
    });
</script>
