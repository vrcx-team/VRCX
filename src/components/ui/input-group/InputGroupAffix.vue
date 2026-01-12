<script setup>
    import { computed, useAttrs, useSlots } from 'vue';
    import { useVModel } from '@vueuse/core';

    import InputGroupField from './InputGroupField.vue';
    import { InputGroupText } from '.';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        modelValue: { type: [String, Number], default: '' },
        class: { type: null, required: false },
        inputClass: { type: null, required: false },
        prefixText: { type: String, default: '' },
        suffixText: { type: String, default: '' },
        clearable: { type: Boolean, default: false },
        size: { type: String, default: 'default' }
    });

    const emit = defineEmits(['update:modelValue']);
    const attrs = useAttrs();
    const slots = useSlots();

    const modelValue = useVModel(props, 'modelValue', emit, {
        passive: true,
        defaultValue: props.modelValue
    });

    const hasLeading = computed(() => Boolean(props.prefixText) || Boolean(slots.leading));
    const hasTrailing = computed(() => Boolean(props.suffixText) || Boolean(slots.trailing));
</script>

<template>
    <InputGroupField
        v-model="modelValue"
        :class="props.class"
        :input-class="props.inputClass"
        :clearable="props.clearable"
        :size="props.size"
        v-bind="attrs">
        <template v-if="hasLeading" #leading>
            <InputGroupText v-if="props.prefixText">{{ props.prefixText }}</InputGroupText>
            <slot name="leading" />
        </template>
        <template v-if="hasTrailing" #trailing>
            <slot name="trailing" />
            <InputGroupText v-if="props.suffixText">{{ props.suffixText }}</InputGroupText>
        </template>
    </InputGroupField>
</template>
