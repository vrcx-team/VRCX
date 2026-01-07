<script setup>
    import { PopoverTrigger } from 'reka-ui';
    import { computed } from 'vue';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false }
    });

    const forwarded = computed(() => ({
        ...props,
        as: props.as ?? (props.asChild ? 'span' : 'button')
    }));
</script>

<template>
    <PopoverTrigger data-slot="popover-trigger" v-bind="forwarded">
        <slot />
    </PopoverTrigger>
</template>
