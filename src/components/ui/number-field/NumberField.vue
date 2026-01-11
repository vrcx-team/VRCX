<script setup>
    import { NumberFieldRoot, useForwardPropsEmits } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        defaultValue: { type: Number, required: false },
        modelValue: { type: [Number, null], required: false },
        min: { type: Number, required: false },
        max: { type: Number, required: false },
        step: { type: Number, required: false },
        stepSnapping: { type: Boolean, required: false },
        formatOptions: { type: null, required: false },
        locale: { type: String, required: false },
        disabled: { type: Boolean, required: false },
        readonly: { type: Boolean, required: false },
        disableWheelChange: { type: Boolean, required: false },
        invertWheelChange: { type: Boolean, required: false },
        id: { type: String, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        name: { type: String, required: false },
        required: { type: Boolean, required: false },
        class: { type: null, required: false }
    });
    const emits = defineEmits(['update:modelValue']);

    const delegatedProps = reactiveOmit(props, 'class');

    const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <NumberFieldRoot v-slot="slotProps" v-bind="forwarded" :class="cn('grid gap-1.5', props.class)">
        <slot v-bind="slotProps" />
    </NumberFieldRoot>
</template>
