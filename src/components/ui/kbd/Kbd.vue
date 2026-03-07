<script setup>
    import { cn } from '@/lib/utils';

    const props = defineProps({
        class: {
            type: [Boolean, null, String, Object, Array],
            required: false,
            skipCheck: true
        }
    });
</script>

<template>
    <kbd
        :class="
            cn(
                'bg-muted text-muted-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium select-none',
                '[&_svg:not([class*=\'size-\'])]:size-3',
                '[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10',
                props.class
            )
        ">
        <slot />
    </kbd>
</template>
