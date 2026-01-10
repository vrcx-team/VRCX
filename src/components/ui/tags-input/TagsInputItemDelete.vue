<script setup>
    import { TagsInputItemDelete, useForwardProps } from 'reka-ui';
    import { X } from 'lucide-vue-next';
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
    <TagsInputItemDelete v-bind="forwardedProps" :class="cn('flex rounded bg-transparent mr-1', props.class)">
        <slot>
            <X class="w-4 h-4" />
        </slot>
    </TagsInputItemDelete>
</template>
