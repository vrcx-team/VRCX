<script setup>
    import { Hash, X } from 'lucide-vue-next';
    import { computed, useAttrs } from 'vue';
    import { cn } from '@/lib/utils';
    import { useVModel } from '@vueuse/core';

    import {
        InputGroup,
        InputGroupAddon,
        InputGroupButton,
        InputGroupInput,
        InputGroupText,
        InputGroupTextarea
    } from '.';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        modelValue: { type: [String, Number], default: '' },
        maxlength: { type: Number, required: true },
        multiline: { type: Boolean, default: false },
        class: { type: null, required: false },
        inputClass: { type: null, required: false },
        countClass: { type: null, required: false },
        iconClass: { type: null, required: false },
        clearable: { type: Boolean, default: false }
    });

    const emit = defineEmits(['update:modelValue']);
    const attrs = useAttrs();

    const modelValue = useVModel(props, 'modelValue', emit, {
        passive: true,
        defaultValue: props.modelValue
    });

    const valueLength = computed(() => String(modelValue.value ?? '').length);
    const remaining = computed(() => Math.max(props.maxlength - valueLength.value, 0));
    const wrapperClass = computed(() => cn(props.class, attrs.class));
    const inputClass = computed(() => cn(props.inputClass));
    const inputAttrs = computed(() => {
        const { class: _class, style: _style, ...rest } = attrs;
        return rest;
    });

    const isDisabled = computed(() => Boolean(inputAttrs.value.disabled));

    function clearValue() {
        if (isDisabled.value) return;
        modelValue.value = '';
    }
</script>

<template>
    <InputGroup :class="wrapperClass" :style="attrs.style">
        <InputGroupAddon v-if="$slots.leading" align="inline-start">
            <slot name="leading" />
        </InputGroupAddon>
        <component
            :is="props.multiline ? InputGroupTextarea : InputGroupInput"
            v-model="modelValue"
            :maxlength="props.maxlength"
            :class="inputClass"
            v-bind="inputAttrs" />
        <InputGroupAddon v-if="$slots.trailing" align="inline-end">
            <slot name="trailing" />
        </InputGroupAddon>
        <InputGroupAddon v-if="props.clearable && valueLength > 0" align="inline-end">
            <InputGroupButton size="icon-xs" :disabled="isDisabled" @click="clearValue">
                <X class="size-3.5" />
                <span class="sr-only">Clear</span>
            </InputGroupButton>
        </InputGroupAddon>
        <InputGroupAddon :align="props.multiline ? 'block-end' : 'inline-end'" v-if="valueLength > 0">
            <InputGroupText :class="cn('gap-1 tabular-nums text-xs', props.multiline && 'ml-auto', props.countClass)">
                <span>{{ valueLength }}</span>
                <span class="text-muted-foreground/70">/ {{ props.maxlength }}</span>
            </InputGroupText>
        </InputGroupAddon>
    </InputGroup>
</template>
