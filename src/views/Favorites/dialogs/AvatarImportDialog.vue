<template>
    <el-dialog
        :z-index="avatarImportDialogIndex"
        v-model="isVisible"
        :title="t('dialog.avatar_import.header')"
        width="650px">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div style="font-size: 12px">{{ t('dialog.avatar_import.description') }}</div>
            <div style="display: flex; align-items: center">
                <div v-if="avatarImportDialog.progress">
                    {{ t('dialog.avatar_import.process_progress') }} {{ avatarImportDialog.progress }} /
                    {{ avatarImportDialog.progressTotal }}
                    <el-icon style="margin: 0 5px"><Loading /></el-icon>
                </div>
                <el-button v-if="avatarImportDialog.loading" size="small" @click="cancelAvatarImport">
                    {{ t('dialog.avatar_import.cancel') }}
                </el-button>
                <el-button v-else size="small" :disabled="!avatarImportDialog.input" @click="processAvatarImportList">
                    {{ t('dialog.avatar_import.process_list') }}
                </el-button>
            </div>
        </div>
        <el-input
            v-model="avatarImportDialog.input"
            type="textarea"
            size="small"
            :rows="10"
            resize="none"
            style="margin-top: 10px"></el-input>
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
                <el-button size="small" @click="clearAvatarImportTable">
                    {{ t('dialog.avatar_import.clear_table') }}
                </el-button>
                <el-button
                    size="small"
                    type="primary"
                    style="margin: 5px"
                    :disabled="
                        avatarImportTable.data.length === 0 ||
                        (!avatarImportDialog.avatarImportFavoriteGroup &&
                            !avatarImportDialog.avatarImportLocalFavoriteGroup)
                    "
                    @click="importAvatarImportTable">
                    {{ t('dialog.avatar_import.import') }}
                </el-button>
            </div>
        </div>
        <span v-if="avatarImportDialog.importProgress" style="margin: 10px">
            <el-icon style="margin-right: 5px"><Loading /></el-icon>
            {{ t('dialog.avatar_import.import_progress') }}
            {{ avatarImportDialog.importProgress }}/{{ avatarImportDialog.importProgressTotal }}
        </span>
        <br />
        <template v-if="avatarImportDialog.errors">
            <el-button size="small" @click="avatarImportDialog.errors = ''">
                {{ t('dialog.avatar_import.clear_errors') }}
            </el-button>
            <h2 style="font-weight: bold; margin: 5px 0">
                {{ t('dialog.avatar_import.errors') }}
            </h2>
            <pre style="white-space: pre-wrap; font-size: 12px" v-text="avatarImportDialog.errors"></pre>
        </template>
        <DataTable :loading="avatarImportDialog.loading" v-bind="avatarImportTable" style="margin-top: 10px">
            <el-table-column :label="t('table.import.image')" width="70" prop="thumbnailImageUrl">
                <template #default="{ row }">
                    <el-popover placement="right" :width="500" trigger="hover">
                        <template #reference>
                            <img :src="row.thumbnailImageUrl" class="friends-list-avatar" loading="lazy" />
                        </template>
                        <img
                            :src="row.imageUrl"
                            :class="['friends-list-avatar', 'x-popover-image']"
                            style="cursor: pointer"
                            @click="showFullscreenImageDialog(row.imageUrl)"
                            loading="lazy" />
                    </el-popover>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.import.name')" prop="name">
                <template #default="{ row }">
                    <span class="x-link" @click="showAvatarDialog(row.id)">
                        {{ row.name }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.import.author')" width="120" prop="authorName">
                <template #default="{ row }">
                    <span class="x-link" @click="showUserDialog(row.authorId)">
                        {{ row.authorName }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.import.status')" width="70" prop="releaseStatus">
                <template #default="{ row }">
                    <span
                        :style="{
                            color:
                                row.releaseStatus === 'public'
                                    ? '#67c23a'
                                    : row.releaseStatus === 'private'
                                      ? '#f56c6c'
                                      : undefined
                        }">
                        {{ row.releaseStatus.charAt(0).toUpperCase() + row.releaseStatus.slice(1) }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.import.action')" width="90" align="right">
                <template #default="{ row }">
                    <el-button text :icon="Close" size="small" @click="deleteItemAvatarImport(row)"> </el-button>
                </template>
            </el-table-column>
        </DataTable>
    </el-dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref, watch } from 'vue';
    import { Close, Loading } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useAvatarStore, useFavoriteStore, useGalleryStore, useUserStore } from '../../../stores';
    import { avatarRequest, favoriteRequest } from '../../../api';
    import { getNextDialogIndex } from '../../../shared/utils/base/ui';
    import { removeFromArray } from '../../../shared/utils';

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

    const avatarImportDialogIndex = ref(2000);

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
                avatarImportDialogIndex.value = getNextDialogIndex();
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
