<template>
    <span
        ref="triggerEl"
        class="vrcx-native-tooltip__trigger"
        :style="triggerStyle"
        @mouseenter="onEnter"
        @mouseleave="onLeave"
        @focusin="onEnter"
        @focusout="onLeave"
        @keydown.esc="close">
        <slot />
    </span>

    <div
        ref="tooltipEl"
        class="vrcx-native-tooltip__content"
        :class="[
            placementClass,
            {
                'has-arrow': props.showArrow,
                'is-open': isOpen,
                'is-closing': isClosing
            }
        ]"
        :style="contentStyle"
        popover="manual"
        role="tooltip"
        @mouseenter="cancelClose"
        @mouseleave="onLeave">
        <slot name="content">
            <span class="vrcx-native-tooltip__text" v-text="content" />
        </slot>
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, ref } from 'vue';

    const props = defineProps({
        content: {
            type: String,
            default: ''
        },
        showAfter: {
            type: Number,
            default: 0
        },
        placement: {
            type: String,
            default: 'top'
        },
        enterMs: {
            type: Number,
            default: 120
        },
        exitMs: {
            type: Number,
            default: 100
        },
        offset: {
            type: Number,
            default: 8
        },
        maxWidth: {
            type: String,
            default: '260px'
        },
        disabled: {
            type: Boolean,
            default: false
        },
        showArrow: {
            type: Boolean,
            default: true
        }
    });

    const ARROW_SIZE_PX = 10;

    const triggerEl = ref(null);
    const tooltipEl = ref(null);

    const isOpen = ref(false);
    const isClosing = ref(false);

    const anchorName = `--vrcx-tt-${Math.random().toString(36).slice(2, 10)}`;

    const triggerStyle = computed(() => {
        return {
            'anchor-name': anchorName
        };
    });

    const contentStyle = computed(() => {
        const effectiveOffsetPx = props.offset + (props.showArrow ? ARROW_SIZE_PX / 2 : 0);
        return {
            'position-anchor': anchorName,
            '--vrcx-tt-enter': `${props.enterMs}ms`,
            '--vrcx-tt-exit': `${props.exitMs}ms`,
            '--vrcx-tt-offset': `${effectiveOffsetPx}px`,
            '--vrcx-tt-max-width': props.maxWidth,
            '--vrcx-tt-shift-x': `${shiftX.value}px`,
            '--vrcx-tt-shift-y': `${shiftY.value}px`,
            '--vrcx-tt-arrow-x': `${arrowX.value}px`,
            '--vrcx-tt-arrow-y': `${arrowY.value}px`
        };
    });

    const placementClass = computed(() => {
        const normalized = String(props.placement || 'top').toLowerCase();
        return `is-${normalized}`;
    });

    const shiftX = ref(0);
    const shiftY = ref(0);
    const arrowX = ref(0);
    const arrowY = ref(0);

    const timers = {
        open: 0,
        close: 0,
        hide: 0
    };

    function clearTimer(key) {
        const id = timers[key];
        if (id) {
            window.clearTimeout(id);
            timers[key] = 0;
        }
    }

    function clearAllTimers() {
        clearTimer('open');
        clearTimer('close');
        clearTimer('hide');
    }

    function resetOffsets() {
        shiftX.value = 0;
        shiftY.value = 0;
        arrowX.value = 0;
        arrowY.value = 0;
    }

    function isPopoverOpen(el) {
        return Boolean(el?.matches?.(':popover-open'));
    }

    function updateViewportShift() {
        const el = tooltipEl.value;
        if (!el) {
            return;
        }

        shiftX.value = 0;
        shiftY.value = 0;

        const rect = el.getBoundingClientRect();
        const margin = 8;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let dx = 0;
        let dy = 0;

        if (rect.left < margin) {
            dx += margin - rect.left;
        }
        if (rect.right > vw - margin) {
            dx -= rect.right - (vw - margin);
        }
        if (rect.top < margin) {
            dy += margin - rect.top;
        }
        if (rect.bottom > vh - margin) {
            dy -= rect.bottom - (vh - margin);
        }

        shiftX.value = Math.round(dx);
        shiftY.value = Math.round(dy);
    }

    function updateArrowPosition() {
        if (!props.showArrow) {
            return;
        }

        const trigger = triggerEl.value;
        const tooltip = tooltipEl.value;
        if (!trigger || !tooltip) {
            return;
        }

        const placement = String(props.placement || 'top').toLowerCase();

        const tr = trigger.getBoundingClientRect();
        const tt = tooltip.getBoundingClientRect();

        const cs = window.getComputedStyle(tooltip);
        const padLeft = Number.parseFloat(cs.paddingLeft) || 0;
        const padRight = Number.parseFloat(cs.paddingRight) || 0;
        const padTop = Number.parseFloat(cs.paddingTop) || 0;
        const padBottom = Number.parseFloat(cs.paddingBottom) || 0;

        const padding = 12;
        const half = ARROW_SIZE_PX / 2;

        if (placement.startsWith('top') || placement.startsWith('bottom')) {
            const desired = tr.left + tr.width / 2 - tt.left;

            const edgeLeft = Math.max(padding, padLeft) + half;
            const edgeRight = Math.max(padding, padRight) + half;
            const min = edgeLeft;
            const max = tt.width - edgeRight;

            const clamped = min > max ? tt.width / 2 : Math.min(Math.max(desired, min), max);
            arrowX.value = Math.round(clamped);
            arrowY.value = 0;
            return;
        }

        if (placement.startsWith('left') || placement.startsWith('right')) {
            const desired = tr.top + tr.height / 2 - tt.top;

            const edgeTop = Math.max(padding, padTop) + half;
            const edgeBottom = Math.max(padding, padBottom) + half;
            const min = edgeTop;
            const max = tt.height - edgeBottom;

            const clamped = min > max ? tt.height / 2 : Math.min(Math.max(desired, min), max);
            arrowY.value = Math.round(clamped);
            arrowX.value = 0;
        }
    }

    function open() {
        if (props.disabled) {
            return;
        }

        const el = tooltipEl.value;
        if (!el) {
            return;
        }

        clearAllTimers();

        const doOpen = () => {
            timers.open = 0;

            const tooltip = tooltipEl.value;
            if (!tooltip) {
                return;
            }

            const alreadyOpen = isPopoverOpen(tooltip);

            isClosing.value = false;
            if (!alreadyOpen) {
                isOpen.value = false;
                tooltip.showPopover();
            }

            window.requestAnimationFrame(() => {
                updateViewportShift();
                window.requestAnimationFrame(() => {
                    updateArrowPosition();
                    isOpen.value = true;
                });
            });
        };

        if (props.showAfter > 0) {
            timers.open = window.setTimeout(doOpen, props.showAfter);
            return;
        }

        doOpen();
    }

    function close(immediate = false) {
        const el = tooltipEl.value;
        if (!el) {
            return;
        }

        clearAllTimers();

        if (immediate) {
            isOpen.value = false;
            isClosing.value = false;
            resetOffsets();
            if (isPopoverOpen(el)) {
                el.hidePopover();
            }
            return;
        }

        isOpen.value = false;
        isClosing.value = true;
        timers.hide = window.setTimeout(() => {
            timers.hide = 0;
            isClosing.value = false;
            resetOffsets();
            if (isPopoverOpen(el)) {
                el.hidePopover();
            }
        }, props.exitMs);
    }

    function onEnter() {
        open();
    }

    function onLeave() {
        clearTimer('open');
        clearTimer('close');
        timers.close = window.setTimeout(() => {
            timers.close = 0;
            close();
        }, 80);
    }

    onBeforeUnmount(() => {
        clearAllTimers();
    });
</script>

<style scoped>
    .vrcx-native-tooltip__trigger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .vrcx-native-tooltip__content {
        position: fixed;
        inset: auto;

        overflow: visible;
        clip-path: none;

        inline-size: max-content;
        max-inline-size: min(var(--vrcx-tt-max-width), calc(100vw - 16px));
        min-inline-size: 0;
        padding: 6px 10px;

        border-radius: var(--el-border-radius-base);
        border: 0;

        background: var(--el-tooltip-bg-color, color-mix(in srgb, var(--el-color-black) 88%, transparent));
        color: var(--el-tooltip-text-color, var(--el-color-white));

        box-shadow: none;

        font-size: 12px;
        line-height: 1.35;

        white-space: pre-line;
        word-break: break-word;
        overflow-wrap: anywhere;

        opacity: 0;

        transition-property: opacity;
        transition-duration: var(--vrcx-tt-exit);
        transition-timing-function: linear;
        transition-behavior: allow-discrete;

        pointer-events: auto;
    }

    :global(html.dark) .vrcx-native-tooltip__content {
        background: var(--el-tooltip-bg-color, color-mix(in srgb, var(--el-color-black) 96%, transparent));
    }

    .vrcx-native-tooltip__content.has-arrow::before {
        content: '';
        position: absolute;
        width: 10px;
        height: 10px;
        background: var(--el-tooltip-bg-color, color-mix(in srgb, var(--el-color-black) 88%, transparent));
        transform: rotate(45deg);
    }

    :global(html.dark) .vrcx-native-tooltip__content.has-arrow::before {
        background: var(--el-tooltip-bg-color, color-mix(in srgb, var(--el-color-black) 96%, transparent));
    }

    .vrcx-native-tooltip__content.has-arrow.is-top::before,
    .vrcx-native-tooltip__content.has-arrow.is-top-start::before,
    .vrcx-native-tooltip__content.has-arrow.is-top-end::before {
        left: var(--vrcx-tt-arrow-x, 50%);
        bottom: -5px;
        translate: -50% 0;
    }

    .vrcx-native-tooltip__content.has-arrow.is-bottom::before,
    .vrcx-native-tooltip__content.has-arrow.is-bottom-start::before,
    .vrcx-native-tooltip__content.has-arrow.is-bottom-end::before {
        left: var(--vrcx-tt-arrow-x, 50%);
        top: -5px;
        translate: -50% 0;
    }

    .vrcx-native-tooltip__content.has-arrow.is-left::before,
    .vrcx-native-tooltip__content.has-arrow.is-left-start::before,
    .vrcx-native-tooltip__content.has-arrow.is-left-end::before {
        top: var(--vrcx-tt-arrow-y, 50%);
        right: -5px;
        translate: 0 -50%;
    }

    .vrcx-native-tooltip__content.has-arrow.is-right::before,
    .vrcx-native-tooltip__content.has-arrow.is-right-start::before,
    .vrcx-native-tooltip__content.has-arrow.is-right-end::before {
        top: var(--vrcx-tt-arrow-y, 50%);
        left: -5px;
        translate: 0 -50%;
    }

    .vrcx-native-tooltip__content:popover-open.is-open {
        opacity: 1;
        transition-duration: var(--vrcx-tt-enter);
    }

    .vrcx-native-tooltip__content:popover-open.is-closing {
        opacity: 0;
        transition-duration: var(--vrcx-tt-exit);
    }

    .vrcx-native-tooltip__content.is-top {
        left: anchor(center);
        bottom: anchor(top);
        translate: calc(-50% + var(--vrcx-tt-shift-x)) calc((-1 * var(--vrcx-tt-offset)) + var(--vrcx-tt-shift-y));
        transform-origin: bottom center;
    }

    .vrcx-native-tooltip__content.is-top-start {
        left: anchor(left);
        bottom: anchor(top);
        translate: var(--vrcx-tt-shift-x) calc((-1 * var(--vrcx-tt-offset)) + var(--vrcx-tt-shift-y));
        transform-origin: bottom left;
    }

    .vrcx-native-tooltip__content.is-top-end {
        right: anchor(right);
        bottom: anchor(top);
        translate: var(--vrcx-tt-shift-x) calc((-1 * var(--vrcx-tt-offset)) + var(--vrcx-tt-shift-y));
        transform-origin: bottom right;
    }

    .vrcx-native-tooltip__content.is-bottom {
        left: anchor(center);
        top: anchor(bottom);
        translate: calc(-50% + var(--vrcx-tt-shift-x)) calc(var(--vrcx-tt-offset) + var(--vrcx-tt-shift-y));
        transform-origin: top center;
    }

    .vrcx-native-tooltip__content.is-bottom-start {
        left: anchor(left);
        top: anchor(bottom);
        translate: var(--vrcx-tt-shift-x) calc(var(--vrcx-tt-offset) + var(--vrcx-tt-shift-y));
        transform-origin: top left;
    }

    .vrcx-native-tooltip__content.is-bottom-end {
        right: anchor(right);
        top: anchor(bottom);
        translate: var(--vrcx-tt-shift-x) calc(var(--vrcx-tt-offset) + var(--vrcx-tt-shift-y));
        transform-origin: top right;
    }

    .vrcx-native-tooltip__content.is-left {
        right: anchor(left);
        top: anchor(center);
        translate: calc((-1 * var(--vrcx-tt-offset)) + var(--vrcx-tt-shift-x)) calc(-50% + var(--vrcx-tt-shift-y));
        transform-origin: center right;
    }

    .vrcx-native-tooltip__content.is-left-start {
        right: anchor(left);
        top: anchor(top);
        translate: calc((-1 * var(--vrcx-tt-offset)) + var(--vrcx-tt-shift-x)) var(--vrcx-tt-shift-y);
        transform-origin: top right;
    }

    .vrcx-native-tooltip__content.is-left-end {
        right: anchor(left);
        bottom: anchor(bottom);
        translate: calc((-1 * var(--vrcx-tt-offset)) + var(--vrcx-tt-shift-x)) var(--vrcx-tt-shift-y);
        transform-origin: bottom right;
    }

    .vrcx-native-tooltip__content.is-right {
        left: anchor(right);
        top: anchor(center);
        translate: calc(var(--vrcx-tt-offset) + var(--vrcx-tt-shift-x)) calc(-50% + var(--vrcx-tt-shift-y));
        transform-origin: center left;
    }

    .vrcx-native-tooltip__content.is-right-start {
        left: anchor(right);
        top: anchor(top);
        translate: calc(var(--vrcx-tt-offset) + var(--vrcx-tt-shift-x)) var(--vrcx-tt-shift-y);
        transform-origin: top left;
    }

    .vrcx-native-tooltip__content.is-right-end {
        left: anchor(right);
        bottom: anchor(bottom);
        translate: calc(var(--vrcx-tt-offset) + var(--vrcx-tt-shift-x)) var(--vrcx-tt-shift-y);
        transform-origin: bottom left;
    }

    .vrcx-native-tooltip__content:not([class*='is-']) {
        left: anchor(center);
        bottom: anchor(top);
        translate: calc(-50% + var(--vrcx-tt-shift-x)) calc((-1 * var(--vrcx-tt-offset)) + var(--vrcx-tt-shift-y));
    }

    .vrcx-native-tooltip__text {
        display: block;
        white-space: pre-line;
    }
</style>
