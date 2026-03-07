<script setup>
    import { computed, ref } from 'vue';
    import { FlexRender } from '@tanstack/vue-table';
    import { GripVertical } from 'lucide-vue-next';
    import { useSortable } from '@dnd-kit/vue/sortable';

    import { TableHead } from '../table';

    const props = defineProps({
        header: {
            type: Object,
            required: true
        },
        index: {
            type: Number,
            required: true
        },
        headerClass: {
            type: String,
            default: ''
        },
        pinnedStyle: {
            type: Object,
            default: null
        },
        disabled: {
            type: Boolean,
            default: false
        }
    });

    const element = ref(null);

    const { isDragSource } = useSortable({
        id: computed(() => props.header.id),
        index: computed(() => props.index),
        element,
        disabled: computed(() => props.disabled)
    });
</script>

<template>
    <TableHead
        ref="element"
        :class="[headerClass, isDragSource && 'opacity-50', !disabled && 'cursor-grab active:cursor-grabbing']"
        :style="pinnedStyle">
        <template v-if="!header.isPlaceholder">
            <div class="flex items-center">
                <GripVertical
                    v-if="!disabled"
                    class="size-3.5 shrink-0 text-muted-foreground/50 -ml-1 mr-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
            </div>
            <div
                v-if="header.column.getCanResize?.()"
                class="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none opacity-0 transition-opacity group-hover:opacity-100"
                @pointerdown.stop
                @mousedown.stop="header.getResizeHandler?.()($event)"
                @touchstart.stop="header.getResizeHandler?.()($event)">
                <div class="absolute right-0 top-0 h-full w-px bg-border dark:bg-border dark:brightness-[2]" />
            </div>
        </template>
    </TableHead>
</template>
