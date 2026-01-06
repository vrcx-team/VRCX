<script setup>
    import { computed, useSlots } from 'vue';

    import Tooltip from './Tooltip.vue';
    import TooltipContent from './TooltipContent.vue';
    import TooltipTrigger from './TooltipTrigger.vue';

    const props = defineProps({
        content: { type: [String, Number], required: false },
        side: { type: null, required: false },
        align: { type: null, required: false },
        sideOffset: { type: Number, required: false },
        delayDuration: { type: Number, required: false },
        disableHoverableContent: { type: Boolean, required: false },
        disabled: { type: Boolean, required: false },
        triggerAsChild: { type: Boolean, required: false, default: true },
        contentClass: { type: null, required: false }
    });

    const slots = useSlots();
    const hasContent = computed(() => Boolean(slots.content) || props.content !== undefined);
</script>

<template>
    <Tooltip :delay-duration="delayDuration" :disable-hoverable-content="disableHoverableContent" :disabled="disabled">
        <TooltipTrigger :as-child="triggerAsChild">
            <slot />
        </TooltipTrigger>
        <TooltipContent v-if="hasContent" :side="side" :align="align" :side-offset="sideOffset" :class="contentClass">
            <slot name="content">
                <span v-if="content !== undefined">{{ content }}</span>
            </slot>
        </TooltipContent>
    </Tooltip>
</template>
