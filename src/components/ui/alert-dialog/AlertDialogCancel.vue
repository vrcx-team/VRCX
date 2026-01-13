<script setup>
    import { AlertDialogCancel } from 'reka-ui';
    import { buttonVariants } from '@/components/ui/button';
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
    <AlertDialogCancel
        v-bind="delegatedProps"
        :class="cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', props.class)">
        <slot />
    </AlertDialogCancel>
</template>
