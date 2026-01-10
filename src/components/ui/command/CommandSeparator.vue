<script setup>
    import { Separator } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        orientation: { type: String, required: false },
        decorative: { type: Boolean, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <Separator data-slot="command-separator" v-bind="delegatedProps" :class="cn('bg-border -mx-1 h-px', props.class)">
        <slot />
    </Separator>
</template>
