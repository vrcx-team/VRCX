<script setup>
    import { cn } from '@/lib/utils';

    import { useProvideCarousel } from './useCarousel';

    const props = defineProps({
        opts: { type: Object, required: false },
        plugins: { type: null, required: false },
        orientation: { type: String, required: false, default: 'horizontal' },
        class: { type: null, required: false }
    });

    const emits = defineEmits(['init-api']);

    const { canScrollNext, canScrollPrev, carouselApi, carouselRef, orientation, scrollNext, scrollPrev } =
        useProvideCarousel(props, emits);

    defineExpose({
        canScrollNext,
        canScrollPrev,
        carouselApi,
        carouselRef,
        orientation,
        scrollNext,
        scrollPrev
    });

    function onKeyDown(event) {
        const prevKey = props.orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
        const nextKey = props.orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

        if (event.key === prevKey) {
            event.preventDefault();
            scrollPrev();

            return;
        }

        if (event.key === nextKey) {
            event.preventDefault();
            scrollNext();
        }
    }
</script>

<template>
    <div
        data-slot="carousel"
        :class="cn('relative', props.class)"
        role="region"
        aria-roledescription="carousel"
        tabindex="0"
        @keydown="onKeyDown">
        <slot :can-scroll-next :can-scroll-prev :carousel-api :carousel-ref :orientation :scroll-next :scroll-prev />
    </div>
</template>
