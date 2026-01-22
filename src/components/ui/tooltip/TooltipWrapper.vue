<script setup>
    import { computed, useAttrs, useSlots } from 'vue';

    import Tooltip from './Tooltip.vue';
    import TooltipContent from './TooltipContent.vue';
    import TooltipTrigger from './TooltipTrigger.vue';

    defineOptions({
        inheritAttrs: false
    });

    const props = defineProps({
        content: { type: [String, Number], required: false },
        side: { type: null, required: false },
        align: { type: null, required: false },
        sideOffset: { type: Number, required: false },
        delayDuration: { type: Number, required: false },
        disableHoverableContent: { type: Boolean, required: false },
        ignoreNonKeyboardFocus: { type: Boolean, required: false },
        disabled: { type: Boolean, required: false },
        triggerAsChild: { type: Boolean, required: false, default: true },
        contentClass: { type: null, required: false }
    });

    const attrs = useAttrs();
    const slots = useSlots();
    const hasContent = computed(() => Boolean(slots.content) || props.content !== undefined);
</script>

<template>
    <Tooltip
        :delay-duration="delayDuration"
        :disable-hoverable-content="disableHoverableContent"
        :ignore-non-keyboard-focus="ignoreNonKeyboardFocus"
        :disabled="disabled">
        <TooltipTrigger :as-child="triggerAsChild" v-bind="attrs">
            <slot />
        </TooltipTrigger>
        <TooltipContent
            v-if="hasContent"
            :side="side"
            :align="align"
            :side-offset="sideOffset"
            :class="contentClass"
            class="max-w-screen">
            <slot name="content">
                <span v-if="content !== undefined" class="whitespace-pre-wrap">{{ content }}</span>
            </slot>
        </TooltipContent>
    </Tooltip>
</template>
