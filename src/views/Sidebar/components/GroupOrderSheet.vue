<template>
    <Sheet v-model:open="isOpen">
        <SheetContent side="right" class="w-80 flex flex-col" @open-auto-focus.prevent>
            <SheetHeader>
                <SheetTitle>{{ t('side_panel.settings.edit_group_order') }}</SheetTitle>
            </SheetHeader>
            <div class="flex-1 overflow-auto p-3">
                <DragDropProvider @dragEnd="onDragEnd">
                    <div class="flex flex-col gap-1.5">
                        <SortableGroupItem
                            v-for="(item, index) in localOrder"
                            :key="item.key"
                            :id="item.key"
                            :index="index"
                            :label="item.displayName" />
                    </div>
                </DragDropProvider>
            </div>
            <div class="flex justify-end gap-2 border-t p-3">
                <Button variant="secondary" size="sm" @click="resetOrder">
                    {{ t('common.actions.reset') }}
                </Button>
                <Button size="sm" @click="confirmOrder">
                    {{ t('common.actions.confirm') }}
                </Button>
            </div>
        </SheetContent>
    </Sheet>
</template>

<script setup>
    import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DragDropProvider } from '@dnd-kit/vue';
    import { isSortable } from '@dnd-kit/vue/sortable';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useFavoriteStore } from '../../../stores';

    import SortableGroupItem from './SortableGroupItem.vue';

    const isOpen = defineModel('open', { type: Boolean, default: false });

    const { t } = useI18n();

    const appearanceStore = useAppearanceSettingsStore();
    const { sidebarFavoriteGroups, sidebarFavoriteGroupOrder } = storeToRefs(appearanceStore);
    const { setSidebarFavoriteGroupOrder } = appearanceStore;

    const favoriteStore = useFavoriteStore();
    const { favoriteFriendGroups, localFriendFavoriteGroups } = storeToRefs(favoriteStore);

    const allGroupItems = computed(() => {
        const items = [];
        for (const group of favoriteFriendGroups.value) {
            items.push({ key: group.key, displayName: group.displayName });
        }
        for (const name of localFriendFavoriteGroups.value) {
            items.push({ key: `local:${name}`, displayName: name });
        }
        return items;
    });

    const selectedGroupKeys = computed(() => {
        if (sidebarFavoriteGroups.value.length === 0) {
            return allGroupItems.value.map((g) => g.key);
        }
        return sidebarFavoriteGroups.value;
    });

    const localOrder = ref([]);

    function buildOrderedList() {
        const selected = new Set(selectedGroupKeys.value);
        const persistedOrder = sidebarFavoriteGroupOrder.value;
        const itemMap = new Map(allGroupItems.value.map((g) => [g.key, g]));

        const ordered = [];
        for (const key of persistedOrder) {
            if (selected.has(key) && itemMap.has(key)) {
                ordered.push(itemMap.get(key));
                selected.delete(key);
            }
        }
        for (const key of selectedGroupKeys.value) {
            if (selected.has(key) && itemMap.has(key)) {
                ordered.push(itemMap.get(key));
            }
        }
        return ordered;
    }

    watch(isOpen, (open) => {
        if (open) {
            localOrder.value = buildOrderedList();
        }
    });

    function onDragEnd(event) {
        if (event.canceled) return;
        const { source } = event.operation;
        if (isSortable(source)) {
            const { initialIndex, index } = source;
            if (initialIndex !== index) {
                const newOrder = [...localOrder.value];
                const [removed] = newOrder.splice(initialIndex, 1);
                newOrder.splice(index, 0, removed);
                localOrder.value = newOrder;
            }
        }
    }

    function confirmOrder() {
        const currentKeys = localOrder.value.map((g) => g.key);
        const persistedOrder = sidebarFavoriteGroupOrder.value;
        const merged = [...currentKeys];
        for (const key of persistedOrder) {
            if (!merged.includes(key)) {
                merged.push(key);
            }
        }
        setSidebarFavoriteGroupOrder(merged);
        isOpen.value = false;
    }

    function resetOrder() {
        setSidebarFavoriteGroupOrder([]);
        localOrder.value = buildOrderedList();
    }
</script>
