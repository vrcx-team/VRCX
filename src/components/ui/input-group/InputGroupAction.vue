<script setup>
    import { useAttrs } from 'vue';
    import { useVModel } from '@vueuse/core';

    import InputGroupField from './InputGroupField.vue';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        modelValue: { type: [String, Number], default: '' },
        class: { type: null, required: false },
        inputClass: { type: null, required: false },
        clearable: { type: Boolean, default: false },
        showPassword: { type: Boolean, default: false },
        showCount: { type: Boolean, default: false },
        maxlength: { type: Number, required: false },
        size: { type: String, default: 'default' }
    });

    const emit = defineEmits(['update:modelValue']);
    const attrs = useAttrs();

    const modelValue = useVModel(props, 'modelValue', emit, {
        passive: true,
        defaultValue: props.modelValue
    });
</script>

<template>
    <InputGroupField
        v-model="modelValue"
        :class="props.class"
        :input-class="props.inputClass"
        :clearable="props.clearable"
        :show-password="props.showPassword"
        :show-count="props.showCount"
        :maxlength="props.maxlength"
        :size="props.size"
        v-bind="attrs">
        <template v-if="$slots.leading" #leading>
            <slot name="leading" />
        </template>
        <template v-if="$slots.actions" #trailing>
            <slot name="actions" />
        </template>
    </InputGroupField>
</template>
