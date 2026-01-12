<script setup>
    import { Label } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        for: { type: String, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
    <Label
        data-slot="label"
        v-bind="delegatedProps"
        :class="
            cn(
                'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                props.class
            )
        ">
        <slot />
    </Label>
</template>
