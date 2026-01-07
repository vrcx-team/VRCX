<script setup>
    import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        defaultValue: { type: Boolean, required: false },
        modelValue: { type: [Boolean, null], required: false },
        disabled: { type: Boolean, required: false },
        id: { type: String, required: false },
        value: { type: String, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        name: { type: String, required: false },
        required: { type: Boolean, required: false },
        class: { type: null, required: false }
    });

    const emits = defineEmits(['update:modelValue']);

    const delegatedProps = reactiveOmit(props, 'class');

    const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <SwitchRoot
        v-slot="slotProps"
        data-slot="switch"
        v-bind="forwarded"
        :class="
            cn(
                'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
                props.class
            )
        ">
        <SwitchThumb
            data-slot="switch-thumb"
            :class="
                cn(
                    'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0'
                )
            ">
            <slot name="thumb" v-bind="slotProps" />
        </SwitchThumb>
    </SwitchRoot>
</template>
