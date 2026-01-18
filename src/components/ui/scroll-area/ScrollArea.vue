<script setup>
    defineOptions({ inheritAttrs: false });

    import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui';
    import { ref, useAttrs } from 'vue';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    import ScrollBar from './ScrollBar.vue';

    const props = defineProps({
        type: { type: null, required: false },
        dir: { type: null, required: false },
        scrollHideDelay: { type: Number, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const attrs = useAttrs();
    const viewportEl = ref(null);

    function setViewportEl(el) {
        viewportEl.value = el?.$el ?? el ?? null;
    }

    defineExpose({ viewportEl, update: () => {} });
</script>

<template>
    <ScrollAreaRoot data-slot="scroll-area" v-bind="delegatedProps" :class="cn('relative', props.class)">
        <ScrollAreaViewport
            data-slot="scroll-area-viewport"
            :ref="setViewportEl"
            v-bind="attrs"
            class="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1">
            <slot />
        </ScrollAreaViewport>
        <ScrollBar />
        <ScrollAreaCorner />
    </ScrollAreaRoot>
</template>
