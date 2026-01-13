<script setup>
    import { TabsContent } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        value: { type: [String, Number], required: true },
        forceMount: { type: Boolean, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <TabsContent data-slot="tabs-content" :class="cn('flex-1 outline-none', props.class)" v-bind="delegatedProps">
        <slot />
    </TabsContent>
</template>
