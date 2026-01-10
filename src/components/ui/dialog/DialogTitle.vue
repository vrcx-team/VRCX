<script setup>
    import { DialogTitle, useForwardProps } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <DialogTitle
        data-slot="dialog-title"
        v-bind="forwardedProps"
        :class="cn('text-lg leading-none font-semibold', props.class)">
        <slot />
    </DialogTitle>
</template>
