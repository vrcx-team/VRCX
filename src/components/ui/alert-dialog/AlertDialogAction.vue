<script setup>
    import { AlertDialogAction } from 'reka-ui';
    import { buttonVariants } from '@/components/ui/button';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        variant: { type: String, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class', 'variant');
</script>

<template>
    <AlertDialogAction v-bind="delegatedProps" :class="cn(buttonVariants({ variant: props.variant }), props.class)">
        <slot />
    </AlertDialogAction>
</template>
