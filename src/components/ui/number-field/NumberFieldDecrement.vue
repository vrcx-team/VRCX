<script setup>
    import { NumberFieldDecrement, useForwardProps } from 'reka-ui';
    import { Minus } from 'lucide-vue-next';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        disabled: { type: Boolean, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const forwarded = useForwardProps(delegatedProps);
</script>

<template>
    <NumberFieldDecrement
        data-slot="decrement"
        v-bind="forwarded"
        :class="
            cn(
                'absolute top-1/2 -translate-y-1/2 left-0 p-3 disabled:cursor-not-allowed disabled:opacity-20',
                props.class
            )
        ">
        <slot>
            <Minus class="h-4 w-4" />
        </slot>
    </NumberFieldDecrement>
</template>
