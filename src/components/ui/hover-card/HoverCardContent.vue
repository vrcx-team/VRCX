<script setup>
    import { HoverCardContent, HoverCardPortal, useForwardProps } from 'reka-ui';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    defineOptions({
        inheritAttrs: false
    });

    const props = defineProps({
        forceMount: { type: Boolean, required: false },
        side: { type: null, required: false },
        sideOffset: { type: Number, required: false, default: 4 },
        sideFlip: { type: Boolean, required: false },
        align: { type: null, required: false },
        alignOffset: { type: Number, required: false },
        alignFlip: { type: Boolean, required: false },
        avoidCollisions: { type: Boolean, required: false },
        collisionBoundary: { type: null, required: false },
        collisionPadding: { type: [Number, Object], required: false },
        arrowPadding: { type: Number, required: false },
        sticky: { type: String, required: false },
        hideWhenDetached: { type: Boolean, required: false },
        positionStrategy: { type: String, required: false },
        updatePositionStrategy: { type: String, required: false },
        disableUpdateOnLayoutShift: { type: Boolean, required: false },
        prioritizePosition: { type: Boolean, required: false },
        reference: { type: null, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <HoverCardPortal>
        <HoverCardContent
            data-slot="hover-card-content"
            v-bind="{ ...$attrs, ...forwardedProps }"
            :class="
                cn(
                    'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-12000 w-64 rounded-md border p-4 shadow-md outline-hidden',
                    props.class
                )
            ">
            <slot />
        </HoverCardContent>
    </HoverCardPortal>
</template>
