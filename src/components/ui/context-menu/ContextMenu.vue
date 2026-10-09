<script setup>
    import { ContextMenuRoot, useForwardPropsEmits } from 'reka-ui';

    /** @typedef {import('reka-ui').ContextMenuRootProps} ContextMenuRootProps */

    const props = defineProps({
        pressOpenDelay: { type: Number, required: false },
        dir: { type: /** @type {import('vue').PropType<ContextMenuRootProps['dir']>} */ (String), required: false },
        modal: { type: Boolean, required: false }
    });
    const emits = defineEmits(['update:open']);

    const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
    <ContextMenuRoot data-slot="context-menu" v-bind="forwarded">
        <slot />
    </ContextMenuRoot>
</template>
