<script setup>
    import { TagsInputRoot, useForwardPropsEmits } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        modelValue: { type: [Array, null], required: false },
        defaultValue: { type: Array, required: false },
        addOnPaste: { type: Boolean, required: false },
        addOnTab: { type: Boolean, required: false },
        addOnBlur: { type: Boolean, required: false },
        duplicate: { type: Boolean, required: false },
        disabled: { type: Boolean, required: false },
        delimiter: { type: null, required: false },
        dir: { type: String, required: false },
        max: { type: Number, required: false },
        id: { type: String, required: false },
        convertValue: { type: Function, required: false },
        displayValue: { type: Function, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        name: { type: String, required: false },
        required: { type: Boolean, required: false },
        class: { type: null, required: false }
    });
    const emits = defineEmits(['update:modelValue', 'invalid', 'addTag', 'removeTag']);

    const delegatedProps = reactiveOmit(props, 'class');

    const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <TagsInputRoot
        v-slot="slotProps"
        v-bind="forwarded"
        :class="
            cn(
                'flex flex-wrap gap-2 items-center rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                props.class
            )
        ">
        <slot v-bind="slotProps" />
    </TagsInputRoot>
</template>
