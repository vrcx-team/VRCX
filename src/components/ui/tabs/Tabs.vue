<script setup>
    import { TabsRoot, useForwardPropsEmits } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    /** @typedef {import('reka-ui').TabsRootProps} TabsRootProps */

    const props = defineProps({
        defaultValue: { type: null, required: false },
        orientation: {
            type: /** @type {import('vue').PropType<TabsRootProps['orientation']>} */ (String),
            required: false
        },
        dir: { type: /** @type {import('vue').PropType<TabsRootProps['dir']>} */ (String), required: false },
        activationMode: {
            type: /** @type {import('vue').PropType<TabsRootProps['activationMode']>} */ (String),
            required: false
        },
        modelValue: { type: null, required: false },
        unmountOnHide: { type: Boolean, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });
    const emits = defineEmits(['update:modelValue']);

    const delegatedProps = reactiveOmit(props, 'class');
    const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <TabsRoot v-slot="slotProps" data-slot="tabs" v-bind="forwarded" :class="cn('flex flex-col gap-2', props.class)">
        <slot v-bind="slotProps" />
    </TabsRoot>
</template>
