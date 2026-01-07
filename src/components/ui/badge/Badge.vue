<script setup>
    import { Primitive } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';
    import { useAttrs } from 'vue';

    import { badgeVariants } from '.';

    const props = defineProps({
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        variant: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');
    const attrs = useAttrs();
</script>

<template>
    <Primitive
        data-slot="badge"
        :class="cn(badgeVariants({ variant }), props.class)"
        v-bind="{ ...delegatedProps, ...attrs }">
        <slot />
    </Primitive>
</template>
