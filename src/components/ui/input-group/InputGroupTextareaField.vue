<script setup>
    import { computed, nextTick, onMounted, ref, useAttrs, watch } from 'vue';
    import { useVModel } from '@vueuse/core';
    import { X } from 'lucide-vue-next';
    import { cn } from '@/lib/utils';

    import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from '.';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        modelValue: { type: [String, Number], default: '' },
        class: { type: null, required: false },
        inputClass: { type: null, required: false },
        clearable: { type: Boolean, default: false },
        showCount: { type: Boolean, default: false },
        maxlength: { type: Number, required: false },
        autosize: { type: [Boolean, Object], default: false }
    });

    const emit = defineEmits(['update:modelValue', 'input', 'change']);
    const attrs = useAttrs();

    const modelValue = useVModel(props, 'modelValue', emit, {
        passive: true,
        defaultValue: props.modelValue
    });

    const textareaRef = ref(null);
    const valueLength = computed(() => String(modelValue.value ?? '').length);
    const maxLength = computed(() => props.maxlength ?? attrs.maxlength);
    const wrapperClass = computed(() => cn(props.class, attrs.class));
    const inputClass = computed(() => cn(props.inputClass));
    const showCount = computed(() => Boolean(maxLength.value) && props.showCount);
    const autosizeConfig = computed(() => {
        if (!props.autosize) return null;
        return typeof props.autosize === 'object' ? props.autosize : {};
    });

    const inputAttrs = computed(() => {
        const {
            class: _class,
            style: _style,
            maxlength: _maxlength,
            onInput: _onInput,
            onChange: _onChange,
            ...rest
        } = attrs;
        return {
            ...rest,
            maxlength: maxLength.value
        };
    });

    const isDisabled = computed(() => Boolean(inputAttrs.value.disabled));

    function resolveTextareaEl() {
        const instance = textareaRef.value;
        if (!instance) return null;
        return instance.$el ?? instance;
    }

    function resizeTextarea() {
        if (!autosizeConfig.value) return;
        const el = resolveTextareaEl();
        if (!el) return;
        const computedStyle = window.getComputedStyle(el);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 16;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        const minRows = autosizeConfig.value.minRows ?? Number(attrs.rows) || 1;
        const maxRows = autosizeConfig.value.maxRows ?? Number.POSITIVE_INFINITY;
        const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
        const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

        el.style.height = 'auto';
        const nextHeight = Math.min(maxHeight, Math.max(el.scrollHeight, minHeight));
        el.style.height = `${nextHeight}px`;
    }

    function clearValue() {
        if (isDisabled.value) return;
        modelValue.value = '';
        emit('input', '');
        emit('change', '');
        nextTick(resizeTextarea);
    }

    function handleInput(event) {
        const value = event?.target?.value ?? '';
        emit('input', value);
        resizeTextarea();
    }

    function handleChange(event) {
        const value = event?.target?.value ?? '';
        emit('change', value);
    }

    onMounted(() => {
        if (autosizeConfig.value) {
            nextTick(resizeTextarea);
        }
    });

    watch(
        () => modelValue.value,
        () => {
            if (autosizeConfig.value) {
                nextTick(resizeTextarea);
            }
        }
    );
</script>

<template>
    <InputGroup :class="wrapperClass" :style="attrs.style" :data-disabled="isDisabled ? 'true' : undefined">
        <InputGroupAddon v-if="$slots.leading" align="block-start">
            <slot name="leading" />
        </InputGroupAddon>
        <InputGroupTextarea
            ref="textareaRef"
            v-model="modelValue"
            :class="inputClass"
            v-bind="inputAttrs"
            @input="handleInput"
            @change="handleChange" />
        <InputGroupAddon v-if="$slots.trailing" align="block-end">
            <slot name="trailing" />
        </InputGroupAddon>
        <InputGroupAddon v-if="props.clearable && valueLength > 0" align="inline-end">
            <InputGroupButton size="icon-xs" :disabled="isDisabled" @click="clearValue">
                <X class="size-3.5" />
                <span class="sr-only">Clear</span>
            </InputGroupButton>
        </InputGroupAddon>
        <InputGroupAddon v-if="showCount && valueLength > 0" align="block-end">
            <InputGroupText class="gap-1 tabular-nums text-xs">
                <span>{{ valueLength }}</span>
                <span class="text-muted-foreground/70">/ {{ maxLength }}</span>
            </InputGroupText>
        </InputGroupAddon>
    </InputGroup>
</template>
