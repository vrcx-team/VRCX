import { computed, onMounted, ref } from 'vue';
import { createInjectionState } from '@vueuse/core';
import { useDirection } from 'reka-ui';

import emblaCarouselVue from 'embla-carousel-vue';

const [useProvideCarousel, useInjectCarousel] = createInjectionState(
    (props, emits) => {
        const { opts, orientation, plugins } = props;
        const textDirection = useDirection();
        const carouselOptions = computed(() => ({
            ...opts,
            axis: orientation === 'horizontal' ? 'x' : 'y',
            direction: textDirection.value
        }));
        const [emblaNode, emblaApi] = emblaCarouselVue(
            carouselOptions,
            plugins
        );

        function scrollPrev() {
            emblaApi.value?.scrollPrev();
        }
        function scrollNext() {
            emblaApi.value?.scrollNext();
        }

        const canScrollNext = ref(false);
        const canScrollPrev = ref(false);

        function onSelect(api) {
            canScrollNext.value = api?.canScrollNext() || false;
            canScrollPrev.value = api?.canScrollPrev() || false;
        }

        onMounted(() => {
            if (!emblaApi.value) return;

            emblaApi.value?.on('init', onSelect);
            emblaApi.value?.on('reInit', onSelect);
            emblaApi.value?.on('select', onSelect);

            emits('init-api', emblaApi.value);
        });

        return {
            carouselRef: emblaNode,
            carouselApi: emblaApi,
            canScrollPrev,
            canScrollNext,
            scrollPrev,
            scrollNext,
            orientation
        };
    }
);

function useCarousel() {
    const carouselState = useInjectCarousel();

    if (!carouselState)
        throw new Error('useCarousel must be used within a <Carousel />');

    return carouselState;
}

export { useCarousel, useProvideCarousel };
