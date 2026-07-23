<script setup>
    import { DropdownMenuSubTrigger, useForwardProps } from 'reka-ui';
    import { ChevronRight } from 'lucide-vue-next';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        disabled: { type: Boolean, required: false },
        textValue: { type: String, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false },
        inset: { type: Boolean, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class', 'inset');
    const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <DropdownMenuSubTrigger
        data-slot="dropdown-menu-sub-trigger"
        v-bind="forwardedProps"
        :class="
            cn(
                'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-inset:ps-8',
                props.class
            )
        ">
        <slot />
        <ChevronRight class="ms-auto size-4 rtl:scale-x-[-1]" />
    </DropdownMenuSubTrigger>
</template>
