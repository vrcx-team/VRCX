<script setup>
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { ChevronRight, Ellipsis, GripVertical } from 'lucide-vue-next';
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { TreeItem } from '@/components/ui/tree';
    import { useI18n } from 'vue-i18n';
    import { useSortable } from '@dnd-kit/vue/sortable';

    const props = defineProps({
        item: { type: Object, required: true },
        index: { type: Number, required: true },
        definitionsMap: { type: Map, required: true },
        dragState: { type: Object, default: () => ({}) }
    });

    const emit = defineEmits(['editFolder', 'deleteFolder', 'hide', 'toggle']);

    const { t } = useI18n();

    const element = ref(null);

    const nodeValue = computed(() => props.item.value);
    const isFolder = computed(() => nodeValue.value?.type === 'folder');
    const hasChildren = computed(() => props.item.hasChildren);
    const level = computed(() => nodeValue.value?.level ?? 0);
    const nodeId = computed(() => (isFolder.value ? nodeValue.value?.id : nodeValue.value?.key));

    const { isDragSource } = useSortable({
        // Use business id (folder.id / item.key) so drag events align with layout lookup logic.
        id: nodeId,
        index: computed(() => props.index),
        element
    });

    const displayLabel = computed(() => {
        if (isFolder.value) {
            return nodeValue.value.name?.trim() || t('nav_menu.custom_nav.folder_name_placeholder');
        }
        const def = props.definitionsMap.get(nodeValue.value?.key);
        return def ? t(def.labelKey) : nodeValue.value?.key || '';
    });

    const displayIcon = computed(() => {
        if (isFolder.value) {
            return nodeValue.value.icon || 'ri-folder-line';
        }
        const def = props.definitionsMap.get(nodeValue.value?.key);
        return def?.icon || '';
    });

    // Visual indicator: highlight when this folder is the drop target
    const isDropHighlighted = computed(() => {
        if (!props.dragState?.active) return false;
        if (!isFolder.value) return false;
        return props.dragState.overTargetId === nodeId.value && props.dragState.overIsFolder;
    });
</script>

<template>
    <TreeItem
        ref="element"
        :value="item.value"
        :level="level"
        v-bind="item.bind"
        class="group select-none cursor-grab active:cursor-grabbing"
        :class="[
            isDragSource ? 'opacity-40' : '',
            isFolder ? 'bg-muted/50 border-l-primary/60 border-l-2 font-semibold' : '',
            level > 0 ? 'text-muted-foreground' : '',
            isDropHighlighted ? 'ring-primary/50 bg-primary/10 ring-2' : ''
        ]">
        <template #default="{ isExpanded }">
            <GripVertical class="size-4 shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100" />

            <button
                v-if="hasChildren"
                type="button"
                class="flex size-4 shrink-0 items-center justify-center rounded transition-transform"
                :class="isExpanded ? 'rotate-90' : ''"
                @click.stop="emit('toggle')">
                <ChevronRight class="size-3.5" />
            </button>
            <span v-else class="size-4 shrink-0" />

            <i v-if="displayIcon" :class="displayIcon" class="text-base" />

            <span class="flex-1 truncate text-sm">{{ displayLabel }}</span>

            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        class="ml-auto size-6 shrink-0 opacity-0 group-hover:opacity-100"
                        @click.stop>
                        <Ellipsis class="size-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <template v-if="isFolder">
                        <DropdownMenuItem @click="emit('editFolder', nodeValue.id)">
                            {{ t('nav_menu.custom_nav.edit_folder') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem class="text-destructive" @click="emit('deleteFolder', nodeValue.id)">
                            {{ t('nav_menu.custom_nav.delete_folder') }}
                        </DropdownMenuItem>
                    </template>
                    <template v-else>
                        <DropdownMenuItem @click="emit('hide', nodeValue.key)">
                            {{ t('nav_menu.custom_nav.hide') }}
                        </DropdownMenuItem>
                    </template>
                </DropdownMenuContent>
            </DropdownMenu>
        </template>
    </TreeItem>
</template>
