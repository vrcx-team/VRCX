<script setup>
    import { cn } from '@/lib/utils';

    import { emptyMediaVariants } from '.';

    const props = defineProps({
        class: { type: null, required: false },
        variant: { type: null, required: false }
    });
</script>

<template>
    <div data-slot="empty-icon" :data-variant="variant" :class="cn(emptyMediaVariants({ variant }), props.class)">
        <slot />
    </div>
</template>
