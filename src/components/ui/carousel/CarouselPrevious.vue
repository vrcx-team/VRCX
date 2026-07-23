<script setup>
    import { ArrowLeft } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { useI18n } from 'vue-i18n';
    import { cn } from '@/lib/utils';

    import { useCarousel } from './useCarousel';

    const { t } = useI18n();

    const props = defineProps({
        variant: { type: String, required: false, default: 'outline' },
        size: { type: String, required: false, default: 'icon' },
        class: { type: null, required: false }
    });

    const { orientation, canScrollPrev, scrollPrev } = useCarousel();
</script>

<template>
    <Button
        data-slot="carousel-previous"
        :disabled="!canScrollPrev"
        :class="
            cn(
                'absolute size-8 rounded-full',
                orientation === 'horizontal'
                    ? 'top-1/2 -start-12 -translate-y-1/2'
                    : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
                props.class
            )
        "
        :variant="variant"
        :size="size"
        @click="scrollPrev">
        <slot>
            <ArrowLeft class="rtl:scale-x-[-1]" />
            <span class="sr-only">{{ t('accessibility.previous_slide') }}</span>
        </slot>
    </Button>
</template>
