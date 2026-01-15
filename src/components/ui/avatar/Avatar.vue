<script setup>
    import { AvatarRoot } from 'reka-ui';
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <AvatarRoot
        data-slot="avatar"
        :class="cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', props.class)">
        <slot />
    </AvatarRoot>
</template>
