<script setup>
    import { cn } from '@/lib/utils';

    import { useCarousel } from './useCarousel';

    defineOptions({
        inheritAttrs: false
    });

    const props = defineProps({
        class: { type: null, required: false }
    });

    const { carouselRef, orientation } = useCarousel();
</script>

<template>
    <div ref="carouselRef" data-slot="carousel-content" class="overflow-hidden">
        <div
            :class="cn('flex', orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col', props.class)"
            v-bind="$attrs">
            <slot />
        </div>
    </div>
</template>
