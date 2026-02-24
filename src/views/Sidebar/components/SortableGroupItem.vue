<script setup>
    import { computed, ref } from 'vue';
    import { GripVertical } from 'lucide-vue-next';
    import { useSortable } from '@dnd-kit/vue/sortable';

    const props = defineProps({
        id: { type: String, required: true },
        index: { type: Number, required: true },
        label: { type: String, required: true }
    });

    const element = ref(null);

    const { isDragSource } = useSortable({
        id: computed(() => props.id),
        index: computed(() => props.index),
        element
    });
</script>

<template>
    <div
        ref="element"
        class="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm select-none cursor-grab active:cursor-grabbing"
        :class="{ 'opacity-50': isDragSource }">
        <GripVertical class="size-4 shrink-0 text-muted-foreground" />
        <span class="truncate">{{ label }}</span>
    </div>
</template>
