<template>
    <Dialog :open="visible" @update:open="(open) => (open ? null : handleClose())">
        <DialogContent class="sm:min-w-140">
            <DialogHeader>
                <DialogTitle>{{ t('nav_menu.custom_nav.dialog_title') }}</DialogTitle>
            </DialogHeader>

            <div class="min-h-[40vh] max-h-[60vh] overflow-y-auto">
                <DragDropProvider @dragStart="onDragStart" @dragOver="onDragOver" @dragEnd="onDragEnd">
                    <Tree
                        :items="treeItems"
                        :get-key="(item) => item.id"
                        :get-children="(item) => item.children"
                        :expanded="expandedKeys"
                        class="gap-0.5 pr-3"
                        @update:expanded="(val) => (expandedKeys = val)">
                        <template #default="{ flattenItems }">
                            <template v-for="(item, idx) in flattenItems" :key="item._id">
                                <template v-if="item.value?._placeholder">
                                    <div
                                        class="rounded-md border border-dashed border-muted-foreground/25 p-1.5 text-sm text-muted-foreground/50 mt-1">
                                        {{ t('nav_menu.custom_nav.folder_drop_here') }}
                                    </div>
                                </template>
                                <SortableTreeNode
                                    v-else
                                    :item="item"
                                    :index="getSortableIndex(idx, flattenItems)"
                                    :definitions-map="definitionsMap"
                                    :drag-state="dragState"
                                    @edit-folder="openFolderEditor"
                                    @delete-folder="handleDeleteFolder"
                                    @hide="handleHideItem"
                                    @toggle="handleTreeToggle(item)" />
                            </template>
                        </template>
                    </Tree>
                </DragDropProvider>

                <template v-if="hiddenItems.length">
                    <div class="my-3 flex items-center gap-2 pr-3">
                        <Separator class="flex-1" />
                        <span class="text-xs text-muted-foreground">
                            {{ t('nav_menu.custom_nav.hidden_items') }}
                        </span>
                        <Separator class="flex-1" />
                    </div>
                    <div class="flex flex-col gap-0.5 pr-3">
                        <div
                            v-for="item in hiddenItems"
                            :key="item.key"
                            class="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground"
                            @click="handleShowItem(item.key)">
                            <span class="size-4 shrink-0" />
                            <span class="size-4 shrink-0" />
                            <i v-if="item.icon" :class="item.icon" class="text-base" />
                            <span class="flex-1 truncate">{{ item.label }}</span>
                            <Button
                                size="icon-sm"
                                variant="ghost"
                                class="ml-auto size-6 shrink-0 opacity-0 group-hover:opacity-100"
                                @click.stop="handleShowItem(item.key)">
                                <Minus class="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </template>
            </div>

            <DialogFooter>
                <div class="flex w-full items-center justify-between">
                    <div class="flex gap-2">
                        <Button variant="outline" @click="handleAddFolder">
                            {{ t('nav_menu.custom_nav.new_folder') }}
                        </Button>
                        <Button variant="ghost" class="text-destructive" @click="handleReset">
                            {{ t('nav_menu.custom_nav.restore_default') }}
                        </Button>
                    </div>
                    <div class="flex gap-2">
                        <Button variant="secondary" @click="handleClose">
                            {{ t('nav_menu.custom_nav.cancel') }}
                        </Button>
                        <Button @click="handleSave">
                            {{ t('common.actions.confirm') }}
                        </Button>
                    </div>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog v-model:open="folderEditor.visible">
        <DialogContent class="sm:max-w-100">
            <DialogHeader>
                <DialogTitle>{{ t('nav_menu.custom_nav.edit_folder') }}</DialogTitle>
            </DialogHeader>
            <div class="flex flex-col gap-3">
                <InputGroupField
                    v-model="folderEditor.data.name"
                    :placeholder="t('nav_menu.custom_nav.folder_name_placeholder')" />
                <InputGroupField
                    v-model="folderEditor.data.icon"
                    :placeholder="t('nav_menu.custom_nav.folder_icon_placeholder')">
                    <template #trailing>
                        <HoverCard>
                            <HoverCardTrigger as-child>
                                <InputGroupButton
                                    size="icon-xs"
                                    :aria-label="t('nav_menu.custom_nav.folder_icon_placeholder')">
                                    <LinkIcon class="size-3.5" />
                                </InputGroupButton>
                            </HoverCardTrigger>
                            <HoverCardContent side="bottom" align="end" class="w-80">
                                <div class="text-sm leading-snug">
                                    <div>
                                        Find the icon you want on this site and paste its class name here, e.g.
                                        <span class="font-mono">ri-arrow-left-up-line</span>
                                    </div>
                                    <div class="mt-2">
                                        <a
                                            class="cursor-pointer text-blue-600"
                                            @click.prevent="openExternalLink('https://remixicon.com/')">
                                            https://remixicon.com/
                                        </a>
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </template>
                </InputGroupField>
            </div>
            <DialogFooter>
                <Button variant="secondary" @click="folderEditor.visible = false">
                    {{ t('nav_menu.custom_nav.cancel') }}
                </Button>
                <Button :disabled="!folderEditor.data.name?.trim()" @click="handleFolderEditorSave">
                    {{ t('common.actions.confirm') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, reactive, ref, watch } from 'vue';
    import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
    import { Link as LinkIcon, Minus } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { DragDropProvider } from '@dnd-kit/vue';
    import { isSortable } from '@dnd-kit/vue/sortable';
    import { openExternalLink } from '@/shared/utils/common';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { InputGroupButton, InputGroupField } from '../ui/input-group';
    import { Separator } from '../ui/separator';
    import { Tree } from '../ui/tree';
    import { navDefinitions } from '../../shared/constants/ui.js';

    import SortableTreeNode from './SortableTreeNode.vue';

    const props = defineProps({
        visible: {
            type: Boolean,
            default: false
        },
        layout: {
            type: Array,
            default: () => []
        },
        hiddenKeys: {
            type: Array,
            default: () => []
        },
        defaultLayout: {
            type: Array,
            default: () => []
        }
    });

    const emit = defineEmits(['update:visible', 'save']);
    const { t } = useI18n();

    const cloneLayout = (source) => {
        if (!Array.isArray(source)) return [];
        return source.map((entry) => {
            if (entry?.type === 'folder') {
                return {
                    type: 'folder',
                    id: entry.id,
                    name: entry.name,
                    icon: entry.icon,
                    items: Array.isArray(entry.items) ? [...entry.items] : []
                };
            }
            return { type: 'item', key: entry.key };
        });
    };

    const localLayout = ref(cloneLayout(props.layout));
    const hiddenKeySet = ref(new Set());
    const hiddenPlacement = ref(new Map());
    const DEFAULT_FOLDER_ICON = 'ri-folder-line';

    const folderEditor = reactive({
        visible: false,
        isEditing: false,
        editingId: null,
        data: { id: '', name: '', icon: '' }
    });

    const dragState = reactive({
        active: false,
        sourceId: null,
        sourceIsFolder: false,
        overTargetId: null,
        overIsFolder: false,
        lastOverNode: null
    });

    const createFolderId = () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return `custom-folder-${crypto.randomUUID()}`;
        }
        return `custom-folder-${dayjs().toISOString()}-${Math.random().toString().slice(2, 7)}`;
    };

    watch(
        () => props.visible,
        (visible) => {
            if (visible) {
                localLayout.value = cloneLayout(props.layout);
                hiddenKeySet.value = new Set(props.hiddenKeys || []);
                hiddenPlacement.value = new Map();
                expandedKeys.value = localLayout.value.filter((e) => e.type === 'folder').map((e) => e.id);
            }
        }
    );

    const definitionsMap = computed(() => {
        const map = new Map();
        navDefinitions.forEach((def) => {
            if (def?.key) map.set(def.key, def);
        });
        return map;
    });

    const treeItems = computed(() => {
        return localLayout.value.map((entry) => {
            if (entry.type === 'folder') {
                const children = (entry.items || [])
                    .map((key) => {
                        const def = definitionsMap.value.get(key);
                        if (!def) return null;
                        return { id: key, type: 'item', key, level: 1, parentId: entry.id };
                    })
                    .filter(Boolean);

                const folderChildren = children.length
                    ? children
                    : [{ id: `${entry.id}__placeholder`, _placeholder: true, level: 1 }];

                return {
                    id: entry.id,
                    type: 'folder',
                    name: entry.name,
                    icon: entry.icon,
                    level: 0,
                    children: folderChildren
                };
            }
            return { id: entry.key, type: 'item', key: entry.key, level: 0 };
        });
    });

    const expandedKeys = ref([]);

    const hiddenItems = computed(() =>
        navDefinitions
            .filter((def) => hiddenKeySet.value.has(def.key))
            .map((def) => ({
                key: def.key,
                icon: def.icon,
                label: t(def.labelKey)
            }))
    );

    const getSortableIndex = (originalIdx, flattenItems) => {
        let sortableIdx = 0;
        for (let i = 0; i < originalIdx; i++) {
            if (!flattenItems[i]?.value?._placeholder) sortableIdx += 1;
        }
        return sortableIdx;
    };

    const handleHideItem = (key) => {
        let placement = null;
        for (let i = 0; i < localLayout.value.length; i++) {
            const entry = localLayout.value[i];
            if (entry.type === 'item' && entry.key === key) {
                placement = { parentId: null, index: i };
                localLayout.value.splice(i, 1);
                break;
            }
            if (entry.type === 'folder') {
                const idx = entry.items?.indexOf(key);
                if (idx !== undefined && idx >= 0) {
                    placement = { parentId: String(entry.id), index: idx };
                    entry.items.splice(idx, 1);
                    break;
                }
            }
        }
        if (placement) {
            hiddenPlacement.value.set(key, placement);
        }
        hiddenKeySet.value.add(key);
        localLayout.value = [...localLayout.value];
    };

    const handleShowItem = (key) => {
        hiddenKeySet.value.delete(key);
        hiddenKeySet.value = new Set(hiddenKeySet.value);
        const placement = hiddenPlacement.value.get(key) || null;

        let restored = false;
        if (placement?.parentId) {
            const folder = localLayout.value.find(
                (entry) => entry.type === 'folder' && String(entry.id) === placement.parentId
            );
            if (folder) {
                const insertAt = Math.max(0, Math.min(placement.index, folder.items.length));
                folder.items.splice(insertAt, 0, key);
                restored = true;
            }
        }

        if (!restored && placement && placement.parentId === null) {
            const insertAt = Math.max(0, Math.min(placement.index, localLayout.value.length));
            localLayout.value.splice(insertAt, 0, { type: 'item', key });
            restored = true;
        }

        if (!restored) {
            localLayout.value.push({ type: 'item', key });
        }

        hiddenPlacement.value.delete(key);
        localLayout.value = [...localLayout.value];
    };

    const handleDeleteFolder = (folderId) => {
        const idx = localLayout.value.findIndex((e) => e.type === 'folder' && e.id === folderId);
        if (idx < 0) return;
        const folder = localLayout.value[idx];
        const childItems = (folder.items || []).map((key) => ({ type: 'item', key }));
        localLayout.value.splice(idx, 1, ...childItems);
        localLayout.value = [...localLayout.value];
    };

    const handleTreeToggle = (item) => {
        const id = item.value?.id;
        if (!id) return;
        if (expandedKeys.value.includes(id)) {
            expandedKeys.value = expandedKeys.value.filter((k) => k !== id);
        } else {
            expandedKeys.value = [...expandedKeys.value, id];
        }
    };

    const buildVisibleNodes = () => {
        const list = [];
        for (const entry of localLayout.value) {
            if (entry.type === 'folder') {
                const folderId = String(entry.id);
                list.push({ type: 'folder', id: folderId });
                if (!expandedKeys.value.includes(entry.id)) {
                    continue;
                }
                for (const key of entry.items || []) {
                    list.push({ type: 'item', id: String(key), key, parentId: folderId });
                }
            } else {
                list.push({ type: 'item', id: String(entry.key), key: entry.key });
            }
        }
        return list;
    };

    const resolveNodeFromDnDEntity = (entity, nodes, options = {}) => {
        const { allowIndexFallback = true } = options;
        if (!entity) return null;

        if (entity.id !== undefined && entity.id !== null) {
            const rawId = String(entity.id);
            const normalizedId = rawId.endsWith('__placeholder') ? rawId.slice(0, -'__placeholder'.length) : rawId;
            const byId = findVisibleNodeById(normalizedId, nodes);
            if (byId) return byId;
        }

        if (
            allowIndexFallback &&
            typeof entity.index === 'number' &&
            entity.index >= 0 &&
            entity.index < nodes.length
        ) {
            return nodes[entity.index] || null;
        }

        return null;
    };

    const resetDragState = () => {
        dragState.active = false;
        dragState.sourceId = null;
        dragState.sourceIsFolder = false;
        dragState.overTargetId = null;
        dragState.overIsFolder = false;
        dragState.lastOverNode = null;
    };

    const findVisibleNodeById = (id, nodes = null) => {
        const normalizedId = String(id);
        const source = nodes || buildVisibleNodes();
        return source.find((node) => node.id === normalizedId) || null;
    };

    const getNodeIndex = (nodes, needle) => {
        if (!needle) return -1;
        return nodes.findIndex((node) => {
            if (node.type !== needle.type) return false;
            if (node.id !== needle.id) return false;
            return (node.parentId || null) === (needle.parentId || null);
        });
    };

    const onDragStart = (event) => {
        const { source } = event.operation;
        if (!source) return;

        const nodes = buildVisibleNodes();
        const sourceNode = resolveNodeFromDnDEntity(source, nodes);
        if (!sourceNode) return;

        dragState.active = true;
        dragState.sourceId = sourceNode.id;
        dragState.sourceIsFolder = sourceNode.type === 'folder';
        dragState.lastOverNode = null;
    };

    const onDragOver = (event) => {
        const { target } = event.operation;
        if (!target) {
            dragState.overTargetId = null;
            dragState.overIsFolder = false;
            return;
        }

        const nodes = buildVisibleNodes();
        const rawTargetNode = resolveNodeFromDnDEntity(target, nodes, { allowIndexFallback: false });
        let targetNode = rawTargetNode;

        // hovering over a folder child maps to its parent folder as top-level target
        if (dragState.sourceIsFolder && rawTargetNode?.parentId) {
            const parentFolderNode = findVisibleNodeById(rawTargetNode.parentId, nodes);
            if (parentFolderNode?.type === 'folder') {
                targetNode = parentFolderNode;
            }
        }

        dragState.overTargetId = targetNode?.id || null;
        dragState.overIsFolder = targetNode?.type === 'folder' && !dragState.sourceIsFolder;
        if (!targetNode) return;

        const isSelfTarget = dragState.sourceId && String(targetNode.id) === String(dragState.sourceId);
        if (isSelfTarget) return;

        if (dragState.sourceIsFolder && targetNode.parentId) return;

        dragState.lastOverNode = {
            type: targetNode.type,
            id: String(targetNode.id),
            parentId: targetNode.parentId ? String(targetNode.parentId) : null
        };
    };

    const removeItemFromEntries = (entries, key) => {
        const normalizedKey = String(key);
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.type === 'item' && String(entry.key) === normalizedKey) {
                entries.splice(i, 1);
                return true;
            }
            if (entry.type === 'folder') {
                const idx = entry.items.findIndex((k) => String(k) === normalizedKey);
                if (idx >= 0) {
                    entry.items.splice(idx, 1);
                    return true;
                }
            }
        }
        return false;
    };

    const moveItemByTarget = (sourceItemId, targetNode, movingDown) => {
        const entries = cloneLayout(localLayout.value);
        const removed = removeItemFromEntries(entries, sourceItemId);
        if (!removed) return;

        if (!targetNode) {
            entries.push({ type: 'item', key: sourceItemId });
            localLayout.value = entries;
            return;
        }

        if (targetNode.type === 'folder') {
            const folder = entries.find((e) => e.type === 'folder' && String(e.id) === targetNode.id);
            if (!folder) return;
            folder.items.push(sourceItemId);
            localLayout.value = entries;
            return;
        }

        if (targetNode.parentId) {
            const folder = entries.find((e) => e.type === 'folder' && String(e.id) === targetNode.parentId);
            if (!folder) return;
            const targetIdx = folder.items.findIndex((k) => String(k) === targetNode.id);
            if (targetIdx < 0) return;
            const insertAt = targetIdx + (movingDown ? 1 : 0);
            folder.items.splice(insertAt, 0, sourceItemId);
            localLayout.value = entries;
            return;
        }

        const targetTopIdx = entries.findIndex((e) => e.type === 'item' && String(e.key) === targetNode.id);
        if (targetTopIdx < 0) return;
        const insertAt = targetTopIdx + (movingDown ? 1 : 0);
        entries.splice(insertAt, 0, { type: 'item', key: sourceItemId });
        localLayout.value = entries;
    };

    const moveFolderByTarget = (sourceFolderId, targetNode, movingDown, allowAppendWhenNoTarget = false) => {
        const entries = cloneLayout(localLayout.value);
        const sourceIdx = entries.findIndex((e) => e.type === 'folder' && String(e.id) === sourceFolderId);
        if (sourceIdx < 0) return;
        const [folder] = entries.splice(sourceIdx, 1);

        if (targetNode?.parentId) return;

        if (!targetNode) {
            if (!allowAppendWhenNoTarget) return;
            entries.push(folder);
            localLayout.value = entries;
            return;
        }

        const targetTopIdx = entries.findIndex((e) => {
            if (targetNode.type === 'folder') {
                return e.type === 'folder' && String(e.id) === targetNode.id;
            }
            return e.type === 'item' && String(e.key) === targetNode.id;
        });
        if (targetTopIdx < 0) return;

        const insertAt = targetTopIdx + (movingDown ? 1 : 0);
        entries.splice(insertAt, 0, folder);
        localLayout.value = entries;
    };

    const onDragEnd = (event) => {
        const sourceIdSnapshot = dragState.sourceId ? String(dragState.sourceId) : null;
        const sourceIsFolderSnapshot = !!dragState.sourceIsFolder;
        const wasOverFolder = dragState.overIsFolder;
        const overTargetId = dragState.overTargetId ? String(dragState.overTargetId) : null;
        const lastOverNodeSnapshot = dragState.lastOverNode
            ? {
                  type: dragState.lastOverNode.type,
                  id: String(dragState.lastOverNode.id),
                  parentId: dragState.lastOverNode.parentId ? String(dragState.lastOverNode.parentId) : null
              }
            : null;

        resetDragState();

        if (event.canceled) return;

        const { source, target } = event.operation;
        if (!isSortable(source)) return;

        const visibleNodes = buildVisibleNodes();
        const sourceNode =
            (sourceIdSnapshot
                ? visibleNodes.find(
                      (node) =>
                          node.id === sourceIdSnapshot && node.type === (sourceIsFolderSnapshot ? 'folder' : 'item')
                  )
                : null) || resolveNodeFromDnDEntity(source, visibleNodes);
        if (!sourceNode) return;

        const isFolderDrag = sourceNode.type === 'folder';
        const resolvedLastOverNode = lastOverNodeSnapshot
            ? findVisibleNodeById(lastOverNodeSnapshot.id, visibleNodes) || lastOverNodeSnapshot
            : null;
        const hoveredTarget = resolveNodeFromDnDEntity(target, visibleNodes, { allowIndexFallback: false });
        let targetNode = resolvedLastOverNode || hoveredTarget || null;

        if (isFolderDrag && targetNode?.parentId) {
            targetNode = findVisibleNodeById(targetNode.parentId, visibleNodes) || targetNode;
        }

        if (isFolderDrag && overTargetId && !resolvedLastOverNode) {
            return;
        }

        if (!isFolderDrag && overTargetId && wasOverFolder) {
            targetNode = findVisibleNodeById(overTargetId, visibleNodes) || targetNode;
        }

        if (
            targetNode &&
            targetNode.type === sourceNode.type &&
            targetNode.id === sourceNode.id &&
            (targetNode.parentId || null) === (sourceNode.parentId || null)
        ) {
            return;
        }

        const sourceNodeIndex = getNodeIndex(visibleNodes, sourceNode);
        const targetNodeIndex = getNodeIndex(visibleNodes, targetNode);
        const movingDown = sourceNodeIndex >= 0 && targetNodeIndex >= 0 ? sourceNodeIndex < targetNodeIndex : false;
        if (isFolderDrag) {
            const allowAppendWhenNoTarget = !overTargetId && !resolvedLastOverNode;
            moveFolderByTarget(sourceNode.id, targetNode, movingDown, allowAppendWhenNoTarget);
        } else {
            moveItemByTarget(sourceNode.id, targetNode, movingDown);
        }
    };

    const openFolderEditor = (folderId) => {
        const entry = localLayout.value.find((e) => e.type === 'folder' && e.id === folderId);
        if (!entry) return;
        folderEditor.isEditing = true;
        folderEditor.editingId = folderId;
        folderEditor.data = { id: entry.id, name: entry.name, icon: entry.icon };
        folderEditor.visible = true;
    };

    const handleAddFolder = () => {
        folderEditor.isEditing = false;
        folderEditor.editingId = null;
        folderEditor.data = {
            id: createFolderId(),
            name: '',
            icon: ''
        };
        folderEditor.visible = true;
    };

    const handleFolderEditorSave = () => {
        if (!folderEditor.data.name?.trim()) return;

        if (folderEditor.isEditing) {
            const entry = localLayout.value.find((e) => e.type === 'folder' && e.id === folderEditor.editingId);
            if (entry) {
                entry.name = folderEditor.data.name.trim();
                entry.icon = folderEditor.data.icon?.trim() || DEFAULT_FOLDER_ICON;
                localLayout.value = [...localLayout.value];
            }
        } else {
            localLayout.value.push({
                type: 'folder',
                id: folderEditor.data.id,
                name: folderEditor.data.name.trim(),
                icon: folderEditor.data.icon?.trim() || DEFAULT_FOLDER_ICON,
                items: []
            });
            localLayout.value = [...localLayout.value];
            if (!expandedKeys.value.includes(folderEditor.data.id)) {
                expandedKeys.value = [...expandedKeys.value, folderEditor.data.id];
            }
        }
        folderEditor.visible = false;
    };

    const handleSave = () => {
        const cleanedLayout = localLayout.value.filter(
            (entry) => !(entry.type === 'folder' && (!entry.items || entry.items.length === 0))
        );
        emit('save', cloneLayout(cleanedLayout), [...hiddenKeySet.value]);
    };

    const handleReset = () => {
        localLayout.value = cloneLayout(props.defaultLayout || []);
        hiddenKeySet.value = new Set();
        hiddenPlacement.value = new Map();
        expandedKeys.value = localLayout.value.filter((e) => e.type === 'folder').map((e) => e.id);
    };

    const handleClose = () => {
        emit('update:visible', false);
    };
</script>
