<script setup>
    import { Button } from '@/components/ui/button';
    import { PanelLeft } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';
    import { cn } from '@/lib/utils';

    import { useSidebar } from './utils';

    const { t } = useI18n();

    const props = defineProps({
        class: {
            type: [String, Array, Object],
            default: undefined
        }
    });

    const { toggleSidebar } = useSidebar();
</script>

<template>
    <Button
        data-sidebar="trigger"
        data-slot="sidebar-trigger"
        variant="ghost"
        size="icon"
        :class="cn('h-7 w-7', props.class)"
        @click="toggleSidebar">
        <PanelLeft />
        <span class="sr-only">{{ t('accessibility.toggle_sidebar') }}</span>
    </Button>
</template>
