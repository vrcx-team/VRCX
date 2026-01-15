<script setup>
    import { DialogClose, DialogContent, DialogOverlay, DialogPortal, useForwardPropsEmits } from 'reka-ui';
    import { inject, onBeforeUnmount, ref, watch } from 'vue';
    import { X } from 'lucide-vue-next';
    import { acquireModalPortalLayer } from '@/lib/modalPortalLayers';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    import { DIALOG_OPEN_INJECTION_KEY } from './context';

    defineOptions({
        inheritAttrs: false
    });

    const props = defineProps({
        forceMount: { type: Boolean, required: false },
        disableOutsidePointerEvents: { type: Boolean, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });
    const emits = defineEmits([
        'escapeKeyDown',
        'pointerDownOutside',
        'focusOutside',
        'interactOutside',
        'openAutoFocus',
        'closeAutoFocus'
    ]);

    const delegatedProps = reactiveOmit(props, 'class');

    const forwarded = useForwardPropsEmits(delegatedProps, emits);

    const injectedOpen = inject(DIALOG_OPEN_INJECTION_KEY, null);
    const open = injectedOpen ?? ref(true);

    const portalLayer = acquireModalPortalLayer();
    const portalTo = portalLayer.element;

    watch(
        open,
        (isOpen) => {
            if (isOpen) {
                portalLayer.bringToFront();
            }
        },
        { immediate: true }
    );

    onBeforeUnmount(() => {
        portalLayer.release();
    });
</script>

<template>
    <DialogPortal :to="portalTo">
        <DialogOverlay
            class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <DialogContent
                :class="
                    cn(
                        'relative z-50 grid w-full max-w-lg my-8 gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full',
                        props.class
                    )
                "
                v-bind="{ ...$attrs, ...forwarded }"
                @pointer-down-outside="
                    (event) => {
                        const originalEvent = event.detail.originalEvent;
                        const target = originalEvent.target;
                        if (originalEvent.offsetX > target.clientWidth || originalEvent.offsetY > target.clientHeight) {
                            event.preventDefault();
                        }
                    }
                ">
                <slot />

                <DialogClose class="absolute top-4 right-4 p-0.5 transition-colors rounded-md hover:bg-secondary">
                    <X class="w-4 h-4" />
                    <span class="sr-only">Close</span>
                </DialogClose>
            </DialogContent>
        </DialogOverlay>
    </DialogPortal>
</template>
