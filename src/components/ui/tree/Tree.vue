<script setup>
    import { TreeRoot } from 'reka-ui';
    import { cn } from '@/lib/utils';

    /** @typedef {import('reka-ui').TreeRootProps} TreeRootProps */

    const props = defineProps({
        items: { type: Array, required: true },
        getKey: { type: /** @type {import('vue').PropType<TreeRootProps['getKey']>} */ (Function), required: false },
        getChildren: {
            type: /** @type {import('vue').PropType<TreeRootProps['getChildren']>} */ (Function),
            required: false
        },
        defaultExpanded: { type: /** @type {import('vue').PropType<string[]>} */ (Array), required: false },
        expanded: { type: /** @type {import('vue').PropType<string[]>} */ (Array), required: false },
        multiple: { type: Boolean, required: false, default: false },
        propagateSelect: { type: Boolean, required: false, default: false },
        class: { type: null, required: false }
    });

    const emit = defineEmits(['update:expanded', 'update:modelValue']);
</script>

<template>
    <TreeRoot
        :items="props.items"
        :get-key="props.getKey"
        :get-children="props.getChildren"
        :default-expanded="props.defaultExpanded"
        :expanded="props.expanded"
        :multiple="props.multiple"
        :propagate-select="props.propagateSelect"
        :class="cn('flex flex-col', props.class)"
        @update:expanded="(val) => emit('update:expanded', val)"
        @update:model-value="(val) => emit('update:modelValue', val)">
        <template #default="slotProps">
            <slot v-bind="slotProps" />
        </template>
    </TreeRoot>
</template>
