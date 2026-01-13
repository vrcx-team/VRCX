<script setup>
    import { ProgressIndicator, ProgressRoot } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        modelValue: { type: [Number, null], required: false, default: 0 },
        max: { type: Number, required: false },
        getValueLabel: { type: Function, required: false },
        getValueText: { type: Function, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <ProgressRoot
        data-slot="progress"
        v-bind="delegatedProps"
        :class="cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', props.class)">
        <ProgressIndicator
            data-slot="progress-indicator"
            class="bg-primary h-full w-full flex-1 transition-all"
            :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%);`" />
    </ProgressRoot>
</template>
