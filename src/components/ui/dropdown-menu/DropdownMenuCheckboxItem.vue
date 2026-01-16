<script setup>
    import { DropdownMenuCheckboxItem, DropdownMenuItemIndicator, useForwardPropsEmits } from 'reka-ui';
    import { Check } from 'lucide-vue-next';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    const props = defineProps({
        modelValue: { type: [Boolean, String], required: false },
        disabled: { type: Boolean, required: false },
        textValue: { type: String, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false },
        indicatorPosition: { type: String, required: false, default: 'left' }
    });
    const emits = defineEmits(['select', 'update:modelValue']);

    const delegatedProps = reactiveOmit(props, 'class', 'indicatorPosition');

    const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
    <DropdownMenuCheckboxItem
        data-slot="dropdown-menu-checkbox-item"
        v-bind="forwarded"
        :class="
            cn(
                'focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
                props.indicatorPosition === 'right' ? 'pr-8 pl-2' : undefined,
                props.class
            )
        ">
        <span
            :class="
                props.indicatorPosition === 'right'
                    ? 'pointer-events-none absolute right-2 flex size-3.5 items-center justify-center'
                    : 'pointer-events-none absolute left-2 flex size-3.5 items-center justify-center'
            ">
            <DropdownMenuItemIndicator>
                <slot name="indicator-icon">
                    <Check class="size-4" />
                </slot>
            </DropdownMenuItemIndicator>
        </span>
        <slot />
    </DropdownMenuCheckboxItem>
</template>
