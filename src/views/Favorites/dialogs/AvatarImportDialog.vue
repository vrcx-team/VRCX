<template>
    <Dialog v-model:open="isVisible">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.avatar_import.header') }}</DialogTitle>
            </DialogHeader>
            <div style="display: flex; align-items: center; justify-content: space-between">
                <div style="font-size: 12px">{{ t('dialog.avatar_import.description') }}</div>
                <div style="display: flex; align-items: center">
                    <div v-if="avatarImportDialog.progress">
                        {{ t('dialog.avatar_import.process_progress') }} {{ avatarImportDialog.progress }} /
                        {{ avatarImportDialog.progressTotal }}
                        <Loader2 style="margin: 0 5px" />
                    </div>
                    <Button v-if="avatarImportDialog.loading" size="sm" variant="secondary" @click="cancelAvatarImport">
                        {{ t('dialog.avatar_import.cancel') }}
                    </Button>
                    <Button size="sm" v-else :disabled="!avatarImportDialog.input" @click="processAvatarImportList">
                        {{ t('dialog.avatar_import.process_list') }}
                    </Button>
                </div>
            </div>
            <InputGroupTextareaField
                v-model="avatarImportDialog.input"
                :rows="10"
                style="margin-top: 10px"
                input-class="resize-none" />
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px">
                <div>
                    <div class="flex items-center gap-2">
                        <Select
                            :model-value="avatarImportFavoriteGroupSelection"
                            @update:modelValue="handleAvatarImportGroupSelect"
                            style="margin-right: 5px">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('dialog.avatar_import.select_group_placeholder')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="groupAPI in favoriteAvatarGroups"
                                        :key="groupAPI.name"
                                        :value="groupAPI.name"
                                        :disabled="groupAPI.count >= groupAPI.capacity">
                                        {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Select
                            :model-value="avatarImportLocalFavoriteGroupSelection"
                            @update:modelValue="handleAvatarImportLocalGroupSelect"
                            style="margin-left: 10px">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('dialog.avatar_import.select_group_placeholder')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem v-for="group in localAvatarFavoriteGroups" :key="group" :value="group">
                                        {{ group }} ({{ localAvatarFavGroupLength(group) }})
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <span v-if="avatarImportDialog.avatarImportFavoriteGroup" style="margin-left: 5px">
                        {{ avatarImportTable.data.length }} /
                        {{
                            avatarImportDialog.avatarImportFavoriteGroup.capacity -
                            avatarImportDialog.avatarImportFavoriteGroup.count
                        }}
                    </span>
                </div>
                <div>
                    <Button size="sm" variant="secondary" class="mr-2" @click="clearAvatarImportTable">
                        {{ t('dialog.avatar_import.clear_table') }}
                    </Button>
                    <Button
                        size="sm"
                        :disabled="
                            avatarImportTable.data.length === 0 ||
                            (!avatarImportDialog.avatarImportFavoriteGroup &&
                                !avatarImportDialog.avatarImportLocalFavoriteGroup)
                        "
                        @click="importAvatarImportTable">
                        {{ t('dialog.avatar_import.import') }}
                    </Button>
                </div>
            </div>
            <span v-if="avatarImportDialog.importProgress" style="margin: 10px">
                <Loader2 style="margin-right: 5px" />
                {{ t('dialog.avatar_import.import_progress') }}
                {{ avatarImportDialog.importProgress }}/{{ avatarImportDialog.importProgressTotal }}
            </span>
            <br />
            <template v-if="avatarImportDialog.errors">
                <Button size="sm" variant="secondary" @click="avatarImportDialog.errors = ''">
                    {{ t('dialog.avatar_import.clear_errors') }}
                </Button>
                <h2 style="font-weight: bold; margin: 5px 0">
                    {{ t('dialog.avatar_import.errors') }}
                </h2>
                <pre style="white-space: pre-wrap; font-size: 12px" v-text="avatarImportDialog.errors"></pre>
            </template>
            <DataTableLayout
                class="min-w-0 w-full"
                :table="table"
                :loading="avatarImportDialog.loading"
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

    import { useAvatarStore, useFavoriteStore, useGalleryStore, useUserStore } from '../../../stores';
    import { avatarRequest, favoriteRequest } from '../../../api';
    import { createColumns } from './avatarImportColumns.jsx';
    import { removeFromArray } from '../../../shared/utils';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const emit = defineEmits(['update:avatarImportDialogInput']);
    const { t } = useI18n();
    const { showUserDialog } = useUserStore();
    const { favoriteAvatarGroups, avatarImportDialogInput, avatarImportDialogVisible, localAvatarFavoriteGroups } =
        storeToRefs(useFavoriteStore());
    const { addLocalAvatarFavorite, localAvatarFavGroupLength } = useFavoriteStore();
    const { showAvatarDialog, applyAvatar } = useAvatarStore();
    const { showFullscreenImageDialog } = useGalleryStore();

    const avatarImportDialog = ref({
        loading: false,
        progress: 0,
        progressTotal: 0,
        input: '',
        avatarIdList: new Set(),
        errors: '',
        avatarImportFavoriteGroup: null,
        avatarImportLocalFavoriteGroup: null,
        importProgress: 0,
        importProgressTotal: 0
    });

    const avatarImportFavoriteGroupSelection = ref('');
    const avatarImportLocalFavoriteGroupSelection = ref('');

    const avatarImportTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'small'
        },
        layout: 'table'
    });

    const tableStyle = { maxHeight: '400px' };

    const rows = computed(() =>
        Array.isArray(avatarImportTable.value?.data) ? avatarImportTable.value.data.slice() : []
    );

    const columns = computed(() =>
        createColumns({
            onShowAvatar: showAvatarDialog,
            onShowUser: showUserDialog,
            onShowFullscreenImage: showFullscreenImageDialog,
            onDelete: deleteItemAvatarImport
        })
    );

    const { table } = useVrcxVueTable({
        persistKey: 'avatarImportDialog',
        data: rows,
        columns: columns.value,
        getRowId: (row) => String(row?.id ?? ''),
        enablePagination: false,
        enableSorting: false
    });

    const isVisible = computed({
        get() {
            return avatarImportDialogVisible.value;
        },
        set(value) {
            avatarImportDialogVisible.value = value;
        }
    });

    watch(
        () => avatarImportDialogVisible.value,
        (value) => {
            if (value) {
                clearAvatarImportTable();
                resetAvatarImport();
                if (avatarImportDialogInput.value) {
                    avatarImportDialog.value.input = avatarImportDialogInput.value;
                    processAvatarImportList();
                    emit('update:avatarImportDialogInput', '');
                }
            }
        }
    );

    async function processAvatarImportList() {
        const D = avatarImportDialog.value;
        D.loading = true;
        const regexAvatarId = /avtr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
        let match = [];
        const avatarIdList = new Set();
        while ((match = regexAvatarId.exec(D.input)) !== null) {
            avatarIdList.add(match[0]);
        }
        D.input = '';
        D.errors = '';
        D.progress = 0;
        D.progressTotal = avatarIdList.size;
        const data = Array.from(avatarIdList);
        for (let i = 0; i < data.length; ++i) {
            if (!isVisible.value) {
                resetAvatarImport();
            }
            if (!D.loading || !isVisible.value) {
                break;
            }
            const avatarId = data[i];
            if (!D.avatarIdList.has(avatarId)) {
                try {
                    const args = await avatarRequest.getAvatar({
                        avatarId
                    });
                    const ref = applyAvatar(args.json);
                    avatarImportTable.value.data.push(ref);
                    D.avatarIdList.add(avatarId);
                } catch (err) {
                    D.errors = D.errors.concat(`AvatarId: ${avatarId}\n${err}\n\n`);
                }
            }
            D.progress++;
            if (D.progress === avatarIdList.size) {
                D.progress = 0;
            }
        }
        D.loading = false;
    }

    function deleteItemAvatarImport(ref) {
        removeFromArray(avatarImportTable.value.data, ref);
        avatarImportDialog.value.avatarIdList.delete(ref.id);
    }

    function resetAvatarImport() {
        avatarImportDialog.value.input = '';
        avatarImportDialog.value.errors = '';
    }

    function clearAvatarImportTable() {
        avatarImportTable.value.data = [];
        avatarImportDialog.value.avatarIdList = new Set();
    }

    function selectAvatarImportGroup(group) {
        avatarImportDialog.value.avatarImportLocalFavoriteGroup = null;
        avatarImportDialog.value.avatarImportFavoriteGroup = group;
        avatarImportFavoriteGroupSelection.value = group?.name ?? '';
        avatarImportLocalFavoriteGroupSelection.value = '';
    }

    function selectAvatarImportLocalGroup(group) {
        avatarImportDialog.value.avatarImportFavoriteGroup = null;
        avatarImportDialog.value.avatarImportLocalFavoriteGroup = group;
        avatarImportFavoriteGroupSelection.value = '';
        avatarImportLocalFavoriteGroupSelection.value = group ?? '';
    }

    function handleAvatarImportGroupSelect(value) {
        avatarImportFavoriteGroupSelection.value = value;
        const group = favoriteAvatarGroups.value.find((g) => g.name === value) ?? null;
        selectAvatarImportGroup(group);
    }

    function handleAvatarImportLocalGroupSelect(value) {
        avatarImportLocalFavoriteGroupSelection.value = value;
        selectAvatarImportLocalGroup(value || null);
    }

    function cancelAvatarImport() {
        avatarImportDialog.value.loading = false;
    }
    function addFavoriteAvatar(ref, group, message) {
        return favoriteRequest
            .addFavorite({
                type: 'avatar',
                favoriteId: ref.id,
                tags: group.name
            })
            .then((args) => {
                if (message) {
                    toast.success('Avatar added to favorites');
                }
                return args;
            });
    }
    async function importAvatarImportTable() {
        const D = avatarImportDialog.value;
        if (!D.avatarImportFavoriteGroup && !D.avatarImportLocalFavoriteGroup) {
            return;
        }
        D.loading = true;
        const data = [...avatarImportTable.value.data].reverse();
        D.importProgressTotal = data.length;
        let ref = null;
        try {
            for (let i = data.length - 1; i >= 0; i--) {
                if (!D.loading || !isVisible.value) {
                    break;
                }
                ref = data[i];
                if (D.avatarImportFavoriteGroup) {
                    await addFavoriteAvatar(ref, D.avatarImportFavoriteGroup, false);
                } else if (D.avatarImportLocalFavoriteGroup) {
                    addLocalAvatarFavorite(ref.id, D.avatarImportLocalFavoriteGroup);
                }
                removeFromArray(avatarImportTable.value.data, ref);
                D.avatarIdList.delete(ref.id);
                D.importProgress++;
            }
        } catch (err) {
            D.errors = `Name: ${ref?.name}\nAvatarId: ${ref?.id}\n${err}\n\n`;
        } finally {
            D.importProgress = 0;
            D.importProgressTotal = 0;
            D.loading = false;
        }
    }
</script>
