<script setup>
    import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui';
    import { Check } from 'lucide-vue-next';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        defaultValue: { type: [Boolean, String], required: false },
        modelValue: { type: [Boolean, String, null], required: false },
        disabled: { type: Boolean, required: false },
        value: { type: null, required: false },
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
    <CheckboxRoot
        v-slot="slotProps"
        data-slot="checkbox"
        v-bind="forwarded"
        :class="
            cn(
                'peer border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
                props.class
            )
        ">
        <CheckboxIndicator
            data-slot="checkbox-indicator"
            class="grid place-content-center text-current transition-none">
            <slot v-bind="slotProps">
                <Check class="size-3.5" />
            </slot>
        </CheckboxIndicator>
    </CheckboxRoot>
</template>
