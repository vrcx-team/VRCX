<script setup>
    import { TagsInputItemText, useForwardProps } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <TagsInputItemText v-bind="forwardedProps" :class="cn('py-0.5 px-2 text-sm rounded bg-transparent', props.class)" />
</template>
