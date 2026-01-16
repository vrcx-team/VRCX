<script setup>
    import { Skeleton } from '@/components/ui/skeleton';
    import { cn } from '@/lib/utils';
    import { computed } from 'vue';

    const props = defineProps({
        showIcon: {
            type: Boolean,
            default: false
        },
        class: {
            type: [String, Array, Object],
            default: undefined
        }
    });

    const width = computed(() => {
        return `${Math.floor(Math.random() * 40) + 50}%`;
    });
</script>

<template>
    <div
        data-slot="sidebar-menu-skeleton"
        data-sidebar="menu-skeleton"
        :class="cn('flex h-8 items-center gap-2 rounded-md px-2', props.class)">
        <Skeleton v-if="showIcon" class="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />

        <Skeleton
            class="h-4 max-w-(--skeleton-width) flex-1"
            data-sidebar="menu-skeleton-text"
            :style="{ '--skeleton-width': width }" />
    </div>
</template>
