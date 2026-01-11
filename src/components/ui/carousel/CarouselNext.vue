<script setup>
    import { ArrowRight } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { cn } from '@/lib/utils';

    import { useCarousel } from './useCarousel';

    const props = defineProps({
        variant: { type: String, required: false, default: 'outline' },
        size: { type: String, required: false, default: 'icon' },
        class: { type: null, required: false }
    });

    const { orientation, canScrollNext, scrollNext } = useCarousel();
</script>

<template>
    <Button
        data-slot="carousel-next"
        :disabled="!canScrollNext"
        :class="
            cn(
                'absolute size-8 rounded-full',
                orientation === 'horizontal'
                    ? 'top-1/2 -right-12 -translate-y-1/2'
                    : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
                props.class
            )
        "
        :variant="variant"
        :size="size"
        @click="scrollNext">
        <slot>
            <ArrowRight />
            <span class="sr-only">Next Slide</span>
        </slot>
    </Button>
</template>
