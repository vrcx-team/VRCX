<template>
    <el-dialog
        ref="elDialogRef"
        :visible="props.visible"
        v-bind="attrs"
        :close-on-click-modal="false"
        @open="handleOpen"
        @close="handleClose">
        <slot></slot>

        <template v-if="slots.title" #title>
            <slot name="title"></slot>
        </template>

        <template v-if="slots.footer" #footer>
            <slot name="footer"></slot>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ref, onBeforeUnmount, nextTick, useAttrs, useSlots } from 'vue';

    const props = defineProps({
        visible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:visible', 'open', 'close']);

    const attrs = useAttrs();
    const slots = useSlots();

    const elDialogRef = ref(null);
    const wrapperElement = ref(null);
    const mouseDownOnWrapper = ref(false);
    const styleObserver = ref(null);
    const resizeObserver = ref(null);
    let handleResize = null;

    const handleOpen = () => {
        emit('open');

        nextTick(() => {
            addWrapperListeners();
            removeTitleAttribute();
            centerDialog();
        });
    };

    const removeTitleAttribute = () => {
        const wrapper = elDialogRef.value?.$el;
        if (wrapper && wrapper.nodeType === Node.ELEMENT_NODE) {
            wrapper.removeAttribute('title');
        }
    };

    const handleClose = () => {
        emit('close');
        removeWrapperListeners();

        if (styleObserver.value) {
            styleObserver.value.disconnect();
            styleObserver.value = null;
        }

        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
            resizeObserver.value = null;
        }

        if (handleResize) {
            window.removeEventListener('resize', handleResize);
            handleResize = null;
        }

        emit('update:visible', false);
    };

    const handleWrapperMouseDown = (event) => {
        if (event.target === wrapperElement.value) {
            mouseDownOnWrapper.value = true;
        }
    };

    const handleWrapperMouseUp = (event) => {
        if (event.target === wrapperElement.value && mouseDownOnWrapper.value) {
            handleClose();
        }
        mouseDownOnWrapper.value = false;
    };

    const addWrapperListeners = () => {
        const wrapper = elDialogRef.value?.$el;

        if (
            wrapper &&
            wrapper.nodeType === Node.ELEMENT_NODE &&
            wrapper.classList &&
            wrapper.classList.contains('el-dialog__wrapper')
        ) {
            wrapperElement.value = wrapper;
            wrapperElement.value.addEventListener('mousedown', handleWrapperMouseDown);
            wrapperElement.value.addEventListener('mouseup', handleWrapperMouseUp);
        } else {
            wrapperElement.value = null;
        }
    };

    const removeWrapperListeners = () => {
        if (wrapperElement.value) {
            wrapperElement.value.removeEventListener('mousedown', handleWrapperMouseDown);
            wrapperElement.value.removeEventListener('mouseup', handleWrapperMouseUp);
            wrapperElement.value = null;
        }
        mouseDownOnWrapper.value = false;
    };

    const centerDialog = () => {
        const wrapper = elDialogRef.value?.$el;
        if (!wrapper) return;

        const dialog = wrapper.querySelector('.el-dialog');
        if (!dialog) return;

        const applyCenterStyle = () => {
            const dialogHeight = dialog.offsetHeight;
            const viewportHeight = window.innerHeight;

            let marginTop;
            if (dialogHeight >= viewportHeight) {
                marginTop = '25px';
            } else {
                const topOffset = Math.max(0, (viewportHeight - dialogHeight) / 2);
                marginTop = `${topOffset}px`;
            }

            dialog.style.setProperty('margin-top', marginTop, 'important');
        };

        applyCenterStyle();

        styleObserver.value = new MutationObserver(() => {
            applyCenterStyle();
        });

        styleObserver.value.observe(dialog, {
            attributes: true,
            attributeFilter: ['style']
        });

        handleResize = () => {
            applyCenterStyle();
        };

        window.addEventListener('resize', handleResize);

        resizeObserver.value = new ResizeObserver(() => {
            applyCenterStyle();
        });

        resizeObserver.value.observe(dialog);
    };

    onBeforeUnmount(() => {
        removeWrapperListeners();

        if (styleObserver.value) {
            styleObserver.value.disconnect();
            styleObserver.value = null;
        }

        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
            resizeObserver.value = null;
        }

        if (handleResize) {
            window.removeEventListener('resize', handleResize);
            handleResize = null;
        }
    });
</script>
