<script setup>
    import { DialogTitle } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <DialogTitle
        data-slot="sheet-title"
        :class="cn('text-foreground font-semibold', props.class)"
        v-bind="delegatedProps">
        <slot />
    </DialogTitle>
</template>
