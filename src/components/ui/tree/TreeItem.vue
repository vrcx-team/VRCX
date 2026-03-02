<script setup>
    import { TreeItem as RekaTreeItem } from 'reka-ui';
    import { cn } from '@/lib/utils';

    const props = defineProps({
        value: { type: Object, required: true },
        level: { type: Number, required: false, default: 0 },
        asChild: { type: Boolean, required: false, default: false },
        class: { type: null, required: false }
    });
</script>

<template>
    <RekaTreeItem
        v-slot="slotProps"
        :value="props.value"
        :level="props.level"
        :as-child="props.asChild"
        :class="
            cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:ring-ring focus-visible:ring-1',
                'data-selected:bg-accent data-selected:text-accent-foreground',
                props.class
            )
        "
        :style="{ paddingLeft: `${props.level * 16 + 8}px` }">
        <slot v-bind="slotProps" />
    </RekaTreeItem>
</template>
