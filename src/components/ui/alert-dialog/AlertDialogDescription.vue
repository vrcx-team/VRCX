<script setup>
    import { AlertDialogDescription } from 'reka-ui';
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
    <AlertDialogDescription
        data-slot="alert-dialog-description"
        v-bind="delegatedProps"
        :class="cn('text-muted-foreground text-sm', props.class)">
        <slot />
    </AlertDialogDescription>
</template>
