<template>
    <div class="relative h-full min-h-[180px]">
        <div v-if="isEditing" class="flex h-full gap-2" :class="isVertical ? 'flex-col' : 'flex-row'">
            <DashboardPanel
                v-for="(panelItem, panelIndex) in row.panels"
                :key="panelIndex"
                :panel-data="panelItem"
                :is-editing="true"
                :show-remove="true"
                :class="panelEditClass"
                @select="(value) => emit('update-panel', rowIndex, panelIndex, value)"
                @remove="emit('remove-panel', rowIndex, panelIndex)" />
        </div>

        <ResizablePanelGroup
            v-else-if="row.panels.length === 2"
            :direction="isVertical ? 'vertical' : 'horizontal'"
            :auto-save-id="`dashboard-${dashboardId}-row-${rowIndex}`"
            class="h-full min-h-[180px]">
            <ResizablePanel :default-size="50" :min-size="20">
                <DashboardPanel
                    :panel-data="row.panels[0]"
                    class="h-full"
                    @select="(value) => emit('update-panel', rowIndex, 0, value)" />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel :default-size="50" :min-size="20">
                <DashboardPanel
                    :panel-data="row.panels[1]"
                    class="h-full"
                    @select="(value) => emit('update-panel', rowIndex, 1, value)" />
            </ResizablePanel>
        </ResizablePanelGroup>

        <div v-else class="h-full">
            <DashboardPanel
                :panel-data="row.panels[0]"
                class="h-full"
                @select="(value) => emit('update-panel', rowIndex, 0, value)" />
        </div>
    </div>
</template>

<script setup>
    import { computed } from 'vue';

    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

    import DashboardPanel from './DashboardPanel.vue';

    const props = defineProps({
        row: {
            type: Object,
            required: true
        },
        rowIndex: {
            type: Number,
            required: true
        },
        dashboardId: {
            type: String,
            required: true
        },
        isEditing: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update-panel', 'remove-panel']);

    const isVertical = computed(() => props.row.direction === 'vertical');

    const panelEditClass = computed(() => {
        if (props.row.panels.length === 1) {
            return 'w-full';
        }
        return isVertical.value ? 'h-1/2' : 'w-1/2';
    });
</script>
