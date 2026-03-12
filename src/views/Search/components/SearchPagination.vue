<template>
    <div v-if="show" class="shrink-0 flex items-center justify-center h-[60px]">
        <ButtonGroup class="shadow-lg rounded-lg">
            <Button variant="outline" size="sm" :disabled="prevDisabled" @click="$emit('prev')">
                <ArrowLeft />
                {{ t('view.search.prev_page') }}
                <Kbd class="ml-1">{{ isMac ? '⌥' : 'Alt' }}</Kbd>
                <Kbd>←</Kbd>
            </Button>
            <Button variant="outline" size="sm" :disabled="nextDisabled" @click="$emit('next')">
                {{ t('view.search.next_page') }}
                <Kbd class="ml-1">{{ isMac ? '⌥' : 'Alt' }}</Kbd>
                <Kbd>→</Kbd>
                <ArrowRight />
            </Button>
        </ButtonGroup>
    </div>
</template>

<script setup>
    import { ArrowLeft, ArrowRight } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { ButtonGroup } from '@/components/ui/button-group';
    import { Kbd } from '@/components/ui/kbd';
    import { useI18n } from 'vue-i18n';

    const { t } = useI18n();

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    defineProps({
        show: { type: Boolean, default: false },
        prevDisabled: { type: Boolean, default: true },
        nextDisabled: { type: Boolean, default: true }
    });

    defineEmits(['prev', 'next']);
</script>
