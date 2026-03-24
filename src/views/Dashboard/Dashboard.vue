<template>
    <div class="x-container flex h-full min-h-0 flex-col gap-3 py-3">
        <DashboardEditToolbar
            v-if="isEditing"
            v-model:name="editName"
            @save="handleSave"
            @cancel="handleCancelEdit"
            @delete="handleDelete" />

        <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            <template v-if="displayRows.length && !isEditing">
                <ResizablePanelGroup direction="vertical" :auto-save-id="`dashboard-${id}`" class="flex-1 min-h-0">
                    <template v-for="(row, rowIndex) in displayRows" :key="rowIndex">
                        <ResizablePanel :default-size="100 / displayRows.length" :min-size="10">
                            <DashboardRow
                                :row="row"
                                :row-index="rowIndex"
                                :dashboard-id="id"
                                @update-panel="handleLiveUpdatePanel" />
                        </ResizablePanel>
                        <ResizableHandle v-if="rowIndex < displayRows.length - 1" />
                    </template>
                </ResizablePanelGroup>
            </template>

            <template v-else-if="isEditing">
                <DashboardRow
                    v-for="(row, rowIndex) in displayRows"
                    :key="rowIndex"
                    :row="row"
                    :row-index="rowIndex"
                    :dashboard-id="id"
                    :is-editing="true"
                    @update-panel="handleUpdatePanel"
                    @remove-panel="handleRemovePanel" />

                <div
                    class="mt-auto flex min-h-[80px] flex-1 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/20 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                    :class="showAddRowOptions ? 'items-start p-4' : 'cursor-pointer'"
                    @click="handleAddRowAreaClick">
                    <div v-if="showAddRowOptions" class="flex flex-wrap items-center gap-3">
                        <span class="text-xs text-muted-foreground">{{ t('dashboard.actions.add_row') }}:</span>
                        <button
                            type="button"
                            class="flex h-10 w-16 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary/50 hover:bg-primary/5"
                            :title="t('dashboard.actions.add_full_row')"
                            @click.stop="handleAddRow(1)">
                            <div class="h-6 w-12 rounded bg-muted-foreground/20" />
                        </button>
                        <button
                            type="button"
                            class="flex h-10 w-16 items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary/50 hover:bg-primary/5"
                            :title="t('dashboard.actions.add_split_row')"
                            @click.stop="handleAddRow(2)">
                            <div class="h-6 w-5 rounded bg-muted-foreground/20" />
                            <div class="h-6 w-5 rounded bg-muted-foreground/20" />
                        </button>
                        <button
                            type="button"
                            class="flex h-10 w-16 items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary/50 hover:bg-primary/5"
                            :title="t('dashboard.actions.add_vertical_row')"
                            @click.stop="handleAddRow(2, 'vertical')">
                            <div class="flex flex-col gap-0.5">
                                <div class="h-2.5 w-10 rounded bg-muted-foreground/20" />
                                <div class="h-2.5 w-10 rounded bg-muted-foreground/20" />
                            </div>
                        </button>
                    </div>
                    <Plus v-else class="size-6 opacity-50" />
                </div>
            </template>

            <div
                v-else
                class="flex flex-1 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                <div class="flex flex-col items-center gap-3">
                    <p>{{ t('dashboard.empty') }}</p>
                    <Button @click="isEditing = true">{{ t('dashboard.actions.start_editing') }}</Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { Plus } from 'lucide-vue-next';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import { Button } from '@/components/ui/button';
    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
    import { useDashboardStore, useModalStore } from '@/stores';

    import DashboardEditToolbar from './components/DashboardEditToolbar.vue';
    import DashboardRow from './components/DashboardRow.vue';

    const props = defineProps({
        id: {
            type: String,
            required: true
        }
    });

    const router = useRouter();
    const { t } = useI18n();
    const dashboardStore = useDashboardStore();
    const modalStore = useModalStore();

    const isEditing = ref(false);
    const showAddRowOptions = ref(false);
    const editRows = ref([]);
    const editName = ref('');

    const dashboard = computed(() => dashboardStore.getDashboard(props.id));
    const displayRows = computed(() => (isEditing.value ? editRows.value : dashboard.value?.rows || []));

    const cloneRows = (rows) => JSON.parse(JSON.stringify(Array.isArray(rows) ? rows : []));

    watch(
        () => props.id,
        () => {
            isEditing.value = false;
            showAddRowOptions.value = false;
        }
    );

    watch(
        dashboard,
        (value) => {
            if (!value) {
                router.replace({ name: 'feed' });
            }
        },
        { immediate: true }
    );

    watch(isEditing, (editing) => {
        if (!editing || !dashboard.value) {
            showAddRowOptions.value = false;
            return;
        }
        editRows.value = cloneRows(dashboard.value.rows);
        editName.value = dashboard.value.name || '';
    });

    watch(
        () => dashboardStore.editingDashboardId,
        (editingId) => {
            if (editingId === props.id) {
                isEditing.value = true;
                dashboardStore.clearEditingDashboardId();
            }
        },
        { immediate: true }
    );

    const handleAddRowAreaClick = () => {
        showAddRowOptions.value = !showAddRowOptions.value;
    };

    const handleAddRow = (panelCount, direction = 'horizontal') => {
        const panels = Array(panelCount).fill(null);
        editRows.value.push({ panels, direction });
        showAddRowOptions.value = false;
    };

    const handleRemovePanel = (rowIndex, panelIndex) => {
        const row = editRows.value[rowIndex];
        if (!row) return;
        if (row.panels.length <= 1) {
            editRows.value.splice(rowIndex, 1);
        } else {
            row.panels.splice(panelIndex, 1);
        }
    };

    const handleUpdatePanel = (rowIndex, panelIndex, panelValue) => {
        if (!editRows.value[rowIndex]?.panels) {
            return;
        }
        editRows.value[rowIndex].panels[panelIndex] = panelValue;
    };

    const handleLiveUpdatePanel = async (rowIndex, panelIndex, panelValue) => {
        if (!dashboard.value?.rows?.[rowIndex]?.panels) return;
        const rows = JSON.parse(JSON.stringify(dashboard.value.rows));
        rows[rowIndex].panels[panelIndex] = panelValue;
        await dashboardStore.updateDashboard(props.id, { rows });
    };

    const handleSave = async () => {
        const isFirstSave =
            dashboardStore.dashboards.length === 1 && (!dashboard.value?.rows || dashboard.value.rows.length === 0);

        await dashboardStore.updateDashboard(props.id, {
            name: editName.value.trim() || dashboard.value?.name || 'Dashboard',
            rows: editRows.value
        });
        isEditing.value = false;

        if (isFirstSave) {
            toast(t('dashboard.first_save_tip'), { duration: 6000 });
        }
    };

    const handleCancelEdit = () => {
        isEditing.value = false;
    };

    const handleDelete = async () => {
        const { ok } = await modalStore.confirm({
            title: t('dashboard.confirmations.delete_title'),
            description: t('dashboard.confirmations.delete_description'),
            destructive: true
        });
        if (!ok) {
            return;
        }
        await dashboardStore.deleteDashboard(props.id);
        router.replace({ name: 'feed' });
    };
</script>
