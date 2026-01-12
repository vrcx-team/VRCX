<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false },
        variant: { type: String, required: false }
    });
</script>

<template>
    <legend
        data-slot="field-legend"
        :data-variant="variant"
        :class="cn('mb-3 font-medium', 'data-[variant=legend]:text-base', 'data-[variant=label]:text-sm', props.class)">
        <slot />
    </legend>
</template>
