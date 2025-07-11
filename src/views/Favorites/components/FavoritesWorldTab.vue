<template>
    <div>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
                <el-button size="small" @click="showExportDialog">{{ $t('view.favorite.export') }}</el-button>
                <el-button size="small" style="margin-left: 5px" @click="showWorldImportDialog">{{
                    $t('view.favorite.import')
                }}</el-button>
            </div>
            <div style="display: flex; align-items: center; font-size: 13px; margin-right: 10px">
                <span class="name" style="margin-right: 5px; line-height: 10px">{{ $t('view.favorite.sort_by') }}</span>
                <el-radio-group v-model="sortFav" style="margin-right: 12px" @change="saveSortFavoritesOption">
                    <el-radio :label="false">{{
                        $t('view.settings.appearance.appearance.sort_favorite_by_name')
                    }}</el-radio>
                    <el-radio :label="true">{{
                        $t('view.settings.appearance.appearance.sort_favorite_by_date')
                    }}</el-radio>
                </el-radio-group>
                <el-input
                    v-model="worldFavoriteSearch"
                    clearable
                    size="mini"
                    :placeholder="$t('view.favorite.worlds.search')"
                    style="width: 200px"
                    @input="searchWorldFavorites" />
            </div>
        </div>
        <div class="x-friend-list" style="margin-top: 10px">
            <div
                v-for="favorite in worldFavoriteSearchResults"
                :key="favorite.id"
                style="display: inline-block; width: 300px; margin-right: 15px"
                @click="showWorldDialog(favorite.id)">
                <div class="x-friend-item">
                    <template v-if="favorite.name">
                        <div class="avatar">
                            <img v-lazy="favorite.thumbnailImageUrl" />
                        </div>
                        <div class="detail">
                            <span class="name" v-text="favorite.name"></span>
                            <span v-if="favorite.occupants" class="extra"
                                >{{ favorite.authorName }} ({{ favorite.occupants }})</span
                            >
                            <span v-else class="extra" v-text="favorite.authorName"></span>
                        </div>
                    </template>
                    <template v-else>
                        <div class="avatar"></div>
                        <div class="detail">
                            <span v-text="favorite.id"></span>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <span style="display: block; margin-top: 20px">{{ $t('view.favorite.worlds.vrchat_favorites') }}</span>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in favoriteWorldGroups" :key="group.name">
                <template slot="title">
                    <div style="display: flex; align-items: center">
                        <span
                            style="font-weight: bold; font-size: 14px; margin-left: 10px"
                            v-text="group.displayName" />
                        <el-tag
                            style="margin: 1px 0 0 5px"
                            size="mini"
                            :type="userFavoriteWorldsStatusForFavTab(group.visibility)"
                            effect="plain"
                            >{{ group.visibility.charAt(0).toUpperCase() + group.visibility.slice(1) }}</el-tag
                        >
                        <span style="color: #909399; font-size: 12px; margin-left: 10px"
                            >{{ group.count }}/{{ group.capacity }}</span
                        >
                        <el-dropdown trigger="click" size="mini" style="margin-left: 10px" @click.native.stop>
                            <el-tooltip
                                placement="top"
                                :content="$t('view.favorite.visibility_tooltip')"
                                :disabled="hideTooltips">
                                <el-button type="default" icon="el-icon-view" size="mini" circle />
                            </el-tooltip>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item
                                    v-for="visibility in worldGroupVisibilityOptions"
                                    v-if="group.visibility !== visibility"
                                    :key="visibility"
                                    style="display: block; margin: 10px 0"
                                    @click.native="changeWorldGroupVisibility(group.name, visibility)"
                                    >{{ visibility.charAt(0).toUpperCase() + visibility.slice(1) }}</el-dropdown-item
                                >
                            </el-dropdown-menu>
                            <el-tooltip
                                placement="top"
                                :content="$t('view.favorite.rename_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    size="mini"
                                    icon="el-icon-edit"
                                    circle
                                    style="margin-left: 5px"
                                    @click.stop="changeFavoriteGroupName(group)" />
                            </el-tooltip>
                            <el-tooltip
                                placement="right"
                                :content="$t('view.favorite.clear_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    size="mini"
                                    icon="el-icon-delete"
                                    circle
                                    style="margin-left: 5px"
                                    @click.stop="clearFavoriteGroup(group)" />
                            </el-tooltip>
                        </el-dropdown>
                    </div>
                </template>
                <div v-if="group.count" class="x-friend-list" style="margin-top: 10px">
                    <FavoritesWorldItem
                        v-for="favorite in groupedByGroupKeyFavoriteWorlds[group.key]"
                        :key="favorite.id"
                        :group="group"
                        :favorite="favorite"
                        :edit-favorites-mode="editFavoritesMode"
                        :hide-tooltips="hideTooltips"
                        @click="showWorldDialog(favorite.id)"
                        @handle-select="favorite.$selected = $event" />
                </div>
                <div
                    v-else
                    style="
                        padding-top: 25px;
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgb(144, 147, 153);
                    ">
                    <span>No Data</span>
                </div>
            </el-collapse-item>
        </el-collapse>
        <span style="display: block; margin-top: 20px">{{ $t('view.favorite.worlds.local_favorites') }}</span>
        <br />
        <el-button size="small" @click="promptNewLocalWorldFavoriteGroup">{{
            $t('view.favorite.worlds.new_group')
        }}</el-button>
        <el-button
            v-if="!refreshingLocalFavorites"
            size="small"
            style="margin-left: 5px"
            @click="refreshLocalWorldFavorite"
            >{{ $t('view.favorite.worlds.refresh') }}</el-button
        >
        <el-button v-else size="small" style="margin-left: 5px" @click="refreshingLocalFavorites = false">
            <i class="el-icon-loading" style="margin-right: 5px" />
            <span>{{ $t('view.favorite.worlds.cancel_refresh') }}</span>
        </el-button>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in localWorldFavoriteGroups" v-if="localWorldFavorites[group]" :key="group">
                <template slot="title">
                    <span style="font-weight: bold; font-size: 14px; margin-left: 10px" v-text="group" />
                    <span style="color: #909399; font-size: 12px; margin-left: 10px">{{
                        getLocalWorldFavoriteGroupLength(group)
                    }}</span>
                    <el-tooltip placement="top" :content="$t('view.favorite.rename_tooltip')" :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-edit"
                            circle
                            style="margin-left: 10px"
                            @click.stop="promptLocalWorldFavoriteGroupRename(group)" />
                    </el-tooltip>
                    <el-tooltip
                        placement="right"
                        :content="$t('view.favorite.delete_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"
                            @click.stop="promptLocalWorldFavoriteGroupDelete(group)" />
                    </el-tooltip>
                </template>
                <div v-if="localWorldFavorites[group].length" class="x-friend-list" style="margin-top: 10px">
                    <FavoritesWorldItem
                        v-for="favorite in localWorldFavorites[group]"
                        :key="favorite.id"
                        is-local-favorite
                        :group="group"
                        :favorite="favorite"
                        :edit-favorites-mode="editFavoritesMode"
                        :hide-tooltips="hideTooltips"
                        @click="showWorldDialog(favorite.id)"
                        @remove-local-world-favorite="removeLocalWorldFavorite" />
                </div>
                <div
                    v-else
                    style="
                        padding-top: 25px;
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgb(144, 147, 153);
                    ">
                    <span>No Data</span>
                </div>
            </el-collapse-item>
        </el-collapse>
        <WorldExportDialog :world-export-dialog-visible.sync="worldExportDialogVisible" />
    </div>
</template>

<script setup>
    import { computed, ref, getCurrentInstance } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
    import { favoriteRequest } from '../../../api';
    import { useAppearanceSettingsStore, useFavoriteStore, useWorldStore } from '../../../stores';
    import WorldExportDialog from '../dialogs/WorldExportDialog.vue';
    import FavoritesWorldItem from './FavoritesWorldItem.vue';

    defineProps({
        editFavoritesMode: {
            type: Boolean,
            default: false
        },
        refreshingLocalFavorites: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits([
        'change-favorite-group-name',
        'save-sort-favorites-option',
        'refresh-local-world-favorite'
    ]);

    const { proxy } = getCurrentInstance();

    const { t } = useI18n();
    const { hideTooltips, sortFavorites } = storeToRefs(useAppearanceSettingsStore());
    const { setSortFavorites } = useAppearanceSettingsStore();
    const { favoriteWorlds, favoriteWorldGroups, localWorldFavorites, localWorldFavoriteGroups } =
        storeToRefs(useFavoriteStore());
    const {
        showWorldImportDialog,
        getLocalWorldFavoriteGroupLength,
        deleteLocalWorldFavoriteGroup,
        renameLocalWorldFavoriteGroup,
        removeLocalWorldFavorite,
        newLocalWorldFavoriteGroup,
        handleFavoriteGroup
    } = useFavoriteStore();
    const { showWorldDialog } = useWorldStore();

    const worldGroupVisibilityOptions = ref(['private', 'friends', 'public']);
    const worldExportDialogVisible = ref(false);
    const worldFavoriteSearch = ref('');
    const worldFavoriteSearchResults = ref([]);

    const groupedByGroupKeyFavoriteWorlds = computed(() => {
        const groupedByGroupKeyFavoriteWorlds = {};

        favoriteWorlds.value.forEach((world) => {
            if (world.groupKey) {
                if (!groupedByGroupKeyFavoriteWorlds[world.groupKey]) {
                    groupedByGroupKeyFavoriteWorlds[world.groupKey] = [];
                }
                groupedByGroupKeyFavoriteWorlds[world.groupKey].push(world);
            }
        });

        return groupedByGroupKeyFavoriteWorlds;
    });

    const sortFav = computed({
        get() {
            return sortFavorites.value;
        },
        set() {
            setSortFavorites();
        }
    });

    function showExportDialog() {
        worldExportDialogVisible.value = true;
    }

    function userFavoriteWorldsStatusForFavTab(visibility) {
        let style = '';
        if (visibility === 'public') {
            style = '';
        } else if (visibility === 'friends') {
            style = 'success';
        } else {
            style = 'info';
        }
        return style;
    }

    function changeWorldGroupVisibility(name, visibility) {
        const params = {
            type: 'world',
            group: name,
            visibility
        };
        favoriteRequest.saveFavoriteGroup(params).then((args) => {
            handleFavoriteGroup({
                json: args.json,
                params: {
                    favoriteGroupId: args.json.id
                }
            });
            proxy.$message({
                message: 'Group visibility changed',
                type: 'success'
            });
            return args;
        });
    }

    function promptNewLocalWorldFavoriteGroup() {
        proxy.$prompt(t('prompt.new_local_favorite_group.description'), t('prompt.new_local_favorite_group.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.new_local_favorite_group.ok'),
            cancelButtonText: t('prompt.new_local_favorite_group.cancel'),
            inputPattern: /\S+/,
            inputErrorMessage: t('prompt.new_local_favorite_group.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue) {
                    newLocalWorldFavoriteGroup(instance.inputValue);
                }
            }
        });
    }

    function promptLocalWorldFavoriteGroupRename(group) {
        proxy.$prompt(
            t('prompt.local_favorite_group_rename.description'),
            t('prompt.local_favorite_group_rename.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.local_favorite_group_rename.save'),
                cancelButtonText: t('prompt.local_favorite_group_rename.cancel'),
                inputPattern: /\S+/,
                inputErrorMessage: t('prompt.local_favorite_group_rename.input_error'),
                inputValue: group,
                callback: (action, instance) => {
                    if (action === 'confirm' && instance.inputValue) {
                        renameLocalWorldFavoriteGroup(instance.inputValue, group);
                    }
                }
            }
        );
    }

    function promptLocalWorldFavoriteGroupDelete(group) {
        proxy.$confirm(`Delete Group? ${group}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    deleteLocalWorldFavoriteGroup(group);
                }
            }
        });
    }

    function clearFavoriteGroup(ctx) {
        proxy.$confirm('Continue? Clear Group', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    favoriteRequest.clearFavoriteGroup({
                        type: ctx.type,
                        group: ctx.name
                    });
                }
            }
        });
    }

    function searchWorldFavorites(worldFavoriteSearch) {
        let ref = null;
        const search = worldFavoriteSearch.toLowerCase();
        if (search.length < 3) {
            worldFavoriteSearchResults.value = [];
            return;
        }

        const results = [];
        for (let i = 0; i < localWorldFavoriteGroups.value.length; ++i) {
            const group = localWorldFavoriteGroups.value[i];
            if (!localWorldFavorites.value[group]) {
                continue;
            }
            for (let j = 0; j < localWorldFavorites.value[group].length; ++j) {
                ref = localWorldFavorites.value[group][j];
                if (
                    !ref ||
                    typeof ref.id === 'undefined' ||
                    typeof ref.name === 'undefined' ||
                    typeof ref.authorName === 'undefined'
                ) {
                    continue;
                }
                if (ref.name.toLowerCase().includes(search) || ref.authorName.toLowerCase().includes(search)) {
                    if (!results.some((r) => r.id === ref.id)) {
                        results.push(ref);
                    }
                }
            }
        }

        for (let i = 0; i < favoriteWorlds.value.length; ++i) {
            ref = favoriteWorlds.value[i].ref;
            if (
                !ref ||
                typeof ref.id === 'undefined' ||
                typeof ref.name === 'undefined' ||
                typeof ref.authorName === 'undefined'
            ) {
                continue;
            }
            if (ref.name.toLowerCase().includes(search) || ref.authorName.toLowerCase().includes(search)) {
                if (!results.some((r) => r.id === ref.id)) {
                    results.push(ref);
                }
            }
        }

        worldFavoriteSearchResults.value = results;
    }

    function changeFavoriteGroupName(group) {
        emit('change-favorite-group-name', group);
    }

    function refreshLocalWorldFavorite() {
        emit('refresh-local-world-favorite');
    }

    function saveSortFavoritesOption() {
        emit('save-sort-favorites-option');
    }
</script>

<style scoped></style>
