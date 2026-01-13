<script setup>
    import { AlertDialogTitle } from 'reka-ui';
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
    <AlertDialogTitle
        data-slot="alert-dialog-title"
        v-bind="delegatedProps"
        :class="cn('text-lg font-semibold', props.class)">
        <slot />
    </AlertDialogTitle>
</template>
