<script setup>
    import { cn } from '@/lib/utils';

    import { fieldVariants } from '.';

    const props = defineProps({
        class: { type: null, required: false },
        orientation: { type: null, required: false }
    });
</script>

<template>
    <div
        role="group"
        data-slot="field"
        :data-orientation="orientation"
        :class="cn(fieldVariants({ orientation }), props.class)">
        <slot />
    </div>
</template>
