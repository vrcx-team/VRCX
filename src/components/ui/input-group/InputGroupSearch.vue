<script setup>
    import { useAttrs } from 'vue';
    import { useVModel } from '@vueuse/core';
    import { Search } from 'lucide-vue-next';

    import InputGroupField from './InputGroupField.vue';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        modelValue: { type: [String, Number], default: '' },
        class: { type: null, required: false },
        inputClass: { type: null, required: false },
        clearable: { type: Boolean, default: true },
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
        :size="props.size"
        v-bind="attrs">
        <template #leading>
            <Search class="size-4" />
        </template>
        <template v-if="$slots.trailing" #trailing>
            <slot name="trailing" />
        </template>
    </InputGroupField>
</template>
