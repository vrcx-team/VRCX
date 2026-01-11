<script setup>
    import { Button } from '@/components/ui/button';
    import { cn } from '@/lib/utils';

    import { inputGroupButtonVariants } from '.';

    const props = defineProps({
        size: { type: null, required: false, default: 'xs' },
        variant: { type: null, required: false, default: 'ghost' },
        class: { type: null, required: false }
    });
</script>

<template>
    <Button
        :data-size="props.size"
        :variant="props.variant"
        :class="cn(inputGroupButtonVariants({ size: props.size }), props.class)">
        <slot />
    </Button>
</template>
