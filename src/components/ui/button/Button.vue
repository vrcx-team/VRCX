<script setup>
    import { Primitive } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { computed } from 'vue';

    import { buttonVariants } from '.';

    const props = defineProps({
        variant: { type: null, required: false },
        size: { type: null, required: false },
        class: { type: null, required: false },
        disabled: { type: Boolean, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false, default: 'button' }
    });

    const isNativeButton = computed(() => props.as === 'button' && !props.asChild);
</script>

<template>
    <Primitive
        data-slot="button"
        :as="as"
        :as-child="asChild"
        :disabled="isNativeButton ? props.disabled : undefined"
        :data-disabled="props.disabled ? '' : undefined"
        :aria-disabled="props.disabled || undefined"
        :class="cn(buttonVariants({ variant, size }), props.class)">
        <slot />
    </Primitive>
</template>
