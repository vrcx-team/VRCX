<script setup>
    import { NumberFieldIncrement, useForwardProps } from 'reka-ui';
    import { Plus } from 'lucide-vue-next';
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
    <NumberFieldIncrement
        data-slot="increment"
        v-bind="forwarded"
        :class="
            cn(
                'absolute top-1/2 -translate-y-1/2 right-0 disabled:cursor-not-allowed disabled:opacity-20 p-3',
                props.class
            )
        ">
        <slot>
            <Plus class="h-4 w-4" />
        </slot>
    </NumberFieldIncrement>
</template>
