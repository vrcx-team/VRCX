<template>
    <safe-dialog
        ref="worldImportDialogRef"
        :visible.sync="isVisible"
        :title="t('dialog.world_import.header')"
        width="650px"
        class="x-dialog">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div style="font-size: 12px">{{ t('dialog.world_import.description') }}</div>
            <div style="display: flex; align-items: center">
                <div v-if="worldImportDialog.progress">
                    {{ t('dialog.world_import.process_progress') }}
                    {{ worldImportDialog.progress }} / {{ worldImportDialog.progressTotal }}
                    <i class="el-icon-loading" style="margin: 0 5px"></i>
                </div>
                <el-button v-if="worldImportDialog.loading" size="small" @click="cancelWorldImport">
                    {{ t('dialog.world_import.cancel') }}
                </el-button>
                <el-button v-else size="small" :disabled="!worldImportDialog.input" @click="processWorldImportList">
                    {{ t('dialog.world_import.process_list') }}
                </el-button>
            </div>
        </div>
        <el-input
            v-model="worldImportDialog.input"
            type="textarea"
            size="mini"
            rows="10"
            resize="none"
            style="margin-top: 10px"></el-input>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px">
            <div>
                <el-dropdown trigger="click" size="small" style="margin-right: 5px" @click.native.stop>
                    <el-button size="mini">
                        <span v-if="worldImportDialog.worldImportFavoriteGroup">
                            {{ worldImportDialog.worldImportFavoriteGroup.displayName }}
                            ({{ worldImportDialog.worldImportFavoriteGroup.count }}/{{
                                worldImportDialog.worldImportFavoriteGroup.capacity
                            }})
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                        <span v-else>
                            {{ t('dialog.world_import.select_vrchat_group_placeholder') }}
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                        <template v-for="groupAPI in favoriteWorldGroups">
                            <el-dropdown-item
                                :key="groupAPI.name"
                                style="display: block; margin: 10px 0"
                                :disabled="groupAPI.count >= groupAPI.capacity"
                                @click.native="selectWorldImportGroup(groupAPI)">
                                {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                            </el-dropdown-item>
                        </template>
                    </el-dropdown-menu>
                </el-dropdown>
                <el-dropdown trigger="click" size="small" style="margin: 5px" @click.native.stop>
                    <el-button size="mini">
                        <span v-if="worldImportDialog.worldImportLocalFavoriteGroup">
                            {{ worldImportDialog.worldImportLocalFavoriteGroup }}
                            ({{ getLocalWorldFavoriteGroupLength(worldImportDialog.worldImportLocalFavoriteGroup) }})
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                        <span v-else>
                            {{ t('dialog.world_import.select_local_group_placeholder') }}
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                        <template v-for="group in localWorldFavoriteGroups">
                            <el-dropdown-item
                                :key="group"
                                style="display: block; margin: 10px 0"
                                @click.native="selectWorldImportLocalGroup(group)">
                                {{ group }} ({{ getLocalWorldFavoriteGroupLength(group) }})
                            </el-dropdown-item>
                        </template>
                    </el-dropdown-menu>
                </el-dropdown>
                <span v-if="worldImportDialog.worldImportFavoriteGroup" style="margin-left: 5px">
                    {{ worldImportTable.data.length }} /
                    {{
                        worldImportDialog.worldImportFavoriteGroup.capacity -
                        worldImportDialog.worldImportFavoriteGroup.count
                    }}
                </span>
            </div>
            <div>
                <el-button size="small" :disabled="worldImportTable.data.length === 0" @click="clearWorldImportTable">
                    {{ t('dialog.world_import.clear_table') }}
                </el-button>
                <el-button
                    size="small"
                    type="primary"
                    style="margin: 5px"
                    :disabled="
                        worldImportTable.data.length === 0 ||
                        (!worldImportDialog.worldImportFavoriteGroup &&
                            !worldImportDialog.worldImportLocalFavoriteGroup)
                    "
                    @click="importWorldImportTable">
                    {{ t('dialog.world_import.import') }}
                </el-button>
            </div>
        </div>
        <span v-if="worldImportDialog.importProgress" style="margin: 10px">
            <i class="el-icon-loading" style="margin-right: 5px"></i>
            {{ t('dialog.world_import.import_progress') }}
            {{ worldImportDialog.importProgress }}/{{ worldImportDialog.importProgressTotal }}
        </span>
        <br />
        <template v-if="worldImportDialog.errors">
            <el-button size="small" @click="worldImportDialog.errors = ''">
                {{ t('dialog.world_import.clear_errors') }}
            </el-button>
            <h2 style="font-weight: bold; margin: 5px 0">
                {{ t('dialog.world_import.errors') }}
            </h2>
            <pre style="white-space: pre-wrap; font-size: 12px" v-text="worldImportDialog.errors"></pre>
        </template>
        <data-tables v-loading="worldImportDialog.loading" v-bind="worldImportTable" style="margin-top: 10px">
            <el-table-column :label="t('table.import.image')" width="70" prop="thumbnailImageUrl">
                <template slot-scope="scope">
                    <el-popover placement="right" height="500px" trigger="hover">
                        <img slot="reference" v-lazy="scope.row.thumbnailImageUrl" class="friends-list-avatar" />
                        <img
                            v-lazy="scope.row.imageUrl"
                            class="friends-list-avatar"
                            style="height: 500px; cursor: pointer"
                            @click="showFullscreenImageDialog(scope.row.imageUrl)" />
                    </el-popover>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.import.name')" prop="name">
                <template slot-scope="scope">
                    <span class="x-link" @click="showWorldDialog(scope.row.id)" v-text="scope.row.name"></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.import.author')" width="120" prop="authorName">
                <template slot-scope="scope">
                    <span
                        class="x-link"
                        @click="showUserDialog(scope.row.authorId)"
                        v-text="scope.row.authorName"></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.import.status')" width="70" prop="releaseStatus">
                <template slot-scope="scope">
                    <span
                        :style="{
                            color:
                                scope.row.releaseStatus === 'public'
                                    ? '#67c23a'
                                    : scope.row.releaseStatus === 'private'
                                      ? '#f56c6c'
                                      : undefined
                        }"
                        v-text="
                            scope.row.releaseStatus.charAt(0).toUpperCase() + scope.row.releaseStatus.slice(1)
                        "></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.import.action')" width="90" align="right">
                <template slot-scope="scope">
                    <el-button
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        @click="deleteItemWorldImport(scope.row)"></el-button>
                </template>
            </el-table-column>
        </data-tables>
    </safe-dialog>
</template>

<script setup>
    import { ref, watch, computed, getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { storeToRefs } from 'pinia';
    import { favoriteRequest, worldRequest } from '../../../api';
    import { adjustDialogZ, removeFromArray } from '../../../shared/utils';
    import { useFavoriteStore, useGalleryStore, useUserStore, useWorldStore } from '../../../stores';

    const { showUserDialog } = useUserStore();
    const { favoriteWorldGroups, worldImportDialogInput, worldImportDialogVisible, localWorldFavoriteGroups } =
        storeToRefs(useFavoriteStore());
    const { getLocalWorldFavoriteGroupLength, addLocalWorldFavorite } = useFavoriteStore();
    const { showWorldDialog } = useWorldStore();
    const { showFullscreenImageDialog } = useGalleryStore();

    const emit = defineEmits(['update:worldImportDialogInput']);

    const { proxy } = getCurrentInstance();
    const { t } = useI18n();

    const worldImportDialogRef = ref(null);

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

    const worldImportTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table'
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
                adjustDialogZ(worldImportDialogRef.value.$el);
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
    }

    function selectWorldImportLocalGroup(group) {
        worldImportDialog.value.worldImportFavoriteGroup = null;
        worldImportDialog.value.worldImportLocalFavoriteGroup = group;
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
                type: 'world',
                favoriteId: ref.id,
                tags: group.name
            })
            .then((args) => {
                if (message) {
                    proxy.$message({
                        message: 'World added to favorites',
                        type: 'success'
                    });
                }
                return args;
            });
    }
</script>
