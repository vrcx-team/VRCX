<script setup>
    import { AlertDialogContent, AlertDialogOverlay, AlertDialogPortal, useForwardPropsEmits } from 'reka-ui';
    import { inject, onBeforeUnmount, ref, watch } from 'vue';
    import { acquireModalPortalLayer } from '@/lib/modalPortalLayers';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    import { ALERT_DIALOG_OPEN_INJECTION_KEY } from './context';

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

    const injectedOpen = inject(ALERT_DIALOG_OPEN_INJECTION_KEY, null);
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
    <AlertDialogPortal :to="portalTo">
        <AlertDialogOverlay
            data-slot="alert-dialog-overlay"
            class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
        <AlertDialogContent
            data-slot="alert-dialog-content"
            v-bind="{ ...$attrs, ...forwarded }"
            :class="
                cn(
                    'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
                    props.class
                )
            ">
            <slot />
        </AlertDialogContent>
    </AlertDialogPortal>
</template>
