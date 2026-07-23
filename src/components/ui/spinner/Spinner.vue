<script setup>
    import { Loader2Icon } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';
    import { cn } from '@/lib/utils';

    const { t } = useI18n();

    const props = defineProps({
        class: { type: null, required: false }
    });
</script>

<template>
    <Loader2Icon role="status" :aria-label="t('accessibility.loading')" :class="cn('size-4 animate-spin', props.class)" />
</template>
