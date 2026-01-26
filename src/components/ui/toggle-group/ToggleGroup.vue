<script setup>
    import { computed, provide, unref } from 'vue';
    import { ToggleGroupRoot, useForwardPropsEmits } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        rovingFocus: { type: Boolean, required: false },
        disabled: { type: Boolean, required: false },
        orientation: { type: String, required: false },
        dir: { type: String, required: false },
        loop: { type: Boolean, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        name: { type: String, required: false },
        required: { type: Boolean, required: false },
        type: { type: String, required: false },
        modelValue: { type: null, required: false },
        defaultValue: { type: null, required: false },
        class: { type: null, required: false },
        variant: { type: null, required: false },
        size: { type: null, required: false },
        spacing: { type: Number, required: false, default: 0 }
    });

    const emits = defineEmits(['update:modelValue']);

    provide('toggleGroup', {
        variant: props.variant,
        size: props.size,
        spacing: props.spacing
    });

    const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant');
    const forwarded = useForwardPropsEmits(delegatedProps, emits);
    const forwardedProps = computed(() => {
        const { ['onUpdate:modelValue']: _ignored, ...rest } = unref(forwarded);
        return rest;
    });

    function onUpdateModelValue(value) {
        if (!value || (Array.isArray(value) && !value.length)) {
            return;
        }
        emits('update:modelValue', value);
    }
</script>

<template>
    <ToggleGroupRoot
        v-slot="slotProps"
        data-slot="toggle-group"
        :data-size="size"
        :data-variant="variant"
        :data-spacing="spacing"
        :style="{
            '--gap': spacing
        }"
        v-bind="forwardedProps"
        @update:modelValue="onUpdateModelValue"
        :class="
            cn(
                'group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=default]:data-[variant=outline]:shadow-xs',
                props.class
            )
        ">
        <slot v-bind="slotProps" />
    </ToggleGroupRoot>
</template>
