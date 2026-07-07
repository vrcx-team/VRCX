<script setup>
    import { Toggle, useForwardPropsEmits } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';
    import { computed } from 'vue';

    import { toggleVariants } from '.';

    const props = defineProps({
        defaultValue: { type: Boolean, required: false },
        modelValue: { type: [Boolean, null], required: false },
        disabled: { type: Boolean, required: false, default: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        name: { type: String, required: false },
        required: { type: Boolean, required: false },
        class: { type: null, required: false },
        variant: { type: null, required: false, default: 'default' },
        size: { type: null, required: false, default: 'default' },
        ariaLabel: { type: String, required: false }
    });

    const emits = defineEmits(['update:modelValue']);

    const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant');
    const forwarded = useForwardPropsEmits(delegatedProps, emits);

    const computedAriaLabel = computed(() => {
        return props.ariaLabel;
    });
</script>

<template>
    <Toggle
        v-slot="slotProps"
        data-slot="toggle"
        v-bind="forwarded"
        :aria-label="computedAriaLabel"
        :class="cn(toggleVariants({ variant, size }), props.class)">
        <slot v-bind="slotProps" />
    </Toggle>
</template>

