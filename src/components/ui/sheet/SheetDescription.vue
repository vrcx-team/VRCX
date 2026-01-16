<script setup>
    import { DialogDescription } from 'reka-ui';
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
    <DialogDescription
        data-slot="sheet-description"
        :class="cn('text-muted-foreground text-sm', props.class)"
        v-bind="delegatedProps">
        <slot />
    </DialogDescription>
</template>
