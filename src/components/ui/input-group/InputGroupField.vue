<script setup>
    import { computed, ref, useAttrs } from 'vue';
    import { useVModel } from '@vueuse/core';
    import { Eye, EyeOff, X } from 'lucide-vue-next';
    import { cn } from '@/lib/utils';

    import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from '.';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        modelValue: { type: [String, Number], default: '' },
        class: { type: null, required: false },
        inputClass: { type: null, required: false },
        clearable: { type: Boolean, default: false },
        showPassword: { type: Boolean, default: false },
        showCount: { type: Boolean, default: false },
        maxlength: { type: Number, required: false },
        type: { type: String, required: false },
        size: { type: String, default: 'default' }
    });

    const emit = defineEmits(['update:modelValue', 'input', 'change']);
    const attrs = useAttrs();

    const modelValue = useVModel(props, 'modelValue', emit, {
        passive: true,
        defaultValue: props.modelValue
    });

    const reveal = ref(false);
    const valueLength = computed(() => String(modelValue.value ?? '').length);
    const maxLength = computed(() => props.maxlength ?? attrs.maxlength);
    const wrapperClass = computed(() =>
        cn(props.class, attrs.class, props.size === 'sm' && 'h-8')
    );
    const inputClass = computed(() => cn(props.inputClass));

    const inputType = computed(() => {
        const rawType = props.type ?? attrs.type;
        if (props.showPassword) {
            return reveal.value ? 'text' : rawType || 'password';
        }
        return rawType;
    });

    const inputAttrs = computed(() => {
        const {
            class: _class,
            style: _style,
            type: _type,
            maxlength: _maxlength,
            onInput: _onInput,
            onChange: _onChange,
            ...rest
        } = attrs;
        return {
            ...rest,
            type: inputType.value,
            maxlength: maxLength.value
        };
    });

    const isDisabled = computed(() => Boolean(inputAttrs.value.disabled));
    const showCount = computed(() => Boolean(maxLength.value) && props.showCount);

    function clearValue() {
        if (isDisabled.value) return;
        modelValue.value = '';
        emit('input', '');
        emit('change', '');
    }

    function toggleReveal() {
        if (isDisabled.value) return;
        reveal.value = !reveal.value;
    }

    function handleInput(event) {
        const value = event?.target?.value ?? '';
        emit('input', value);
    }

    function handleChange(event) {
        const value = event?.target?.value ?? '';
        emit('change', value);
    }
</script>

<template>
    <InputGroup :class="wrapperClass" :style="attrs.style" :data-disabled="isDisabled ? 'true' : undefined">
        <InputGroupAddon v-if="$slots.leading" align="inline-start">
            <slot name="leading" />
        </InputGroupAddon>
        <InputGroupInput
            v-model="modelValue"
            :class="inputClass"
            v-bind="inputAttrs"
            @input="handleInput"
            @change="handleChange" />
        <InputGroupAddon v-if="$slots.trailing" align="inline-end">
            <slot name="trailing" />
        </InputGroupAddon>
        <InputGroupAddon v-if="props.showPassword" align="inline-end">
            <InputGroupButton size="icon-xs" :disabled="isDisabled" @click="toggleReveal">
                <Eye v-if="!reveal" class="size-3.5" />
                <EyeOff v-else class="size-3.5" />
                <span class="sr-only">Toggle password</span>
            </InputGroupButton>
        </InputGroupAddon>
        <InputGroupAddon v-if="props.clearable && valueLength > 0" align="inline-end">
            <InputGroupButton size="icon-xs" :disabled="isDisabled" @click="clearValue">
                <X class="size-3.5" />
                <span class="sr-only">Clear</span>
            </InputGroupButton>
        </InputGroupAddon>
        <InputGroupAddon v-if="showCount && valueLength > 0" align="inline-end">
            <InputGroupText class="gap-1 tabular-nums text-xs">
                <span>{{ valueLength }}</span>
                <span class="text-muted-foreground/70">/ {{ maxLength }}</span>
            </InputGroupText>
        </InputGroupAddon>
    </InputGroup>
</template>
