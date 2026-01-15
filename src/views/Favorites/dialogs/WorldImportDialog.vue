<template>
    <Dialog v-model:open="isVisible">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.world_import.header') }}</DialogTitle>
            </DialogHeader>
            <div style="display: flex; align-items: center; justify-content: space-between">
                <div style="font-size: 12px">{{ t('dialog.world_import.description') }}</div>
                <div style="display: flex; align-items: center">
                    <div v-if="worldImportDialog.progress">
                        {{ t('dialog.world_import.process_progress') }}
                        {{ worldImportDialog.progress }} / {{ worldImportDialog.progressTotal }}
                        <Loader2 style="margin: 0 5px" />
                    </div>
                    <Button v-if="worldImportDialog.loading" size="sm" variant="outline" @click="cancelWorldImport">
                        {{ t('dialog.world_import.cancel') }}
                    </Button>
                    <Button size="sm" v-else :disabled="!worldImportDialog.input" @click="processWorldImportList">
                        {{ t('dialog.world_import.process_list') }}
                    </Button>
                </div>
            </div>
            <InputGroupTextareaField
                v-model="worldImportDialog.input"
                :rows="10"
                style="margin-top: 10px"
                input-class="resize-none" />
            <div>
                <div class="mb-2">
                    <div class="flex items-center gap-2">
                        <Select
                            :model-value="worldImportFavoriteGroupSelection"
                            @update:modelValue="handleWorldImportGroupSelect">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('dialog.world_import.select_vrchat_group_placeholder')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="groupAPI in favoriteWorldGroups"
                                        :key="groupAPI.name"
                                        :value="groupAPI.name"
                                        :disabled="groupAPI.count >= groupAPI.capacity">
                                        {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Select
                            :model-value="worldImportLocalFavoriteGroupSelection"
                            @update:modelValue="handleWorldImportLocalGroupSelect"
                            style="margin-left: 10px">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('dialog.world_import.select_local_group_placeholder')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem v-for="group in localWorldFavoriteGroups" :key="group" :value="group">
                                        {{ group }} ({{ localWorldFavGroupLength(group) }})
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <span v-if="worldImportDialog.worldImportFavoriteGroup" style="margin-left: 5px">
                        {{ worldImportTable.data.length }} /
                        {{
                            worldImportDialog.worldImportFavoriteGroup.capacity -
                            worldImportDialog.worldImportFavoriteGroup.count
                        }}
                    </span>
                </div>
                <div>
                    <Button
                        size="sm"
                        variant="secondary"
                        class="mr-2"
                        :disabled="worldImportTable.data.length === 0"
                        @click="clearWorldImportTable">
                        {{ t('dialog.world_import.clear_table') }}
                    </Button>
                    <Button
                        size="sm"
                        :disabled="
                            worldImportTable.data.length === 0 ||
                            (!worldImportDialog.worldImportFavoriteGroup &&
                                !worldImportDialog.worldImportLocalFavoriteGroup)
                        "
                        @click="importWorldImportTable">
                        {{ t('dialog.world_import.import') }}
                    </Button>
                </div>
            </div>
            <span v-if="worldImportDialog.importProgress" style="margin: 10px">
                <Loader2 style="margin-right: 5px" />
                {{ t('dialog.world_import.import_progress') }}
                {{ worldImportDialog.importProgress }}/{{ worldImportDialog.importProgressTotal }}
            </span>
            <br />
            <template v-if="worldImportDialog.errors">
                <Button size="sm" variant="secondary" @click="worldImportDialog.errors = ''">
                    {{ t('dialog.world_import.clear_errors') }}
                </Button>
                <h2 style="font-weight: bold; margin: 5px 0">
                    {{ t('dialog.world_import.errors') }}
                </h2>
                <pre style="white-space: pre-wrap; font-size: 12px" v-text="worldImportDialog.errors"></pre>
            </template>
            <DataTableLayout
                class="min-w-0 w-full"
                :table="table"
                :loading="worldImportDialog.loading"
                :table-style="tableStyle"
                :show-pagination="false"
                style="margin-top: 10px" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { Loader2 } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useGalleryStore, useUserStore, useWorldStore } from '../../../stores';
    import { favoriteRequest, worldRequest } from '../../../api';
    import { createColumns } from './worldImportColumns.jsx';
    import { removeFromArray } from '../../../shared/utils';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const { showUserDialog } = useUserStore();
    const { favoriteWorldGroups, worldImportDialogInput, worldImportDialogVisible, localWorldFavoriteGroups } =
        storeToRefs(useFavoriteStore());
    const { localWorldFavGroupLength, addLocalWorldFavorite, getCachedFavoritesByObjectId } = useFavoriteStore();
    const { showWorldDialog } = useWorldStore();
    const { showFullscreenImageDialog } = useGalleryStore();

    const emit = defineEmits(['update:worldImportDialogInput']);

    const { t } = useI18n();

    const worldImportDialog = ref({
        loading: false,
        progress: 0,
        progressTotal: 0,
        input: '',
        worldIdList: new Set(),
        errors: '',
        worldImportFavoriteGroup: null,
        worldImportLocalFavoriteGroup: null,
        importProgress: 0,
        importProgressTotal: 0
    });

    const worldImportFavoriteGroupSelection = ref('');
    const worldImportLocalFavoriteGroupSelection = ref('');

    const worldImportTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'small'
        },
        layout: 'table'
    });

    const tableStyle = { maxHeight: '400px' };

    const rows = computed(() =>
        Array.isArray(worldImportTable.value?.data) ? worldImportTable.value.data.slice() : []
    );

    const columns = computed(() =>
        createColumns({
            onShowWorld: showWorldDialog,
            onShowUser: showUserDialog,
            onShowFullscreenImage: showFullscreenImageDialog,
            onDelete: deleteItemWorldImport
        })
    );

    const { table } = useVrcxVueTable({
        persistKey: 'worldImportDialog',
        data: rows,
        columns: columns.value,
        getRowId: (row) => String(row?.id ?? ''),
        enablePagination: false,
        enableSorting: false
    });

    const isVisible = computed({
        get() {
            return worldImportDialogVisible.value;
        },
        set(visible) {
            worldImportDialogVisible.value = visible;
        }
    });

    watch(
        () => worldImportDialogVisible.value,
        (visible) => {
            if (visible) {
                clearWorldImportTable();
                resetWorldImport();
                if (worldImportDialogInput.value) {
                    worldImportDialog.value.input = worldImportDialogInput.value;
                    processWorldImportList();
                    emit('update:worldImportDialogInput', '');
                }
            }
        }
    );

    function resetWorldImport() {
        worldImportDialog.value.input = '';
        worldImportDialog.value.errors = '';
    }

    async function processWorldImportList() {
        const D = worldImportDialog.value;
        D.loading = true;
        const regexWorldId = /wrld_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
        let match = [];
        const worldIdList = new Set();
        while ((match = regexWorldId.exec(D.input)) !== null) {
            worldIdList.add(match[0]);
        }
        D.input = '';
        D.errors = '';
        D.progress = 0;
        D.progressTotal = worldIdList.size;
        const data = Array.from(worldIdList);
        for (let i = 0; i < data.length; ++i) {
            if (!isVisible.value) {
                resetWorldImport();
            }
            if (!D.loading || !isVisible.value) {
                break;
            }
            const worldId = data[i];
            if (!D.worldIdList.has(worldId)) {
                try {
                    const args = await worldRequest.getWorld({
                        worldId
                    });
                    worldImportTable.value.data.push(args.ref);
                    D.worldIdList.add(worldId);
                } catch (err) {
                    D.errors = D.errors.concat(`WorldId: ${worldId}\n${err}\n\n`);
                }
            }
            D.progress++;
            if (D.progress === worldIdList.size) {
                D.progress = 0;
            }
        }
        D.loading = false;
    }

    function deleteItemWorldImport(ref) {
        removeFromArray(worldImportTable.value.data, ref);
        worldImportDialog.value.worldIdList.delete(ref.id);
    }

    function clearWorldImportTable() {
        worldImportTable.value.data = [];
        worldImportDialog.value.worldIdList = new Set();
    }

    function selectWorldImportGroup(group) {
        worldImportDialog.value.worldImportLocalFavoriteGroup = null;
        worldImportDialog.value.worldImportFavoriteGroup = group;
        worldImportFavoriteGroupSelection.value = group?.name ?? '';
        worldImportLocalFavoriteGroupSelection.value = '';
    }

    function selectWorldImportLocalGroup(group) {
        worldImportDialog.value.worldImportFavoriteGroup = null;
        worldImportDialog.value.worldImportLocalFavoriteGroup = group;
        worldImportFavoriteGroupSelection.value = '';
        worldImportLocalFavoriteGroupSelection.value = group ?? '';
    }

    function handleWorldImportGroupSelect(value) {
        worldImportFavoriteGroupSelection.value = value;
        const group = favoriteWorldGroups.value.find((g) => g.name === value) ?? null;
        selectWorldImportGroup(group);
    }

    function handleWorldImportLocalGroupSelect(value) {
        worldImportLocalFavoriteGroupSelection.value = value;
        selectWorldImportLocalGroup(value || null);
    }

    function cancelWorldImport() {
        worldImportDialog.value.loading = false;
    }

    async function importWorldImportTable() {
        const D = worldImportDialog.value;
        if (!D.worldImportFavoriteGroup && !D.worldImportLocalFavoriteGroup) {
            return;
        }
        D.loading = true;
        const data = [...worldImportTable.value.data].reverse();
        D.importProgressTotal = data.length;
        let ref = undefined;
        try {
            for (let i = data.length - 1; i >= 0; i--) {
                if (!D.loading || !isVisible.value) {
                    break;
                }
                ref = data[i];
                if (D.worldImportFavoriteGroup) {
                    if (getCachedFavoritesByObjectId(ref.id)) {
                        throw new Error('World is already in favorites');
                    }
                    await addFavoriteWorld(ref, D.worldImportFavoriteGroup, false);
                } else if (D.worldImportLocalFavoriteGroup) {
                    addLocalWorldFavorite(ref.id, D.worldImportLocalFavoriteGroup);
                }
                removeFromArray(worldImportTable.value.data, ref);
                D.worldIdList.delete(ref.id);
                D.importProgress++;
            }
        } catch (err) {
            D.errors = `Name: ${ref?.name}\nWorldId: ${ref?.id}\n${err}\n\n`;
        } finally {
            D.importProgress = 0;
            D.importProgressTotal = 0;
            D.loading = false;
        }
    }

    function addFavoriteWorld(ref, group, message) {
        return favoriteRequest
            .addFavorite({
                type: group.type,
                favoriteId: ref.id,
                tags: group.name
            })
            .then((args) => {
                if (message) {
                    toast.success('World added to favorites');
                }
                return args;
            });
    }
</script>
