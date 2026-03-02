<script setup>
    import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
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
    <Item
        ref="element"
        variant="outline"
        size="sm"
        class="cursor-grab select-none active:cursor-grabbing"
        :class="{ 'opacity-50': isDragSource }">
        <ItemMedia>
            <GripVertical class="size-4 text-muted-foreground" />
        </ItemMedia>
        <ItemContent>
            <ItemTitle class="truncate">{{ label }}</ItemTitle>
        </ItemContent>
    </Item>
</template>
